import { Type } from 'class-transformer';
import {
  IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, ValidateNested, Min, IsBoolean
} from 'class-validator';
import { Currency } from '@givar/database';

// 1. Budget Item Structure (Aligned to Spec)
class BudgetItem {
  @IsString()
  id!: string;

  @IsString()
  payTo!: string;

  @IsString()
  costType!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  stage?: string;
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

// 2. Timeline Item Structure (Maintained for legacy compatibility during transition)
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
  @IsOptional() @IsString() endDate?: string;
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

  @IsOptional() @IsString() beneficiaryName?: string;
  @IsOptional() @IsNumber() beneficiaryAge?: number;
  @IsOptional() @IsString() beneficiaryRelationship?: string;

  @IsOptional() @IsString() vendorName?: string;
  @IsOptional() @IsString() vendorContactPerson?: string;
  @IsOptional() @IsString() vendorEmail?: string;
  @IsOptional() @IsString() vendorPhone?: string;
  @IsOptional() @IsString() vendorAddress?: string;

  @IsOptional() @IsBoolean() hasPreCollectedFunds?: boolean;
  @IsOptional() @IsNumber() preCollectedAmount?: number;
  @IsOptional() @IsString() preCollectedHeldAt?: string;
  @IsOptional() @IsString() preCollectedProofKey?: string;
}