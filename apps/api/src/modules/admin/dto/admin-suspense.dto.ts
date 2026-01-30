import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum SuspenseAction {
  REFUND = 'REFUND',
  ALLOCATE = 'ALLOCATE',
}

export class ResolveSuspenseDto {
  @IsEnum(SuspenseAction)
  action!: SuspenseAction;

  @IsOptional()
  @IsUUID()
  targetProjectId?: string;
}