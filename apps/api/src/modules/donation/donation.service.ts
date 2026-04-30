import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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

@Injectable()
export class DonationService {
  private readonly logger = new Logger(DonationService.name);

  private readonly MIN_DONATION_MINOR = 10000n;           // 100.00
  private readonly MAX_DONATION_MINOR = 100_000_000_000n; // 1,000,000.00

  constructor(
    private prisma: PrismaService,
    private walletRepo: WalletRepository,
    private config: ConfigService,
    private audit: AuditService,
    private emailService: EmailService,
    private feeService: FeeService,
  ) { }

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
      throw new BadRequestException('Amount exceeds maximum allowed per donation');
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
        budgetBreakdown: true,
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

    const { feeAmountMinor, rule: feeRule } = await this.feeService.calculateFee(baseAmount, project.categoryId || undefined);
    const totalCharge = baseAmount + feeAmountMinor + tipAmount;

    const result = await this.prisma.$transaction(async (tx) => {
      const txProject = await tx.project.findUnique({
        where: { id: dto.projectId },
      });

      if (!txProject || !txProject.isActive) {
        throw new BadRequestException('Project state changed during processing');
      }

      const activeIndex = txProject.currentPhaseIndex || 0;
      const budget = (txProject.budgetBreakdown as any[]) || [];
      const vendors = (txProject.vendors as any[]) || [];
      const activeBudgetItem = budget[activeIndex];
      const phaseNameRaw = activeBudgetItem ? (activeBudgetItem.description || activeBudgetItem.item) : 'Final Phase';
      const formattedPhase = `Phase ${activeIndex + 1}: ${phaseNameRaw}`;

      const activeVendor = vendors.find(v => v.id === activeBudgetItem?.vendorId);
      const activeSubaccount = activeVendor?.subaccountCode || activeBudgetItem?.vendorSubaccount;

      if (!activeSubaccount) {
        throw new InternalServerErrorException(
          'Strict Non-Custodial Policy: The active phase lacks a verified vendor routing account.'
        );
      }

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
                description: `Platform fee from: ${txProject.title}`,
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
                description: `Donor tip from: ${txProject.title}`,
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

    return result.donation;
  }

  async initiateDirectDonation(user: any | undefined, dto: InitiateDirectDonationDto) {
    if (user && user.emailVerified === false) {
      throw new ForbiddenException('Please verify your email address to use direct payments.');
    }

    const baseAmountBig = BigInt(dto.amount);
    const tipAmountBig = BigInt(dto.tipAmount || '0');

    if (baseAmountBig < this.MIN_DONATION_MINOR) {
      throw new BadRequestException('Minimum donation amount is 100.00');
    }

    if (baseAmountBig > this.MAX_DONATION_MINOR) {
      throw new BadRequestException('Amount exceeds maximum allowed per donation');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      select: {
        id: true, isActive: true, currency: true, status: true, categoryId: true,
        budgetBreakdown: true, currentPhaseIndex: true, vendors: true // <-- NEW: Ensure vendors are fetched
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

    const { feeAmountMinor, rule: feeRule } = await this.feeService.calculateFee(baseAmountBig, project.categoryId || undefined);
    const totalCharge = baseAmountBig + feeAmountMinor + tipAmountBig;

    let emailToCharge: string;
    let internalUserId: string | null = null;

    if (user) {
      emailToCharge = user.email;
      internalUserId = user.id;
    } else {
      if (!dto.guestEmail?.trim()) {
        throw new BadRequestException('Email is required for guest donations');
      }
      emailToCharge = dto.guestEmail.trim();
    }

    const activeIndex = project.currentPhaseIndex || 0;
    const budget = (project.budgetBreakdown as any[]) || [];
    const vendors = (project.vendors as any[]) || []; // <-- NEW: Array mapping

    // Resolving the subaccount from the new Vendor structure with fallback
    const activeBudgetItem = budget[activeIndex];
    const activeVendor = vendors.find(v => v.id === activeBudgetItem?.vendorId);
    const activeSubaccount = activeVendor?.subaccountCode || activeBudgetItem?.vendorSubaccount;

    if (!activeSubaccount) {
      throw new InternalServerErrorException(
        'Strict Non-Custodial Policy: The active phase lacks a verified vendor routing account. Donations are temporarily halted.'
      );
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
          fxRate: dto.fxRate
        },
        callback_url: `${this.config.get('FRONTEND_URL')}/callback`,
      };

      if (activeSubaccount) {
        paystackPayload.subaccount = activeSubaccount;
        paystackPayload.transaction_charge = Number(feeAmountMinor + tipAmountBig);
        paystackPayload.bearer = 'subaccount';
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

      throw new InternalServerErrorException('Unable to initialize payment at this time');
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

      if (!project) throw new NotFoundException('Project node missing on ledger');

      const activeIndex = project.currentPhaseIndex || 0;
      const budget = (project.budgetBreakdown as any[]) || [];
      const vendors = (project.vendors as any[]) || [];
      const activeBudgetItem = budget[activeIndex];
      const phaseNameRaw = activeBudgetItem ? (activeBudgetItem.description || activeBudgetItem.item) : 'Final Phase';
      const formattedPhase = `Phase ${activeIndex + 1}: ${phaseNameRaw}`;

      const activeVendor = vendors.find(v => v.id === activeBudgetItem?.vendorId);
      const activeSubaccount = activeVendor?.subaccountCode || activeBudgetItem?.vendorSubaccount;

      if (!activeSubaccount) {
        throw new InternalServerErrorException(
          'Strict Non-Custodial Policy: The active phase lacks a verified vendor routing account.'
        );
      }

      let processedDonationId: string;
      let isGoalMet = false;
      let isPhaseNewlyMet = false;

      // Platform Fee Deductions
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
                description: `Platform fee via Gateway: ${project.title}`,
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
                description: `Platform tip via Gateway: ${project.title}`,
                metadata: { originalProjectId: project.id, channel }
              }
            });
            await tx.wallet.update({ where: { id: systemWalletId }, data: { balance: { increment: tipAmount } } });
          }
        }
      }

      // Guest / User Logic routing
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

      // --- PROJECT FULFILLMENT & THRESHOLD DUST COVERAGE ---
      let updatedProject = await tx.project.update({
        where: { id: projectId },
        data: { raisedAmount: { increment: baseAmount } }
      });

      // Calculate phase cap
      let cumulativeMajor = 0;
      for (let i = 0; i <= activeIndex && i < budget.length; i++) {
        cumulativeMajor += (budget[i].amount || (budget[i] as any).cost || 0);
      }
      let currentPhaseCap = BigInt(cumulativeMajor * 100);
      if (budget.length === 0 || activeIndex >= budget.length) {
        currentPhaseCap = BigInt(updatedProject.targetAmount || '0');
      }

      let currentRemainingForPhase = currentPhaseCap - updatedProject.raisedAmount;

      // THRESHOLD COMPLETION RULE (PLATFORM DUST COVERAGE)
      // If remaining balance is between ₦0.01 and ₦99.99, the platform absorbs it
      if (currentRemainingForPhase > 0n && currentRemainingForPhase < 10000n) {
        const dustMinor = currentRemainingForPhase;

        const systemNode = await tx.user.findFirst({
          where: { role: UserRole.SUPERADMIN },
          include: { wallets: { where: { currency } } }
        });

        if (systemNode?.wallets[0]) {
          const systemWalletId = systemNode.wallets[0].id;

          const dustTx = await tx.walletTransaction.create({
            data: {
              walletId: systemWalletId,
              amount: dustMinor,
              currency,
              type: TxType.DEBIT,
              status: TxStatus.COMPLETED,
              category: TxCategory.ADJUSTMENT,
              reference: `DUST-${reference}`,
              description: `Platform Dust Coverage to finalize phase: ${project.title}`,
              metadata: { originalProjectId: project.id, reason: 'THRESHOLD_COMPLETION_RULE' }
            }
          });

          await tx.wallet.update({
            where: { id: systemWalletId },
            data: { balance: { decrement: dustMinor } }
          });

          await tx.donation.create({
            data: {
              userId: systemNode.id,
              projectId: project.id,
              transactionId: dustTx.id,
              amount: dustMinor,
              baseAmount: dustMinor,
              currency,
              message: 'Platform Dust Coverage (Threshold Completion)',
            }
          });

          updatedProject = await tx.project.update({
            where: { id: projectId },
            data: { raisedAmount: { increment: dustMinor } }
          });

          await tx.auditLog.create({
            data: {
              userId: systemNode.id,
              action: AuditAction.PROJECT_UPDATED,
              entityId: projectId,
              entityType: 'Project',
              metadata: {
                action: 'PLATFORM_ROUNDING_POLICY',
                coveredAmount_naira: Number(dustMinor) / 100,
                triggeringDonationRef: reference
              }
            }
          });

          currentRemainingForPhase = 0n;
        }
      }

      isGoalMet = updatedProject.raisedAmount >= updatedProject.targetAmount;
      isPhaseNewlyMet = !isGoalMet && (currentRemainingForPhase <= 0n);

      if (isGoalMet && updatedProject.status === ProjectStatus.ACTIVE) {
        await tx.project.update({
          where: { id: projectId },
          data: { status: ProjectStatus.FUNDED, fundedAt: new Date() }
        });
      }

      await tx.notification.create({
        data: {
          userId: project.userId,
          type: 'DONATION_RECEIVED' as NotificationType,
          title: 'New contribution received',
          content: `You received a gift for "${project.title}".`,
          link: `/dashboard/impact/${project.slug}`
        }
      });

      if (isGoalMet) {
        await tx.notification.create({
          data: {
            userId: project.userId,
            type: 'PROJECT_STATUS' as NotificationType,
            title: 'Goal reached!',
            content: `Success! "${project.title}" is now fully funded.`,
            link: `/dashboard/impact/${project.slug}`
          }
        });
      }

      if (isPhaseNewlyMet) {
        await tx.notification.create({
          data: {
            userId: project.userId,
            type: 'MILESTONE_ALERT' as NotificationType,
            title: 'Phase Funding Complete',
            content: `The full capital for "${phaseNameRaw}" has been routed to the vendor. Work can now commence.`,
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
              title: 'Action Required: Payout Finalized',
              content: `Phase ${project.currentPhaseIndex + 1} for "${project.title}" is 100% funded. Contact the vendor to authorize work.`,
              link: `/admin/projects/${project.id}/edit`
            }))
          });

          const vendorName = activeVendor ? activeVendor.name : (activeBudgetItem?.payTo || activeBudgetItem?.vendor || 'Verified Vendor');
          const totalPhaseAmount = activeBudgetItem?.amount || (activeBudgetItem as any)?.cost || 0;

          this.emailService.sendAdminVendorPayoutAlert({
            projectTitle: project.title,
            phaseName: phaseNameRaw,
            vendorName,
            amount: totalPhaseAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            currency: currency,
            reference: reference,
            projectId: project.id
          }).catch(() => { });
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
              amount: (Number(amount) / 100).toLocaleString(),
              currency: currency,
              projectId: projectId
            });
          }
        });

        this.broadcastProjectFunded(projectId, result.projectTitle, result.projectSlug, amount, currency);
      }
    }

    return result;
  }

  // --- Private Handler: Registered User ---
  private async fulfillUserDirectDonation(data: {
    userId: string;
    projectId: string;
    amount: bigint;
    currency: Currency;
    reference: string;
    channel?: string;
    authorization?: any;
    // Capture FX metadata for forensic tracing
    donorCurrency?: string;
    donorAmount?: string;
    fxRate?: number;
  }) {
    const {
      userId, projectId, amount, currency, reference, channel, authorization,
      donorCurrency, donorAmount, fxRate
    } = data;

    const result = await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUniqueOrThrow({
        where: { userId_currency: { userId, currency } }
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          currency,
          type: TxType.CREDIT,
          status: TxStatus.COMPLETED,
          category: TxCategory.FUNDING,
          reference: `${reference}-CREDIT`,
          description: `Direct Donation Charge`,
          metadata: { channel, authorization, donorCurrency, donorAmount, fxRate }
        },
      });

      const donationTx = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          currency,
          type: TxType.DEBIT,
          status: TxStatus.COMPLETED,
          category: TxCategory.DONATION,
          reference,
          description: `Direct donation to project ${projectId}`,
          metadata: { channel, authorization, donorCurrency, donorAmount, fxRate }
        },
      });

      const donation = await tx.donation.create({
        data: {
          userId,
          projectId,
          transactionId: donationTx.id,
          amount,
          currency,
          message: 'Direct donation via Paystack',
        },
      });

      const project = await tx.project.findUniqueOrThrow({
        where: { id: projectId },
        select: { raisedAmount: true, targetAmount: true, userId: true, title: true, currency: true, slug: true }
      });

      const newRaisedAmount = project.raisedAmount + amount;
      const isNowFunded = newRaisedAmount === project.targetAmount;

      await tx.project.update({
        where: { id: projectId },
        data: {
          raisedAmount: newRaisedAmount,
          ...(isNowFunded && {
            status: ProjectStatus.FUNDED,
            fundedAt: new Date(),
          })
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.DIRECT_PAYMENT_FULFILLED,
          entityId: donation.id,
          entityType: 'Donation',
          metadata: {
            projectId,
            amount: amount.toString(),
            amount_naira: (Number(amount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            currency,
            reference,
            method: 'DIRECT_WEBHOOK',
            isGoalMet: isNowFunded,
            channel,
            authorization,
            donorCurrency,
            donorAmount,
            fxRate
          }
        }
      });

      return {
        donationId: donation.id,
        isGoalMet: isNowFunded,
        projectContext: {
          organizerId: project.userId,
          title: project.title,
          targetAmount: project.targetAmount,
          currency: project.currency,
          id: projectId,
          slug: project.slug
        }
      };
    }, {
      timeout: 15000,
      maxWait: 5000
    });

    if (result.isGoalMet) {
      // Notify Organizer
      this.prisma.user.findUnique({
        where: { id: result.projectContext.organizerId },
        select: { email: true, firstName: true }
      }).then(organizer => {
        if (organizer) {
          this.emailService.sendProjectFundedAlert(organizer.email, {
            name: organizer.firstName,
            projectTitle: result.projectContext.title,
            amount: (Number(result.projectContext.targetAmount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 }),
            currency: result.projectContext.currency,
            projectId: result.projectContext.id
          });
        }
      });

      this.broadcastProjectFunded(
        result.projectContext.id,
        result.projectContext.title,
        result.projectContext.slug,
        result.projectContext.targetAmount,
        result.projectContext.currency
      );
    }

    return {
      type: 'user',
      donationId: result.donationId,
      status: 'processed',
      reference
    };
  }

  // --- Private Handler: Guest ---
  private async fulfillGuestDonation(data: {
    email: string;
    name?: string;
    projectId: string;
    amount: bigint;
    currency: Currency;
    reference: string;
    // Add FX metadata to private signature
    donorCurrency?: string;
    donorAmount?: string;
    fxRate?: number;
  }) {
    const { email, name, projectId, amount, currency, reference, donorCurrency, donorAmount, fxRate } = data;
    const normalizedEmail = email.toLowerCase().trim();

    const result = await this.prisma.$transaction(async (tx) => {
      const guestDonor = await tx.guestDonor.upsert({
        where: { email: normalizedEmail },
        update: {
          totalDonated: { increment: amount },
          donationCount: { increment: 1 },
          lastDonated: new Date(),
        },
        create: {
          email: normalizedEmail,
          name,
          totalDonated: amount,
          donationCount: 1,
        }
      });

      const guestDonation = await tx.guestDonation.create({
        data: {
          guestDonorId: guestDonor.id,
          projectId,
          amount,
          currency,
          reference,
          status: TxStatus.COMPLETED
        }
      });

      const project = await tx.project.findUniqueOrThrow({
        where: { id: projectId },
        select: { raisedAmount: true, targetAmount: true, userId: true, title: true, currency: true, slug: true }
      });

      const newRaisedAmount = project.raisedAmount + amount;
      const isNowFunded = newRaisedAmount === project.targetAmount;

      await tx.project.update({
        where: { id: projectId },
        data: {
          raisedAmount: newRaisedAmount,
          ...(isNowFunded && {
            status: ProjectStatus.FUNDED,
            fundedAt: new Date(),
          })
        },
      });

      await this.audit.log({
        action: AuditAction.DIRECT_PAYMENT_FULFILLED,
        entityId: guestDonation.id,
        entityType: 'GuestDonation',
        metadata: {
          guestEmail: normalizedEmail,
          amount: amount.toString(),
          amount_naira: (Number(amount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          projectId,
          reference,
          method: 'GUEST_WEBHOOK',
          isGoalMet: isNowFunded,
          // Inject FX metadata into audit trail for Guest reconciliation
          donorCurrency,
          donorAmount,
          fxRate
        }
      }, tx);

      return {
        donationId: guestDonation.id,
        isGoalMet: isNowFunded,
        projectContext: {
          organizerId: project.userId,
          title: project.title,
          targetAmount: project.targetAmount,
          currency: project.currency,
          id: projectId,
          slug: project.slug
        }
      };
    }, {
      timeout: 15000,
      maxWait: 5000
    });

    if (result.isGoalMet) {
      // Notify Organizer
      this.prisma.user.findUnique({
        where: { id: result.projectContext.organizerId },
        select: { email: true, firstName: true }
      }).then(organizer => {
        if (organizer) {
          this.emailService.sendProjectFundedAlert(organizer.email, {
            name: organizer.firstName,
            projectTitle: result.projectContext.title,
            amount: (Number(result.projectContext.targetAmount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 }),
            currency: result.projectContext.currency,
            projectId: result.projectContext.id
          });
        }
      });

      this.broadcastProjectFunded(
        result.projectContext.id,
        result.projectContext.title,
        result.projectContext.slug,
        result.projectContext.targetAmount,
        result.projectContext.currency
      );
    }

    return {
      type: 'guest',
      donationId: result.donationId,
      status: 'processed',
      reference
    };
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

  /**
   * Suspense Routing Handler
   * Captures orphaned funds for manual Admin reconciliation
   */
  private async handleSuspenseRouting(data: any, projectTitle?: string) {
    const { userId, guestEmail, guestName, amount, currency, reference, projectId } = data;

    return this.prisma.$transaction(async (tx) => {
      let resultId: string;
      let resultType: string;

      if (userId !== 'GUEST') {
        const wallet = await tx.wallet.upsert({
          where: { userId_currency: { userId, currency } },
          update: {},
          create: { userId, currency, balance: 0n },
        });

        const suspenseTx = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount,
            currency,
            type: TxType.CREDIT,
            status: TxStatus.SUSPENSE,
            category: TxCategory.INTERNAL_TRANSFER,
            reference,
            description: `PENDING ROUTING: Payment for closed project (${projectTitle || 'Unknown'})`,
            metadata: { originalProjectId: projectId, reason: 'PROJECT_CLOSED' }
          }
        });

        resultId = suspenseTx.id;
        resultType = 'WalletTransaction';

      } else {
        const normalizedEmail = guestEmail.toLowerCase().trim();

        const guestDonor = await tx.guestDonor.upsert({
          where: { email: normalizedEmail },
          update: { lastDonated: new Date() },
          create: {
            email: normalizedEmail,
            name: guestName,
          }
        });

        const guestSuspense = await tx.guestDonation.create({
          data: {
            guestDonorId: guestDonor.id,
            projectId,
            amount,
            currency,
            reference,
            status: TxStatus.SUSPENSE,
            message: 'Funds received after project closure'
          }
        });

        resultId = guestSuspense.id;
        resultType = 'GuestDonation';
      }

      // Logic: Fetch all Administrative Nodes for In-App Notification
      const admins = await tx.user.findMany({
        where: { role: { in: [UserRole.ADMIN, UserRole.SUPERADMIN] } },
        select: { id: true }
      });

      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map(admin => ({
            userId: admin.id,
            type: 'SYSTEM' as NotificationType,
            title: 'Unallocated Funds Detected',
            content: `₦${(Number(amount) / 100).toLocaleString()} requires manual routing (Ref: ${reference.slice(0, 8)}).`,
            link: '/admin/ledger'
          }))
        });
      }

      await tx.auditLog.create({
        data: {
          userId: userId !== 'GUEST' ? userId : undefined,
          action: AuditAction.FUNDS_MOVED_TO_SUSPENSE,
          entityId: resultId,
          entityType: resultType,
          metadata: {
            reference,
            amount: amount.toString(),
            amount_naira: (Number(amount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            projectId,
            guestEmail: userId === 'GUEST' ? guestEmail : undefined
          }
        }
      });

      return { status: 'moved_to_suspense', reference };
    }).then(async (result) => {
      // Logic: Trigger External Email Broadcast (Async)
      this.emailService.sendAdminSuspenseAlert({
        amount: (Number(amount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 }),
        currency,
        reference,
        reason: projectTitle ? `Donation to closed project: ${projectTitle}` : 'Unknown destination project'
      }).catch(err => this.logger.error(`Admin Suspense Email Failed: ${err.message}`));

      return result;
    });
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

  private calculatePhaseCap(project: any): bigint {
    const budget = (project.budgetBreakdown as any[]) || [];
    let cumulativeMajor = 0;
    const activeIndex = project.currentPhaseIndex || 0;

    for (let i = 0; i <= activeIndex && i < budget.length; i++) {
      cumulativeMajor += (budget[i].amount || budget[i].cost || 0);
    }

    let currentPhaseCap = BigInt(cumulativeMajor * 100);

    // Failsafe: if timeline is exhausted or budget is empty, cap at total target
    if (budget.length === 0 || activeIndex >= budget.length) {
      currentPhaseCap = BigInt(project.targetAmount || '0');
    }

    return currentPhaseCap;
  }
}