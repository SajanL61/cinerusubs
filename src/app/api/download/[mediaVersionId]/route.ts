import { createDownloadToken } from '@/lib/download-token';
import { apiError } from '@/lib/http';
import { enforceRateLimit, requestClientKey } from '@/lib/rate-limit';
import { resolveAuthorizedMediaVersion } from '@/services/downloads';
import { DownloadEvent } from '@/models';

function deviceCategory(userAgent: string) {
  if (/ipad|tablet/i.test(userAgent)) return 'tablet';
  if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
  if (userAgent) return 'desktop';
  return 'unknown';
}

export async function GET(request: Request, { params }: RouteContext<'/api/download/[mediaVersionId]'>) {
  try {
    await enforceRateLimit(request, 'media-download-token', 12, 10 * 60_000);
    const { mediaVersionId } = await params;
    const { version, content, asset } = await resolveAuthorizedMediaVersion(mediaVersionId);
    const expiresAt = Math.floor(Date.now() / 1_000) + 90;
    const fileName = String(version.fileName || `cinerusubs-${String(version.quality)}.${String(version.container || 'mp4').toLocaleLowerCase()}`);
    const token = createDownloadToken({ mediaVersionId, objectKey: String(asset.objectKey), bucket: String(asset.bucket), fileName, contentType: String(asset.mimeType || 'application/octet-stream'), exp: expiresAt });
    const downloadUrl = `/api/download/file/${token}`;
    await DownloadEvent.create({ kind: 'media', targetId: version._id, contentId: version.contentId, mediaVersion: version._id, movie: version.contentType === 'movie' ? content._id : undefined, providerType: 'direct', status: 'started', ipHash: requestClientKey(request), countryCode: request.headers.get('cf-ipcountry')?.slice(0, 2), userAgentFamily: request.headers.get('user-agent')?.slice(0, 180), deviceCategory: deviceCategory(request.headers.get('user-agent') || '') });
    return Response.json({ downloadUrl, expiresAt: new Date(expiresAt * 1_000).toISOString(), resumeSupported: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return apiError(error); }
}
