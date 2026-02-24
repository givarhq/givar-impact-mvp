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
  private publicBucket: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private config: ConfigService) {
    const region = this.config.get('IDRIVE_REGION') || 'us-east-1';
    const endpoint = this.config.get('IDRIVE_ENDPOINT');

    this.bucket = this.config.getOrThrow('IDRIVE_BUCKET'); // Strict private/forensic bucket
    this.publicBucket = this.config.get('IDRIVE_PUBLIC_BUCKET') || this.bucket; // Fallback to private if public is pending

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
  * Recursively signs S3 keys. Safely ignores permanent public URLs to save compute.
  */
  async hydrateEntityMedia<T extends Record<string, any>>(entity: T): Promise<T> {
    if (!entity) return entity;

    const item = entity as Hydratable;
    const endpoint = this.config.get('IDRIVE_ENDPOINT');
    const isPublicModeActive = this.bucket !== this.publicBucket;

    // INTERNAL HELPER: Extracts the permanent Key from any string (URL or Key)
    const getCleanKey = (value: any): string | null => {
      if (typeof value !== 'string' || !value) return null;

      // If it's already a raw key (doesn't start with http), return it for JIT signing
      if (!value.startsWith('http')) return value;

      // If it's a URL, check if it belongs to our specific iDrive endpoint
      if (endpoint && value.includes(endpoint)) {
        try {
          const url = new URL(value);
          const privatePrefix = `/${this.bucket}/`;
          const publicPrefix = `/${this.publicBucket}/`;

          // ARCHITECTURE WIN: If it's already pointing to the public bucket, DO NOT sign it.
          // Let the browser load the permanent public URL directly.
          if (isPublicModeActive && url.pathname.startsWith(publicPrefix)) {
            return null;
          }

          if (url.pathname.startsWith(privatePrefix)) {
            return url.pathname.replace(privatePrefix, '');
          }

          return url.pathname.substring(1);
        } catch (e) {
          return null;
        }
      }

      // If it's an external URL (YouTube/Vimeo) or public CDN, ignore it.
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

      // Routing Logic: Divert to Public Bucket if applicable
      const targetBucket = useCase === 'public' ? this.publicBucket : this.bucket;
      const visibilityFolder = useCase === 'public' ? 'public' : 'private';
      const key = `proposals/${userId}/${visibilityFolder}/${useCase}/${filename}`;

      const command = new PutObjectCommand({
        Bucket: targetBucket,
        Key: key,
        ContentType: fileType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 900 });

      const isPublicModeActive = this.bucket !== this.publicBucket;

      return {
        uploadUrl,
        key,
        // If we have a dedicated public bucket, return the absolute permanent URL for DB storage
        publicUrl: (useCase === 'public' && isPublicModeActive)
          ? `${this.config.get('IDRIVE_ENDPOINT')}/${this.publicBucket}/${key}`
          : null
      };

    } catch (error: any) {
      this.logger.error(`Failed to generate presigned URL: ${error.message}`);
      throw new InternalServerErrorException('Could not generate upload permission');
    }
  }

  async getPresignedViewUrl(key: string, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket, // View URLs are only ever used for Private/Forensic files
        Key: key,
      });

      const viewUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

      return { viewUrl };
    } catch (error: any) {
      this.logger.error(`Failed to generate view URL for key ${key}: ${error.message}`);
      throw new InternalServerErrorException('Could not grant view permission');
    }
  }

  /**
   * Dual-Bucket Deletion Router
   */
  async deleteFiles(keys: string[]) {
    if (!keys || keys.length === 0) return;

    const privateKeys: string[] = [];
    const publicKeys: string[] = [];
    const endpoint = this.config.get('IDRIVE_ENDPOINT');

    keys.forEach(k => {
      if (k.startsWith('http')) {
        if (endpoint && k.includes(endpoint)) {
          try {
            const url = new URL(k);
            if (this.publicBucket !== this.bucket && url.pathname.startsWith(`/${this.publicBucket}/`)) {
              publicKeys.push(url.pathname.replace(`/${this.publicBucket}/`, ''));
            } else {
              privateKeys.push(url.pathname.replace(`/${this.bucket}/`, ''));
            }
          } catch (e) { }
        }
      } else {
        privateKeys.push(k);
      }
    });

    const deleteFrom = async (bucketName: string, objectKeys: string[]) => {
      if (objectKeys.length === 0) return;
      try {
        const command = new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: { Objects: objectKeys.map(Key => ({ Key })), Quiet: true },
        });
        await this.s3Client.send(command);
      } catch (e: any) {
        this.logger.error(`Purge failed in ${bucketName}: ${e.message}`);
      }
    };

    await Promise.all([
      deleteFrom(this.bucket, privateKeys),
      deleteFrom(this.publicBucket, publicKeys)
    ]);
  }
}