import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Currency, TxStatus, TxType, AuditAction } from '@givar/database';
import { PrismaService } from '../../common/prisma.service';
import { WalletRepository } from '../wallet/wallet.repository';
import { CreateDonationDto, InitiateDirectDonationDto } from './dto/donation.dto';
import * as crypto from 'crypto';
import { CreateSubscriptionDto } from './dto/subscription.dto';
import { add } from 'date-fns';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DonationService {
  private readonly logger = new Logger(DonationService.name);
  constructor(
    private prisma: PrismaService,
    private walletRepo: WalletRepository,
    private config: ConfigService,
    private audit: AuditService,
  ) {}

  async donate(userId: string, dto: CreateDonationDto) {
    const amount = BigInt(dto.amount);
    
    // 1. Validation Logic
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project || !project.isActive) {
      throw new BadRequestException('Project is not active or does not exist');
    }

    if (project.currency !== dto.currency) {
      throw new BadRequestException(`Project only accepts ${project.currency}`);
    }

    return this.prisma.$transaction(async (tx) => {
      
      // A. Generate a deterministic internal reference
      const reference = `DON-${crypto.randomUUID()}`;

      // B. Debit Wallet (Secure Atomic Check via Repository)
      const { transaction: walletTx } = await this.walletRepo.processTransaction(
        {
          userId,
          amount,
          currency: dto.currency,
          type: TxType.DEBIT,
          status: TxStatus.COMPLETED,
          reference,
          description: `Donation to: ${project.title}`,
        },
        tx, // Pass the transaction client
      );

      // C. Create Donation Record
      const donation = await tx.donation.create({
        data: {
          userId,
          projectId: project.id,
          transactionId: walletTx.id, // Strictly link to the ledger entry
          amount,
          currency: dto.currency,
          message: dto.message,
        },
      });

      // D. Update Project Totals (Atomic Increment)
      await tx.project.update({
        where: { id: project.id },
        data: {
          raisedAmount: { increment: amount },
        },
      });

      // STRICT AUDIT LOGGING
      // We pass 'tx' here. If this line fails, the debit is reverted.
      // If the debit fails, this line never runs.
      // If power cuts, neither exists.
      await this.audit.log({
          userId,
          action: AuditAction.DONATION_CREATED,
          entityId: donation.id,
          entityType: 'Donation',
          metadata: { 
              projectId: dto.projectId, 
              amount: dto.amount, 
              currency: dto.currency,
              reference 
          }
      }, tx);

      return donation;
    });
  }

  // Initiate a direct, wallet-bypassing donation
  async initiateDirectDonation(user: any | undefined, dto: InitiateDirectDonationDto) {
    const { projectId, amount, currency, guestEmail, guestName } = dto;
    const amountInMinor = Number(amount);

    // 1. Determine who is paying
    let emailToCharge = guestEmail;
    let userId = null;

    if (user) {
        // Logged in user overrides guest email
        emailToCharge = user.email;
        userId = user.id;
    } else {
        // Guest mode
        if (!guestEmail) throw new BadRequestException('Email is required for guest donations');
    }

    // 1. Validate Project
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || !project.isActive) {
      throw new BadRequestException('Project is not active or does not exist');
    }
    if (project.currency !== currency) {
        throw new BadRequestException(`Project only accepts ${currency}`);
    }

    // 2. Call Paystack to get a checkout URL
    try {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email: emailToCharge,
          amount: amountInMinor,
          currency,
          metadata: {
            donationType: 'DIRECT',
            userId: userId || 'GUEST', // Mark as GUEST if no ID
            guestEmail: emailToCharge, // Store email in metadata for fulfillment
            guestName: guestName || 'Anonymous',
            projectId,
          },
          callback_url: `${this.config.get('FRONTEND_URL')}/dashboard/impact`,
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        authorizationUrl: response.data.data.authorization_url,
        reference: response.data.data.reference,
      };
    } catch (error) {
      this.logger.error('Paystack Direct Donation Init Failed', error);
      throw new InternalServerErrorException('Payment provider unavailable');
    }
  }

  // Atomically fulfill a direct donation from a webhook
  async fulfillDirectDonation(data: {
    userId: string; // 'GUEST' or UUID
    guestEmail?: string;
    guestName?: string;
    projectId: string;
    amount: bigint;
    currency: Currency;
    reference: string;
  }) {
    const { userId, guestEmail, guestName, projectId, amount, currency, reference } = data;

    return this.prisma.$transaction(async (tx) => {
      let walletId: string;

      // --- Step 1: Resolve Wallet ---
      if (userId && userId !== 'GUEST') {
        // Case A: Logged-in User -> Use their personal wallet
        const wallet = await tx.wallet.upsert({
          where: { userId_currency: { userId, currency } },
          update: {},
          create: { userId, currency },
        });
        walletId = wallet.id;
      } else {
        // Case B: Guest -> Use the "System Guest Wallet"
        // We find/create a special system user to attach this wallet to.
        const SYSTEM_GUEST_EMAIL = 'guest@givar.com';
        
        let systemUser = await tx.user.findUnique({ where: { email: SYSTEM_GUEST_EMAIL } });
        if (!systemUser) {
            systemUser = await tx.user.create({
                data: {
                    email: SYSTEM_GUEST_EMAIL,
                    firstName: 'System',
                    lastName: 'Guest-Ledger',
                    passwordHash: 'SYSTEM_ACCOUNT_LOCKED',
                    role: 'ADMIN', // Protected role
                    emailVerified: true,
                }
            });
        }

        const wallet = await tx.wallet.upsert({
          where: { userId_currency: { userId: systemUser.id, currency } },
          update: {},
          create: { userId: systemUser.id, currency },
        });
        walletId = wallet.id;
      }

      // --- Step 2: Virtual Ledger Entry (Credit) ---
      // Money enters the system from Paystack
      await tx.walletTransaction.create({
        data: {
          walletId,
          amount,
          currency,
          type: 'CREDIT',
          status: 'COMPLETED',
          reference: `${reference}-CREDIT`,
          description: userId === 'GUEST' 
            ? `Direct Guest Donation (${guestEmail})` 
            : `Direct Donation Charge`,
        },
      });

      // --- Step 3: Virtual Ledger Entry (Debit) ---
      // Money leaves the wallet to the project
      const donationTx = await tx.walletTransaction.create({
        data: {
          walletId,
          amount,
          currency,
          type: 'DEBIT',
          status: 'COMPLETED',
          reference, // Main reference
          description: `Direct donation to project ${projectId}`,
        },
      });

      // --- Step 4: Create Donation Record ---
      const donation = await tx.donation.create({
        data: {
          userId: userId !== 'GUEST' ? userId : undefined, // Link only if real user
          guestEmail: userId === 'GUEST' ? guestEmail : undefined, // Store guest info
          guestName: userId === 'GUEST' ? guestName : undefined,
          projectId,
          transactionId: donationTx.id,
          amount,
          currency,
          message: 'Direct donation via Paystack',
        },
      });

      // --- Step 5: Update Project ---
      await tx.project.update({
        where: { id: projectId },
        data: {
          raisedAmount: { increment: amount },
        },
      });

      this.logger.log(`Fulfilled direct donation ${donation.id} [${userId === 'GUEST' ? 'GUEST' : 'USER'}]`);

      // --- Step 6: Audit Log ---
      await this.audit.log({
        userId: userId !== 'GUEST' ? userId : undefined, // Null for guests
        action: AuditAction.DIRECT_PAYMENT_INITIATED,
        entityId: donation.id,
        entityType: 'Donation',
        metadata: {
          projectId,
          amount: amount.toString(),
          currency,
          reference,
          donorType: userId === 'GUEST' ? 'GUEST' : 'USER',
          guestEmail, // Capture who the guest was in audit log
        },
      }, tx);

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
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getUserDonations(userId: string) {
    return this.prisma.donation.findMany({
      where: { userId },
      take: 5, // Limit to last 5 for the dashboard
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