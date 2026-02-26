import { IsEmail, IsEnum, IsNumberString, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { Currency } from '@givar/database';

// Centralized Regex for Money
// 1. Must be positive (starts with 1-9)
// 2. Only digits
// 3. Length 3-15 (Min 1.00 base unit, Max 9 Quadrillion)
const MONEY_REGEX = /^[1-9]\d{2,14}$/;
const MONEY_MESSAGE = 'Amount must be a positive integer representing minor units (min 100 base units, e.g. 1.00)';

export class CreateDonationDto {
  @IsUUID()
  projectId!: string;

  // Strict regex
  @Matches(MONEY_REGEX, { message: MONEY_MESSAGE })
  amount!: string;

  // Support for optional tips
  @IsOptional()
  @IsNumberString()
  tipAmount?: string;

  @IsEnum(Currency)
  currency!: Currency;

  @IsString()
  @IsOptional()
  message?: string;
}

export class InitiateDirectDonationDto {
  @IsUUID()
  projectId: string;

  @Matches(MONEY_REGEX, { message: MONEY_MESSAGE })
  amount: string;

  // Support for optional tips
  @IsOptional()
  @IsNumberString()
  tipAmount?: string;

  @IsEnum(Currency)
  currency: Currency;

  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  guestName?: string;
}
