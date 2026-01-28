import { 
  IsEnum, 
  IsNumberString, 
  IsOptional, 
  IsString, 
  IsUrl, 
  MinLength, 
  IsBoolean, 
  IsUUID, 
  IsArray, 
  ValidateNested
} from 'class-validator';
import { Currency, ProjectStatus } from '@givar/database';
import { Type } from 'class-transformer';

/**
 * SOTA: Media Item structure for the Project Gallery
 */
class ProjectMediaDto {
  @IsString()
  url!: string;

  @IsEnum(['IMAGE', 'VIDEO', 'DOCUMENT'])
  type!: string;

  @IsOptional()
  @IsString()
  caption?: string;
}

export class CreateProjectDto {
  @IsString()
  @MinLength(5)
  title!: string;

  @IsString()
  @MinLength(20)
  description!: string;

  @IsOptional()
  @IsString()
  shortDesc?: string;

  @IsNumberString()
  targetAmount!: string;

  @IsEnum(Currency)
  currency!: Currency;

  @IsUUID()
  userId!: string; // SOTA: Mandatory link to owner/proposer

  @IsUUID()
  categoryId!: string; // SOTA: Mandatory taxonomy

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectMediaDto)
  gallery?: ProjectMediaDto[];
}

export class UpdateProjectDto {
  @IsOptional() @IsString() @MinLength(5)
  title?: string;

  @IsOptional() @IsString() @MinLength(20)
  description?: string;

  @IsOptional() @IsString()
  shortDesc?: string;

  @IsOptional() @IsUrl()
  imageUrl?: string;
  
  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}