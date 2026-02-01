import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus } from '@givar/database';

export class AdminProjectQueryDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(ProjectStatus)
    status?: ProjectStatus;

    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 20;

    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc';
}