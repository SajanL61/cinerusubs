import { isValidObjectId } from 'mongoose';
import { assertMutationRequest, requirePermission } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { apiError } from '@/lib/http';
import { completeMultipartObject, inspectObject, r2BucketKindFromName } from '@/lib/r2';
import { multipartCompleteSchema } from '@/lib/validation/upload';
import { AuditLog, MediaAsset } from '@/models';

export async function POST(request: Request, { params }: RouteContext<'/api/admin/uploads/multipart/[assetId]/complete'>) {
  try {
    const session = await requirePermission('media.upload');
    await assertMutationRequest(request, session);
    const { assetId } = await params;
    if (!isValidObjectId(assetId)) throw Object.assign(new Error('Upload was not found.'), { status: 404, code: 'NOT_FOUND' });
    const input = multipartCompleteSchema.parse(await request.json());
    await connectDb();
    const asset = await MediaAsset.findOne({ _id: assetId, uploadedBy: session.user.id, kind: 'media', status: 'pending' });
    if (!asset || String((asset.metadata as Record<string, unknown> | undefined)?.uploadId) !== input.uploadId) throw Object.assign(new Error('Pending multipart upload was not found.'), { status: 404, code: 'NOT_FOUND' });
    const bucketKind = r2BucketKindFromName(asset.bucket);
    await completeMultipartObject(String(asset.objectKey), input.uploadId, input.parts, bucketKind);
    const remote = await inspectObject(String(asset.objectKey), bucketKind);
    if (remote.ContentLength !== undefined && Number(remote.ContentLength) !== Number(asset.size)) throw Object.assign(new Error('Completed media size did not match the upload request.'), { status: 422, code: 'UPLOAD_MISMATCH' });
    asset.status = 'active';
    asset.metadata = { ...(asset.metadata as Record<string, unknown>), etag: remote.ETag, verifiedAt: new Date(), completedParts: input.parts.length };
    await asset.save();
    await AuditLog.create({ actor: session.user.id, action: 'media.multipart.complete', entity: 'MediaAsset', entityId: assetId, metadata: { objectKey: asset.objectKey, size: asset.size, parts: input.parts.length, bucket: asset.bucket } });
    return Response.json({ asset: { id: assetId, objectKey: asset.objectKey, bucket: asset.bucket, kind: asset.kind, fileName: asset.fileName, size: asset.size, status: asset.status } });
  } catch (error) {
    return apiError(error);
  }
}
