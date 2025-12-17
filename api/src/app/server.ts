// api/src/app/server.ts
import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';

// Database connection (necessary for the app lifecycle)
import { prisma } from '../lib/prisma';

// health routes
import healthRoutes from '../routes/health.routes';

// modules
import { orgRoutes } from '../modules/orgs/routes';
import { petsRoutes } from '../modules/pets/pets.routes';

// authentication plugin
import authenticatePlugin from '../plugins/authenticate';

dotenv.config();

export async function buildServer() {
  const isTest = process.env.NODE_ENV === 'test';

  // In tests: enable debug level but avoid pino transports (pino-pretty) that may not be available.
  const loggerConfig = isTest
    ? { level: 'debug' } // simple logger for test runner
    : {
        level: 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      };

  const app = Fastify({
    logger: loggerConfig,
  });

  // expose prisma on the fastify instance so routes/tests can access `fastify.prisma`
  app.decorate('prisma', prisma);

  // CORS - allow frontend dev servers
  await app.register(fastifyCors, {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });

  // Security headers
  await app.register(fastifyHelmet);

  // Rate limiting (100 requests/minute)
  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // IMPORTANT: register authentication plugin BEFORE registering routes
  // This ensures request decoration (request.org) and preHandler hook are available to routes.
  await app.register(authenticatePlugin);

  // Health endpoints (from separate file)
  await app.register(healthRoutes);

  // Business routes (orgs & pets)
  await app.register(orgRoutes);
  await app.register(petsRoutes);

  // Graceful shutdown - close database connection when server stops
  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  return app;
}

// Start server when run directly (not during tests)
if (require.main === module) {
  (async () => {
    try {
      const server = await buildServer();
      const address = await server.listen({
        port: Number(process.env.PORT || 3000),
        host: '0.0.0.0',
      });
      console.log(`🚀 Server running at ${address}`);
      console.log(`✅ Health check: ${address}/health`);
      console.log(`✅ Readiness check: ${address}/ready`);
      // Handle graceful shutdown signals
      process.on('SIGTERM', async () => {
        console.log('SIGTERM received, shutting down gracefully...');
        await server.close();
        process.exit(0);
      });
      process.on('SIGINT', async () => {
        console.log('SIGINT received, shutting down gracefully...');
        await server.close();
        process.exit(0);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  })();
}