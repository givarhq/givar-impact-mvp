import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { v2 as cloudinary } from 'cloudinary';

interface Hydratable {
  imageUrl?: string;
  coverImage?: string;
  videoUrl?: string;
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

    // Initialize Cloudinary for public asset offloading
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
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

      // Cloudinary URLs are strictly public and permanent. Ignore signing.
      if (value.includes('cloudinary.com')) return null;

      // If it's already a raw key (doesn't start with http), return it for JIT signing
      if (!value.startsWith('http')) return value;

      // If it's a URL, check if it belongs to our specific iDrive endpoint
      if (endpoint && value.includes(endpoint)) {
        try {
          const url = new URL(value);
          const privatePrefix = `/${this.bucket}/`;
          const publicPrefix = `/${this.publicBucket}/`;

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

      return null;
    };

    const coverField = item.imageUrl ? 'imageUrl' : (item.coverImage ? 'coverImage' : null);

    if (coverField) {
      const key = getCleanKey(item[coverField]);
      if (key) {
        const { viewUrl } = await this.getPresignedViewUrl(key);
        item[coverField] = viewUrl;
      }
    }

    // Hydrate short video URL
    if (item.videoUrl) {
      const key = getCleanKey(item.videoUrl);
      if (key) {
        const { viewUrl } = await this.getPresignedViewUrl(key);
        item.videoUrl = viewUrl;
      }
    }

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
      // Logic: Intercept public uploads and route to Cloudinary if configured
      if (useCase === 'public') {
        const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME');
        const apiKey = this.config.get('CLOUDINARY_API_KEY');
        const apiSecret = this.config.get('CLOUDINARY_API_SECRET');

        if (cloudName && apiKey && apiSecret) {
          const timestamp = Math.round(new Date().getTime() / 1000);
          const folder = `givar/public/${userId}`;
          const signature = cloudinary.utils.api_sign_request(
            { timestamp, folder },
            apiSecret
          );

          return {
            provider: 'cloudinary',
            uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
            uploadData: {
              apiKey,
              timestamp,
              signature,
              folder,
            }
          };
        }
      }

      // Fallback & Private logic: Route to iDrive e2 S3
      const extension = fileType.split('/')[1] || 'bin';
      const filename = `${randomUUID()}.${extension}`;

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
        provider: 's3',
        uploadUrl,
        key,
        publicUrl: (useCase === 'public' && isPublicModeActive)
          ? `${this.config.get('IDRIVE_ENDPOINT')}/${this.publicBucket}/${key}`
          : null
      };

    } catch (error: any) {
      this.logger.error(`Failed to generate upload instruction: ${error.message}`);
      throw new InternalServerErrorException('Could not generate upload permission');
    }
  }

  async getPresignedViewUrl(key: string, expiresIn = 3600) {
    // SECURITY/ROBUSTNESS: If the key is already a fully qualified public URL (e.g. Cloudinary),
    // return it immediately. Do not attempt to sign it with the AWS SDK.
    if (key.startsWith('http')) {
      return { viewUrl: key };
    }

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

  /**
   * Dual-Cloud Deletion Router
   */
  async deleteFiles(keys: string[]) {
    if (!keys || keys.length === 0) return;

    const privateKeys: string[] = [];
    const publicKeys: string[] = [];
    const cloudinaryPublicIds: string[] = [];
    const endpoint = this.config.get('IDRIVE_ENDPOINT');

    keys.forEach(k => {
      if (k.includes('cloudinary.com')) {
        try {
          const parts = k.split('/upload/');
          if (parts.length > 1) {
            const idWithExt = parts[1].split('/').slice(1).join('/');
            const publicId = idWithExt.substring(0, idWithExt.lastIndexOf('.'));
            if (publicId) cloudinaryPublicIds.push(publicId);
          }
        } catch (e) { }
      } else if (k.startsWith('http')) {
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

    const deleteFromS3 = async (bucketName: string, objectKeys: string[]) => {
      if (objectKeys.length === 0) return;
      try {
        const command = new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: { Objects: objectKeys.map(Key => ({ Key })), Quiet: true },
        });
        await this.s3Client.send(command);
      } catch (e: any) {
        this.logger.error(`S3 Purge failed in ${bucketName}: ${e.message}`);
      }
    };

    const deleteFromCloudinary = async () => {
      if (cloudinaryPublicIds.length === 0 || !this.config.get('CLOUDINARY_API_KEY')) return;
      try {
        await cloudinary.api.delete_resources(cloudinaryPublicIds);
      } catch (e: any) {
        this.logger.error(`Cloudinary Purge failed: ${e.message}`);
      }
    };

    await Promise.all([
      deleteFromS3(this.bucket, privateKeys),
      deleteFromS3(this.publicBucket, publicKeys),
      deleteFromCloudinary()
    ]);
  }
}