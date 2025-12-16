import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { verifyJwt } from '../lib/jwt';

const authenticate: FastifyPluginAsync = async (fastify) => {
  // add hook: parse token if present and attach to request.org
  fastify.addHook('preHandler', async (request, reply) => {
    const header = request.headers.authorization;
    if (!header) return;

    const token = header.replace(/^Bearer\s+/i, '');
    try {
      const payload = verifyJwt(token);
      request.org = { orgId: (payload as any).orgId, email: (payload as any).email };
    } catch (err) {
      // if token invalid, do not throw here; let route decide or throw 401 if route requires auth
      request.org = undefined;
    }
  });
};

export default fp(authenticate);