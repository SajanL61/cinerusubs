import { isValidObjectId, type Model } from 'mongoose';
import { z } from 'zod';
import { assertMutationRequest, requirePermission } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { apiError } from '@/lib/http';
import { AuditLog, Comment, ContactMessage, Report, TakedownRequest } from '@/models';

const resources: Record<string, { model: Model<Record<string, unknown>>; statuses: string[]; entity: string }> = {
  comments: { model: Comment, statuses: ['visible', 'hidden', 'deleted'], entity: 'Comment' },
  reports: { model: Report, statuses: ['new', 'reviewing', 'resolved', 'rejected'], entity: 'Report' },
  takedowns: { model: TakedownRequest, statuses: ['new', 'reviewing', 'resolved', 'rejected'], entity: 'TakedownRequest' },
  messages: { model: ContactMessage, statuses: ['new', 'reviewing', 'resolved'], entity: 'ContactMessage' },
};

export async function PATCH(request: Request, { params }: RouteContext<'/api/admin/moderation/[resource]/[id]'>) {
  try {
    const session = await requirePermission('moderation.update');
    await assertMutationRequest(request, session);
    const { resource, id } = await params;
    const definition = resources[resource];
    if (!definition || !isValidObjectId(id)) throw Object.assign(new Error('Moderation record was not found.'), { status: 404, code: 'NOT_FOUND' });
    const { status } = z.object({ status: z.string().trim().min(1).max(30) }).parse(await request.json());
    if (!definition.statuses.includes(status)) throw Object.assign(new Error('That status is not valid for this record.'), { status: 400, code: 'INVALID_STATUS' });
    await connectDb();
    const record = await definition.model.findByIdAndUpdate(id, { $set: { status } }, { new: true, runValidators: true });
    if (!record) throw Object.assign(new Error('Moderation record was not found.'), { status: 404, code: 'NOT_FOUND' });
    await AuditLog.create({ actor: session.user.id, action: `${resource}.status.update`, entity: definition.entity, entityId: id, metadata: { status } });
    return Response.json({ id, status });
  } catch (error) { return apiError(error); }
}
