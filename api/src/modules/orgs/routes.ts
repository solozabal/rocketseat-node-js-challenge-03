import { FastifyInstance } from 'fastify';
import { registerOrgSchema, loginSchema } from './schemas';
import { createOrg, authenticateOrg } from './service';
import { signJwt } from '../../lib/jwt';

export async function orgRoutes(fastify: FastifyInstance) {
  // POST /orgs - register
  fastify.post('/orgs', async (request, reply) => {
    const parse = registerOrgSchema.safeParse(request.body);
    if (!parse.success) return reply.code(400).send({ error: parse.error.format() });

    try {
      const org = await createOrg(parse.data as any);
      // cria token usando helper local (expira em 24h conforme configuração)
      const token = signJwt({ orgId: org.id, email: org.email });
      return reply
        .code(201)
        .send({
          org: {
            id: org.id,
            name: org.name,
            email: org.email,
            whatsapp: org.whatsapp,
            address: org.address ? JSON.parse(org.address) : null,
          },
          token,
        });
    } catch (err: any) {
      if (err.message === 'EMAIL_IN_USE') return reply.code(409).send({ message: 'Email already registered' });
      fastify.log.error(err);
      return reply.code(500).send({ message: 'Internal error' });
    }
  });

  // POST /sessions - login
  fastify.post('/sessions', async (request, reply) => {
    const parse = loginSchema.safeParse(request.body);
    if (!parse.success) return reply.code(400).send({ error: parse.error.format() });

    try {
      const { org, token } = await authenticateOrg(parse.data.email, parse.data.password);
      return reply.code(200).send({ token, org: { id: org.id, name: org.name, email: org.email } });
    } catch (err: any) {
      if (err.message === 'INVALID_CREDENTIALS') return reply.code(401).send({ message: 'Invalid credentials' });
      fastify.log.error(err);
      return reply.code(500).send({ message: 'Internal error' });
    }
  });

  // GET /orgs/me - protected
  fastify.get('/orgs/me', async (request, reply) => {
    const payload = request.org;
    if (!payload) return reply.code(401).send({ message: 'Missing token' });

    const org = await fastify.prisma.org.findUnique({
      where: { id: payload.orgId },
      select: { id: true, name: true, email: true, whatsapp: true, address: true },
    });
    if (!org) return reply.code(404).send({ message: 'Org not found' });

    return reply.send({ ...org, address: org.address ? JSON.parse(org.address) : null });
  });
}