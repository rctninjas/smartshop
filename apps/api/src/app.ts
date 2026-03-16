import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import {
  registerAuthModule,
  registerCatalogModule,
  registerCategoriesModule,
  registerCustomersModule,
  registerHealthModule,
  registerOrdersModule
} from './modules/index.js';
import { getSessionFromRequest, sendAuthError } from './lib/auth.js';

export function createApp() {
  const app = Fastify({
    logger: true
  });

  app.register(fastifyCookie, {
    secret: process.env.ADMIN_SESSION_SECRET ?? 'change-me'
  });

  app.addHook('preHandler', async (request, reply) => {
    const writeMethods = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
    if (!writeMethods.has(request.method)) {
      return;
    }

    if (!request.url.startsWith('/api/')) {
      return;
    }

    const authPublicPaths = ['/api/admin/auth/login', '/api/admin/auth/logout'];
    if (authPublicPaths.some((path) => request.url.startsWith(path))) {
      return;
    }

    const session = getSessionFromRequest(request);
    if (!session) {
      return sendAuthError(reply, request.id);
    }
  });

  app.register(registerHealthModule);
  app.register(registerCatalogModule, { prefix: '/api' });
  app.register(registerCategoriesModule, { prefix: '/api' });
  app.register(registerCustomersModule, { prefix: '/api' });
  app.register(registerAuthModule, { prefix: '/api' });
  app.register(registerOrdersModule, { prefix: '/api' });

  return app;
}
