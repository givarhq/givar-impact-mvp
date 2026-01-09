import { IsEnum, IsNumberString, IsOptional, IsString, IsUrl, MinLength, IsBoolean } from 'class-validator';
import { Currency } from '@givar/database';
import { Type } from 'class-transformer';

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

// Support Partial Updates
export class UpdateProjectDto {
  @IsOptional() @IsString() @MinLength(5)
  title?: string;

  @IsOptional() @IsString() @MinLength(20)
  description?: string;

  @IsOptional() @IsUrl()
  imageUrl?: string;
  
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

// Pagination & Filtering
export class ProjectQueryDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;
}