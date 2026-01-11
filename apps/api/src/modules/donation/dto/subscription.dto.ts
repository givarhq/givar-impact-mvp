import { IsEnum, IsNumberString, IsUUID } from 'class-validator';
import { Currency, SubscriptionInterval } from '@givar/database';

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