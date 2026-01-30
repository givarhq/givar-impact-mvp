import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { StorageModule } from '../storage/storage.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    StorageModule,
    WalletModule
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}