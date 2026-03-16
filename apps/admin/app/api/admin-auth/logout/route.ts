import { NextResponse } from 'next/server';

const fallbackApiUrl = 'http://localhost:4000';

export async function POST(request: Request) {
  const baseUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? fallbackApiUrl;
  const upstream = await fetch(`${baseUrl}/api/admin/auth/logout`, {
    method: 'POST',
    cache: 'no-store'
  });

  const response = NextResponse.redirect(new URL('/admin/login', request.url));
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
