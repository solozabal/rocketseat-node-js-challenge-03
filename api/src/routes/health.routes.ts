// api/src/routes/health.routes.ts
import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma'; // Fixed: go up only 1 level

export default async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    return { 
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  });

  app.get('/ready', async (request, reply) => {
    try {
      // Quick database connection check
      await prisma.$queryRaw`SELECT 1`;
      return { 
        status: 'ready',
        timestamp: new Date().toISOString(),
        database: 'connected'
      };
    } catch (err) {
      // Log error properly (Fastify expects object format)
      app.log.error({ err }, 'Database readiness check failed');
      reply.status(503);
      return { 
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected'
      };
    }
  });
}