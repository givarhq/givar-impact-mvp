import { IsEnum, IsNumber, IsNumberString, IsOptional, IsString } from 'class-validator';
import { Currency } from '@givar/database';

export class FundWalletDto {
  // We accept "1000" (representing 10.00) or "100000" (1000.00)
  // Logic assumes lowest denomination (cents/kobo)
  @IsNumberString({}, { message: 'Amount must be a numeric string' })
  amount!: string;

  @IsEnum(Currency)
  currency!: Currency;

  @IsString()
  @IsOptional()
  description?: string;

  // --- FX Metadata for International Top-ups ---
  @IsOptional()
  @IsString()
  donorCurrency?: string;

  @IsOptional()
  @IsString()
  donorAmount?: string;

  @IsOptional()
  @IsNumber()
  fxRate?: number;
}

export class WalletBalanceDto {
  currency!: Currency;
  balance!: string;
}