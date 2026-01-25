import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WalletRepository } from './wallet.repository';
import axios from 'axios';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma.service';
import { Prisma, Currency, TxType, TxStatus, AuditAction } from '@givar/database';
import { AuditService } from '../audit/audit.service';
import { json2csv } from 'json-2-csv';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { DonationService } from '../donation/donation.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  private readonly MAX_AMOUNT_MINOR = 100_000_000_000_000n;
  private readonly MIN_AMOUNT_MINOR = 10000n;

  constructor(
    private repository: WalletRepository,
    private config: ConfigService,
    private prisma: PrismaService,
    @Inject(forwardRef(() => DonationService))
    private donationService: DonationService,
    private audit: AuditService,
  ) {}

  private toPaystackAmount(amountStr: string): number {
    let amountBig: bigint;
    try {
      amountBig = BigInt(amountStr);
    } catch {
      throw new BadRequestException('Invalid amount format');
    }

    if (amountBig < this.MIN_AMOUNT_MINOR) {
      throw new BadRequestException('Amount below minimum allowed (100.00)');
    }

    if (amountBig > this.MAX_AMOUNT_MINOR) {
      throw new BadRequestException('Amount exceeds maximum allowed limit');
    }

    return Number(amountBig);
  }

  async initiateFunding(
    userId: string,
    email: string,
    amount: string,
    currency: Currency,
  ) {
    const amountInMinor = this.toPaystackAmount(amount);

    try {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email,
          amount: amountInMinor,
          currency,
          metadata: {
            userId,
            action: 'wallet_funding',
            custom_fields: [{ display_name: 'Wallet Action', value: 'funding' }],
          },
          callback_url: `${this.config.get('FRONTEND_URL')}/callback`,
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      const { data } = response.data;

      return {
        authorizationUrl: data.authorization_url,
        reference: data.reference,
        accessCode: data.access_code,
      };
    } catch (error) {
      this.logger.error('Paystack initialization failed', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        amount,
        currency,
      });
      throw new InternalServerErrorException('Unable to initialize payment at this time');
    }
  }

  async handleWebhook(signature: string, payload: any) {
    const secret = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!secret) {
      this.logger.error('PAYSTACK_SECRET_KEY is not configured');
      throw new InternalServerErrorException('Server configuration error');
    }

    const computedHash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (computedHash !== signature) {
      await this.audit.log({
        action: AuditAction.WEBHOOK_SIGNATURE_FAILED,
        metadata: { computedHash, receivedSignature: signature },
      });
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = payload.event;
    const data = payload.data;

    await this.audit.log({
      action: AuditAction.WEBHOOK_RECEIVED,
      metadata: {
        event,
        reference: data.reference,
        amount: data.amount,
        currency: data.currency,
        channel: data.channel,
      },
    });

    if (event === 'charge.success') {
      const allowedChannels = ['card', 'bank', 'bank_transfer', 'ussd', 'mobile_money', 'qr'];

      if (!allowedChannels.includes(data.channel)) {
        this.logger.warn(`Suspicious channel ignored: ${data.channel}`, { reference: data.reference });
        return true;
      }

      if (data.metadata?.action === 'wallet_funding') {
        await this.processSuccessfulFunding(data);
      } else if (data.metadata?.donationType === 'DIRECT') {
        await this.processDirectDonation(data);
      }
    }

    return true;
  }

  private async processDirectDonation(data: any) {
    const { reference, amount, currency, metadata } = data;
    const { userId, projectId, guestEmail, guestName } = metadata;

    if (!userId || !projectId) {
      this.logger.warn(`Direct donation webhook missing required metadata`, { reference });
      return;
    }

    try {
      await this.donationService.fulfillDirectDonation({
        userId,
        projectId,
        amount: BigInt(amount),
        currency: currency as Currency,
        reference,
        guestEmail,
        guestName,
        channel: data.channel
      });

      this.logger.log(`Direct donation successfully fulfilled: ${amount} ${currency}`);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        this.logger.log(`Idempotent skip: duplicate direct donation webhook`, { reference });
      } else {
        this.logger.error('Failed to process direct donation webhook', {
          error: error instanceof Error ? error.message : String(error),
          reference,
        });
      }
    }
  }

  private async processSuccessfulFunding(data: any) {
    const { reference, amount, currency, metadata } = data;
    const userId = metadata?.userId;

    if (!userId) {
      this.logger.warn(`Wallet funding webhook missing userId in metadata`, { reference });
      return;
    }

    try {
      const result = await this.repository.processTransaction({
        userId,
        amount: BigInt(amount),
        currency: currency as Currency,
        type: TxType.CREDIT,
        reference,
        status: TxStatus.COMPLETED,
        description: 'Wallet funding via Paystack',
      });

      await this.audit.log({
        userId,
        action: AuditAction.WALLET_FUND_SUCCESS,
        entityId: result.transaction.id,
        entityType: 'WalletTransaction',
        metadata: {
          amount,
          currency,
          reference,
          newBalance: result.newBalance.toString(),
          channel: data.channel,
        },
      });

      this.logger.log(`Wallet funded successfully: ${amount} ${currency} → User ${userId}`);
    } catch (error) {
      this.logger.error('Failed to credit wallet from webhook', {
        error: error instanceof Error ? error.message : String(error),
        reference,
      });
    }
  }

  // ... (rest of methods: getBalance, getTransactions, exportTransactionsToCsv)
  async getBalance(userId: string, currency: Currency) {
    const wallet = await this.repository.getOrCreateWallet(userId, currency);
    return {
      currency: wallet.currency,
      balance: wallet.balance.toString(),
    };
  }

  async getTransactions(userId: string, query: TransactionQueryDto) {
    const {
      page = 1,
      limit = 15,
      search,
      type,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.WalletTransactionWhereInput = {
      wallet: { userId },
      ...(type && { type }),
      ...(status && { status }),
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      ...(search && {
        OR: [
          { description: { contains: search, mode: 'insensitive' } },
          { reference: { contains: search, mode: 'insensitive' } },
          { donation: { project: { title: { contains: search, mode: 'insensitive' } } } },
        ],
      }),
    };

    const orderBy: Prisma.WalletTransactionOrderByWithRelationInput =
      sortBy && sortOrder ? { [sortBy]: sortOrder } : { createdAt: 'desc' };

    const include = {
      donation: {
        select: { project: { select: { title: true } } },
      },
    };

    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.walletTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    const enhanced = transactions.map((tx) => ({
      ...tx,
      isDonation: !!tx.donation,
      projectName: tx.donation?.project?.title ?? null,
    }));

    return {
      data: enhanced,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async exportTransactionsToCsv(userId: string, query: TransactionQueryDto) {
    const { search, type, status, startDate, endDate } = query;

    const where: Prisma.WalletTransactionWhereInput = {
      wallet: { userId },
      ...(type && { type }),
      ...(status && { status }),
      ...(startDate &&
        endDate && {
          createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
        }),
      ...(search && {
        OR: [
          { description: { contains: search, mode: 'insensitive' } },
          { reference: { contains: search, mode: 'insensitive' } },
          { donation: { project: { title: { contains: search, mode: 'insensitive' } } } },
        ],
      }),
    };

    const transactions = await this.prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { donation: { select: { project: { select: { title: true } } } } },
    });

    const flattened = transactions.map((tx) => ({
      ID: tx.id,
      Date: tx.createdAt.toISOString(),
      Type: tx.type,
      Amount: (Number(tx.amount) / 100).toFixed(2),
      Currency: tx.currency,
      Status: tx.status,
      Description: tx.description || (tx.donation ? `Donation to ${tx.donation.project.title}` : 'N/A'),
      Reference: tx.reference,
    }));

    if (flattened.length === 0) return '';

    return json2csv(flattened);
  }

  /**
   * Unified Verification
   * Checks WalletTransactions, Donations, and GuestDonations for a reference.
   */
  async verifyAnyTransaction(reference: string) {
    // Check for standard Wallet Funding or User Direct Donation
    const walletTx = await this.prisma.walletTransaction.findUnique({
      where: { reference },
      select: { status: true }
    });

    if (walletTx?.status === 'COMPLETED') return { status: 'success' };

    // Check for Guest Donation
    const guestDonation = await this.prisma.guestDonation.findUnique({
      where: { reference },
      select: { status: true }
    });

    if (guestDonation?.status === 'COMPLETED') return { status: 'success' };

    // If not found yet, return pending to trigger frontend retry
    return { status: 'pending' };
  }
}