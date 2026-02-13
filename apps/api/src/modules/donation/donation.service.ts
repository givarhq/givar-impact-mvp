import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Currency, TxStatus, TxType, AuditAction, ProjectStatus, UserRole, Prisma } from '@givar/database';
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
  ) { }

  // Centralized Receipt Logic
  private async triggerReceipt(userId: string | null, guestEmail: string | null, projectId: string, amount: bigint, currency: Currency, reference: string) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { title: true }
      });

      let email: string | undefined | null = guestEmail;

      if (!email && userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, preferences: true } });

        const prefs = user?.preferences as any;
        if (prefs?.donationReceipts === false) {
          this.logger.log(`Skipping receipt for user ${userId} per preference settings.`);
          return;
        }

        email = user?.email;
      }

      if (email) {
        // Fire and forget (don't await) to keep API responsive
        this.emailService.sendDonationReceipt(email, {
          amount: (Number(amount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 }),
          currency: currency,
          project: project?.title || 'Impact Project',
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
          ref: reference
        }).catch(err => {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(`Receipt Email Failed: ${msg}`);
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

    const amount = BigInt(dto.amount);

    if (amount < this.MIN_DONATION_MINOR) {
      throw new BadRequestException('Amount is below minimum allowed (100.00)');
    }

    if (amount > this.MAX_DONATION_MINOR) {
      throw new BadRequestException('Amount exceeds maximum allowed per donation');
    }

    // Initial check outside transaction for quick rejection
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
        slug: true
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

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Transaction-level Re-read: Get fresh state to prevent race conditions
      const txProject = await tx.project.findUnique({
        where: { id: dto.projectId },
      });

      if (!txProject || !txProject.isActive) {
        throw new BadRequestException('Project state changed during processing');
      }

      // 2. Dynamic Cap Calculation: Handle already-funded guard inside transaction
      const currentRemaining = txProject.targetAmount - txProject.raisedAmount;

      // If project was funded mid-flight, actualRemaining becomes 0
      const actualRemaining = (txProject.status !== ProjectStatus.ACTIVE || currentRemaining <= 0n) ? 0n : currentRemaining;

      const amountToProject = amount > actualRemaining ? actualRemaining : amount;
      const surplus = amount - amountToProject;

      const reference = `DON-${crypto.randomUUID()}`;

      // 3. Process full debit from user wallet
      const { transaction: walletTx } = await this.walletRepo.processTransaction(
        {
          userId,
          amount,
          currency: dto.currency,
          type: TxType.DEBIT,
          reference,
          description: `Donation to: ${txProject.title}`,
          status: TxStatus.COMPLETED,
        },
        tx,
      );

      // 4. Spillover Logic: Enforce system wallet existence (no silent spill loss)
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

      // 5. Create Donation record (Only if project accepted a portion of the capital)
      let donation = null;
      let isGoalMet = false;

      if (amountToProject > 0n) {
        donation = await tx.donation.create({
          data: {
            userId,
            projectId: txProject.id,
            transactionId: walletTx.id,
            amount: amountToProject,
            currency: dto.currency,
            message: dto.message?.trim() || null,
          },
        });

        // 6. Double-entry symmetry: Update Project raised amount
        const updatedProject = await tx.project.update({
          where: { id: txProject.id },
          data: {
            raisedAmount: { increment: amountToProject }
          },
        });

        isGoalMet = updatedProject.raisedAmount >= updatedProject.targetAmount;

        if (isGoalMet) {
          await tx.project.update({
            where: { id: txProject.id },
            data: {
              status: ProjectStatus.FUNDED,
              fundedAt: new Date(),
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
            totalPaid: amount.toString(),
            appliedToProject: amountToProject.toString(),
            surplus: surplus.toString(),
            currency: dto.currency,
            reference,
            isGoalMet,
          },
        },
        tx,
      );

      // We return the txProject as it has the original context needed for notifications
      return { donation, isGoalMet, project: txProject };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });

    // 1. Trigger Individual Receipt for the FULL amount paid (matches bank statement)
    await this.triggerReceipt(userId, null, dto.projectId, amount, dto.currency, `WAL-${result.project.id.slice(0, 8)}`);

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
    if (user && !user.emailVerified) {
      throw new ForbiddenException('EMAIL_NOT_VERIFIED');
    }

    const amountBig = BigInt(dto.amount);

    if (amountBig < this.MIN_DONATION_MINOR) {
      throw new BadRequestException('Minimum donation amount is 100.00');
    }

    if (amountBig > this.MAX_DONATION_MINOR) {
      throw new BadRequestException('Amount exceeds maximum allowed per donation');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      select: { id: true, isActive: true, currency: true, status: true },
    });

    if (!project || !project.isActive) {
      throw new BadRequestException('Project is not active or does not exist');
    }

    // Note: We no longer check "amount > remainingNeeded" here to allow Paystack 
    // to process the payment. The capping will happen in fulfillDirectDonation.
    if (project.status !== ProjectStatus.ACTIVE) {
      throw new BadRequestException(`Project is currently ${project.status.toLowerCase()} and cannot accept donations.`);
    }

    if (project.currency !== dto.currency) {
      throw new BadRequestException(`Project only accepts ${project.currency}`);
    }

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
          amount: Number(amountBig),
          currency: dto.currency,
          metadata: {
            donationType: 'DIRECT',
            userId: internalUserId ?? 'GUEST',
            guestEmail: emailToCharge,
            guestName: dto.guestName?.trim() || 'Anonymous',
            projectId: dto.projectId,
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

  /**
   * Fulfill direct (Paystack-initiated) donation from webhook
   * Critical: must be extremely idempotent
   * Fulfill direct donation with Funding Cap and Suspense Routing
   * Strictly respects Guest/User branching and Security Hardening
   */
  async fulfillDirectDonation(data: {
    userId: string;
    guestEmail?: string;
    guestName?: string;
    projectId: string;
    amount: bigint;
    currency: Currency;
    reference: string;
    channel?: string;
  }) {
    const { userId, guestEmail, guestName, projectId, amount, currency, reference, channel } = data;

    // 1. Channel Validation (Anti-Fraud) - Outside TX for performance
    if (channel && !['card', 'bank', 'bank_transfer', 'ussd', 'qr', 'mobile_money'].includes(channel)) {
      this.logger.warn(`Suspicious payment channel ignored`, { channel, reference });
      return { status: 'ignored_channel', reference };
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 2. Strict Webhook Idempotency Check (Inside Serializable TX)
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

      // 3. Transactional Re-read of Project State
      const project = await tx.project.findUnique({
        where: { id: projectId },
      });

      if (!project) throw new NotFoundException('Project node missing on ledger');

      // 4. Cap & Spillover Calculation
      const currentRemaining = project.targetAmount - project.raisedAmount;
      const actualRemaining = (project.status !== ProjectStatus.ACTIVE || currentRemaining <= 0n) ? 0n : currentRemaining;

      const amountToProject = amount > actualRemaining ? actualRemaining : amount;
      const surplus = amount - amountToProject;

      let processedDonationId: string;
      let isGoalMet = false;

      // 5. Branching Logic: Registered User vs Guest
      if (userId !== 'GUEST') {
        // --- PATH: REGISTERED USER ---
        const wallet = await tx.wallet.findUniqueOrThrow({
          where: { userId_currency: { userId, currency } }
        });

        // Double-entry symmetry: Record the gateway inflow to user wallet first
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount,
            currency,
            type: TxType.CREDIT,
            status: TxStatus.COMPLETED,
            reference: `IN-${reference}`,
            description: `Direct Pay Inflow`,
          },
        });

        // Record the debit for the donation
        const donationTx = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount,
            currency,
            type: TxType.DEBIT,
            status: TxStatus.COMPLETED,
            reference,
            description: `Direct donation: ${project.title}`,
          },
        });

        if (amountToProject > 0n) {
          const donation = await tx.donation.create({
            data: {
              userId,
              projectId,
              transactionId: donationTx.id,
              amount: amountToProject,
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
            amount: amountToProject, // Only the capped portion
            currency,
            reference,
            status: TxStatus.COMPLETED
          }
        });
        processedDonationId = guestDonation.id;
      }

      // 6. Impact Application (Project Credit)
      if (amountToProject > 0n) {
        const updatedProject = await tx.project.update({
          where: { id: projectId },
          data: { raisedAmount: { increment: amountToProject } }
        });

        isGoalMet = updatedProject.raisedAmount >= updatedProject.targetAmount;

        if (isGoalMet) {
          await tx.project.update({
            where: { id: projectId },
            data: { status: ProjectStatus.FUNDED, fundedAt: new Date() }
          });
        }
      }

      // 7. Surplus Protocol (Route to System Suspense)
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
              reference: `SPILL-${reference}`,
              description: `Surplus from direct completion: ${project.title}`,
              metadata: {
                originalProjectId: project.id,
                email: guestEmail || userId,
                reason: actualRemaining === 0n ? 'PROJECT_ALREADY_FUNDED' : 'GOAL_THRESHOLD_EXCEEDED'
              }
            }
          });
        }
      }

      await this.audit.log({
        userId: userId !== 'GUEST' ? userId : undefined,
        action: AuditAction.DIRECT_PAYMENT_FULFILLED,
        entityId: processedDonationId,
        entityType: userId !== 'GUEST' ? 'Donation' : 'GuestDonation',
        metadata: {
          projectId,
          totalPaid: amount.toString(),
          applied: amountToProject.toString(),
          surplus: surplus.toString(),
          isGoalMet,
          reference
        }
      }, tx);

      return { status: 'processed', isGoalMet, projectTitle: project.title, projectSlug: project.slug, projectUserId: project.userId };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 20000
    });

    // 8. Post-Transaction Notifications
    if (result.status === 'processed') {
      await this.triggerReceipt(
        userId === 'GUEST' ? null : userId,
        guestEmail || null,
        projectId,
        amount,
        currency,
        reference
      );

      if (result.isGoalMet) {
        // Notify Organizer
        this.prisma.user.findUnique({
          where: { id: result.projectUserId },
          select: { email: true, firstName: true }
        }).then(organizer => {
          if (organizer) {
            this.emailService.sendProjectFundedAlert(organizer.email, {
              name: organizer.firstName,
              projectTitle: result.projectTitle,
              amount: (Number(amount) / 100).toLocaleString(), // This reflects the finishing push
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
  }) {
    const { userId, projectId, amount, currency, reference } = data;

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
          reference: `${reference}-CREDIT`,
          description: `Direct Donation Charge`,
        },
      });

      const donationTx = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          currency,
          type: TxType.DEBIT,
          status: TxStatus.COMPLETED,
          reference,
          description: `Direct donation to project ${projectId}`,
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

      await this.audit.log({
        userId,
        action: AuditAction.DIRECT_PAYMENT_FULFILLED,
        entityId: donation.id,
        entityType: 'Donation',
        metadata: {
          projectId,
          amount: amount.toString(),
          currency,
          reference,
          method: 'DIRECT_WEBHOOK',
          isGoalMet: isNowFunded
        }
      }, tx);

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
  }) {
    const { email, name, projectId, amount, currency, reference } = data;
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
          projectId,
          reference,
          method: 'GUEST_WEBHOOK',
          isGoalMet: isNowFunded
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
        // --- CASE A: Registered User ---
        // We attach the suspense record to their actual wallet.
        // Ideally, we might just credit them, but for "Suspense" tracking we flag it.
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
            status: TxStatus.SUSPENSE, // Flagged for admin review
            reference,
            description: `SUSPENSE: Donation for closed project (${projectTitle || 'Unknown'})`,
            metadata: { originalProjectId: projectId, reason: 'PROJECT_CLOSED' }
          }
        });

        resultId = suspenseTx.id;
        resultType = 'WalletTransaction';

      } else {
        // --- CASE B: Guest ---
        // We find/create the GuestDonor identity just like a normal donation,
        // but mark the specific donation record as SUSPENSE.

        const normalizedEmail = guestEmail.toLowerCase().trim();

        // 1. Identity
        const guestDonor = await tx.guestDonor.upsert({
          where: { email: normalizedEmail },
          update: { lastDonated: new Date() },
          create: {
            email: normalizedEmail,
            name: guestName,
          }
        });

        // 2. Ledger Record (Suspense)
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

      // --- Audit Log ---
      await this.audit.log({
        userId: userId !== 'GUEST' ? userId : undefined,
        action: AuditAction.FUNDS_MOVED_TO_SUSPENSE,
        entityId: resultId,
        entityType: resultType,
        metadata: {
          reference,
          amount: amount.toString(),
          projectId,
          guestEmail: userId === 'GUEST' ? guestEmail : undefined
        }
      }, tx);

      return { status: 'moved_to_suspense', reference };
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