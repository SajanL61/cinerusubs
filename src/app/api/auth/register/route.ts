import { z } from 'zod';
import { apiError } from '@/lib/http';
import { enforceRateLimit } from '@/lib/rate-limit';
import { createSession } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { useDemoData } from '@/lib/env';
import { hashPassword } from '@/lib/security';
import { AuditLog, User } from '@/models';

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  displayName: z.string().trim().min(2).max(80).optional(),
  email: z.email().max(254).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(12).max(256).regex(/[a-z]/, 'Include a lowercase letter.').regex(/[A-Z]/, 'Include an uppercase letter.').regex(/[0-9]/, 'Include a number.'),
});

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, 'auth-register', 4, 60 * 60_000);
    if (useDemoData) throw Object.assign(new Error('Account registration is available after connecting the isolated CineSeya.lk database.'), { status: 503, code: 'DATABASE_REQUIRED' });
    const input = schema.parse(await request.json());
    await connectDb();
    if (await User.exists({ email: input.email })) throw Object.assign(new Error('An account already exists for that email.'), { status: 409, code: 'EMAIL_EXISTS' });
    const user = await User.create({ ...input, displayName: input.displayName || input.name, passwordHash: await hashPassword(input.password), role: 'user', active: true });
    await createSession(String(user._id), request);
    await AuditLog.create({ actor: user._id, action: 'auth.register', entity: 'User', entityId: String(user._id) });
    return Response.json({ user: { id: String(user._id), name: user.displayName, role: user.role } }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return Response.json({ error: { code: 'EMAIL_EXISTS', message: 'An account already exists for that email.' } }, { status: 409 });
    return apiError(error);
  }
}
