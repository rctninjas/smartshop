import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from './db.js';

export const CUSTOMER_SESSION_COOKIE = 'customer_session';

type CustomerSessionPayload = {
  accountId: string;
};

function getSessionSecret(): string {
  return process.env.CUSTOMER_SESSION_SECRET ?? process.env.ADMIN_SESSION_SECRET ?? 'change-me';
}

function getSessionTtlMs(): number {
  const minutes = Number(process.env.CUSTOMER_SESSION_TTL_MINUTES ?? 60 * 24 * 30);
  return Math.max(1, minutes) * 60_000;
}

function getCodeTtlMs(): number {
  const minutes = Number(process.env.CUSTOMER_LOGIN_CODE_TTL_MINUTES ?? 10);
  return Math.max(1, minutes) * 60_000;
}

export function getCustomerSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: getSessionTtlMs() / 1000
  };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, `${getSessionSecret()}-${salt}`, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) {
    return false;
  }
  const calculated = scryptSync(password, `${getSessionSecret()}-${salt}`, 64).toString('hex');
  const hashBuffer = Buffer.from(hash, 'hex');
  const calculatedBuffer = Buffer.from(calculated, 'hex');
  return hashBuffer.length === calculatedBuffer.length && timingSafeEqual(hashBuffer, calculatedBuffer);
}

export async function createCustomerSession(accountId: string): Promise<string> {
  const rawToken = randomBytes(48).toString('hex');
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + getSessionTtlMs());

  await prisma.customerSession.create({
    data: {
      accountId,
      tokenHash,
      expiresAt
    }
  });

  return rawToken;
}

export async function getCustomerSessionFromRequest(
  request: FastifyRequest
): Promise<CustomerSessionPayload | null> {
  const rawToken = request.cookies[CUSTOMER_SESSION_COOKIE];
  if (!rawToken) {
    return null;
  }

  const session = await prisma.customerSession.findUnique({
    where: {
      tokenHash: sha256(rawToken)
    },
    select: {
      accountId: true,
      expiresAt: true
    }
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.customerSession.deleteMany({
      where: { tokenHash: sha256(rawToken) }
    });
    return null;
  }

  return {
    accountId: session.accountId
  };
}

export async function clearCustomerSession(response: FastifyReply, request: FastifyRequest) {
  const rawToken = request.cookies[CUSTOMER_SESSION_COOKIE];
  if (rawToken) {
    await prisma.customerSession.deleteMany({
      where: { tokenHash: sha256(rawToken) }
    });
  }
  response.clearCookie(CUSTOMER_SESSION_COOKIE, { path: '/' });
}

export async function createCustomerLoginCode(accountId: string): Promise<string> {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = sha256(code);
  const expiresAt = new Date(Date.now() + getCodeTtlMs());

  await prisma.customerEmailCode.create({
    data: {
      accountId,
      codeHash,
      expiresAt
    }
  });

  return code;
}

export async function verifyCustomerLoginCode(accountId: string, code: string): Promise<boolean> {
  const now = new Date();
  const record = await prisma.customerEmailCode.findFirst({
    where: {
      accountId,
      usedAt: null,
      expiresAt: { gt: now }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!record) {
    return false;
  }

  const providedHash = sha256(code);
  const recordHashBuffer = Buffer.from(record.codeHash, 'hex');
  const providedHashBuffer = Buffer.from(providedHash, 'hex');

  const isValid =
    recordHashBuffer.length === providedHashBuffer.length &&
    timingSafeEqual(recordHashBuffer, providedHashBuffer);

  if (!isValid) {
    return false;
  }

  await prisma.customerEmailCode.update({
    where: { id: record.id },
    data: { usedAt: now }
  });

  return true;
}
