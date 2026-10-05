import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import argon2 from 'argon2';
import { Session, User } from './models.js';
import { config, isProduction } from './config.js';

const hash = (value: string) => createHash('sha256').update(`${config.SESSION_SECRET}:${value}`).digest('hex');
export const hashPassword = (password: string) => argon2.hash(password, { type: argon2.argon2id });
export const verifyPassword = (digest: string, password: string) => argon2.verify(digest, password);

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url');
  const csrfToken = randomBytes(24).toString('base64url');
  await Session.create({ tokenHash: hash(token), user: userId, csrfToken: hash(csrfToken), expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), lastSeenAt: new Date() });
  return { token, csrfToken };
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie('admin_session', token, { httpOnly: true, secure: isProduction, sameSite: 'strict', path: '/', maxAge: 8 * 60 * 60 * 1000 });
}

declare global { namespace Express { interface Request { admin?: { id: string; role: string; permissions: string[] }; sessionId?: string } } }

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.admin_session;
  if (!token) return res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Sign in required' } });
  const session = await Session.findOne({ tokenHash: hash(token), expiresAt: { $gt: new Date() } }).select('+csrfToken');
  if (!session) return res.status(401).json({ error: { code: 'SESSION_EXPIRED', message: 'Session expired' } });
  const user = await User.findById(session.user);
  if (!user?.active) return res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Account unavailable' } });
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const presented = String(req.get('x-csrf-token') || '');
    const actual = hash(presented);
    if (!presented || !timingSafeEqual(Buffer.from(actual), Buffer.from(String(session.csrfToken)))) return res.status(403).json({ error: { code: 'CSRF', message: 'Invalid security token' } });
  }
  req.admin = { id: String(user._id), role: user.role, permissions: user.permissions };
  req.sessionId = String(session._id);
  next();
}

export function permit(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.admin?.role === 'owner' || permissions.some(p => req.admin?.permissions.includes(p))) return next();
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not have permission for this action' } });
  };
}
