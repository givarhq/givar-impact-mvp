import { IsEnum, IsOptional, IsString, IsNumber, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ProjectStatus } from '@givar/database';

export enum ProjectSort {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  MOST_FUNDED = 'most_funded',
  ENDING_SOON = 'ending_soon',
}

export class ProjectQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(ProjectSort)
  sort?: ProjectSort = ProjectSort.NEWEST;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Max(100, { message: 'Limit cannot exceed 100 to prevent system overload' })
  limit?: number = 10;
}

export class LedgerQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Max(100, { message: 'Limit cannot exceed 100 to prevent system overload' })
  limit?: number = 15;

  @IsOptional()
  @IsString()
  type?: string;
}