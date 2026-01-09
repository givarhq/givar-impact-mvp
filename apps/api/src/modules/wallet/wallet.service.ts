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

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private repository: WalletRepository,
    private config: ConfigService,
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
}