export const INVALID_UPLOAD_RESPONSE = 'Upload service returned an invalid response. Check the server upload API.';

export function assertUploadJsonResponse(response: Response) {
  const contentType = response.headers.get('content-type')?.toLocaleLowerCase() || '';
  if (!contentType.includes('/json') && !contentType.includes('+json')) throw new Error(INVALID_UPLOAD_RESPONSE);
  return response;
}

export const uploadApiFetch: typeof globalThis.fetch = async (...input) => {
  const response = await globalThis.fetch(...input);
  const request = input[0];
  const rawUrl = typeof request === 'string' ? request : request instanceof URL ? request.href : request.url;
  const target = new URL(rawUrl, window.location.href);
  if (target.origin === window.location.origin && target.pathname.startsWith('/api/')) {
    assertUploadJsonResponse(response);

    try {
      await response.clone().json();
    } catch {
      throw new Error(INVALID_UPLOAD_RESPONSE);
    }
  }

  return response;
};

export async function readUploadJson<T>(response: Response): Promise<T> {
  assertUploadJsonResponse(response);
  try {
    return await response.json() as T;
  } catch {
    throw new Error(INVALID_UPLOAD_RESPONSE);
  }
}
