import { env } from '../config/env';

export async function apiGet<T>(path: string): Promise<T> {
  const baseUrl = typeof window === 'undefined' ? env.apiServerUrl : env.apiUrl;
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'GET',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`GET ${path} failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}
