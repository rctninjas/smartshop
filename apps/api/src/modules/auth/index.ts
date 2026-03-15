import type { FastifyInstance } from 'fastify';

export async function registerAuthModule(app: FastifyInstance) {
  app.get('/auth/status', async () => {
    return { authenticated: false };
  });
}
