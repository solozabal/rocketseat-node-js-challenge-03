// api/src/modules/pets/pets.routes.ts
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  createPetSchema,
  listPetsSchema,
  paramsSchema,
  updatePetSchema,
  adoptPetSchema,
} from './pets.schemas';
import {
  createPet,
  listPets,
  getPetById,
  adoptPet,
  updatePet,
  deletePet,
  getPetsByOrg,
} from './pets.service';

// Schema para validação de parâmetros da rota /orgs/:orgId/pets
const orgPetsParamsSchema = z.object({
  orgId: z.string().uuid('Invalid organization ID format'),
});

// Schema para validação de query da rota /orgs/:orgId/pets
const orgPetsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

function mapError(reply: any, err: any) {
  // Prefer explicit statusCode if provided by error
  if (err?.statusCode && typeof err.statusCode === 'number') {
    return reply.code(err.statusCode).send({ message: err.message });
  }

  // Map common domain error names (from lib/errors)
  if (err?.name === 'NotFoundError') return reply.code(404).send({ message: err.message });
  if (err?.name === 'ForbiddenError') return reply.code(403).send({ message: err.message });
  if (err?.name === 'ValidationError') return reply.code(400).send({ message: err.message });

  // fallback
  reply.log?.error?.(err);
  return reply.code(500).send({ message: 'Internal error' });
}

export async function petsRoutes(fastify: FastifyInstance) {
  // POST /pets - create (authenticated)
  fastify.post(
    '/pets',
    { preHandler: fastify.authenticate },
    async (request: any, reply) => {
      const payloadParse = createPetSchema.safeParse(request.body);
      if (!payloadParse.success) {
        return reply.code(400).send({ error: payloadParse.error.format() });
      }

      const org = request.org;
      if (!org || !org.orgId) {
        return reply.code(401).send({ message: 'Not authenticated' });
      }

      try {
        const pet = await createPet(org.orgId, payloadParse.data as any);
        return reply.code(201).send(pet);
      } catch (err: any) {
        return mapError(reply, err);
      }
    }
  );

  // GET /pets - list (city required)
  fastify.get('/pets', async (request: any, reply) => {
    const parse = listPetsSchema.safeParse(request.query);
    if (!parse.success) {
      return reply.code(400).send({ error: parse.error.format() });
    }

    try {
      const result = await listPets(parse.data as any);
      return reply.send(result);
    } catch (err: any) {
      return mapError(reply, err);
    }
  });

  // GET /pets/:id - details
  fastify.get('/pets/:id', async (request: any, reply) => {
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: params.error.format() });
    }

    try {
      const pet = await getPetById(params.data.id);
      return reply.send(pet);
    } catch (err: any) {
      return mapError(reply, err);
    }
  });

  // PATCH /pets/:id/adopt - body { adopted: boolean } (authenticated, only owner) - RETORNA 204
  fastify.patch(
    '/pets/:id/adopt',
    { preHandler: fastify.authenticate },
    async (request: any, reply) => {
      const params = paramsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({ error: params.error.format() });
      }

      // handle optional body: if no body provided, default adopted = true
      const rawBody = request.body as any;
      let adoptedValue: boolean | undefined;

      if (!rawBody || (typeof rawBody === 'object' && Object.keys(rawBody).length === 0)) {
        adoptedValue = true;
      } else {
        const bodyParse = adoptPetSchema.safeParse(rawBody);
        if (!bodyParse.success) {
          return reply.code(400).send({ error: bodyParse.error.format() });
        }
        adoptedValue = bodyParse.data.adopted;
      }

      const org = request.org;
      if (!org || !org.orgId) {
        return reply.code(401).send({ message: 'Not authenticated' });
      }

      try {
        await adoptPet(org.orgId, params.data.id, adoptedValue as boolean);
        return reply.code(204).send();
      } catch (err: any) {
        return mapError(reply, err);
      }
    }
  );

  // PATCH /pets/:id - update (authenticated, owner)
  fastify.patch(
    '/pets/:id',
    { preHandler: fastify.authenticate },
    async (request: any, reply) => {
      const params = paramsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({ error: params.error.format() });
      }

      const bodyParse = updatePetSchema.safeParse(request.body);
      if (!bodyParse.success) {
        return reply.code(400).send({ error: bodyParse.error.format() });
      }

      const org = request.org;
      if (!org || !org.orgId) {
        return reply.code(401).send({ message: 'Not authenticated' });
      }

      try {
        const updated = await updatePet(org.orgId, params.data.id, bodyParse.data as any);
        return reply.send(updated);
      } catch (err: any) {
        return mapError(reply, err);
      }
    }
  );

  // DELETE /pets/:id
  fastify.delete(
    '/pets/:id',
    { preHandler: fastify.authenticate },
    async (request: any, reply) => {
      const params = paramsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({ error: params.error.format() });
      }

      const org = request.org;
      if (!org || !org.orgId) {
        return reply.code(401).send({ message: 'Not authenticated' });
      }

      try {
        const result = await deletePet(org.orgId, params.data.id);
        return reply.code(200).send(result);
      } catch (err: any) {
        return mapError(reply, err);
      }
    }
  );

  // GET /orgs/:orgId/pets - Com validação completa
  fastify.get('/orgs/:orgId/pets', async (request: any, reply) => {
    const paramsParse = orgPetsParamsSchema.safeParse(request.params);
    if (!paramsParse.success) {
      return reply.code(400).send({ error: paramsParse.error.format() });
    }

    const queryParse = orgPetsQuerySchema.safeParse(request.query);
    if (!queryParse.success) {
      return reply.code(400).send({ error: queryParse.error.format() });
    }

    try {
      const { orgId } = paramsParse.data;
      const { page, limit } = queryParse.data;

      const res = await getPetsByOrg(orgId, page, limit);
      return reply.send(res);
    } catch (err: any) {
      return mapError(reply, err);
    }
  });
}