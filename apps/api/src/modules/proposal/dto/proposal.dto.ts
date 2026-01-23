import { Type } from 'class-transformer';
import { 
  IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, ValidateNested, Min, IsUrl 
} from 'class-validator';
import { Currency } from '@givar/database';

// 1. Budget Item Structure
class BudgetItem {
  @IsString()
  item!: string;

  @IsNumber()
  @Min(1)
  cost!: number; // Major units (Frontend handles formatting)

  @IsString()
  vendor!: string; // Critical for Procurement Model

  @IsOptional()
  @IsString()
  vendorContact?: string;

  @IsEnum(['SERVICE', 'GOODS', 'LOGISTICS', 'OTHER'])
  type!: string;
}

// 2. Timeline Item Structure
class TimelineItem {
  @IsString()
  phase!: string;

  @IsString()
  estimatedDate!: string; // ISO Date String

  @IsString()
  deliverables!: string;
}

// 3. Create Draft DTO (Minimal requirements to start)
export class CreateProposalDto {
  @IsString()
  title!: string;

  @IsUUID()
  categoryId!: string;
}

// 4. Update Draft DTO (Everything is optional)
export class UpdateProposalDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() shortDesc?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsNumber() targetAmount?: number; // Major units
  @IsOptional() @IsEnum(Currency) currency?: Currency;
  
  // Media
  @IsOptional() @IsUrl() coverImage?: string;
  @IsOptional() @IsArray() @IsUrl({}, { each: true }) gallery?: string[];
  @IsOptional() @IsUrl() videoUrl?: string;

  // Complex Structures
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

  // KYC / Trust
  @IsOptional() @IsArray() @IsString({ each: true }) kycDocuments?: string[];
  @IsOptional() @IsString() organizationName?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() beneficiaryContact?: string;
}