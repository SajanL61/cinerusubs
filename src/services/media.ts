import 'server-only';
import { isValidObjectId } from 'mongoose';
import { connectDb } from '@/lib/db';
import { assertMediaDistributionAllowed } from '@/lib/rights';
import { signedStreamUrl } from '@/lib/r2';
import { Episode, MediaAsset, MediaVersion, Movie, Series } from '@/models';
import type { RightsStatus } from '@/types/content';

export async function getPlayableMedia(mediaId: string) {
  if (!isValidObjectId(mediaId)) return null;
  await connectDb();
  const version = await MediaVersion.findOne({ _id: mediaId, active: true, deletionStatus: { $ne: 'deleted' } }).lean();
  if (!version) return null;
  const content = version.contentType === 'movie'
    ? await Movie.findOne({ _id: version.contentId, publicationStatus: 'published' }).lean()
    : await Episode.findOne({ _id: version.contentId, publicationStatus: 'published' }).lean();
  if (!content) return null;
  assertMediaDistributionAllowed(content.rightsStatus as RightsStatus, true);
  assertMediaDistributionAllowed(version.rightsStatus as RightsStatus, Boolean(version.active));
  const asset = await MediaAsset.findOne({ objectKey: version.r2ObjectKey, bucket: version.storageBucket, status: 'active' }).lean();
  if (!asset) return null;
  let seriesSlug: string | undefined;
  if (version.contentType === 'episode' && content.series) seriesSlug = String((await Series.findById(content.series).select('slug').lean())?.slug || '');
  const streamKey = String(version.streamingManifestKey || version.r2ObjectKey);
  const adaptive = Boolean(version.streamingManifestKey);
  return {
    id: String(version._id), contentId: String(content._id), contentType: version.contentType as 'movie' | 'episode', title: String(content.title),
    slug: String(content.slug), seriesSlug, posterUrl: String(content.posterUrl || content.thumbnailUrl || '/media/fallback-backdrop.svg'),
    quality: String(version.resolution || version.quality || 'HD'), releaseType: String(version.releaseType || 'Authorized release'),
    streamUrl: await signedStreamUrl(streamKey, adaptive ? 'application/vnd.apple.mpegurl' : String(asset.mimeType || 'video/mp4'), 600, 'media'),
    mimeType: adaptive ? 'application/vnd.apple.mpegurl' : String(asset.mimeType || 'video/mp4'),
  };
}
