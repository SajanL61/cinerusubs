import { assertMutationRequest, currentSession } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { apiError } from '@/lib/http';
import { enforceRateLimit } from '@/lib/rate-limit';
import { hashPassword, verifyPassword } from '@/lib/security';
import { passwordChangeSchema } from '@/lib/validation/password';
import { AuditLog, Session, User } from '@/models';

export async function POST(request: Request) {
  try {
    const session = await currentSession();
    if (!session) throw Object.assign(new Error('Authentication is required.'), { status: 401, code: 'AUTH_REQUIRED' });
    await assertMutationRequest(request, session);
    await enforceRateLimit(request, 'auth-password-change', 5, 15 * 60_000);
    const input = passwordChangeSchema.parse(await request.json());

    await connectDb();
    const user = await User.findOne({ _id: session.user.id, active: true }).select('+passwordHash');
    if (!user) throw Object.assign(new Error('Authentication is required.'), { status: 401, code: 'AUTH_REQUIRED' });
    if (!await verifyPassword(String(user.passwordHash), input.currentPassword)) {
      throw Object.assign(new Error('The current password is incorrect.'), { status: 400, code: 'CURRENT_PASSWORD_INCORRECT' });
    }

    await User.updateOne(
      { _id: user._id },
      { $set: { passwordHash: await hashPassword(input.newPassword), passwordChangedAt: new Date() } },
    );
    const revoked = await Session.deleteMany({ user: user._id, _id: { $ne: session.id } });
    await AuditLog.create({
      actor: user._id,
      action: 'auth.password_change',
      entity: 'User',
      entityId: String(user._id),
      metadata: { revokedSessions: revoked.deletedCount },
    });

    return Response.json(
      { ok: true, message: 'Password changed. Other signed-in sessions were closed.' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return apiError(error);
  }
}
