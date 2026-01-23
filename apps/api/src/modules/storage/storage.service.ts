import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucket: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private config: ConfigService) {
    const region = this.config.get('IDRIVE_REGION') || 'us-east-1';
    const endpoint = this.config.get('IDRIVE_ENDPOINT');
    
    this.bucket = this.config.getOrThrow('IDRIVE_BUCKET');

    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId: this.config.getOrThrow('IDRIVE_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow('IDRIVE_SECRET_ACCESS_KEY'),
      },
      forcePathStyle: true,
    });
  }

  async getPresignedUploadUrl(
    userId: string,
    fileType: string,
    useCase: 'public' | 'kyc' | 'docs'
  ) {
    try {
      const extension = fileType.split('/')[1] || 'bin';
      const filename = `${randomUUID()}.${extension}`;
      
      const visibilityFolder = useCase === 'public' ? 'public' : 'private';
      const key = `proposals/${userId}/${visibilityFolder}/${useCase}/${filename}`;

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: fileType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 900 });

      return {
        uploadUrl,
        key, 
        publicUrl: useCase === 'public' 
            ? `${this.config.get('IDRIVE_ENDPOINT')}/${this.bucket}/${key}`
            : null
      };

    } catch (error: any) {
      this.logger.error(`Failed to generate presigned URL: ${error.message}`);
      throw new InternalServerErrorException('Could not generate upload permission');
    }
  }
}