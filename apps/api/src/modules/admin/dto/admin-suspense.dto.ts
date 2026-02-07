import { IsEnum, IsOptional, IsUUID, IsArray, ValidateNested, IsNumberString } from 'class-validator';
import { Type } from 'class-transformer';

export enum SuspenseAction {
  REFUND = 'REFUND',
  ALLOCATE = 'ALLOCATE',
}

export class AllocationSplitDto {
  @IsUUID()
  projectId!: string;

  @IsNumberString()
  amount!: string; // Minor units string
}

export class ResolveSuspenseDto {
  @IsEnum(SuspenseAction)
  action!: SuspenseAction;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllocationSplitDto)
  allocations?: AllocationSplitDto[];
}