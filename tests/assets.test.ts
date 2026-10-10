import { describe, expect, it } from 'vitest';
import { absoluteSiteUrl, normalizePublicAssetObjectKey, publicAssetObjectKeyFromUrl, resolvePublicAssetUrl } from '@/lib/assets';

const assetOrigin = 'https://pub-example.r2.dev';

describe('public asset URLs', () => {
  it('preserves local paths and validated HTTP URLs', () => {
    expect(resolvePublicAssetUrl('/media/fallback-poster.svg', undefined, assetOrigin)).toBe('/media/fallback-poster.svg');
    expect(resolvePublicAssetUrl('https://image.tmdb.org/t/p/w780/poster.jpg', undefined, assetOrigin)).toBe('https://image.tmdb.org/t/p/w780/poster.jpg');
  });

  it('turns object keys into encoded public URLs without encoding separators', () => {
    expect(resolvePublicAssetUrl('posters/movies/Youth poster.png', undefined, assetOrigin)).toBe('https://pub-example.r2.dev/posters/movies/Youth%20poster.png');
    expect(resolvePublicAssetUrl('posters/movies/Youth%20poster.png', undefined, assetOrigin)).toBe('https://pub-example.r2.dev/posters/movies/Youth%20poster.png');
  });

  it('rejects unsafe keys, paths, and schemes', () => {
    for (const value of ['../secret.png', 'posters/../secret.png', 'posters\\secret.png', 'javascript:alert(1)', 'file:///secret.png', '//evil.example/poster.png']) {
      expect(resolvePublicAssetUrl(value, '/media/fallback-poster.svg', assetOrigin)).toBe('/media/fallback-poster.svg');
    }
    expect(normalizePublicAssetObjectKey('posters/%2e%2e/secret.png')).toBeUndefined();
  });

  it('creates absolute metadata URLs without doubling an existing origin', () => {
    expect(absoluteSiteUrl('https://pub-example.r2.dev/poster.png', 'https://cineseya.lk')).toBe('https://pub-example.r2.dev/poster.png');
    expect(absoluteSiteUrl('/media/fallback-poster.svg', 'https://cineseya.lk')).toBe('https://cineseya.lk/media/fallback-poster.svg');
  });

  it('extracts only keys from the configured public origin', () => {
    expect(publicAssetObjectKeyFromUrl('https://pub-example.r2.dev/posters/Youth%20poster.png', assetOrigin)).toBe('posters/Youth poster.png');
    expect(publicAssetObjectKeyFromUrl('https://image.tmdb.org/t/p/w780/poster.jpg', assetOrigin)).toBeUndefined();
  });
});
