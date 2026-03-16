import type { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/db.js';

export async function registerHealthModule(app: FastifyInstance) {
  app.get('/health', async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        database: 'up'
      };
    } catch {
      return reply.code(503).send({
        status: 'degraded',
        database: 'down'
      });
    }
  });
}
