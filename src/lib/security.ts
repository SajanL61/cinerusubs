import 'server-only';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import argon2 from 'argon2';
import { env } from './env';

export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url');

export function hashToken(value: string) {
  return createHmac('sha256', env.SESSION_SECRET).update(value).digest('hex');
}

export function hashPrivateValue(value: string) {
  return createHash('sha256').update(`${env.DOWNLOAD_SIGNING_SECRET}:${value}`).digest('hex');
}

export async function hashPassword(password: string) {
  return argon2.hash(password, { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 });
}

export async function verifyPassword(hash: string, password: string) {
  try { return await argon2.verify(hash, password); } catch { return false; }
}

export function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
