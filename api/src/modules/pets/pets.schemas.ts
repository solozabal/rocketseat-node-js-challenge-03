import { z } from 'zod';

export const createPetSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  species: z.enum(['dog', 'cat', 'other']).default('dog'),
  age: z.number().int().min(0).max(30).optional(),
  size: z.enum(['small', 'medium', 'large']).optional(),
  energy_level: z.enum(['low', 'medium', 'high']).optional(),
  independence: z.enum(['low', 'medium', 'high']).optional(),
  environment: z.enum(['apartment', 'house', 'both']).optional(),
  photo_urls: z.array(z.string().url()).min(1).max(10).default([]),
});

export const updatePetSchema = createPetSchema.partial();

export const listPetsSchema = z.object({
  city: z.string().min(2, 'City is required'), // REQUIRED
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  species: z.enum(['dog', 'cat', 'other']).optional(),
  size: z.enum(['small', 'medium', 'large']).optional(),
  energy_level: z.enum(['low', 'medium', 'high']).optional(),
  independence: z.enum(['low', 'medium', 'high']).optional(),
  environment: z.enum(['apartment', 'house', 'both']).optional(),
  adopted: z.coerce.boolean().optional()
});

export const adoptPetSchema = z.object({
  adopted: z.boolean()
});

export const paramsSchema = z.object({
  id: z.string().uuid(),
});

export type CreatePetInput = z.infer<typeof createPetSchema>;
export type UpdatePetInput = z.infer<typeof updatePetSchema>;
export type ListPetsInput = z.infer<typeof listPetsSchema>;
export type AdoptPetInput = z.infer<typeof adoptPetSchema>;
export type ParamsInput = z.infer<typeof paramsSchema>;