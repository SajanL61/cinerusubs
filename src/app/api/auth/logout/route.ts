import { assertMutationRequest, currentSession, deleteSession } from '@/lib/auth';
import { apiError } from '@/lib/http';
import { AuditLog } from '@/models';

export async function POST(request: Request) {
  try {
    const session = await currentSession();
    if (session) {
      await assertMutationRequest(request, session);
      await AuditLog.create({ actor: session.user.id, action: 'auth.logout', entity: 'Session', entityId: session.id });
    }
    await deleteSession();
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiError(error); }
}
