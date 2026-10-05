export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, { ...options, headers: { 'content-type': 'application/json', ...options.headers } });
  const body = response.status === 204 ? undefined : await response.json();
  if (!response.ok) throw new Error(body?.error?.message || 'Something went wrong. Please try again.');
  return body;
}

export const csrf = () => typeof sessionStorage === 'undefined' ? '' : sessionStorage.getItem('csrf') || '';
export const adminApi = <T,>(path: string, options: RequestInit = {}) => api<T>(`/admin${path}`, { ...options, headers: { 'x-csrf-token': csrf(), ...options.headers } });
