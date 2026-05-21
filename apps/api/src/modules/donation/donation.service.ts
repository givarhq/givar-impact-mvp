import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Currency, TxStatus, TxType, AuditAction, ProjectStatus, UserRole, Prisma, NotificationType, TxCategory } from '@givar/database';
import { PrismaService } from '../../common/prisma.service';
import { WalletRepository } from '../wallet/wallet.repository';
import {
  CreateDonationDto,
  InitiateDirectDonationDto,
} from './dto/donation.dto';
import * as crypto from 'crypto';
import { CreateSubscriptionDto, UpdateSubscriptionStatusDto } from './dto/subscription.dto';
import { add } from 'date-fns';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { FeeService } from '../fee/fee.service';
import { calculatePhaseFunding } from '@givar/types';

@Injectable()
export class DonationService implements OnModuleInit {
  private readonly logger = new Logger(DonationService.name);

  private readonly MIN_DONATION_MINOR = 10000n;           // 100.00
  private readonly MAX_DONATION_MINOR = 10_000_000_000n; // 1,000,000.00

  private walletRepo!: WalletRepository;

  constructor(
    private prisma: PrismaService,
    private moduleRef: ModuleRef,
    private config: ConfigService,
    private audit: AuditService,
    private emailService: EmailService,
    private feeService: FeeService,
  ) { }

  onModuleInit() {
    this.walletRepo = this.moduleRef.get(WalletRepository, { strict: false });
  }

  // Centralized Receipt Logic
  private async triggerReceipt(
    userId: string | null,
    guestEmail: string | null,
    projectId: string,
    amount: bigint,
    currency: Currency,
    reference: string,
    donorCurrency?: string,
    donorAmount?: string,
    phaseName?: string
  ) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { title: true }
      });

      let email: string | undefined | null = guestEmail;

      if (!email && userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, preferences: true }
        });
        const prefs = user?.preferences as any;
        if (prefs?.donationReceipts === false) return;
        email = user?.email;
      }

      if (email) {
        await this.emailService.sendDonationReceipt(email, {
          amount: (Number(amount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 }),
          currency: currency,
          project: project?.title || 'Impact Project',
          phaseName: phaseName,
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
          ref: reference,
          donorAmount,
          donorCurrency
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Receipt triggering failed: ${msg}`);
    }
  }

  /**
   * Helper: Dynamically determines the active vendor and remaining capacity
   * based purely on the raised amount vs cumulative budget items.
   */
  private getActiveBudgetContext(project: any) {
    const phaseMath = calculatePhaseFunding(project);
    const rawBudget = (project.budgetBreakdown as any[]) || [];
    const STAGE_ORDER = ['Early Stage', 'Main Stage', 'Final Stage'];
    const budget = [...rawBudget].sort((a, b) => {
      const idxA = STAGE_ORDER.indexOf(a.stage || 'Main Stage');
      const idxB = STAGE_ORDER.indexOf(b.stage || 'Main Stage');
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    });

    const raisedAmountMajor = Number(project.raisedAmount) / 100;

    let cumulativeMajor = 0;
    let activeBudgetItem = null;
    let itemRemainingMajor = 0;

    for (const item of budget) {
      const itemAmount = item.amount || item.cost || 0;
      cumulativeMajor += itemAmount;

      if (raisedAmountMajor < cumulativeMajor) {
        activeBudgetItem = item;
        itemRemainingMajor = cumulativeMajor - raisedAmountMajor;
        break;
      }
    }

    const activeVendorId = activeBudgetItem?.vendorId;
    const vendors = (project.vendors as any[]) || [];
    const activeVendor = vendors.find(v => v.id === activeVendorId);
    const activeSubaccount = activeVendor?.subaccountCode || activeBudgetItem?.vendorSubaccount;

    return {
      activeBudgetItem,
      itemRemainingMinor: BigInt(Math.round(itemRemainingMajor * 100)),
      activeSubaccount,
      currentStageName: phaseMath.currentStageLogicName,
      phaseNameRaw: activeBudgetItem ? (activeBudgetItem.description || activeBudgetItem.item) : phaseMath.currentStageLogicName,
      fullStageDisplayName: phaseMath.currentStageDisplayName
    };
  }

  async donate(userId: string, dto: CreateDonationDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });

    if (!user?.emailVerified) {
      throw new ForbiddenException('EMAIL_NOT_VERIFIED');
    }

    const baseAmount = BigInt(dto.amount);
    const tipAmount = BigInt(dto.tipAmount || '0');

    if (baseAmount < this.MIN_DONATION_MINOR) {
      throw new BadRequestException('Amount is below minimum allowed (100.00)');
    }

    if (baseAmount > this.MAX_DONATION_MINOR) {
      throw new BadRequestException(
        'Transaction exceeds high-capital threshold (₦100m). Please split the deposit or contact Givar support for institutional onboarding.'
      );
    }

    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      select: {
        id: true,
        title: true,
        isActive: true,
        currency: true,
        targetAmount: true,
        raisedAmount: true,
        status: true,
        userId: true,
        slug: true,
        categoryId: true,
        subcategoryId: true,
        budgetBreakdown: true,
        executionTimeline: true,
        currentPhaseIndex: true,
        vendors: true
      },
    });

    if (!project || !project.isActive) {
      throw new BadRequestException('Project is not active or does not exist');
    }

    if (project.status !== ProjectStatus.ACTIVE) {
      throw new BadRequestException(`Project is currently ${project.status.toLowerCase()} and cannot accept donations.`);
    }

    if (project.currency !== dto.currency) {
      throw new BadRequestException(`Project only accepts ${project.currency}`);
    }

    const activeContext = this.getActiveBudgetContext(project);

    if (!activeContext.activeSubaccount) {
      throw new InternalServerErrorException(
        'Strict Non-Custodial Policy: The active vendor lacks a verified routing account.'
      );
    }

    if (baseAmount > activeContext.itemRemainingMinor) {
      throw new BadRequestException(
        `Donation exceeds the remaining capacity for the current vendor allocation. Please lower the amount to max ₦${(Number(activeContext.itemRemainingMinor) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}.`
      );
    }

    const { feeAmountMinor, rule: feeRule } = await this.feeService.calculateFee(
      baseAmount,
      project.categoryId || undefined,
      project.subcategoryId || undefined,
      project.id
    );
    const totalCharge = baseAmount + feeAmountMinor + tipAmount;

    const result = await this.prisma.$transaction(async (tx) => {
      const txProject = await tx.project.findUnique({
        where: { id: dto.projectId },
      });

      if (!txProject || !txProject.isActive) {
        throw new BadRequestException('Project state changed during processing');
      }

      const formattedPhase = activeContext.fullStageDisplayName;
      const reference = `DON-${crypto.randomUUID()}`;

      const { transaction: walletTx } = await this.walletRepo.processTransaction(
        {
          userId,
          amount: totalCharge,
          currency: dto.currency,
          type: TxType.DEBIT,
          reference,
          description: `Donation to: ${txProject.title}`,
          status: TxStatus.COMPLETED,
          category: TxCategory.DONATION,
          metadata: { phaseName: formattedPhase }
        },
        tx,
      );

      if (feeAmountMinor > 0n || tipAmount > 0n) {
        const systemNode = await tx.user.findFirst({
          where: { role: UserRole.SUPERADMIN },
          include: { wallets: { where: { currency: dto.currency } } }
        });

        if (systemNode?.wallets[0]) {
          const systemWalletId = systemNode.wallets[0].id;

          if (feeAmountMinor > 0n) {
            await tx.walletTransaction.create({
              data: {
                walletId: systemWalletId,
                amount: feeAmountMinor,
                currency: dto.currency,
                type: TxType.CREDIT,
                status: TxStatus.COMPLETED,
                category: TxCategory.TRANSACTION_FEE,
                reference: `FEE-${reference}`,
                description: `Operational Support Fee from: ${txProject.title}`,
                metadata: { originalProjectId: txProject.id, donorId: userId }
              }
            });

            await tx.wallet.update({
              where: { id: systemWalletId },
              data: { balance: { increment: feeAmountMinor } }
            });
          }

          if (tipAmount > 0n) {
            await tx.walletTransaction.create({
              data: {
                walletId: systemWalletId,
                amount: tipAmount,
                currency: dto.currency,
                type: TxType.CREDIT,
                status: TxStatus.COMPLETED,
                category: TxCategory.VOLUNTARY_TIP,
                reference: `TIP-${reference}`,
                description: `Optional Support Contribution from: ${txProject.title}`,
                metadata: { originalProjectId: txProject.id, donorId: userId }
              }
            });

            await tx.wallet.update({
              where: { id: systemWalletId },
              data: { balance: { increment: tipAmount } }
            });
          }
        }
      }

      const donation = await tx.donation.create({
        data: {
          userId,
          projectId: txProject.id,
          transactionId: walletTx.id,
          amount: totalCharge,
          baseAmount: baseAmount,
          feePercentageUsed: feeRule.percentage,
          feeAmount: feeAmountMinor,
          tipAmount: tipAmount,
          feeRuleId: feeRule.id,
          currency: dto.currency,
          message: dto.message?.trim() || null,
        },
      });

      const updatedProject = await tx.project.update({
        where: { id: txProject.id },
        data: { raisedAmount: { increment: baseAmount } },
      });

      const isGoalMet = updatedProject.raisedAmount >= updatedProject.targetAmount;

      if (isGoalMet) {
        await tx.project.update({
          where: { id: txProject.id },
          data: { status: ProjectStatus.FUNDED, fundedAt: new Date() }
        });
      }

      await tx.notification.create({
        data: {
          userId: txProject.userId,
          type: 'DONATION_RECEIVED' as NotificationType,
          title: 'New contribution received',
          content: `You received a gift for "${txProject.title}".`,
          link: `/dashboard/impact/${txProject.slug}`
        }
      });

      if (isGoalMet) {
        await tx.notification.create({
          data: {
            userId: txProject.userId,
            type: 'PROJECT_STATUS' as NotificationType,
            title: 'Goal reached!',
            content: `Success! "${txProject.title}" is now fully funded.`,
            link: `/dashboard/impact/${txProject.slug}`
          }
        });
      }

      await this.audit.log(
        {
          userId,
          action: AuditAction.DONATION_CREATED,
          entityId: txProject.id,
          entityType: 'Project',
          metadata: {
            projectId: dto.projectId,
            totalPaid: totalCharge.toString(),
            totalPaid_naira: (Number(totalCharge) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            appliedToProject: baseAmount.toString(),
            feeAmount: feeAmountMinor.toString(),
            tipAmount: tipAmount.toString(),
            currency: dto.currency,
            reference,
            isGoalMet,
          },
        },
        tx,
      );

      return { donation, isGoalMet, project: txProject, totalCharge, formattedPhase };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });

    await this.triggerReceipt(
      userId, null, dto.projectId, result.totalCharge, dto.currency,
      `WAL-${result.project.id.slice(0, 8)}`, undefined, undefined, result.formattedPhase
    );

    if (result.isGoalMet) {
      this.prisma.user.findUnique({
        where: { id: result.project.userId },
        select: { email: true, firstName: true }
      }).then(organizer => {
        if (organizer) {
          this.emailService.sendProjectFundedAlert(organizer.email, {
            name: organizer.firstName,
            projectTitle: result.project.title,
            amount: (Number(result.project.targetAmount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 }),
            currency: result.project.currency,
            projectId: result.project.id
          });
        }
      });

      this.broadcastProjectFunded(result.project.id, result.project.title, result.project.slug, result.project.targetAmount, result.project.currency);
    }

    return {
      ...result.donation,
      amount: result.donation.amount.toString(),
      baseAmount: result.donation.baseAmount.toString(),
      feeAmount: result.donation.feeAmount.toString(),
      tipAmount: result.donation.tipAmount.toString()
    };
  }

  async initiateDirectDonation(user: any | undefined, dto: InitiateDirectDonationDto) {
    if (user && user.emailVerified === false) {
      throw new ForbiddenException('Please verify your email address to use direct payments.');
    }

    const baseAmountBig = BigInt(dto.amount);
    const tipAmountBig = BigInt(dto.tipAmount || '0');

    if (baseAmountBig < this.MIN_DONATION_MINOR) {
      throw new BadRequestException('Minimum donation amount is 100.00.');
    }

    if (baseAmountBig > this.MAX_DONATION_MINOR) {
      const emailToContact = user ? user.email : dto.guestEmail;

      this.emailService.sendAdminHighCapitalAlert({
        userEmail: emailToContact || 'Anonymous Guest',
        amount: (Number(baseAmountBig) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 }),
        currency: dto.currency
      }).catch(err => this.logger.error(`High Capital Alert Failed: ${err.message}`));

      throw new BadRequestException(
        'Transaction exceeds high-capital threshold (₦100m). Please split the deposit or contact Givar support for institutional onboarding.'
      );
    }

    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      select: {
        id: true, isActive: true, currency: true, status: true, categoryId: true, subcategoryId: true, title: true,
        budgetBreakdown: true, executionTimeline: true, currentPhaseIndex: true, vendors: true, raisedAmount: true, targetAmount: true
      },
    });

    if (!project || !project.isActive) {
      throw new BadRequestException('Project is not active or does not exist.');
    }

    if (project.status !== ProjectStatus.ACTIVE) {
      throw new BadRequestException(`Project is currently ${project.status.toLowerCase()} and cannot accept donations.`);
    }

    if (project.currency !== dto.currency) {
      throw new BadRequestException(`Project only accepts ${project.currency}.`);
    }

    const phaseMath = calculatePhaseFunding(project);

    if (phaseMath.isPhaseFull) {
      throw new BadRequestException('The current funding phase is fully funded and pending administrative verification. Donations are temporarily paused.');
    }

    const activeContext = this.getActiveBudgetContext(project);

    if (!activeContext.activeSubaccount) {
      throw new InternalServerErrorException(
        'Strict non-custodial policy: The active vendor routing account is missing. Donations are temporarily halted.'
      );
    }

    if (baseAmountBig > activeContext.itemRemainingMinor) {
      throw new BadRequestException(
        `Donation exceeds the remaining capacity for the current vendor allocation. Please lower the amount to max ₦${(Number(activeContext.itemRemainingMinor) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}.`
      );
    }

    const { feeAmountMinor, rule: feeRule } = await this.feeService.calculateFee(
      baseAmountBig,
      project.categoryId || undefined,
      project.subcategoryId || undefined,
      project.id
    );

    const netAmountMinor = baseAmountBig + feeAmountMinor + tipAmountBig;

    // --- Dynamic Gateway Fee Math (Local vs International) ---
    let gatewayFeeMinor = 0n;
    if (netAmountMinor > 0n) {
      const isInternational = dto.donorCurrency && dto.donorCurrency !== 'NGN';
      const threshold = 250000n; // 2500 NGN in kobo
      const flatFee = 10000n; // 100 NGN in kobo

      // Paystack math: 1.5% local (1000-15=985), 3.9% international (1000-39=961)
      const divisor = isInternational ? 961n : 985n;

      let chargeMinor = (netAmountMinor * 1000n) / divisor;
      if (chargeMinor >= threshold) {
        chargeMinor = ((netAmountMinor + flatFee) * 1000n) / divisor;
      }

      gatewayFeeMinor = chargeMinor - netAmountMinor;

      // Paystack caps local fees at 2000 NGN. International fees are uncapped.
      if (!isInternational && gatewayFeeMinor > 200000n) {
        gatewayFeeMinor = 200000n;
      }
    }

    const totalCharge = netAmountMinor + gatewayFeeMinor;

    let emailToCharge: string;
    let internalUserId: string | null = null;

    if (user) {
      emailToCharge = user.email;
      internalUserId = user.id;
    } else {
      if (!dto.guestEmail?.trim()) {
        throw new BadRequestException('Email is required for guest donations.');
      }
      emailToCharge = dto.guestEmail.trim();
    }

    try {
      const paystackPayload: any = {
        email: emailToCharge,
        amount: Number(totalCharge),
        currency: dto.currency,
        channels: ['card', 'bank', 'bank_transfer', 'ussd', 'qr', 'mobile_money', 'apple_pay'],
        metadata: {
          donationType: 'DIRECT',
          userId: internalUserId ?? 'GUEST',
          guestEmail: emailToCharge,
          guestName: dto.guestName?.trim() || 'Anonymous',
          projectId: dto.projectId,
          baseAmount: baseAmountBig.toString(),
          feeAmount: feeAmountMinor.toString(),
          tipAmount: tipAmountBig.toString(),
          feePercentage: feeRule.percentage,
          feeRuleId: feeRule.id,
          donorCurrency: dto.donorCurrency,
          donorAmount: dto.donorAmount,
          fxRate: dto.fxRate,
          custom_fields: [
            {
              display_name: 'Project Title',
              variable_name: 'project_title',
              value: project.title
            },
            {
              display_name: 'Funding Stage',
              variable_name: 'funding_phase',
              value: activeContext.fullStageDisplayName
            }
          ]
        },
        callback_url: `${this.config.get('FRONTEND_URL')}/callback`,
      };

      if (activeContext.activeSubaccount) {
        paystackPayload.subaccount = activeContext.activeSubaccount;
        // CRITICAL FIX: Add gateway fee to transaction_charge so the vendor receives strictly the baseAmount.
        paystackPayload.transaction_charge = Number(feeAmountMinor + tipAmountBig + gatewayFeeMinor);
        paystackPayload.bearer = 'account';
      }

      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        paystackPayload,
        {
          headers: {
            Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
            'Content-Type': 'application/json',
          },
          timeout: 12000,
        },
      );

      const { data } = response.data;

      return {
        authorizationUrl: data.authorization_url,
        reference: data.reference,
      };
    } catch (error) {
      this.logger.error('Failed to initialize direct donation', {
        error: error instanceof Error ? error.message : String(error),
        projectId: dto.projectId,
        amount: dto.amount,
      });

      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        throw new InternalServerErrorException('Payment initialization timed out. Please try again.');
      }

      throw new InternalServerErrorException('Unable to initialize payment at this time.');
    }
  }

  async fulfillDirectDonation(data: {
    userId: string;
    guestEmail?: string;
    guestName?: string;
    projectId: string;
    amount: bigint;
    currency: Currency;
    reference: string;
    channel?: string;
    authorization?: any;
    baseAmount?: bigint;
    feeAmount?: bigint;
    tipAmount?: bigint;
    feePercentageUsed?: number;
    feeRuleId?: string;
    donorCurrency?: string;
    donorAmount?: string;
    fxRate?: number;
  }) {
    const {
      userId, guestEmail, guestName, projectId, amount, currency, reference, channel, authorization,
      donorCurrency, donorAmount, fxRate,
      baseAmount = amount, feeAmount = 0n, tipAmount = 0n, feePercentageUsed = 0, feeRuleId = null
    } = data;

    if (channel && !['card', 'bank', 'bank_transfer', 'ussd', 'qr', 'mobile_money', 'apple_pay'].includes(channel)) {
      this.logger.warn(`Suspicious payment channel ignored`, { channel, reference });
      return { status: 'ignored_channel', reference };
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const existingUserDonation = await tx.donation.findFirst({
          where: { transaction: { reference } },
          select: { id: true }
        });
        const existingGuestDonation = await tx.guestDonation.findUnique({
          where: { reference },
          select: { id: true }
        });

        if (existingUserDonation || existingGuestDonation) {
          return { status: 'duplicate', reference };
        }

        const project = await tx.project.findUnique({
          where: { id: projectId },
        });

        if (!project) throw new NotFoundException('Project node missing on ledger.');

        const activeContext = this.getActiveBudgetContext(project);

        if (!activeContext.activeSubaccount) {
          throw new InternalServerErrorException(
            'Strict non-custodial policy: The active vendor lacks a verified routing account.'
          );
        }

        const formattedPhase = activeContext.fullStageDisplayName;
        let processedDonationId: string;

        if (feeAmount > 0n || tipAmount > 0n) {
          const systemNode = await tx.user.findFirst({
            where: { role: UserRole.SUPERADMIN },
            include: { wallets: { where: { currency } } }
          });

          if (systemNode?.wallets[0]) {
            const systemWalletId = systemNode.wallets[0].id;

            if (feeAmount > 0n) {
              await tx.walletTransaction.create({
                data: {
                  walletId: systemWalletId,
                  amount: feeAmount,
                  currency,
                  type: TxType.CREDIT,
                  status: TxStatus.COMPLETED,
                  category: TxCategory.TRANSACTION_FEE,
                  reference: `FEE-${reference}`,
                  description: `Operational Support Fee via Gateway: ${project.title}`,
                  metadata: { originalProjectId: project.id, channel }
                }
              });
              await tx.wallet.update({ where: { id: systemWalletId }, data: { balance: { increment: feeAmount } } });
            }

            if (tipAmount > 0n) {
              await tx.walletTransaction.create({
                data: {
                  walletId: systemWalletId,
                  amount: tipAmount,
                  currency,
                  type: TxType.CREDIT,
                  status: TxStatus.COMPLETED,
                  category: TxCategory.VOLUNTARY_TIP,
                  reference: `TIP-${reference}`,
                  description: `Optional Support Contribution via Gateway: ${project.title}`,
                  metadata: { originalProjectId: project.id, channel }
                }
              });
              await tx.wallet.update({ where: { id: systemWalletId }, data: { balance: { increment: tipAmount } } });
            }
          }
        }

        if (userId !== 'GUEST') {
          await this.walletRepo.processTransaction({
            userId,
            amount,
            currency,
            type: TxType.CREDIT,
            reference: `IN-${reference}`,
            description: `Direct Pay Inflow`,
            status: TxStatus.COMPLETED,
            category: TxCategory.FUNDING,
            metadata: { channel, authorization, donorCurrency, donorAmount, fxRate }
          }, tx);

          const { transaction: donationTx } = await this.walletRepo.processTransaction({
            userId,
            amount,
            currency,
            type: TxType.DEBIT,
            reference,
            description: `Direct donation: ${project.title}`,
            status: TxStatus.COMPLETED,
            category: TxCategory.DONATION,
            metadata: { channel, authorization, donorCurrency, donorAmount, fxRate, phaseName: formattedPhase }
          }, tx);

          const donation = await tx.donation.create({
            data: {
              userId,
              projectId,
              transactionId: donationTx.id,
              amount: amount,
              baseAmount: baseAmount,
              feePercentageUsed: feePercentageUsed,
              feeAmount: feeAmount,
              tipAmount: tipAmount,
              feeRuleId: feeRuleId,
              currency,
              message: 'Direct payment fulfillment',
            },
          });
          processedDonationId = donation.id;
        } else {
          const normalizedEmail = guestEmail!.toLowerCase().trim();
          const guestDonor = await tx.guestDonor.upsert({
            where: { email: normalizedEmail },
            update: {
              totalDonated: { increment: amount },
              donationCount: { increment: 1 },
              lastDonated: new Date(),
            },
            create: {
              email: normalizedEmail,
              name: guestName,
              totalDonated: amount,
              donationCount: 1,
            }
          });

          const guestDonation = await tx.guestDonation.create({
            data: {
              guestDonorId: guestDonor.id,
              projectId,
              amount: amount,
              baseAmount: baseAmount,
              feePercentageUsed: feePercentageUsed,
              feeAmount: feeAmount,
              tipAmount: tipAmount,
              feeRuleId: feeRuleId,
              currency,
              reference,
              status: TxStatus.COMPLETED,
              message: formattedPhase
            }
          });
          processedDonationId = guestDonation.id;
        }

        const updatedProject = await tx.project.update({
          where: { id: projectId },
          data: { raisedAmount: { increment: baseAmount } }
        });

        const previousPhaseMath = calculatePhaseFunding(project);
        const previousPhaseMet = previousPhaseMath.remainingForPhaseMinor < 10000n;

        const currentPhaseMath = calculatePhaseFunding(updatedProject);
        const currentPhaseMet = currentPhaseMath.remainingForPhaseMinor < 10000n;

        const projectRemaining = updatedProject.targetAmount - updatedProject.raisedAmount;

        const isGoalMet = projectRemaining < 10000n;
        const isPhaseNewlyMet = !isGoalMet && currentPhaseMet && !previousPhaseMet;

        if (isGoalMet && updatedProject.status !== ProjectStatus.FUNDED) {
          await tx.project.update({
            where: { id: projectId },
            data: { status: ProjectStatus.FUNDED, fundedAt: new Date() }
          });
        }

        if (isPhaseNewlyMet) {
          await tx.notification.create({
            data: {
              userId: project.userId,
              type: 'MILESTONE_ALERT' as NotificationType,
              title: 'Stage funding complete',
              content: `The full capital for "${activeContext.currentStageName}" has been routed to vendors. Proof of work required.`,
              link: `/dashboard/projects/${project.id}/manage`
            }
          });

          const admins = await tx.user.findMany({
            where: { role: { in: [UserRole.ADMIN, UserRole.SUPERADMIN] } },
            select: { id: true }
          });

          if (admins.length > 0) {
            await tx.notification.createMany({
              data: admins.map(admin => ({
                userId: admin.id,
                type: 'PROJECT_STATUS' as NotificationType,
                title: 'Action required: payout finalized',
                content: `Stage "${activeContext.currentStageName}" for "${project.title}" is 100% funded. Ready for vendor disbursement.`,
                link: `/admin/projects/${project.id}/edit`
              }))
            });

            const budgetArray = Array.isArray(project.budgetBreakdown) ? (project.budgetBreakdown as any[]) : [];
            const vendorsArray = Array.isArray(project.vendors) ? (project.vendors as any[]) : [];

            const phaseBudgetItems = budgetArray.filter((b: any) => (b.stage || 'Main Stage') === activeContext.currentStageName);
            const vendorAllocations = new Map<string, { amount: number, email: string, name: string }>();

            phaseBudgetItems.forEach((b: any) => {
              const vendor = vendorsArray.find(v => v.id === b.vendorId);
              const vEmail = vendor?.email || b.vendorEmail;
              const vName = vendor?.name || b.payTo || b.vendor || 'Verified Vendor';
              const amt = b.amount || b.cost || 0;

              if (vEmail) {
                const existing = vendorAllocations.get(vEmail) || { amount: 0, email: vEmail, name: vName };
                existing.amount += amt;
                vendorAllocations.set(vEmail, existing);
              }
            });

            for (const [email, vData] of vendorAllocations.entries()) {
              this.emailService.sendVendorPhaseFundedAlert(email, {
                vendorName: vData.name,
                projectTitle: project.title,
                phaseName: activeContext.currentStageName,
                amount: vData.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                currency: currency,
                reference: reference
              }).catch(err => this.logger.error(`Vendor notification failed: ${err.message}`));
            }
          }
        }

        await tx.auditLog.create({
          data: {
            userId: userId !== 'GUEST' ? userId : undefined,
            action: AuditAction.DIRECT_PAYMENT_FULFILLED,
            entityId: processedDonationId,
            entityType: userId !== 'GUEST' ? 'Donation' : 'GuestDonation',
            metadata: {
              projectId,
              totalPaid: amount.toString(),
              totalPaid_naira: (Number(amount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              applied: baseAmount.toString(),
              applied_naira: (Number(baseAmount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              isGoalMet,
              isPhaseNewlyMet,
              reference,
              channel,
              authorization,
              donorCurrency,
              donorAmount,
              fxRate
            }
          }
        });

        return {
          status: 'processed',
          isGoalMet,
          projectTitle: project.title,
          projectSlug: project.slug,
          projectUserId: project.userId,
          targetAmount: updatedProject.targetAmount.toString(),
          formattedPhase,
          type: 'DIRECT_DONATION'
        };
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 20000
      });

      if (result.status === 'processed') {
        await this.triggerReceipt(
          userId === 'GUEST' ? null : userId,
          guestEmail || null,
          projectId,
          amount,
          currency,
          reference,
          donorCurrency,
          donorAmount,
          result.formattedPhase
        );

        if (result.isGoalMet) {
          this.prisma.user.findUnique({
            where: { id: result.projectUserId },
            select: { email: true, firstName: true }
          }).then(organizer => {
            if (organizer) {
              this.emailService.sendProjectFundedAlert(organizer.email, {
                name: organizer.firstName,
                projectTitle: result.projectTitle,
                amount: (Number(result.targetAmount) / 100).toLocaleString(),
                currency: currency,
                projectId: projectId
              });
            }
          });

          this.broadcastProjectFunded(projectId, result.projectTitle, result.projectSlug, amount, currency);
        }
      }

      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === 'P2002' || error.code === 'P2034')) {
        this.logger.warn(`Concurrently received duplicate webhook for reference ${reference}. Handled gracefully.`);
        return { status: 'duplicate', reference };
      }
      if (error instanceof BadRequestException && error.message.includes('Duplicate transaction')) {
        this.logger.warn(`Concurrently received duplicate webhook for reference ${reference}. Handled gracefully via Repository exception.`);
        return { status: 'duplicate', reference };
      }
      throw error;
    }
  }

  // Create Recurring Donation
  async createSubscription(userId: string, dto: CreateSubscriptionDto) {
    const amount = BigInt(dto.amount);

    // 1. Validate Project and Wallet (First charge is immediate)
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project || !project.isActive) {
      throw new BadRequestException('Project is not active or does not exist');
    }

    // 2. Perform the FIRST donation immediately as part of creation
    // This confirms the user has funds and validates the flow.
    await this.donate(userId, {
      projectId: dto.projectId,
      amount: dto.amount,
      currency: dto.currency,
      message: `Initial donation for recurring plan.`
    });

    // 3. Calculate next charge date
    const now = new Date();
    let nextChargeDate: Date;
    if (dto.interval === 'WEEKLY') {
      nextChargeDate = add(now, { weeks: 1 });
    } else { // MONTHLY
      nextChargeDate = add(now, { months: 1 });
    }

    // 4. Create the Subscription record
    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        projectId: dto.projectId,
        amount,
        currency: dto.currency,
        interval: dto.interval,
        status: 'ACTIVE',
        nextChargeDate,
      },
    });

    this.logger.log(`Subscription created for User ${userId} to Project ${dto.projectId}`);
    return subscription;
  }

  async getMySubscriptions(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            title: true,
            slug: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserDonations(userId: string) {
    return this.prisma.donation.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: {
            title: true,
            slug: true,
            imageUrl: true,
            targetAmount: true,
            raisedAmount: true,
            currency: true,
            status: true,
            budgetBreakdown: true,
            currentPhaseIndex: true,
          },
        },
      },
    });
  }

  async updateSubscriptionStatus(userId: string, subscriptionId: string, dto: UpdateSubscriptionStatusDto) {
    // 1. Ownership Check (Critical Security)
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.userId !== userId) {
      await this.audit.log({
        action: AuditAction.USER_LOGIN_FAILED,
        userId,
        metadata: { reason: 'IDOR Attempt on Subscription', targetId: subscriptionId }
      });
      throw new ForbiddenException('You do not own this subscription');
    }

    // 2. Update Status
    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: dto.status },
      include: {
        project: { select: { title: true } },
        user: { select: { email: true, firstName: true, preferences: true } }
      }
    });

    // 3. Audit Log
    await this.audit.log({
      userId,
      action: AuditAction.SUBSCRIPTION_UPDATED,
      entityId: subscriptionId,
      entityType: 'Subscription',
      metadata: {
        previousStatus: subscription.status,
        newStatus: dto.status,
        project: updated.project.title
      }
    });

    // 4. Trigger Email Notification
    const prefs = updated.user.preferences as any;
    if (prefs?.milestoneUpdates !== false) {
      this.emailService.sendSubscriptionUpdate(
        updated.user.email,
        updated.user.firstName,
        updated.project.title,
        dto.status
      ).catch(err => this.logger.error(`Subscription email failed: ${err.message}`));
    }

    this.logger.log(`Subscription ${subscriptionId} status changed to ${dto.status} by user ${userId}`);
    return updated;
  }

  private async broadcastProjectFunded(projectId: string, projectTitle: string, projectSlug: string, totalAmount: bigint, currency: string) {
    // 1. Fetch all unique donors (Registered) including their notification preferences
    const userDonors = await this.prisma.donation.findMany({
      where: { projectId },
      select: { user: { select: { email: true, firstName: true, preferences: true } } },
      distinct: ['userId'],
    });

    // 2. Fetch all unique guest donors
    const guestDonors = await this.prisma.guestDonation.findMany({
      where: { projectId },
      select: { guestDonor: { select: { email: true, name: true } } },
      distinct: ['guestDonorId'],
    });

    // 3. Combine into unique recipient list, filtering out registered users who disabled milestone/impact updates
    const recipients = [
      ...userDonors
        .filter(d => (d.user?.preferences as any)?.milestoneUpdates !== false)
        .map(d => ({ email: d.user?.email, name: d.user?.firstName || 'Giver' })),
      ...guestDonors.map(d => ({ email: d.guestDonor.email, name: d.guestDonor.name || 'Giver' })),
    ].filter((v, i, a) => v.email && a.findIndex(t => t.email === v.email) === i);

    const fmtAmount = (Number(totalAmount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 });

    this.logger.log(`📢 Broadcasting Goal Completion for "${projectTitle}" to ${recipients.length} eligible recipients.`);

    // 4. Batch Dispatch
    Promise.allSettled(
      recipients.map(r =>
        this.emailService.sendProjectFundedDonorAlert(r.email!, {
          name: r.name!,
          projectTitle,
          amount: fmtAmount,
          currency,
          projectId,
          projectSlug
        })
      )
    ).catch(err => this.logger.error('Donor Broadcast Transmission Failed', err));
  }

  /**
   * Helper: Calculates the precise phase cap dynamically by aggregating
   * all budget items that fall under the currently active stage and all prior stages.
   */
  private calculatePhaseCap(project: any): bigint {
    return calculatePhaseFunding(project).phaseCapMinor;
  }
}