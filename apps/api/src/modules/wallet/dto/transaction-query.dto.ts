import { IsDateString, IsEnum, IsOptional, IsString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { TxType, TxStatus } from '@givar/database';

export class TransactionQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 15;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(TxType)
  type?: TxType;
  
  @IsOptional()
  @IsEnum(TxStatus)
  status?: TxStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn(['createdAt', 'amount', 'status', 'description'])
  sortBy?: 'createdAt' | 'amount' | 'status' | 'description';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}