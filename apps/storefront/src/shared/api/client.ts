import { env } from '../config/env';

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    method: 'GET',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}
