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
  async initiateDirectDonation(userId: string, userEmail: string, dto: InitiateDirectDonationDto) {
    const { projectId, amount, currency } = dto;
    const amountInMinor = Number(amount);

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
          email: userEmail,
          amount: amountInMinor,
          currency,
          // Embed critical metadata for the webhook to use later
          metadata: {
            donationType: 'DIRECT',
            userId,
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
    userId: string;
    projectId: string;
    amount: bigint;
    currency: Currency;
    reference: string; // The Paystack reference
  }) {
    const { userId, projectId, amount, currency, reference } = data;

    // We wrap the entire logic in a Prisma transaction.
    // All of these steps must succeed, or they all roll back.
    return this.prisma.$transaction(async (tx) => {
      // Step 1: Create a "Virtual" Wallet Transaction for our ledger.
      // This transaction is NOT linked to a user's persistent wallet,
      // but it allows us to have a complete, auditable record of all money movement.
      // We use a fake walletId or a designated system walletId for this.
      // For robustness, let's create a temporary wallet and transaction.

      // We need a wallet to associate the transaction with. Let's find the user's NGN wallet
      // or create it if it doesn't exist. This ensures user record consistency.
      const wallet = await tx.wallet.upsert({
          where: { userId_currency: { userId, currency } },
          update: {},
          create: { userId, currency }
      });
      
      const virtualTx = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          currency,
          type: 'CREDIT', // Logically, money is "credited" to the system via Paystack...
          status: 'COMPLETED',
          reference: `${reference}-CREDIT`, // Ensure uniqueness from the DEBIT
          description: `Direct donation charge via Paystack`,
        },
      });

      // Step 2: Create the corresponding DEBIT transaction record
      const donationTx = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          currency,
          type: 'DEBIT', // ...and then immediately "debited" to the project.
          status: 'COMPLETED',
          reference: reference, // The main Paystack reference, this must be unique.
          description: `Direct donation to project ${projectId}`,
        },
      });

      // Step 3: Create the actual Donation record, linking it to the DEBIT transaction
      const donation = await tx.donation.create({
        data: {
          userId,
          projectId,
          transactionId: donationTx.id, // Link to the debit record
          amount,
          currency,
          message: 'Direct donation via Paystack',
        },
      });

      // Step 4: Atomically update the project's raised amount
      await tx.project.update({
        where: { id: projectId },
        data: {
          raisedAmount: { increment: amount },
        },
      });
      
      this.logger.log(`Fulfilled direct donation ${donation.id} from webhook ref ${reference}`);

      await this.audit.log({
          userId,
          action: AuditAction.DIRECT_PAYMENT_INITIATED, // or DONATION_CREATED
          entityId: donation.id,
          entityType: 'Donation',
          metadata: { 
              projectId, 
              amount: amount.toString(), 
              currency,
              reference,
              method: 'DIRECT_WEBHOOK'
          }
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