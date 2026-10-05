import 'server-only';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';

let client: S3Client | null = null;

export function r2Configured() {
  return Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME);
}

export function getR2Client() {
  if (!r2Configured()) throw Object.assign(new Error('Object storage is not configured'), { status: 503, code: 'STORAGE_UNAVAILABLE' });
  client ??= new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID!, secretAccessKey: env.R2_SECRET_ACCESS_KEY! },
  });
  return client;
}

export async function signedDownloadUrl(key: string, fileName: string, expiresIn = 90) {
  const command = new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key, ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}` });
  return getSignedUrl(getR2Client(), command, { expiresIn });
}

export async function signedUploadUrl(key: string, contentType: string, metadata: Record<string, string>, expiresIn = 600) {
  const command = new PutObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key, ContentType: contentType, Metadata: metadata });
  return getSignedUrl(getR2Client(), command, { expiresIn });
}
