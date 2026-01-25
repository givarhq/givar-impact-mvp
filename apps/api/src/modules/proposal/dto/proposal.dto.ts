import { Type } from 'class-transformer';
import { 
  IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, ValidateNested, Min 
} from 'class-validator';
import { Currency } from '@givar/database';

// 1. Budget Item Structure
class BudgetItem {
  @IsString()
  id!: string;

  @IsString()
  item!: string;

  @IsNumber()
  @Min(0)
  cost!: number;

  @IsString()
  vendor!: string;

  @IsOptional()
  @IsString()
  vendorContact?: string;

  @IsEnum(['SERVICE', 'GOODS', 'LOGISTICS', 'OTHER'])
  type!: string;
}

class MediaItemDto {
  @IsString()
  id!: string;

  @IsString()
  url!: string;

  @IsEnum(['IMAGE', 'VIDEO', 'DOCUMENT'])
  type!: string;

  @IsOptional()
  @IsString()
  caption?: string;
}

// 2. Timeline Item Structure
class TimelineItem {
  @IsString() 
  id!: string;

  @IsString()
  phase!: string;

  @IsString()
  estimatedDate!: string; 

  @IsString()
  deliverables!: string;
}

export class CreateProposalDto {
  @IsString()
  title!: string;

  @IsUUID()
  categoryId!: string;
}

export class UpdateProposalDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() shortDesc?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsNumber() targetAmount?: number; 
  @IsOptional() @IsEnum(Currency) currency?: Currency;
  
  @IsOptional() @IsString() coverImage?: string; 
  @IsOptional() @IsString() videoUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaItemDto) 
  gallery?: MediaItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetItem)
  budgetBreakdown?: BudgetItem[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimelineItem)
  executionTimeline?: TimelineItem[];

  @IsOptional() @IsString() riskAnalysis?: string;

  @IsOptional() @IsArray() @IsString({ each: true }) kycDocuments?: string[];
  @IsOptional() @IsString() organizationName?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() beneficiaryContact?: string;
}