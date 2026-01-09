import { Body, Controller, Get, Headers, HttpCode, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WalletService } from './wallet.service';
import { FundWalletDto } from './dto/wallet.dto';
import { Currency } from '@givar/database';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

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
}