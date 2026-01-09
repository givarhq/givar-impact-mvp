import { IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';
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
}

export class WalletBalanceDto {
  currency!: Currency;
  balance!: string;
}