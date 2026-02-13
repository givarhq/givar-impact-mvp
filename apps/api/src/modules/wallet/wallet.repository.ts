import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
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
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Retrieves or lazily creates a user's wallet for the specified currency.
   * This method is safe to call concurrently.
   */
  async getOrCreateWallet(
    userId: string,
    currency: Currency,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string; balance: bigint; currency: Currency }> {
    const client = tx ?? this.prisma;

    let wallet = await client.wallet.findUnique({
      where: { userId_currency: { userId, currency } },
      select: {
        id: true,
        balance: true,
        currency: true   // ← Add this
      },
    });

    if (!wallet) {
      try {
        wallet = await client.wallet.create({
          data: { userId, currency, balance: 0n },
          select: {
            id: true,
            balance: true,
            currency: true
          },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          wallet = await client.wallet.findUniqueOrThrow({
            where: { userId_currency: { userId, currency } },
            select: { id: true, balance: true, currency: true },
          });
        } else {
          throw err;
        }
      }
    }

    return wallet;
  }

  /**
   * Process a credit or debit transaction atomically.
   * Supports both standalone and nested transaction usage.
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
  ): Promise<{
    transaction: Prisma.WalletTransactionGetPayload<{}>;
    newBalance: bigint;
  }> {
    if (externalTx) {
      return this._executeLedgerLogic(externalTx, params);
    }

    return this.prisma.$transaction(
      async (tx) => this._executeLedgerLogic(tx, params),
      {
        maxWait: 5000,
        timeout: 10000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  /**
   * Core ledger operation - must be executed inside a transaction
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
    },
  ): Promise<{
    transaction: Prisma.WalletTransactionGetPayload<{}>;
    newBalance: bigint;
  }> {
    const { userId, amount, currency, type, reference, description, status } = params;

    if (amount <= 0n) {
      throw new BadRequestException('Transaction amount must be positive');
    }

    // 1. Idempotency check (stronger for both CREDIT and DEBIT)
    const existingTx = await tx.walletTransaction.findUnique({
      where: { reference },
      select: { id: true, type: true, amount: true, status: true },
    });

    if (existingTx) {
      if (existingTx.type !== type || existingTx.amount !== amount) {
        throw new BadRequestException(
          'Transaction reference exists but with different type or amount',
        );
      }

      // Already processed - return existing result
      const wallet = await tx.wallet.findUniqueOrThrow({
        where: { userId_currency: { userId, currency } },
        select: { balance: true },
      });

      return {
        transaction: existingTx as any, // minimal fields
        newBalance: wallet.balance,
      };
    }

    try {
      // 2. Ensure wallet exists (race-condition safe)
      const wallet = await this.getOrCreateWallet(userId, currency, tx);

      // 3. Create transaction record
      const walletTx = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          currency,
          type,
          status: status || TxStatus.COMPLETED,
          reference,
          description,
        },
      });

      // 4. Update balance atomically
      let updatedWallet;

      if (type === TxType.CREDIT) {
        updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: amount } },
          select: { balance: true },
        });
      } else {
        // DEBIT - atomic check + update
        const result = await tx.wallet.updateMany({
          where: {
            id: wallet.id,
            balance: { gte: amount },
          },
          data: { balance: { decrement: amount } },
        });

        if (result.count === 0) {
          throw new BadRequestException('Insufficient wallet balance');
        }

        updatedWallet = await tx.wallet.findUniqueOrThrow({
          where: { id: wallet.id },
          select: { balance: true },
        });
      }

      return {
        transaction: walletTx,
        newBalance: updatedWallet.balance,
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          throw new BadRequestException('Duplicate transaction reference');
        }
      }

      // Re-throw unexpected errors
      if (err instanceof Error) {
        throw new InternalServerErrorException(
          `Ledger operation failed: ${err.message}`,
        );
      }

      throw err;
    }
  }

  /**
   * Utility method - mostly for admin/debug purposes
   */
  async getCurrentBalance(userId: string, currency: Currency): Promise<bigint> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency } },
      select: { balance: true },
    });

    return wallet?.balance ?? 0n;
  }
}