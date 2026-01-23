import { IsEnum, IsMimeType, IsString } from 'class-validator';

export enum UploadUseCase {
  PUBLIC = 'public', // Project Cover, Gallery
  KYC = 'kyc',       // CAC, Passport
  DOCS = 'docs',     // Vendor Quotes, Invoices
}

export class GetUploadUrlDto {
  @IsString()
  // Basic mime type check (image/png, application/pdf)
  // We accept basic string but ideally use a regex or strict set
  fileType!: string; 

  @IsEnum(UploadUseCase)
  useCase!: UploadUseCase;
}