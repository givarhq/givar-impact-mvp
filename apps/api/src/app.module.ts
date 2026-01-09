import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './common/prisma.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { DonationModule } from './modules/donation/donation.module';
import { ProjectModule } from './modules/project/project.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    WalletModule,
    DonationModule,
    ProjectModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}