import mongoose from 'mongoose';
import { z } from 'zod';
import { connectDb } from '@/lib/db';
import { hashPassword } from '@/lib/security';
import { AuditLog, ensureCineruIndexes, User } from '@/models';

const input = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(16).max(256).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/),
}).parse({ name: process.env.SUPER_ADMIN_NAME, email: process.env.SUPER_ADMIN_EMAIL, password: process.env.SUPER_ADMIN_PASSWORD });

try {
  await connectDb();
  await ensureCineruIndexes();
  const existing = await User.findOne({ email: input.email }).select('+passwordHash');
  const passwordHash = await hashPassword(input.password);
  const user = existing
    ? await User.findByIdAndUpdate(existing._id, { name: input.name, displayName: input.name, passwordHash, role: 'super_admin', active: true, passwordChangedAt: new Date() }, { new: true })
    : await User.create({ name: input.name, displayName: input.name, email: input.email, passwordHash, role: 'super_admin', active: true, passwordChangedAt: new Date() });
  if (!user) throw new Error('Super administrator could not be created.');
  await AuditLog.create({ actor: user._id, action: existing ? 'user.super_admin_reset' : 'user.super_admin_create', entity: 'User', entityId: String(user._id), metadata: { provisionedBy: 'create-super-admin script' } });
  process.stdout.write(`Super administrator ready: ${user.email}\nClear SUPER_ADMIN_PASSWORD from the environment now.\n`);
} finally { await mongoose.disconnect(); }
