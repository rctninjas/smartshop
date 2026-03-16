import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ADMIN_SESSION_COOKIE = 'admin_session';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  const isLoginPage = pathname === '/admin/login';
  const isAuthApi = pathname.startsWith('/api/admin-auth/');

  if (!hasSession && !isLoginPage && !isAuthApi) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  if (hasSession && isLoginPage) {
    return NextResponse.redirect(new URL('/admin/catalog', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
