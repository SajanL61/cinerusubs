import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4001),
  PUBLIC_ORIGIN: z.url().default('http://localhost:4001'),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/clothing_store'),
  SESSION_SECRET: z.string().min(32).default('development-only-secret-change-me-now'),
  TRACKING_PEPPER: z.string().min(32).default('development-only-tracking-change-me'),
  STORE_NAME: z.string().default('Development Clothing Store'),
  WHATSAPP_NUMBER: z.string().default(''),
  RESERVATION_MINUTES: z.coerce.number().int().min(5).max(10080).default(60)
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) throw new Error(`Invalid environment: ${parsed.error.message}`);
export const config = parsed.data;
export const isProduction = config.NODE_ENV === 'production';

export function assertProductionConfig() {
  if (!isProduction) return;
  const blockers: string[] = [];
  if (config.STORE_NAME.startsWith('Development')) blockers.push('STORE_NAME');
  if (!/^\d{10,15}$/.test(config.WHATSAPP_NUMBER)) blockers.push('WHATSAPP_NUMBER');
  if (config.SESSION_SECRET.includes('development')) blockers.push('SESSION_SECRET');
  if (config.TRACKING_PEPPER.includes('development')) blockers.push('TRACKING_PEPPER');
  if (blockers.length) throw new Error(`Public launch blocked: configure ${blockers.join(', ')}`);
}
