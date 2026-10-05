import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { assertMutationRequest, requirePermission } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { apiError } from '@/lib/http';
import { AuditLog, Session, User } from '@/models';
import { ROLES } from '@/types/auth';

const schema = z.object({ role: z.enum(ROLES).optional(), active: z.boolean().optional() }).refine((value) => value.role !== undefined || value.active !== undefined);

export async function PATCH(request: Request, { params }: RouteContext<'/api/admin/users/[id]'>) {
  try {
    const session = await requirePermission('users.update');
    await assertMutationRequest(request, session);
    const { id } = await params;
    if (!isValidObjectId(id)) throw Object.assign(new Error('User was not found.'), { status: 404, code: 'NOT_FOUND' });
    const input = schema.parse(await request.json());
    if (input.role !== undefined && !session.user.permissions.includes('users.roles')) throw Object.assign(new Error('Role management permission is required.'), { status: 403, code: 'FORBIDDEN' });
    await connectDb();
    const user = await User.findById(id);
    if (!user) throw Object.assign(new Error('User was not found.'), { status: 404, code: 'NOT_FOUND' });
    const roleChanged = input.role !== undefined && input.role !== user.role;
    const deactivating = input.active === false && user.active !== false;
    if (id === session.user.id && (roleChanged || deactivating)) throw Object.assign(new Error('You cannot remove your own active administrative access.'), { status: 409, code: 'SELF_LOCKOUT' });
    if ((user.role === 'super_admin' || input.role === 'super_admin') && session.user.role !== 'super_admin') throw Object.assign(new Error('Only a super administrator can manage super administrator access.'), { status: 403, code: 'FORBIDDEN' });
    user.set({ ...(input.role !== undefined ? { role: input.role } : {}), ...(input.active !== undefined ? { active: input.active } : {}) });
    await user.save();
    if (roleChanged || input.active === false) await Session.deleteMany({ user: user._id });
    await AuditLog.create({ actor: session.user.id, action: 'user.access.update', entity: 'User', entityId: id, metadata: { role: user.role, active: user.active } });
    return Response.json({ id, role: user.role, active: user.active });
  } catch (error) { return apiError(error); }
}
