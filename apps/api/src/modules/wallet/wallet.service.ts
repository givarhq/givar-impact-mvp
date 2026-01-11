import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Currency, TxType, TxStatus } from '@givar/database';
import { WalletRepository } from './wallet.repository';
import axios from 'axios';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma.service';
import { Prisma } from '@givar/database';
import { json2csv } from 'json-2-csv';
import { TransactionQueryDto } from './dto/transaction-query.dto';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private repository: WalletRepository,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  /**
   * Initialize Payment
   * We tell Paystack how much we want. They give us a URL.
   */
  async initiateFunding(userId: string, email: string, amount: string, currency: Currency) {
    // 1. Convert "1000" (BigInt string) to number for Paystack
    const amountInMinor = Number(amount); 
    
    if (isNaN(amountInMinor) || amountInMinor <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    try {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email,
          amount: amountInMinor,
          currency,
          metadata: {
            userId,
            custom_fields: [{ display_name: "Wallet Action", value: "funding" }]
          },
          callback_url: `${this.config.get('FRONTEND_URL')}/dashboard`, 
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
        accessCode: response.data.data.access_code,
      };
    } catch (error) {
      this.logger.error('Paystack Init Failed', error);
      throw new InternalServerErrorException('Payment provider unavailable');
    }
  }

  // Handle Webhook
  async handleWebhook(signature: string, payload: any) {
    // 1. Security: Verify HMAC Signature
    const secret = this.config.get('PAYSTACK_SECRET_KEY');
    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (hash !== signature) {
      this.logger.error('Invalid Webhook Signature');
      throw new BadRequestException('Invalid signature');
    }

    const event = payload.event;
    const data = payload.data;

    // 2. Process "charge.success"
    if (event === 'charge.success') {
      await this.processSuccessfulFunding(data);
    }

    return true;
  }

  private async processSuccessfulFunding(data: any) {
    const { reference, amount, currency, metadata } = data;
    const userId = metadata?.userId;

    if (!userId) {
      this.logger.warn(`Webhook received without userId metadata: ${reference}`);
      return;
    }

    try {
      await this.repository.processTransaction({
        userId,
        amount: BigInt(amount),
        currency: currency as Currency,
        type: TxType.CREDIT,
        reference,
        status: TxStatus.COMPLETED,
        description: 'Wallet Funding via Paystack',
      });
      this.logger.log(`Wallet funded: ${amount} ${currency} for User ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to process funding webhook: ${error}`);
    }
  }

  async getBalance(userId: string, currency: Currency) {
    const wallet = await this.repository.getWallet(userId, currency);
    return { 
        currency: wallet.currency, 
        balance: wallet.balance.toString()
    };
  }

  // Advanced Transaction Fetching
  async getTransactions(userId: string, query: TransactionQueryDto) {
    const { page = 1, limit = 15, search, type, status, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.WalletTransactionWhereInput = {
      wallet: { userId },
      ...(type && { type }),
      ...(status && { status }),
      ...(startDate && endDate && {
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

    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.walletTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          donation: {
            select: { project: { select: { title: true } } },
          },
        },
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);
    
    // Enhance data with readable descriptions before sending
    const enhancedData = transactions.map(tx => ({
        ...tx,
        isDonation: !!tx.donation,
        projectName: tx.donation?.project?.title,
    }));

    return {
      data: enhancedData,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // CSV Export Logic
  async exportTransactionsToCsv(userId: string, query: TransactionQueryDto) {
    const { search, type, status, startDate, endDate } = query;
    const where: Prisma.WalletTransactionWhereInput = {
        wallet: { userId },
        ...(type && { type }),
        ...(status && { status }),
        ...(startDate && endDate && { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } }),
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
    
    // Flatten data for clean CSV columns
    const flattenedData = transactions.map(tx => ({
        ID: tx.id,
        Date: tx.createdAt.toISOString(),
        Type: tx.type,
        Amount: (Number(tx.amount) / 100).toFixed(2),
        Currency: tx.currency,
        Status: tx.status,
        Description: tx.description || (tx.donation ? `Donation to ${tx.donation.project.title}` : 'N/A'),
        Reference: tx.reference,
    }));

    if (flattenedData.length === 0) {
        return '';
    }
    
    return json2csv(flattenedData);
  }
}