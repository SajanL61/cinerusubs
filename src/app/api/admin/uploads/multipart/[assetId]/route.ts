import { isValidObjectId } from 'mongoose';
import { assertMutationRequest, requirePermission } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { apiError } from '@/lib/http';
import { abortMultipartObject, r2BucketKindFromName } from '@/lib/r2';
import { multipartAbortSchema } from '@/lib/validation/upload';
import { AuditLog, MediaAsset } from '@/models';

export async function DELETE(request: Request, { params }: RouteContext<'/api/admin/uploads/multipart/[assetId]'>) {
  try {
    const session = await requirePermission('media.upload');
    await assertMutationRequest(request, session);
    const { assetId } = await params;
    if (!isValidObjectId(assetId)) throw Object.assign(new Error('Upload was not found.'), { status: 404, code: 'NOT_FOUND' });
    const { uploadId } = multipartAbortSchema.parse(await request.json());
    await connectDb();
    const asset = await MediaAsset.findOne({ _id: assetId, uploadedBy: session.user.id, kind: 'media', status: 'pending' });
    if (!asset || String((asset.metadata as Record<string, unknown> | undefined)?.uploadId) !== uploadId) throw Object.assign(new Error('Pending multipart upload was not found.'), { status: 404, code: 'NOT_FOUND' });
    await abortMultipartObject(String(asset.objectKey), uploadId, r2BucketKindFromName(asset.bucket));
    asset.status = 'disabled';
    await asset.save();
    await AuditLog.create({ actor: session.user.id, action: 'media.multipart.abort', entity: 'MediaAsset', entityId: assetId, metadata: { objectKey: asset.objectKey, bucket: asset.bucket } });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
