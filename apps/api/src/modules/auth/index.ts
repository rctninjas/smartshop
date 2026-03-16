import type { FastifyInstance } from 'fastify';
import {
  ADMIN_SESSION_COOKIE,
  createSessionToken,
  getSessionCookieOptions,
  getSessionFromRequest,
  verifyCredentials
} from '../../lib/auth.js';

type LoginBody = {
  login: string;
  password: string;
};

export async function registerAuthModule(app: FastifyInstance) {
  app.post<{ Body: LoginBody }>('/admin/auth/login', async (request, reply) => {
    const { login, password } = request.body;
    if (!verifyCredentials(login, password)) {
      return reply.code(401).send({
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Invalid credentials',
        requestId: request.id
      });
    }

    const token = createSessionToken(login);
    reply.setCookie(ADMIN_SESSION_COOKIE, token, getSessionCookieOptions());
    return reply.code(204).send();
  });

  app.post('/admin/auth/logout', async (_request, reply) => {
    reply.clearCookie(ADMIN_SESSION_COOKIE, { path: '/' });
    return reply.code(204).send();
  });

  app.get('/admin/auth/me', async (request, reply) => {
    const session = getSessionFromRequest(request);
    if (!session) {
      return reply.code(401).send({
        code: 'AUTH_UNAUTHORIZED',
        message: 'Authentication required',
        requestId: request.id
      });
    }

    return {
      login: session.login
    };
  });
}
