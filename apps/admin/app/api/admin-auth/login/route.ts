import { NextResponse } from 'next/server';

type LoginRequestBody = {
  login: string;
  password: string;
};

const fallbackApiUrl = 'http://localhost:4000';

export async function POST(request: Request) {
  const body = (await request.json()) as LoginRequestBody;
  const baseUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? fallbackApiUrl;

  const upstream = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(body),
    cache: 'no-store'
  });

  if (upstream.status === 204) {
    const response = new NextResponse(null, { status: 204 });
    const setCookieFn = (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
    const setCookies = setCookieFn?.call(upstream.headers) ?? [];

    for (const cookie of setCookies) {
      response.headers.append('set-cookie', cookie);
    }

    if (!setCookies.length) {
      const fallbackSetCookie = upstream.headers.get('set-cookie');
      if (fallbackSetCookie) {
        response.headers.set('set-cookie', fallbackSetCookie);
      }
    }

    return response;
  }

  const errorBody = await upstream.text();
  return new NextResponse(errorBody, {
    status: upstream.status,
    headers: {
      'content-type': 'application/json'
    }
  });
}
