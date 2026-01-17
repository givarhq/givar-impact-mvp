import { IsEmail, IsEnum, IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';
import { Currency } from '@givar/database';

export class CreateDonationDto {
  @IsUUID()
  projectId!: string;

  @IsNumberString()
  amount!: string;

  @IsEnum(Currency)
  currency!: Currency;

  @IsString()
  @IsOptional()
  message?: string;
}

export class InitiateDirectDonationDto {
  @IsUUID()
  projectId: string;

  @IsNumberString()
  amount: string;

  @IsEnum(Currency)
  currency: Currency;
  
  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  guestName?: string;
}