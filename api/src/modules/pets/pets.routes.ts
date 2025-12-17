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

export async function petsRoutes(fastify: FastifyInstance) {
  // POST /pets - create (authenticated)
  fastify.post('/pets', async (request, reply) => {
    const payloadParse = createPetSchema.safeParse(request.body);
    if (!payloadParse.success) return reply.code(400).send({ error: payloadParse.error.format() });

    const org = request.org;
    if (!org) return reply.code(401).send({ message: 'Missing token' });

    try {
      const pet = await createPet(org.orgId, payloadParse.data as any);
      return reply.code(201).send(pet);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(err?.statusCode || 500).send({ message: err?.message || 'Internal error' });
    }
  });

  // GET /pets - list (city required)
  fastify.get('/pets', async (request, reply) => {
    const parse = listPetsSchema.safeParse(request.query);
    if (!parse.success) return reply.code(400).send({ error: parse.error.format() });

    try {
      const result = await listPets(parse.data as any);
      return reply.send(result);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(err?.statusCode || 500).send({ message: err?.message || 'Internal error' });
    }
  });

  // GET /pets/:id - details
  fastify.get('/pets/:id', async (request, reply) => {
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: params.error.format() });

    try {
      const pet = await getPetById(params.data.id);
      return reply.send(pet);
    } catch (err: any) {
      if (err.name === 'AppError') return reply.code(err.statusCode).send({ message: err.message });
      fastify.log.error(err);
      return reply.code(500).send({ message: 'Internal error' });
    }
  });

  // PATCH /pets/:id/adopt - body { adopted: boolean } (authenticated, only owner) - RETORNA 204
  fastify.patch('/pets/:id/adopt', async (request, reply) => {
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: params.error.format() });

    // handle optional body: if no body provided, default adopted = true
    const rawBody = request.body as any;
    let adoptedValue: boolean | undefined;

    if (!rawBody || (typeof rawBody === 'object' && Object.keys(rawBody).length === 0)) {
      adoptedValue = true;
    } else {
      const bodyParse = adoptPetSchema.safeParse(rawBody);
      if (!bodyParse.success) return reply.code(400).send({ error: bodyParse.error.format() });
      adoptedValue = bodyParse.data.adopted;
    }

    const org = request.org;
    if (!org) return reply.code(401).send({ message: 'Missing token' });

    try {
      await adoptPet(org.orgId, params.data.id, adoptedValue as boolean);
      // Return 204 No Content for success (as tests expect)
      return reply.code(204).send();
    } catch (err: any) {
      if (err.name === 'AppError') return reply.code(err.statusCode).send({ message: err.message });
      fastify.log.error(err);
      return reply.code(500).send({ message: 'Internal error' });
    }
  });

  // PATCH /pets/:id - update (authenticated, owner)
  fastify.patch('/pets/:id', async (request, reply) => {
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: params.error.format() });

    const bodyParse = updatePetSchema.safeParse(request.body);
    if (!bodyParse.success) return reply.code(400).send({ error: bodyParse.error.format() });

    const org = request.org;
    if (!org) return reply.code(401).send({ message: 'Missing token' });

    try {
      const updated = await updatePet(org.orgId, params.data.id, bodyParse.data as any);
      return reply.send(updated);
    } catch (err: any) {
      if (err.name === 'AppError') return reply.code(err.statusCode).send({ message: err.message });
      fastify.log.error(err);
      return reply.code(500).send({ message: 'Internal error' });
    }
  });

  // DELETE /pets/:id
  fastify.delete('/pets/:id', async (request, reply) => {
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: params.error.format() });

    const org = request.org;
    if (!org) return reply.code(401).send({ message: 'Missing token' });

    try {
      const result = await deletePet(org.orgId, params.data.id);
      return reply.code(200).send(result);
    } catch (err: any) {
      if (err.name === 'AppError') return reply.code(err.statusCode).send({ message: err.message });
      fastify.log.error(err);
      return reply.code(500).send({ message: 'Internal error' });
    }
  });

  // GET /orgs/:orgId/pets - Com validação completa
  fastify.get('/orgs/:orgId/pets', async (request, reply) => {
    // Validação dos parâmetros da URL
    const paramsParse = orgPetsParamsSchema.safeParse(request.params);
    if (!paramsParse.success) {
      return reply.code(400).send({ error: paramsParse.error.format() });
    }

    // Validação dos query parameters
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
      if (err.name === 'AppError') {
        return reply.code(err.statusCode).send({ message: err.message });
      }
      fastify.log.error(err);
      return reply.code(500).send({ message: 'Internal error' });
    }
  });
}