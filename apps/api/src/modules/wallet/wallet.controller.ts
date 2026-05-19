import { Body, Controller, Get, Headers, HttpCode, Post, Query, Req, UseGuards, Res, Param, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WalletService } from './wallet.service';
import { FundWalletDto } from './dto/wallet.dto';
import { Currency } from '@givar/database';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { type Response } from 'express';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { Public } from 'src/common/decorators/public.decorator';

// Paystack Official IPs (Feb 2024)
const PAYSTACK_IPS = ['52.31.139.75', '52.49.173.169', '52.214.14.220'];

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getWallet(@Req() req: any, @Query('currency') currency?: Currency) {
    // Default to NGN if not specified
    const cur = currency || Currency.NGN;
    return this.walletService.getBalance(req.user.id, cur);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(AuthGuard('jwt'))
  @Post('fund')
  async fundWallet(@Req() req: any, @Body() dto: FundWalletDto) {
    // COMPLIANCE LOCK: Wallet funding is strictly disabled at the API level 
    // to comply with CBN/Paystack non-custodial regulations.
    throw new ForbiddenException(
      'Wallet funding is currently disabled for compliance purposes. Please use direct checkout on the cause page.'
    );
  }

  // Paystack Webhooks need high throughput during flash sales or heavy traffic.
  // We can skip throttling here because Paystack validates via Signature.
  // Alternatively, allow a higher limit (e.g., 100).
  @SkipThrottle()
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: any,
  ) {
    // 1. IP Whitelist Check removed as per forensic assessment.
    // Relying entirely on cryptographic HMAC signature verification.

    // 2. Process Webhook using the raw unparsed buffer to prevent signature mismatches
    await this.walletService.handleWebhook(signature, req.rawBody, req.body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('transactions')
  async getTransactions(@Req() req: any, @Query() query: TransactionQueryDto) {
    return this.walletService.getTransactions(req.user.id, query);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('transactions/export')
  async exportTransactions(
    @Req() req: any,
    @Query() query: TransactionQueryDto,
    @Res() res: Response,
  ) {
    const csv = await this.walletService.exportTransactionsToCsv(req.user.id, query);

    res.header('Content-Type', 'text/csv');
    res.attachment(`givar-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  }

  @Public()
  @Get('verify/:reference')
  async verifyTransaction(@Param('reference') reference: string) {
    return this.walletService.verifyAnyTransaction(reference);
  }
}