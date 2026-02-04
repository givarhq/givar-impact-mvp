import { Type } from 'class-transformer';
import {
  IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, ValidateNested, Min, IsUrl, IsBoolean
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Currency, ProjectStatus } from '@givar/database';

export class AdminBudgetItem {
  @IsString() id!: string;
  @IsString() item!: string;
  @IsNumber() @Min(0) cost!: number;
  @IsString() vendor!: string;
  @IsOptional() @IsString() vendorContact?: string;
  @IsString() type!: string;
}

export class AdminTimelineItem {
  @IsString() id!: string;
  @IsString() phase!: string;
  @IsString() estimatedDate!: string;
  @IsString() deliverables!: string;
}

export class AdminMediaItem {
  @IsString() id!: string;
  @IsUrl() url!: string;
  @IsEnum(['IMAGE', 'VIDEO', 'DOCUMENT']) type!: string;
  @IsOptional() @IsString() caption?: string;
}

export class CreateAdminProjectDto {
  @IsString() title!: string;
  @IsString() description!: string;
  @IsOptional() @IsString() shortDesc?: string;
  @IsUUID() categoryId!: string;
  @IsString() location!: string;

  @IsNumber() @Min(100) targetAmount!: number;
  @IsEnum(Currency) currency!: Currency;

  @IsUrl() coverImage!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminMediaItem)
  gallery!: AdminMediaItem[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminBudgetItem)
  budgetBreakdown?: AdminBudgetItem[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminTimelineItem)
  executionTimeline?: AdminTimelineItem[];

  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() endDate?: string;

  @IsOptional() @IsEnum(ProjectStatus) status?: ProjectStatus;
}

export class UpdateAdminProjectDto extends PartialType(CreateAdminProjectDto) {
  @IsOptional() @IsEnum(ProjectStatus) status?: ProjectStatus;
  @IsOptional() @IsBoolean() isActive?: boolean;
}