// api/src/plugins/authenticate.ts
import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { verifyJwt } from '../lib/jwt';

const authenticatePlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('org', undefined);

  fastify.decorate('authenticate', async (request: any, reply: any) => {
    try {
      const auth = request.headers.authorization;

      if (!auth) {
        return reply.status(401).send({ message: 'Missing Authorization header' });
      }

      const token = auth.replace(/^Bearer\s+/i, '').trim();

      if (!token) {
        return reply.status(401).send({ message: 'Invalid token format' });
      }

      const payload = await Promise.resolve(verifyJwt(token)) as any;

      if (!payload || typeof payload !== 'object') {
        return reply.status(401).send({ message: 'Invalid token payload' });
      }

      const orgId = payload.orgId ?? payload.id;
      const email = payload.email;

      if (!orgId) {
        return reply.status(401).send({ message: 'Missing orgId in token' });
      }

      request.org = { orgId, email };
      return;

    } catch (error: any) {
      return reply.status(401).send({
        message: `Token error: ${error?.message ?? 'invalid token'}`,
      });
    }
  });
};

export default fp(authenticatePlugin);