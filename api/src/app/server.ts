import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import dotenv from 'dotenv';
import { prisma } from '../lib/prisma';

// modules
import { orgRoutes } from '../modules/orgs/routes';
import authenticatePlugin from '../plugins/authenticate';

dotenv.config();

export async function buildServer() {
  const app = Fastify({ logger: true });

  // attach prisma to fastify instance
  app.decorate('prisma', prisma);

  // plugins
  await app.register(fastifyCors, { origin: true });
  await app.register(fastifyHelmet);
  await app.register(authenticatePlugin); // populates request.org when Authorization header present

  // register business routes
  await app.register(orgRoutes, { prefix: '' });

  // health route
  app.get('/health', async () => ({ status: 'ok' }));

  return app;
}

// if executed directly, start listening
if (require.main === module) {
  (async () => {
    const server = await buildServer();
    const address = await server.listen({ port: 3000, host: '::' });
    console.log('Server started at', address);
  })();
}