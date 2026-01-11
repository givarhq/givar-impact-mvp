import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
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
  category?: string; // Slug

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
  
  @IsOptional() 
  @IsEnum(ProjectSort) 
  sort?: ProjectSort = ProjectSort.NEWEST;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  limit?: number = 9;
}