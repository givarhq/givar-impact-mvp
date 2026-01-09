import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { TxStatus, TxType } from '@givar/database';
import { PrismaService } from '../../common/prisma.service';
import { WalletRepository } from '../wallet/wallet.repository';
import { CreateDonationDto } from './dto/donation.dto';
import * as crypto from 'crypto';

@Injectable()
export class DonationService {
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
}