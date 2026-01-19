import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Currency, TxStatus, TxType, AuditAction } from '@givar/database';
import { PrismaService } from '../../common/prisma.service';
import { WalletRepository } from '../wallet/wallet.repository';
import {
  CreateDonationDto,
  InitiateDirectDonationDto,
} from './dto/donation.dto';
import * as crypto from 'crypto';
import { CreateSubscriptionDto } from './dto/subscription.dto';
import { add } from 'date-fns';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';

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
  ) {}

  async donate(userId: string, dto: CreateDonationDto) {
    const amount = BigInt(dto.amount);

    if (amount < this.MIN_DONATION_MINOR) {
      throw new BadRequestException('Amount is below minimum allowed (100.00)');
    }

    if (amount > this.MAX_DONATION_MINOR) {
      throw new BadRequestException('Amount exceeds maximum allowed per donation');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      select: { id: true, title: true, isActive: true, currency: true },
    });

    if (!project || !project.isActive) {
      throw new BadRequestException('Project is not active or does not exist');
    }

    if (project.currency !== dto.currency) {
      throw new BadRequestException(`Project only accepts ${project.currency}`);
    }

    return this.prisma.$transaction(async (tx) => {
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

      await tx.project.update({
        where: { id: project.id },
        data: {
          raisedAmount: { increment: amount },
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
            walletTxId: walletTx.id,
          },
        },
        tx,
      );

      return donation;
    });
  }

  async initiateDirectDonation(user: any | undefined, dto: InitiateDirectDonationDto) {
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
          callback_url: `${this.config.get('FRONTEND_URL')}/dashboard/impact`,
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
   */
  async fulfillDirectDonation(data: {
    userId: string; // 'GUEST' or real UUID
    guestEmail?: string;
    guestName?: string;
    projectId: string;
    amount: bigint;
    currency: Currency;
    reference: string;
  }) {
    const { userId, guestEmail, guestName, projectId, amount, currency, reference } = data;

    // Very strong idempotency check
    const existingDonation = await this.prisma.donation.findFirst({
      where: {
        OR: [
          { transaction: { reference } },
          { transaction: { reference: `${reference}-CREDIT` } },
        ],
      },
      select: { id: true },
    });

    if (existingDonation) {
      this.logger.log(`Idempotent skip - direct donation already processed`, { reference });
      return this.prisma.donation.findUniqueOrThrow({
        where: { id: existingDonation.id },
      });
    }

    return this.prisma.$transaction(async (tx) => {
      let walletId: string;

      if (userId && userId !== 'GUEST') {
        const wallet = await tx.wallet.upsert({
          where: { userId_currency: { userId, currency } },
          update: {},
          create: { userId, currency, balance: 0n },
        });
        walletId = wallet.id;
      } else {
        // Guest donations should ideally go to a different model/table in production
        // Using system guest wallet is a temporary compromise
        const SYSTEM_GUEST_EMAIL = 'system.guest-ledger@givar.com';

        let systemUser = await tx.user.findUnique({
          where: { email: SYSTEM_GUEST_EMAIL },
          select: { id: true },
        });

        if (!systemUser) {
          systemUser = await tx.user.create({
            data: {
              email: SYSTEM_GUEST_EMAIL,
              firstName: 'System',
              lastName: 'Guest Ledger',
              passwordHash: 'SYSTEM_LOCKED',
              role: 'SYSTEM',
              emailVerified: true,
            },
            select: { id: true },
          });
        }

        const wallet = await tx.wallet.upsert({
          where: { userId_currency: { userId: systemUser.id, currency } },
          update: {},
          create: { userId: systemUser.id, currency, balance: 0n },
        });
        walletId = wallet.id;
      }

      // Credit leg (virtual - money never really lands here)
      await tx.walletTransaction.create({
        data: {
          walletId,
          amount,
          currency,
          type: TxType.CREDIT,
          status: TxStatus.COMPLETED,
          reference: `${reference}-CREDIT`,
          description: userId === 'GUEST'
            ? `Direct guest donation credit (${guestEmail})`
            : `Direct donation charge credit`,
        },
      });

      // Debit leg - this is the real movement
      const donationTx = await tx.walletTransaction.create({
        data: {
          walletId,
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
          userId: userId !== 'GUEST' ? userId : undefined,
          guestEmail: userId === 'GUEST' ? (guestEmail ?? null) : null,
          guestName: userId === 'GUEST' ? (guestName?.trim() ?? null) : null,
          projectId,
          transactionId: donationTx.id,
          amount,
          currency,
          message: 'Direct donation via Paystack',
        },
      });

      await tx.project.update({
        where: { id: projectId },
        data: { raisedAmount: { increment: amount } },
      });

      await this.audit.log(
        {
          userId: userId !== 'GUEST' ? userId : undefined,
          action: AuditAction.DIRECT_PAYMENT_FULFILLED,
          entityId: donation.id,
          entityType: 'Donation',
          metadata: {
            projectId,
            amount: amount.toString(),
            currency,
            reference,
            donorType: userId === 'GUEST' ? 'GUEST' : 'REGISTERED',
            guestEmail: userId === 'GUEST' ? guestEmail : undefined,
          },
        },
        tx,
      );

      this.logger.log(`Direct donation fulfilled: ${donation.id} (${userId === 'GUEST' ? 'guest' : 'user'})`);

      return donation;
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
}