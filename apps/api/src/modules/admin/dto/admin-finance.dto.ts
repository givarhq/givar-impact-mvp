import { IsOptional, IsDateString, IsArray, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class AdminFinanceQueryDto {
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
    categoryIds?: string[];
}