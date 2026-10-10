import { isValidObjectId } from 'mongoose';
import { assertMutationRequest, currentSession } from '@/lib/auth';
import { resolvePublicAssetUrl } from '@/lib/assets';
import { connectDb } from '@/lib/db';
import { apiError } from '@/lib/http';
import { inspectObject, r2BucketKindFromName, readObjectBytes } from '@/lib/r2';
import { validateSubtitleArchive } from '@/lib/validation/upload';
import { AuditLog, MediaAsset } from '@/models';

export async function POST(request: Request, { params }: RouteContext<'/api/admin/uploads/[assetId]/complete'>) {
  try {
    const session = await currentSession();
    if (!session) throw Object.assign(new Error('Authentication is required.'), { status: 401, code: 'AUTH_REQUIRED' });
    await assertMutationRequest(request, session);
    const { assetId } = await params;
    if (!isValidObjectId(assetId)) throw Object.assign(new Error('Asset was not found.'), { status: 404, code: 'NOT_FOUND' });
    await connectDb();
    const asset = await MediaAsset.findOne({ _id: assetId, uploadedBy: session.user.id, status: 'pending' });
    if (!asset) throw Object.assign(new Error('Pending asset was not found.'), { status: 404, code: 'NOT_FOUND' });
    const permission = asset.kind === 'subtitle' ? 'subtitles.create' : 'media.upload';
    if (!session.user.permissions.includes(permission)) throw Object.assign(new Error('You do not have permission to complete this upload.'), { status: 403, code: 'FORBIDDEN' });

    const bucketKind = r2BucketKindFromName(asset.bucket);
    const remote = await inspectObject(String(asset.objectKey), bucketKind);
    if (remote.ContentLength !== undefined && Number(remote.ContentLength) !== Number(asset.size)) throw Object.assign(new Error('Uploaded file size did not match the signed request.'), { status: 422, code: 'UPLOAD_MISMATCH' });
    const remoteType = String(remote.ContentType || '').split(';', 1)[0].trim().toLocaleLowerCase();
    const expectedType = String(asset.mimeType || '').split(';', 1)[0].trim().toLocaleLowerCase();
    if (remoteType && remoteType !== expectedType) throw Object.assign(new Error('Uploaded file type did not match the signed request.'), { status: 422, code: 'UPLOAD_MISMATCH' });

    let archiveMetadata: Record<string, number> | undefined;
    if (asset.kind === 'subtitle' && String(asset.fileName).toLocaleLowerCase().endsWith('.zip')) archiveMetadata = await validateSubtitleArchive(await readObjectBytes(String(asset.objectKey), bucketKind));
    const isPublic = ['poster', 'backdrop', 'avatar', 'other'].includes(String(asset.kind));
    const publicUrl = isPublic ? resolvePublicAssetUrl(asset.objectKey) : undefined;
    if (isPublic && !publicUrl) throw Object.assign(new Error('PUBLIC_ASSET_DOMAIN is required to publish uploaded artwork.'), { status: 503, code: 'PUBLIC_ASSET_DOMAIN_REQUIRED' });
    asset.status = 'active';
    asset.metadata = { ...(asset.metadata as Record<string, unknown> | undefined), etag: remote.ETag, verifiedAt: new Date(), ...archiveMetadata };
    await asset.save();
    await AuditLog.create({ actor: session.user.id, action: 'media.activate', entity: 'MediaAsset', entityId: assetId, metadata: { kind: asset.kind, objectKey: asset.objectKey, bucket: asset.bucket } });
    return Response.json({ asset: { id: assetId, objectKey: asset.objectKey, bucket: asset.bucket, kind: asset.kind, fileName: asset.fileName, size: asset.size, status: asset.status, publicUrl } });
  } catch (error) {
    return apiError(error);
  }
}
