import { createHmac, timingSafeEqual } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';

export const ADMIN_SESSION_COOKIE = 'admin_session';

type SessionPayload = {
  login: string;
  exp: number;
};

function getAdminLogin(): string {
  return process.env.ADMIN_LOGIN ?? 'admin';
}

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? 'change-me';
}

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? 'change-me';
}

function getSessionTtlMs(): number {
  const minutes = Number(process.env.ADMIN_SESSION_TTL_MINUTES ?? 480);
  return Math.max(1, minutes) * 60_000;
}

function sign(value: string): string {
  return createHmac('sha256', getSessionSecret()).update(value).digest('hex');
}

export function verifyCredentials(login: string, password: string): boolean {
  const loginBuffer = Buffer.from(login);
  const expectedLoginBuffer = Buffer.from(getAdminLogin());
  const passwordBuffer = Buffer.from(password);
  const expectedPasswordBuffer = Buffer.from(getAdminPassword());

  const loginMatches =
    loginBuffer.length === expectedLoginBuffer.length &&
    timingSafeEqual(loginBuffer, expectedLoginBuffer);

  const passwordMatches =
    passwordBuffer.length === expectedPasswordBuffer.length &&
    timingSafeEqual(passwordBuffer, expectedPasswordBuffer);

  return loginMatches && passwordMatches;
}

export function createSessionToken(login: string): string {
  const exp = Date.now() + getSessionTtlMs();
  const base = `${login}.${exp}`;
  const signature = sign(base);
  return `${base}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [login, expRaw, signature] = token.split('.');
  if (!login || !expRaw || !signature) {
    return null;
  }

  const base = `${login}.${expRaw}`;
  const expectedSignature = sign(base);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || Date.now() > exp) {
    return null;
  }

  return { login, exp };
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: getSessionTtlMs() / 1000
  };
}

export function getSessionFromRequest(request: FastifyRequest): SessionPayload | null {
  const token = request.cookies[ADMIN_SESSION_COOKIE];
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}

export function sendAuthError(reply: FastifyReply, requestId: string) {
  return reply.code(401).send({
    code: 'AUTH_UNAUTHORIZED',
    message: 'Authentication required',
    requestId
  });
}
