import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletRepository } from './wallet.repository';
import { DonationModule } from '../donation/donation.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    ConfigModule, 
    AuditModule,
    forwardRef(() => DonationModule),
  ],
  controllers: [WalletController],
  providers: [WalletService, WalletRepository],
  exports: [WalletService, WalletRepository],
})
export class WalletModule {}