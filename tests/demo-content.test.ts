import { describe, expect, it } from 'vitest';
import { demoMovies, demoSeries, demoSubtitles } from '../src/data/demo';

describe('curated demo catalog', () => {
  it('contains a complete, honest starter movie catalog', () => {
    expect(demoMovies).toHaveLength(8);
    expect(demoMovies.every((movie) => movie.publicationStatus === 'published')).toBe(true);
    expect(demoMovies.every((movie) => movie.posterUrl.startsWith('/media/'))).toBe(true);
    expect(demoMovies.every((movie) => ['licensed', 'public_domain', 'subtitle_only'].includes(movie.rightsStatus))).toBe(true);
    expect(demoMovies.every((movie) => movie.languages[0] && movie.releaseType && movie.videoQuality)).toBe(true);
  });

  it('keeps series, seasons, and episodes linked', () => {
    expect(demoSeries.length).toBeGreaterThan(0);
    expect(demoSeries.every((series) => series.seasons.length > 0)).toBe(true);
    expect(demoSeries.flatMap((series) => series.seasons).every((season) => season.episodes.length > 0)).toBe(true);
  });

  it('offers only declared subtitle formats', () => {
    expect(demoSubtitles.length).toBeGreaterThan(0);
    expect(demoSubtitles.every((subtitle) => ['srt', 'vtt', 'ass', 'zip'].includes(subtitle.format))).toBe(true);
  });
});
