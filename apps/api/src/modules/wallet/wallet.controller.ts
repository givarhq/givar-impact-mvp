import { Body, Controller, Get, Headers, HttpCode, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WalletService } from './wallet.service';
import { FundWalletDto } from './dto/wallet.dto';
import { Currency } from '@givar/database';

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

  // PUBLIC ENDPOINT - Called by Paystack
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Body() payload: any,
  ) {
    // Returns void, but throws 400 if signature invalid
    await this.walletService.handleWebhook(signature, payload); 
  }
}