import { env } from '../config/env';

export async function apiGet<T>(path: string): Promise<T> {
  const baseUrl = typeof window === 'undefined' ? env.apiServerUrl : env.apiUrl;
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function apiPost<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
  const baseUrl = typeof window === 'undefined' ? env.apiServerUrl : env.apiUrl;
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(body),
    cache: 'no-store',
    credentials: 'include'
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return {} as TResponse;
  }

  return (await response.json()) as TResponse;
}
