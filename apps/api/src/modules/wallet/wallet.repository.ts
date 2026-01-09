import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import {
  Currency,
  Prisma,
  TxStatus,
  TxType,
} from '@givar/database';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class WalletRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Get a user's wallet. Creates one if it doesn't exist (Lazy loading).
   */
  async getWallet(userId: string, currency: Currency) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency } },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId, currency, balance: 0n },
      });
    }
    return wallet;
  }

  /**
   * Public Entry Point
   * Decides whether to start a new transaction or use the provided one.
   */
  async processTransaction(
    params: {
      userId: string;
      amount: bigint;
      currency: Currency;
      type: TxType;
      reference: string;
      description?: string;
      status?: TxStatus;
    },
    externalTx?: Prisma.TransactionClient,
  ) {
    if (externalTx) {
      return this._executeLedgerLogic(externalTx, params);
    } else {
      // Start a new atomic transaction
      return this.prisma.$transaction((tx) => 
        this._executeLedgerLogic(tx, params)
      );
    }
  }

  /**
   * Private Logic Implementation
   * Contains the hard logic, unaware of transaction boundaries.
   */
  private async _executeLedgerLogic(
    tx: Prisma.TransactionClient, 
    params: {
      userId: string;
      amount: bigint;
      currency: Currency;
      type: TxType;
      reference: string;
      description?: string;
      status?: TxStatus;
    }
  ) {
    const { userId, amount, currency, type, reference, description, status } = params;

    // 1. IDEMPOTENCY CHECK (Optimization)
    if (type === TxType.CREDIT) {
      const exists = await tx.walletTransaction.findUnique({
        where: { reference },
      });
      if (exists) {
        return { transaction: exists, newBalance: 0n };
      }
    }

    try {
      // 2. CREATE LEDGER ENTRY
      const walletTx = await tx.walletTransaction.create({
        data: {
          wallet: { connect: { userId_currency: { userId, currency } } },
          amount,
          currency,
          type,
          status: status || TxStatus.COMPLETED,
          reference,
          description,
        },
      });

      // 3. ATOMIC BALANCE UPDATE
      if (type === TxType.CREDIT) {
        const updatedWallet = await tx.wallet.update({
          where: { userId_currency: { userId, currency } },
          data: { balance: { increment: amount } },
        });
        return { transaction: walletTx, newBalance: updatedWallet.balance };
      } else {
        // DEBIT: Secure Atomic Decrement with Guard
        const result = await tx.wallet.updateMany({
          where: {
            userId,
            currency,
            balance: { gte: amount }, // Guard: Must have funds
          },
          data: {
            balance: { decrement: amount },
          },
        });

        if (result.count === 0) {
          throw new BadRequestException('Insufficient funds');
        }

        // Fetch new balance to return
        const updatedWallet = await tx.wallet.findUniqueOrThrow({
          where: { userId_currency: { userId, currency } },
        });

        return { transaction: walletTx, newBalance: updatedWallet.balance };
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique Constraint Violation (Double Spending/Crediting)
        if (error.code === 'P2002') {
           throw new BadRequestException('Duplicate transaction reference');
        }
      }
      throw error;
    }
  }
}