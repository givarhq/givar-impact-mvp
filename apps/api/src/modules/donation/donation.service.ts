import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Currency, TxStatus, TxType, AuditAction, ProjectStatus } from '@givar/database';
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
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
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

    // 1. Fetch Project with current financials
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      select: { id: true, title: true, isActive: true, currency: true, targetAmount: true, raisedAmount: true, status: true },
    });

    if (!project || !project.isActive) {
      throw new BadRequestException('Project is not active or does not exist');
    }

    // 2. Status Guard
    if (project.status !== ProjectStatus.ACTIVE) {
      throw new BadRequestException(`Project is currently ${project.status.toLowerCase()} and cannot accept donations.`);
    }

    if (project.currency !== dto.currency) {
      throw new BadRequestException(`Project only accepts ${project.currency}`);
    }

    // 3. Over-donation Prevention
    const remainingNeeded = project.targetAmount - project.raisedAmount;
    if (amount > remainingNeeded) {
      throw new BadRequestException('OVERFUNDING');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const reference = `DON-${crypto.randomUUID()}`;

      const { transaction: walletTx } = await this.walletRepo.processTransaction(
        {
          userId,
          amount,
          currency: dto.currency,
          type: TxType.DEBIT,
          reference,
          description: `Donation to: ${project.title}`,
          status: TxStatus.COMPLETED,
        },
        tx,
      );

      const donation = await tx.donation.create({
        data: {
          userId,
          projectId: project.id,
          transactionId: walletTx.id,
          amount,
          currency: dto.currency,
          message: dto.message?.trim() || null,
        },
      });

      // 4. Update Amount & Atomic Completion Trigger
      const newRaisedAmount = project.raisedAmount + amount;
      const isGoalMet = newRaisedAmount === project.targetAmount;

      await tx.project.update({
        where: { id: project.id },
        data: {
          raisedAmount: newRaisedAmount,
          // If goal is met, move to FUNDED
          ...(isGoalMet && {
            status: ProjectStatus.FUNDED,
            fundedAt: new Date(),
          })
        },
      });

      await this.audit.log(
        {
          userId,
          action: AuditAction.DONATION_CREATED,
          entityId: donation.id,
          entityType: 'Donation',
          metadata: {
            projectId: dto.projectId,
            amount: amount.toString(),
            currency: dto.currency,
            reference,
            isGoalMet, // Log completion status
          },
        },
        tx,
      );

      return donation;
    });

    await this.triggerReceipt(userId, null, dto.projectId, BigInt(dto.amount), dto.currency, `WAL-${result.id.slice(0, 8)}`);

    return result;
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
      select: { id: true, isActive: true, currency: true },
    });

    if (!project || !project.isActive) {
      throw new BadRequestException('Project is not active or does not exist');
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
    userId: string; // 'GUEST' or real UUID
    guestEmail?: string;
    guestName?: string;
    projectId: string;
    amount: bigint;
    currency: Currency;
    reference: string;
    channel?: string;
  }) {
    const { userId, guestEmail, guestName, projectId, amount, currency, reference, channel } = data;

    // 1. Channel Validation (Anti-Fraud)
    if (channel && !['card', 'bank', 'bank_transfer', 'ussd', 'qr', 'mobile_money'].includes(channel)) {
      this.logger.warn(`Suspicious payment channel ignored`, { channel, reference });
      return { status: 'ignored_channel', reference };
    }

    // 2. Robust Global Idempotency Check
    const [existingUserDonation, existingGuestDonation] = await Promise.all([
      this.prisma.donation.findFirst({
        where: { transaction: { reference } },
        select: { id: true }
      }),
      this.prisma.guestDonation.findUnique({
        where: { reference },
        select: { id: true }
      })
    ]);

    if (existingUserDonation || existingGuestDonation) {
      this.logger.log(`Idempotent skip - already processed: ${reference}`);
      return {
        type: existingUserDonation ? 'user' : 'guest',
        donationId: existingUserDonation?.id || existingGuestDonation?.id,
        status: 'duplicate',
        reference
      };
    }

    // 3. Project Lifecycle & Funding Cap Check
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { targetAmount: true, raisedAmount: true, status: true, title: true }
    });

    const remainingNeeded = project ? project.targetAmount - project.raisedAmount : 0n;

    // Determine if funds should be routed to Suspense
    // Reasons: Project closed, Project not found, or Donation exceeds remaining goal
    const shouldRouteToSuspense =
      !project ||
      project.status === ProjectStatus.FUNDED ||
      project.status === ProjectStatus.COMPLETED ||
      amount > remainingNeeded;

    if (shouldRouteToSuspense) {
      this.logger.warn(`Routing ${amount} to SUSPENSE. Ref: ${reference}. Reason: ${!project ? 'Project Missing' : amount > remainingNeeded ? 'Goal Exceeded' : 'Project Closed'}`);
      return this.handleSuspenseRouting(data, project?.title);
    }

    // 4. Branching Logic for Standard Fulfillment
    let result: any;
    if (userId === 'GUEST') {
      if (!guestEmail) throw new Error("Guest email missing for guest donation");
      result = await this.fulfillGuestDonation({
        email: guestEmail,
        name: guestName,
        projectId,
        amount,
        currency,
        reference
      });
    } else {
      result = await this.fulfillUserDirectDonation(data);
    }

    // 5. Post-Fulfillment Email Receipt
    if (result && result.status === 'processed') {
      await this.triggerReceipt(
        userId === 'GUEST' ? null : userId,
        guestEmail || null,
        projectId,
        amount,
        currency,
        reference
      );
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

    return this.prisma.$transaction(async (tx) => {
      // 1. Find User Wallet (Must exist for logged in user)
      const wallet = await tx.wallet.findUniqueOrThrow({
        where: { userId_currency: { userId, currency } }
      });

      // 2. Virtual Ledger Credit (In)
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

      // 3. Ledger Debit (Out)
      const donationTx = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          currency,
          type: TxType.DEBIT,
          status: TxStatus.COMPLETED,
          reference, // Unique reference linkage
          description: `Direct donation to project ${projectId}`,
        },
      });

      // 4. Create User Donation Record
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

      // 5. Update Project Stats (With Completion Trigger)
      // We must fetch the current state inside the transaction to calculate totals accurately
      const project = await tx.project.findUniqueOrThrow({
        where: { id: projectId },
        select: { raisedAmount: true, targetAmount: true }
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

      // 6. Audit
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

      this.logger.log(`User direct donation fulfilled: ${donation.id}`);

      return {
        type: 'user',
        donationId: donation.id,
        status: 'processed',
        reference
      };
    }, {
      timeout: 15000, // 15s timeout to prevent hanging locks
      maxWait: 5000
    });
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

    return this.prisma.$transaction(async (tx) => {
      // 1. Find or Create Guest Identity
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

      // 2. Create Guest Ledger Record
      const guestDonation = await tx.guestDonation.create({
        data: {
          guestDonorId: guestDonor.id,
          projectId,
          amount,
          currency,
          reference, // Unique reference
          status: TxStatus.COMPLETED
        }
      });

      // 3. Update Project Stats (Unified with Completion Trigger)
      // Fetch current state inside transaction
      const project = await tx.project.findUniqueOrThrow({
        where: { id: projectId },
        select: { raisedAmount: true, targetAmount: true }
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

      // 4. Audit
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

      this.logger.log(`Guest donation fulfilled: ${reference}`);

      return {
        type: 'guest',
        donationId: guestDonation.id,
        status: 'processed',
        reference
      };
    }, {
      timeout: 15000, // 15s timeout
      maxWait: 5000
    });
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
        user: { select: { email: true, firstName: true } }
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
    this.emailService.sendSubscriptionUpdate(
      updated.user.email,
      updated.user.firstName,
      updated.project.title,
      dto.status
    ).catch(err => this.logger.error(`Subscription email failed: ${err.message}`));

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
}