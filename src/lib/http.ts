export function apiError(error: unknown) {
  const value = error as { status?: number; code?: string; message?: string };
  const status = value.status && value.status >= 400 && value.status < 600 ? value.status : 500;
  const message = status >= 500 ? 'The service could not complete this request.' : value.message ?? 'The request could not be completed.';
  return Response.json({ error: { code: value.code ?? 'INTERNAL_ERROR', message } }, { status, headers: { 'Cache-Control': 'no-store' } });
}
