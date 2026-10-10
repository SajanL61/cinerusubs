import { publicAssetOrigin, siteUrl } from './env';

const controlCharacters = /[\u0000-\u001f\u007f]/;
const scheme = /^[a-z][a-z0-9+.-]*:/i;

function safePathSegments(value: string) {
  if (!value || value.includes('\\') || controlCharacters.test(value)) return undefined;
  const segments = value.split('/');
  if (segments.some((segment) => !segment)) return undefined;
  const decoded: string[] = [];
  for (const segment of segments) {
    let part: string;
    try { part = decodeURIComponent(segment); }
    catch { return undefined; }
    if (!part || part === '.' || part === '..' || part.includes('/') || part.includes('\\') || controlCharacters.test(part)) return undefined;
    decoded.push(part);
  }
  return decoded;
}

function safeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return undefined;
    return value;
  } catch { return undefined; }
}

function safeLocalPath(value: string) {
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\') || controlCharacters.test(value)) return undefined;
  const path = value.split(/[?#]/, 1)[0]!.slice(1);
  if (!path) return '/';
  return safePathSegments(path) ? value : undefined;
}

export function normalizePublicAssetObjectKey(value: unknown) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw || raw.startsWith('/') || scheme.test(raw)) return undefined;
  return safePathSegments(raw)?.join('/');
}

export function resolvePublicAssetUrl(value: unknown, fallback?: string, origin = publicAssetOrigin) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return fallback;
  if (/^https?:\/\//i.test(raw)) return safeHttpUrl(raw) ?? fallback;
  if (scheme.test(raw)) return fallback;
  if (raw.startsWith('/')) return safeLocalPath(raw) ?? fallback;
  const key = normalizePublicAssetObjectKey(raw);
  if (!key || !origin) return fallback;
  return `${origin}/${key.split('/').map((segment) => encodeURIComponent(segment)).join('/')}`;
}

export function absoluteSiteUrl(value: unknown, origin = siteUrl) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return undefined;
  const external = safeHttpUrl(raw);
  if (external) return external;
  const local = safeLocalPath(raw);
  if (local) return new URL(local, `${origin}/`).toString();
  const publicUrl = resolvePublicAssetUrl(raw);
  return publicUrl && /^https?:\/\//i.test(publicUrl) ? publicUrl : undefined;
}

export function publicAssetObjectKeyFromUrl(value: unknown, origin = publicAssetOrigin) {
  if (!origin || typeof value !== 'string') return undefined;
  try {
    const url = new URL(value.trim());
    if (url.origin !== origin || url.search || url.hash) return undefined;
    return normalizePublicAssetObjectKey(url.pathname.slice(1));
  } catch { return undefined; }
}
