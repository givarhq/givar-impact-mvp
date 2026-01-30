import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateMilestoneDto {
  @IsEnum(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
  status!: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

  // Optional field for visual proof
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}