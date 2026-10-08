import { describe, expect, it } from 'vitest';
import { assertSafeMirrorUrl } from '../src/lib/validation/media';
import { buildStorageObjectKey, sanitizeStorageFileName } from '../src/lib/storage-key';

describe('download and storage security', () => {
  it('removes traversal and control characters from object filenames', () => {
    expect(sanitizeStorageFileName('../dangerous\u0000movie.mp4')).toBe('dangerousmovie.mp4');
    const key = buildStorageObjectKey({ kind: 'media', fileName: '../../movie file.mkv', linkedModel: 'Movie', linkedId: '66a000000000000000000001' });
    expect(key).toMatch(/^media\/movies\/66a000000000000000000001\/[a-f0-9-]+\/movie-file\.mkv$/);
    expect(key).not.toContain('..');
  });

  it('accepts public HTTPS mirrors and rejects local/private targets', () => {
    expect(assertSafeMirrorUrl('https://downloads.example.com/file')).toBeInstanceOf(URL);
    expect(() => assertSafeMirrorUrl('http://downloads.example.com/file')).toThrow();
    expect(() => assertSafeMirrorUrl('https://127.0.0.1/file')).toThrow();
    expect(() => assertSafeMirrorUrl('https://192.168.1.8/file')).toThrow();
    expect(() => assertSafeMirrorUrl('https://user:pass@example.com/file')).toThrow();
  });
});
