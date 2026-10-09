import { isValidObjectId } from 'mongoose';
import { assertMutationRequest, requirePermission } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { apiError } from '@/lib/http';
import { r2BucketKindFromName, signedMultipartPartUrl } from '@/lib/r2';
import { multipartPartSchema } from '@/lib/validation/upload';
import { MediaAsset } from '@/models';

export async function POST(request: Request, { params }: RouteContext<'/api/admin/uploads/multipart/[assetId]/part'>) {
  try {
    const session = await requirePermission('media.upload');
    await assertMutationRequest(request, session);
    const { assetId } = await params;
    if (!isValidObjectId(assetId)) throw Object.assign(new Error('Upload was not found.'), { status: 404, code: 'NOT_FOUND' });
    const input = multipartPartSchema.parse(await request.json());
    await connectDb();
    const asset = await MediaAsset.findOne({ _id: assetId, uploadedBy: session.user.id, kind: 'media', status: 'pending' }).lean();
    if (!asset || String((asset.metadata as Record<string, unknown> | undefined)?.uploadId) !== input.uploadId) throw Object.assign(new Error('Pending multipart upload was not found.'), { status: 404, code: 'NOT_FOUND' });
    const uploadUrl = await signedMultipartPartUrl(String(asset.objectKey), input.uploadId, input.partNumber, 900, r2BucketKindFromName(asset.bucket));
    return Response.json({ uploadUrl, expiresIn: 900 });
  } catch (error) {
    return apiError(error);
  }
}
