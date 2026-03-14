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
    surplus: bigint = 0n,
    donorCurrency?: string,
    donorAmount?: string
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
        const appliedAmount = amount - surplus;

        await this.emailService.sendDonationReceipt(email, {
          amount: (Number(amount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 }),
          currency: currency,
          project: project?.title || 'Impact Project',
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
          ref: reference,
          surplus: surplus > 0n ? (Number(surplus) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 }) : undefined,
          applied: surplus > 0n ? (Number(appliedAmount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 }) : undefined,
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
        categoryId: true
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

      const currentRemaining = txProject.targetAmount - txProject.raisedAmount;
      const actualRemaining = (txProject.status !== ProjectStatus.ACTIVE || currentRemaining <= 0n) ? 0n : currentRemaining;

      const amountToProject = baseAmount > actualRemaining ? actualRemaining : baseAmount;
      const surplus = baseAmount - amountToProject;

      const reference = `DON-${crypto.randomUUID()}`;

      // 1. Process full debit from user wallet (Base + Fee + Tip)
      // Categorized as DONATION (System considers the whole outflow a donation event)
      const { transaction: walletTx } = await this.walletRepo.processTransaction(
        {
          userId,
          amount: totalCharge,
          currency: dto.currency,
          type: TxType.DEBIT,
          reference,
          description: `Donation to: ${txProject.title}`,
          status: TxStatus.COMPLETED,
          category: TxCategory.DONATION, // <--- Explicit Category
        },
        tx,
      );

      // 2. Platform Revenue Routing (Split into Fee and Tip)
      if (feeAmountMinor > 0n || tipAmount > 0n) {
        const systemNode = await tx.user.findFirst({
          where: { role: UserRole.SUPERADMIN },
          include: { wallets: { where: { currency: dto.currency } } }
        });

        if (systemNode?.wallets[0]) {
          const systemWalletId = systemNode.wallets[0].id;

          // A. The Mandatory Fee
          if (feeAmountMinor > 0n) {
            await tx.walletTransaction.create({
              data: {
                walletId: systemWalletId,
                amount: feeAmountMinor,
                currency: dto.currency,
                type: TxType.CREDIT,
                status: TxStatus.COMPLETED,
                category: TxCategory.TRANSACTION_FEE, // <--- Explicit
                reference: `FEE-${reference}`,
                description: `Platform fee from: ${txProject.title}`,
                metadata: { originalProjectId: txProject.id, donorId: userId }
              }
            });

            // Increment wallet balance for fee
            await tx.wallet.update({
              where: { id: systemWalletId },
              data: { balance: { increment: feeAmountMinor } }
            });
          }

          // B. The Voluntary Tip
          if (tipAmount > 0n) {
            await tx.walletTransaction.create({
              data: {
                walletId: systemWalletId,
                amount: tipAmount,
                currency: dto.currency,
                type: TxType.CREDIT,
                status: TxStatus.COMPLETED,
                category: TxCategory.VOLUNTARY_TIP, // <--- Explicit
                reference: `TIP-${reference}`,
                description: `Donor tip from: ${txProject.title}`,
                metadata: { originalProjectId: txProject.id, donorId: userId }
              }
            });

            // Increment wallet balance for tip
            await tx.wallet.update({
              where: { id: systemWalletId },
              data: { balance: { increment: tipAmount } }
            });
          }
        }
      }

      // 3. Spillover Logic
      if (surplus > 0n) {
        const systemNode = await tx.user.findFirst({
          where: { role: UserRole.SUPERADMIN },
          include: { wallets: { where: { currency: dto.currency } } }
        });

        if (!systemNode || !systemNode.wallets[0]) {
          throw new InternalServerErrorException(
            `System Protocol Error: No active ${dto.currency} node available to capture surplus capital.`
          );
        }

        await tx.walletTransaction.create({
          data: {
            walletId: systemNode.wallets[0].id,
            amount: surplus,
            currency: dto.currency,
            type: TxType.CREDIT,
            status: TxStatus.SUSPENSE,
            category: TxCategory.INTERNAL_TRANSFER, // <--- Explicit
            reference: `SPILL-${reference}`,
            description: `Surplus capital from completion of: ${txProject.title}`,
            metadata: {
              originalProjectId: txProject.id,
              donorId: userId,
              reason: actualRemaining === 0n ? 'PROJECT_ALREADY_FUNDED' : 'GOAL_THRESHOLD_EXCEEDED'
            }
          }
        });
      }

      // 4. Create Donation record
      let donation = null;
      let isGoalMet = false;

      if (amountToProject > 0n) {
        donation = await tx.donation.create({
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
          data: { raisedAmount: { increment: amountToProject } },
        });

        isGoalMet = updatedProject.raisedAmount >= updatedProject.targetAmount;

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
            appliedToProject: amountToProject.toString(),
            surplus: surplus.toString(),
            feeAmount: feeAmountMinor.toString(),
            tipAmount: tipAmount.toString(),
            currency: dto.currency,
            reference,
            isGoalMet,
          },
        },
        tx,
      );

      return { donation, isGoalMet, project: txProject, surplus, totalCharge };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });

    // 1. Trigger Individual Receipt for the FULL amount paid (matches bank statement)
    await this.triggerReceipt(userId, null, dto.projectId, result.totalCharge, dto.currency, `WAL-${result.project.id.slice(0, 8)}`, result.surplus);

    // 2. Trigger "Project Funded" Alert to Organizer
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
      select: { id: true, isActive: true, currency: true, status: true, categoryId: true },
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

    try {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
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
        },
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
      // 1. Idempotency Guard
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

      // 2. Refined Spillover Logic
      // Logic: Identify if project is effectively closed to new capital.
      const isClosed = ([ProjectStatus.COMPLETED, ProjectStatus.SUSPENDED] as ProjectStatus[]).includes(project.status);

      const currentRemaining = project.targetAmount - project.raisedAmount;
      // If the project is closed, it accepts zero. If open, it accepts up to the remaining gap.
      const actualRemaining = isClosed ? 0n : (currentRemaining <= 0n ? 0n : currentRemaining);

      const amountToProject = baseAmount > actualRemaining ? actualRemaining : baseAmount;
      const surplus = baseAmount - amountToProject;

      let processedDonationId: string;
      let isGoalMet = false;

      // Platform Revenue Routing for Direct Pays
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

      if (userId !== 'GUEST') {
        // --- PATH: REGISTERED USER (FIXED FOR SYMMETRY) ---

        // 1. Process Inflow: Atomically increment wallet balance
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

        // 2. Process Outflow: Atomically decrement wallet balance
        const { transaction: donationTx } = await this.walletRepo.processTransaction({
          userId,
          amount,
          currency,
          type: TxType.DEBIT,
          reference,
          description: `Direct donation: ${project.title}`,
          status: TxStatus.COMPLETED,
          category: TxCategory.DONATION,
          metadata: { channel, authorization, donorCurrency, donorAmount, fxRate }
        }, tx);

        if (amountToProject > 0n) {
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
          processedDonationId = donationTx.id;
        }
      } else {
        // --- PATH: GUEST DONOR ---
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
          }
        });
        processedDonationId = guestDonation.id;
      }

      // 3. Ledger Sync: Update Project State uses baseAmount To Project
      if (amountToProject > 0n) {
        const updatedProject = await tx.project.update({
          where: { id: projectId },
          data: { raisedAmount: { increment: amountToProject } }
        });

        isGoalMet = updatedProject.raisedAmount >= updatedProject.targetAmount;

        // Logic: Only flip status to Funded if it was previously Active.
        if (isGoalMet && updatedProject.status === ProjectStatus.ACTIVE) {
          await tx.project.update({
            where: { id: projectId },
            data: { status: ProjectStatus.FUNDED, fundedAt: new Date() }
          });
        }

        // Logic: Notify owner of incoming direct donation
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
      }

      // 4. Surplus Routing: Move only the true excess to the Suspense Ledger
      if (surplus > 0n) {
        const systemNode = await tx.user.findFirst({
          where: { role: UserRole.SUPERADMIN },
          include: { wallets: { where: { currency } } }
        });

        if (systemNode?.wallets[0]) {
          await tx.walletTransaction.create({
            data: {
              walletId: systemNode.wallets[0].id,
              amount: surplus,
              currency,
              type: TxType.CREDIT,
              status: TxStatus.SUSPENSE,
              category: TxCategory.INTERNAL_TRANSFER,
              reference: `SPILL-${reference}`,
              description: `Surplus from direct completion: ${project.title}`,
              metadata: {
                originalProjectId: project.id,
                email: guestEmail || userId,
                reason: actualRemaining === 0n ? 'PROJECT_ALREADY_FUNDED' : 'GOAL_THRESHOLD_EXCEEDED',
                channel
              }
            }
          });
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
            applied: amountToProject.toString(),
            applied_naira: (Number(amountToProject) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            surplus: surplus.toString(),
            surplus_naira: (Number(surplus) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            isGoalMet,
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
        surplus,
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
        result.surplus,
        donorCurrency,
        donorAmount
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
            description: `SUSPENSE: Donation for closed project (${projectTitle || 'Unknown'})`,
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
            title: 'Orphaned funds detected',
            content: `₦${(Number(amount) / 100).toLocaleString()} hit the suspense ledger (Ref: ${reference.slice(0, 8)}).`,
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
}