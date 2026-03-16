const fallbackApiUrl = 'http://localhost:4000';

function resolveApiBaseUrl() {
  return process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? fallbackApiUrl;
}

export async function upstreamJson(
  request: Request,
  path: string,
  options: {
    method: 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
  }
) {
  const baseUrl = resolveApiBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method,
    headers: {
      'content-type': 'application/json',
      cookie: request.headers.get('cookie') ?? ''
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store'
  });

  return response;
}
