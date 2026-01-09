import { IsEnum, IsNumberString, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';
import { Currency } from '@givar/database';

export class CreateProjectDto {
  @IsString()
  @MinLength(5)
  title!: string;

  @IsString()
  @MinLength(20)
  description!: string;

  @IsNumberString()
  targetAmount!: string;

  @IsEnum(Currency)
  currency!: Currency;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}