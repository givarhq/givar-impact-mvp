import { IsEnum, Matches, IsString } from 'class-validator';

export enum UploadUseCase {
  PUBLIC = 'public', // Project Cover, Gallery
  KYC = 'kyc',       // CAC, Passport
  DOCS = 'docs',     // Vendor Quotes, Invoices
}

export class GetUploadUrlDto {
  @IsString()
  @Matches(/^(image\/(jpeg|png|webp|gif)|video\/(mp4|quicktime|webm)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document))$/, {
    message: 'Unsupported file format. Please upload standard images, videos, or documents.',
  })
  fileType!: string;

  @IsEnum(UploadUseCase)
  useCase!: UploadUseCase;
}