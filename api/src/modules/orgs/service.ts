import { prisma } from '../../lib/prisma';
import { hashPassword, comparePassword } from '../../lib/hash';
import { signJwt } from '../../lib/jwt';

export async function createOrg(data: {
  name: string;
  email: string;
  password: string;
  whatsapp: string;
  address: any;
}) {
  const existing = await prisma.org.findUnique({ where: { email: data.email } });
  if (existing) throw new Error('EMAIL_IN_USE');

  const hashed = await hashPassword(data.password);
  const org = await prisma.org.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
      whatsapp: data.whatsapp,
      address: JSON.stringify(data.address),
    },
  });
  return org;
}

export async function authenticateOrg(email: string, password: string) {
  const org = await prisma.org.findUnique({ where: { email } });
  if (!org) throw new Error('INVALID_CREDENTIALS');

  const ok = await comparePassword(password, org.password);
  if (!ok) throw new Error('INVALID_CREDENTIALS');

  const token = signJwt({ orgId: org.id, email: org.email });
  return { org, token };
}