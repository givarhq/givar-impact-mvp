import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletRepository } from './wallet.repository';
import { DonationModule } from '../donation/donation.module';
import { DonationService } from '../donation/donation.service';

@Module({
  imports: [ConfigModule, DonationModule],
  controllers: [WalletController],
  providers: [WalletService, WalletRepository],
  exports: [DonationService, WalletService, WalletRepository],
})
export class WalletModule {}