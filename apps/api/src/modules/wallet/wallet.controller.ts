import { Body, Controller, Get, Headers, HttpCode, Post, Query, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WalletService } from './wallet.service';
import { FundWalletDto } from './dto/wallet.dto';
import { Currency } from '@givar/database';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { type Response } from 'express';
import { TransactionQueryDto } from './dto/transaction-query.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

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
    return this.walletService.initiateFunding(
      req.user.id,
      req.user.email,
      dto.amount,
      dto.currency,
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
    @Body() payload: any,
  ) {
    await this.walletService.handleWebhook(signature, payload); 
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
}