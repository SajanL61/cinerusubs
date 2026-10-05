import { describe, expect, it } from 'vitest';
import { assertMediaDistributionAllowed, mayDistributeFullMedia } from '../src/lib/rights';

describe('media rights enforcement', () => {
  it('allows only verified full-media rights states', () => {
    expect(mayDistributeFullMedia('owned')).toBe(true);
    expect(mayDistributeFullMedia('licensed')).toBe(true);
    expect(mayDistributeFullMedia('public_domain')).toBe(true);
    expect(mayDistributeFullMedia('subtitle_only')).toBe(false);
    expect(mayDistributeFullMedia('unavailable')).toBe(false);
  });

  it('rejects inactive and restricted downloads at the service boundary', () => {
    expect(() => assertMediaDistributionAllowed('owned', false)).toThrow('metadata, trailers and subtitles only');
    expect(() => assertMediaDistributionAllowed('subtitle_only', true)).toThrow('metadata, trailers and subtitles only');
    expect(() => assertMediaDistributionAllowed('unavailable', true)).toThrow('metadata, trailers and subtitles only');
    expect(() => assertMediaDistributionAllowed('public_domain', true)).not.toThrow();
  });
});
