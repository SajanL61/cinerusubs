import type { RightsStatus } from '@/types/content';

const FULL_MEDIA_RIGHTS = new Set<RightsStatus>(['owned', 'licensed', 'public_domain']);

export function mayDistributeFullMedia(rightsStatus: RightsStatus, active = true) {
  return active && FULL_MEDIA_RIGHTS.has(rightsStatus);
}

export function assertMediaDistributionAllowed(rightsStatus: RightsStatus, active = true) {
  if (!mayDistributeFullMedia(rightsStatus, active)) {
    const error = new Error('This title is available for metadata, trailers and subtitles only.');
    Object.assign(error, { status: 403, code: 'RIGHTS_RESTRICTED' });
    throw error;
  }
}

export function rightsLabel(status: RightsStatus) {
  return ({
    subtitle_only: 'Subtitle release',
    owned: 'CineSeya.lk owned',
    licensed: 'Licensed media',
    public_domain: 'Public domain',
    unavailable: 'Currently unavailable',
  } as const)[status];
}
