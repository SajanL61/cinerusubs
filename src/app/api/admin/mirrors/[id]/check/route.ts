import { isValidObjectId } from 'mongoose';
import { assertMutationRequest, requirePermission } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { apiError } from '@/lib/http';
import { assertSafeMirrorUrl } from '@/lib/validation/media';
import { AuditLog, DownloadMirror } from '@/models';

export async function POST(request: Request, { params }: RouteContext<'/api/admin/mirrors/[id]/check'>) {
  try {
    const session = await requirePermission('media.update'); await assertMutationRequest(request, session);
    const { id } = await params; if (!isValidObjectId(id)) throw Object.assign(new Error('Mirror was not found.'), { status: 404, code: 'NOT_FOUND' });
    await connectDb(); const mirror = await DownloadMirror.findById(id).select('+url');
    if (!mirror) throw Object.assign(new Error('Mirror was not found.'), { status: 404, code: 'NOT_FOUND' });
    const url = assertSafeMirrorUrl(String(mirror.url)); let online = false;
    try { const response = await fetch(url, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(8_000), cache: 'no-store' }); online = response.status >= 200 && response.status < 500; } catch { online = false; }
    const checkedAt = new Date(); mirror.healthStatus = online ? 'online' : 'unavailable'; mirror.lastCheckedAt = checkedAt; mirror.updatedBy = session.user.id; await mirror.save();
    await AuditLog.create({ actor: session.user.id, action: 'mirror.check', entity: 'DownloadMirror', entityId: id, metadata: { healthStatus: mirror.healthStatus } });
    return Response.json({ healthStatus: mirror.healthStatus, lastCheckedAt: checkedAt.toISOString() });
  } catch (error) { return apiError(error); }
}
