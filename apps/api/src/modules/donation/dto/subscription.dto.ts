import { IsEnum, IsNumberString, IsUUID } from 'class-validator';
import { Currency, SubscriptionInterval, SubscriptionStatus } from '@givar/database';

export class CreateSubscriptionDto {
  @IsUUID()
  projectId: string;

  @IsNumberString({}, { message: 'Amount must be a numeric string' })
  amount: string;

  @IsEnum(Currency)
  currency: Currency;

  @IsEnum(SubscriptionInterval)
  interval: SubscriptionInterval;
}

export class UpdateSubscriptionStatusDto {
  @IsEnum(SubscriptionStatus, { 
    message: 'Status must be ACTIVE, PAUSED, or CANCELLED' 
  })
  status!: SubscriptionStatus;
}