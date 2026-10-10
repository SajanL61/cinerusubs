import { verifyDownloadToken } from '@/lib/download-token';
import { env } from '@/lib/env';
import { apiError } from '@/lib/http';
import { enforceRateLimit } from '@/lib/rate-limit';
import { r2BucketKindFromName, signedDownloadUrl } from '@/lib/r2';
import { resolveAuthorizedMediaVersion } from '@/services/downloads';
import { DownloadEvent, MediaVersion, Movie } from '@/models';

export async function GET(request: Request, { params }: RouteContext<'/api/download/file/[token]'>) {
  try {
    await enforceRateLimit(request, 'media-download-file', 20, 10 * 60_000);
    const { token } = await params;
    const payload = verifyDownloadToken(token);
    const { version, content, asset } = await resolveAuthorizedMediaVersion(payload.mediaVersionId);
    if (payload.objectKey !== String(asset.objectKey) || payload.bucket !== String(asset.bucket)) throw Object.assign(new Error('The download authorization no longer matches this file.'), { status: 409, code: 'DOWNLOAD_CHANGED' });
    const url = env.DOWNLOAD_WORKER_ENABLED === 'true' && env.DOWNLOAD_DOMAIN
      ? `${env.DOWNLOAD_DOMAIN.replace(/\/$/, '')}/v1/files/${token}`
      : await signedDownloadUrl(String(asset.objectKey), payload.fileName, 90, r2BucketKindFromName(asset.bucket));
    await Promise.all([
      MediaVersion.updateOne({ _id: version._id }, { $inc: { downloadCount: 1 } }),
      version.contentType === 'movie' ? Movie.updateOne({ _id: content._id }, { $inc: { mediaDownloadCount: 1 } }) : Promise.resolve(),
      DownloadEvent.create({ kind: 'media', targetId: version._id, contentId: version.contentId, mediaVersion: version._id, movie: version.contentType === 'movie' ? content._id : undefined, providerType: 'direct', status: 'redirected' }),
    ]);
    return Response.redirect(url, 302);
  } catch (error) { return apiError(error); }
}
