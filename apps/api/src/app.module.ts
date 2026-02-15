import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './common/prisma.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { DonationModule } from './modules/donation/donation.module';
import { ProjectModule } from './modules/project/project.module';
import { HealthModule } from './modules/health/health.module';
import { GoalModule } from './modules/goals/goal.module';
import { AuditModule } from './modules/audit/audit.module';
import { AdminModule } from './modules/admin/admin.module';
import { ProposalModule } from './modules/proposal/proposal.module';
import { StorageModule } from './modules/storage/storage.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { EmailModule } from './modules/email/email.module';
import { ReadOnlyGuard } from './common/guards/read-only.guard';
import { JwtModule } from '@nestjs/jwt';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    // RATE LIMITING
    ThrottlerModule.forRoot([{
      ttl: 60000, // Time to Live (1 minute)
      limit: 60,  // Max 60 requests per minute per IP globally
    }]),
    EmailModule,
    PrismaModule,
    AuthModule,
    WalletModule,
    DonationModule,
    ProjectModule,
    HealthModule,
    GoalModule,
    AuditModule,
    AdminModule,
    StorageModule,
    ProposalModule,
    OrganizationModule,
    RecommendationsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      // The ReadOnlyGuard is registered platform-wide.
      // It only activates when it detects the 'isImpersonating' flag in the JWT.
      provide: APP_GUARD,
      useClass: ReadOnlyGuard,
    },
  ],
  exports: [],
})
export class AppModule { }