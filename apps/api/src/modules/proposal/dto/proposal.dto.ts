import { Type } from 'class-transformer';
import {
  IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, ValidateNested, Min, IsBoolean,
  ValidateIf, ArrayMaxSize
} from 'class-validator';
import { Currency } from '@givar/database';

class VendorItemDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  subaccountCode?: string;
}

class BudgetItem {
  @IsString()
  id!: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  payTo?: string;

  @IsOptional()
  @IsString()
  vendorContact?: string;

  @IsString()
  costType!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  description!: string;

  @IsOptional()
  @IsEnum(['Early Stage', 'Main Stage', 'Final Stage'])
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

  @IsUUID()
  subcategoryId!: string;

  @IsOptional() @IsString() beneficiaryName?: string;
  @IsOptional() @IsNumber() beneficiaryAge?: number;
  @IsOptional() @IsString() beneficiaryRelationship?: string;
  @IsOptional() @IsString() beneficiaryContact?: string;

  @IsOptional() @IsString() organizationName?: string;
  @IsOptional() @IsString() contactPhone?: string;
}

export class UpdateProposalDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() shortDesc?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() personalMessage?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @IsNumber() targetAmount?: number;
  @IsOptional() @IsEnum(Currency) currency?: Currency;

  @IsOptional()
  @ValidateIf((object, value) => value !== null)
  @IsUUID()
  categoryId?: string | null;

  @IsOptional()
  @ValidateIf((object, value) => value !== null)
  @IsUUID()
  subcategoryId?: string | null;

  @IsOptional() @IsString() coverImage?: string;
  @IsOptional() @IsString() videoUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30, { message: 'Maximum of 30 gallery items allowed' })
  @ValidateNested({ each: true })
  @Type(() => MediaItemDto)
  gallery?: MediaItemDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50, { message: 'Maximum of 50 budget items allowed' })
  @ValidateNested({ each: true })
  @Type(() => BudgetItem)
  budgetBreakdown?: BudgetItem[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'Maximum of 10 timeline phases allowed' })
  @ValidateNested({ each: true })
  @Type(() => TimelineItem)
  executionTimeline?: TimelineItem[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30, { message: 'Maximum of 30 vendors allowed' })
  @ValidateNested({ each: true })
  @Type(() => VendorItemDto)
  vendors?: VendorItemDto[];

  @IsOptional() @IsString() riskAnalysis?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'Maximum of 10 KYC documents allowed' })
  @IsString({ each: true })
  kycDocuments?: string[];

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