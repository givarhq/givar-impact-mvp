import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

interface Hydratable {
  imageUrl?: string;
  coverImage?: string;
  gallery?: any[];
  updates?: any[];
}

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

  /**
  * Global Media Hydrator
  * Recursively signs S3 keys within an entity to make them browser-viewable.
  */
  async hydrateEntityMedia<T extends Record<string, any>>(entity: T): Promise<T> {
    if (!entity) return entity;

    const item = entity as Hydratable;
    const endpoint = this.config.get('IDRIVE_ENDPOINT');

    // INTERNAL HELPER: Extracts the permanent Key from any string (URL or Key)
    const getCleanKey = (value: any): string | null => {
      if (typeof value !== 'string' || !value) return null;

      // If it's already a key (doesn't start with http), return it
      if (!value.startsWith('http')) return value;

      // If it's a URL, check if it belongs to our specific iDrive endpoint
      if (value.includes(endpoint)) {
        try {
          const url = new URL(value);
          // Path is usually /bucket-name/proposals/...
          // We remove the leading slash and the bucket name prefix to get the raw key
          const bucketPrefix = `/${this.bucket}/`;
          if (url.pathname.startsWith(bucketPrefix)) {
            return url.pathname.replace(bucketPrefix, '');
          }
          return url.pathname.substring(1); // Fallback to just removing leading slash
        } catch (e) {
          return null;
        }
      }

      // If it's an external URL (YouTube/Vimeo), it's not a "key", so return null
      return null;
    };

    // 1. Handle primary image fields
    const coverField = item.imageUrl ? 'imageUrl' : (item.coverImage ? 'coverImage' : null);

    if (coverField) {
      const key = getCleanKey(item[coverField]);
      if (key) {
        const { viewUrl } = await this.getPresignedViewUrl(key);
        item[coverField] = viewUrl;
      }
    }

    // 2. Handle rich Gallery JSON arrays
    if (item.gallery && Array.isArray(item.gallery)) {
      item.gallery = await Promise.all(
        item.gallery.map(async (g: any) => {
          const key = getCleanKey(g.url);
          if (key) {
            const { viewUrl } = await this.getPresignedViewUrl(key);
            return { ...g, url: viewUrl };
          }
          return g;
        }),
      );
    }

    // 3. Handle specific ImageUrls in nested Update arrays
    if (item.updates && Array.isArray(item.updates)) {
      item.updates = await Promise.all(
        item.updates.map(async (u: any) => {
          const key = getCleanKey(u.imageUrl);
          if (key) {
            const { viewUrl } = await this.getPresignedViewUrl(key);
            return { ...u, imageUrl: viewUrl };
          }
          return u;
        }),
      );
    }

    return entity;
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

  // Generate temporary VIEW URLs for private files
  async getPresignedViewUrl(key: string, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const viewUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

      return { viewUrl };
    } catch (error: any) {
      this.logger.error(`Failed to generate view URL for key ${key}: ${error.message}`);
      throw new InternalServerErrorException('Could not grant view permission');
    }
  }
  async deleteFiles(keys: string[]) {
    if (!keys || keys.length === 0) return;

    try {
      const command = new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: keys.map(key => ({ Key: key })),
          Quiet: true,
        },
      });

      await this.s3Client.send(command);
      this.logger.log(`Successfully purged ${keys.length} files from S3`);
    } catch (error: any) {
      this.logger.error(`Failed to purge files from S3: ${error.message}`);
    }
  }
}