import { z } from 'zod';
import { MEDIA_CONTAINERS, MEDIA_QUALITIES, MEDIA_RELEASE_TYPES, MIRROR_PROVIDER_TYPES, VIDEO_CODECS } from '@/types/media';
import { RIGHTS_STATUSES } from '@/types/content';

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const mediaVersionInputSchema = z.object({
  assetId: z.string().trim().min(1),
  contentId: z.string().trim().min(1),
  contentType: z.enum(['movie', 'episode']),
  quality: z.enum(MEDIA_QUALITIES),
  resolution: z.string().trim().min(2).max(40),
  releaseType: z.enum(MEDIA_RELEASE_TYPES),
  videoCodec: z.enum(VIDEO_CODECS),
  audioCodec: optionalText(40),
  container: z.enum(MEDIA_CONTAINERS),
  audioLanguages: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  embeddedSubtitleLanguages: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  streamingManifestKey: optionalText(1_000),
  rightsStatus: z.enum(RIGHTS_STATUSES),
  regionRestrictions: z.array(z.string().trim().min(2).max(8)).max(250).default([]),
  active: z.boolean().default(false),
});

export const downloadMirrorInputSchema = z.object({
  providerName: z.string().trim().min(2).max(80),
  providerType: z.enum(MIRROR_PROVIDER_TYPES),
  url: z.url().refine((value) => new URL(value).protocol === 'https:', 'Mirror URLs must use HTTPS.'),
  priority: z.coerce.number().int().min(0).max(1_000).default(100),
  supportsResume: z.boolean().default(false),
  requiresLogin: z.boolean().default(false),
  active: z.boolean().default(true),
});

export function assertSafeMirrorUrl(value: string) {
  const url = new URL(value);
  const host = url.hostname.toLocaleLowerCase();
  const privateIpv4 = /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;
  if (url.protocol !== 'https:' || url.username || url.password || host === 'localhost' || host.endsWith('.local') || privateIpv4.test(host) || host === '::1') {
    throw Object.assign(new Error('Mirror URLs must be public HTTPS addresses without embedded credentials.'), { status: 400, code: 'UNSAFE_MIRROR_URL' });
  }
  return url;
}
