import 'server-only';
import { AbortMultipartUploadCommand, CompleteMultipartUploadCommand, CreateMultipartUploadCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client, UploadPartCommand } from '@aws-sdk/client-s3';
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

export async function signedStreamUrl(key: string, contentType?: string, expiresIn = 600) {
  const command = new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key, ResponseContentType: contentType, ResponseContentDisposition: 'inline' });
  return getSignedUrl(getR2Client(), command, { expiresIn });
}

export async function signedUploadUrl(key: string, contentType: string, metadata: Record<string, string>, expiresIn = 600) {
  const command = new PutObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key, ContentType: contentType, Metadata: metadata });
  return getSignedUrl(getR2Client(), command, { expiresIn });
}

export async function createMultipartObject(key: string, contentType: string, metadata: Record<string, string>) {
  const response = await getR2Client().send(new CreateMultipartUploadCommand({ Bucket: env.R2_BUCKET_NAME, Key: key, ContentType: contentType, Metadata: metadata }));
  if (!response.UploadId) throw Object.assign(new Error('R2 did not create a multipart upload.'), { status: 502, code: 'MULTIPART_START_FAILED' });
  return response.UploadId;
}

export async function signedMultipartPartUrl(key: string, uploadId: string, partNumber: number, expiresIn = 900) {
  const command = new UploadPartCommand({ Bucket: env.R2_BUCKET_NAME, Key: key, UploadId: uploadId, PartNumber: partNumber });
  return getSignedUrl(getR2Client(), command, { expiresIn });
}

export async function completeMultipartObject(key: string, uploadId: string, parts: { ETag: string; PartNumber: number }[]) {
  return getR2Client().send(new CompleteMultipartUploadCommand({ Bucket: env.R2_BUCKET_NAME, Key: key, UploadId: uploadId, MultipartUpload: { Parts: parts } }));
}

export async function abortMultipartObject(key: string, uploadId: string) {
  await getR2Client().send(new AbortMultipartUploadCommand({ Bucket: env.R2_BUCKET_NAME, Key: key, UploadId: uploadId }));
}

export async function inspectObject(key: string) {
  return getR2Client().send(new HeadObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }));
}

export async function readObjectBytes(key: string) {
  const response = await getR2Client().send(new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }));
  if (!response.Body) throw Object.assign(new Error('Stored object could not be read.'), { status: 422, code: 'OBJECT_UNREADABLE' });
  return response.Body.transformToByteArray();
}

export async function deleteObject(key: string) {
  await getR2Client().send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }));
}

export async function listObjectKeys(limit = 10_000) {
  const keys: string[] = [];
  let continuationToken: string | undefined;
  do {
    const page = await getR2Client().send(new ListObjectsV2Command({ Bucket: env.R2_BUCKET_NAME, ContinuationToken: continuationToken, MaxKeys: Math.min(1_000, limit - keys.length) }));
    for (const object of page.Contents ?? []) if (object.Key) keys.push(object.Key);
    continuationToken = page.IsTruncated && keys.length < limit ? page.NextContinuationToken : undefined;
  } while (continuationToken);
  return { keys, capped: keys.length >= limit };
}
