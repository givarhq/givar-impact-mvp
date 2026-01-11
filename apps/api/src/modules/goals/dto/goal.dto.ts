import { IsEnum, IsNumberString } from 'class-validator';
import { Currency, GoalInterval } from '@givar/database';

export class UpsertGoalDto {
  @IsNumberString({}, { message: 'Target amount must be a numeric string' })
  targetAmount: string; // "50000" = 500.00

  @IsEnum(Currency)
  currency: Currency;

  @IsEnum(GoalInterval)
  interval: GoalInterval;
}