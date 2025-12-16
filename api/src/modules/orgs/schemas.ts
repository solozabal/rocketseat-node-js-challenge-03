import { z } from 'zod';

export const registerOrgSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  whatsapp: z.string().min(8),
  address: z.any(), // will be stringified
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});