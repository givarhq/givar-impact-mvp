import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { TxStatus, TxType } from '@givar/database';
import { PrismaService } from '../../common/prisma.service';
import { WalletRepository } from '../wallet/wallet.repository';
import { CreateDonationDto } from './dto/donation.dto';
import * as crypto from 'crypto';
import { CreateSubscriptionDto } from './dto/subscription.dto';
import { add, nextDay } from 'date-fns';

@Injectable()
export class DonationService {
  private readonly logger = new Logger(DonationService.name);
  constructor(
    private prisma: PrismaService,
    private walletRepo: WalletRepository,
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

      return donation;
    });
  }

  async getUserDonations(userId: string) {
    return this.prisma.donation.findMany({
      where: { userId },
      include: { project: { select: { title: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // SOTA: Create Recurring Donation
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
}