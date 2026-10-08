import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { assertMutationRequest, requirePermission } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { apiError } from '@/lib/http';
import { assertMediaDistributionAllowed } from '@/lib/rights';
import { AuditLog, Episode, MediaAsset, MediaVersion, Movie } from '@/models';
import type { RightsStatus } from '@/types/content';

const patchSchema = z.object({ active: z.boolean().optional(), deletionStatus: z.enum(['active', 'pending_deletion', 'retained']).optional() });

export async function PATCH(request: Request, { params }: RouteContext<'/api/admin/media-versions/[id]'>) {
  try {
    const session = await requirePermission('media.update'); await assertMutationRequest(request, session);
    const { id } = await params; if (!isValidObjectId(id)) throw Object.assign(new Error('Media version was not found.'), { status: 404, code: 'NOT_FOUND' });
    const input = patchSchema.parse(await request.json()); await connectDb(); const version = await MediaVersion.findById(id);
    if (!version) throw Object.assign(new Error('Media version was not found.'), { status: 404, code: 'NOT_FOUND' });
    if (input.active) { const content = version.contentType === 'movie' ? await Movie.findById(version.contentId) : await Episode.findById(version.contentId); if (!content) throw Object.assign(new Error('Content was not found.'), { status: 404, code: 'NOT_FOUND' }); assertMediaDistributionAllowed(content.rightsStatus as RightsStatus, true); assertMediaDistributionAllowed(version.rightsStatus as RightsStatus, true); }
    Object.assign(version, input, { updatedBy: session.user.id }); await version.save();
    await AuditLog.create({ actor: session.user.id, action: 'media_version.update', entity: 'MediaVersion', entityId: id, metadata: input });
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request, { params }: RouteContext<'/api/admin/media-versions/[id]'>) {
  try {
    const session = await requirePermission('media.delete'); await assertMutationRequest(request, session);
    const { id } = await params; if (!isValidObjectId(id)) throw Object.assign(new Error('Media version was not found.'), { status: 404, code: 'NOT_FOUND' });
    await connectDb(); const version = await MediaVersion.findById(id); if (!version) throw Object.assign(new Error('Media version was not found.'), { status: 404, code: 'NOT_FOUND' });
    version.active = false; version.deletionStatus = 'pending_deletion'; version.updatedBy = session.user.id; await version.save();
    await MediaAsset.updateOne({ objectKey: version.r2ObjectKey, bucket: version.storageBucket }, { $set: { status: 'pending_deletion' } });
    await AuditLog.create({ actor: session.user.id, action: 'media_version.pending_deletion', entity: 'MediaVersion', entityId: id, metadata: { objectKey: version.r2ObjectKey } });
    return Response.json({ ok: true, status: 'pending_deletion' });
  } catch (error) { return apiError(error); }
}
