import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:4001'),
  NEXT_PUBLIC_SITE_NAME: z.string().default('CineruSubs'),
  MONGODB_URI: z.string().optional(),
  MONGODB_DB: z.literal('cinerusubs').default('cinerusubs'),
  SESSION_SECRET: z.string().min(32).default('development-only-session-secret-change-now'),
  DOWNLOAD_SIGNING_SECRET: z.string().min(32).default('development-only-download-secret-change'),
  CINERUSUBS_DEMO_MODE: z.enum(['true', 'false']).default('false'),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_ENDPOINT: z.url().optional(),
  R2_MEDIA_BUCKET: z.string().default('cinerusubs-media'),
  R2_ASSETS_BUCKET: z.string().default('cinerusubs-assets'),
  PUBLIC_ASSET_DOMAIN: z.url().default('https://assets.cinerusubs.com'),
  DOWNLOAD_DOMAIN: z.url().default('https://dl.cinerusubs.com'),
  DOWNLOAD_WORKER_ENABLED: z.enum(['true', 'false']).default('false'),
  TMDB_API_TOKEN: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) throw new Error(`Invalid environment configuration: ${parsed.error.message}`);

export const env = parsed.data;
export const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
export const useDemoData = env.CINERUSUBS_DEMO_MODE === 'true' || !env.MONGODB_URI;

export function assertProductionEnvironment() {
  if (env.NODE_ENV !== 'production') return;
  const missing: string[] = [];
  if (!env.MONGODB_URI) missing.push('MONGODB_URI');
  if (!env.R2_ACCOUNT_ID) missing.push('R2_ACCOUNT_ID');
  if (!env.R2_ACCESS_KEY_ID) missing.push('R2_ACCESS_KEY_ID');
  if (!env.R2_SECRET_ACCESS_KEY) missing.push('R2_SECRET_ACCESS_KEY');
  if (!env.R2_MEDIA_BUCKET) missing.push('R2_MEDIA_BUCKET');
  if (!env.R2_ASSETS_BUCKET) missing.push('R2_ASSETS_BUCKET');
  if (env.R2_MEDIA_BUCKET === env.R2_ASSETS_BUCKET) missing.push('separate R2_MEDIA_BUCKET and R2_ASSETS_BUCKET values');
  if (env.SESSION_SECRET.startsWith('development-')) missing.push('SESSION_SECRET');
  if (env.DOWNLOAD_SIGNING_SECRET.startsWith('development-')) missing.push('DOWNLOAD_SIGNING_SECRET');
  if (!env.NEXT_PUBLIC_SITE_URL.startsWith('https://')) missing.push('NEXT_PUBLIC_SITE_URL (HTTPS)');
  if (missing.length) throw new Error(`Production launch blocked: configure ${missing.join(', ')}`);
}
