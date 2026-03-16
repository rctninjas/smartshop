import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
import {
  registerAuthModule,
  registerCatalogModule,
  registerCategoriesModule,
  registerCustomersModule,
  registerHealthModule,
  registerOrdersModule,
  registerStorefrontAuthModule
} from './modules/index.js';
import { getSessionFromRequest, sendAuthError } from './lib/auth.js';

export function createApp() {
  const app = Fastify({
    logger: true
  });

  const allowedOrigins = [process.env.STORE_FRONTEND_URL, process.env.ADMIN_FRONTEND_URL, 'http://localhost:3000']
    .filter(Boolean)
    .map((value) => String(value));

  app.addHook('onRequest', async (request, reply) => {
    const origin = request.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      reply.header('access-control-allow-origin', origin);
      reply.header('vary', 'Origin');
      reply.header('access-control-allow-credentials', 'true');
      reply.header('access-control-allow-methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
      reply.header('access-control-allow-headers', 'content-type');
    }

    if (request.method === 'OPTIONS') {
      return reply.code(204).send();
    }
  });

  app.register(fastifyCookie, {
    secret: process.env.ADMIN_SESSION_SECRET ?? 'change-me'
  });
  app.register(fastifyMultipart, {
    limits: {
      files: 10,
      fileSize: 10 * 1024 * 1024
    }
  });

  app.addHook('preHandler', async (request, reply) => {
    const writeMethods = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
    if (!writeMethods.has(request.method)) {
      return;
    }

    if (!request.url.startsWith('/api/')) {
      return;
    }

    const adminPublicPaths = ['/api/admin/auth/login', '/api/admin/auth/logout'];
    const storefrontPublicWritePaths = [
      '/api/storefront/auth/register',
      '/api/storefront/auth/login/password',
      '/api/storefront/auth/login/code/request',
      '/api/storefront/auth/login/code/verify',
      '/api/storefront/auth/logout',
      '/api/storefront/checkout'
    ];

    if (
      adminPublicPaths.some((path) => request.url.startsWith(path)) ||
      storefrontPublicWritePaths.some((path) => request.url.startsWith(path))
    ) {
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
  app.register(registerStorefrontAuthModule, { prefix: '/api' });
  app.register(registerOrdersModule, { prefix: '/api' });

  return app;
}
