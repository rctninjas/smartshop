import type { FastifyInstance } from 'fastify';

export async function registerHealthModule(app: FastifyInstance) {
  app.get('/health', async () => {
    return { status: 'ok' };
  });
}
