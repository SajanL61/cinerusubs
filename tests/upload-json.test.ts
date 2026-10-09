import { describe, expect, it } from 'vitest';
import { INVALID_UPLOAD_RESPONSE, readUploadJson } from '../src/lib/client/upload-json';

describe('upload JSON response handling', () => {
  it('parses JSON responses', async () => {
    const response = Response.json({ assetId: 'asset-1' });
    await expect(readUploadJson<{ assetId: string }>(response)).resolves.toEqual({ assetId: 'asset-1' });
  });

  it('rejects HTML and malformed JSON without exposing response contents', async () => {
    const html = new Response('<!DOCTYPE html><title>Not found</title>', { headers: { 'Content-Type': 'text/html' } });
    await expect(readUploadJson(html)).rejects.toThrow(INVALID_UPLOAD_RESPONSE);
    const malformed = new Response('{', { headers: { 'Content-Type': 'application/json' } });
    await expect(readUploadJson(malformed)).rejects.toThrow(INVALID_UPLOAD_RESPONSE);
  });
});
