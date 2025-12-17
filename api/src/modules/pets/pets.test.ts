// api/src/modules/pets/pets.test.ts
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { buildServer } from '../../app/server';
import { prisma } from '../../lib/prisma';

let app: Awaited<ReturnType<typeof buildServer>>;
let tokenOwner: string;
let tokenOther: string;
let ownerOrgId: string;
let createdPetId: string;

// helper: clear DB atomically with retry to handle SQLite locks
async function clearDb(retries = 3): Promise<void> {
  try {
    await prisma.$transaction([
      prisma.photo.deleteMany(),
      prisma.pet.deleteMany(),
      prisma.org.deleteMany(),
    ]);
  } catch (err) {
    if (retries > 0) {
      // small backoff and retry
      await new Promise((r) => setTimeout(r, 100));
      return clearDb(retries - 1);
    }
    // rethrow for permanent cases
    throw err;
  }
}

beforeAll(async () => {
  app = await buildServer();
  await app.ready();

  // clear DB atomically
  await clearDb();

  // create owner org
  const res1 = await app.inject({
    method: 'POST',
    url: '/orgs',
    payload: {
      name: 'OwnerOrg',
      email: 'owner@a.test',
      password: '123456',
      whatsapp: '+5511999990000',
      address: { city: 'TestCity' },
    },
  });
  tokenOwner = res1.json().token;
  ownerOrgId = res1.json().org.id;

  // create other org
  const res2 = await app.inject({
    method: 'POST',
    url: '/orgs',
    payload: {
      name: 'OtherOrg',
      email: 'other@a.test',
      password: '123456',
      whatsapp: '+5511999991111',
      address: { city: 'TestCity' },
    },
  });
  tokenOther = res2.json().token;
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe('Pets module', () => {
  it('creates a pet when authenticated', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/pets',
      headers: { Authorization: `Bearer ${tokenOwner}` },
      payload: {
        name: 'Buddy',
        description: 'Friendly dog',
        species: 'dog',
        age: 3,
        size: 'medium',
        energy_level: 'high',
        photo_urls: ['https://example.com/1.jpg'],
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.name).toBe('Buddy');
    expect(body.photos.length).toBeGreaterThan(0);
    createdPetId = body.id;
  });

  it('lists pets when city provided', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/pets?city=TestCity&page=1&limit=10',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.total).toBeGreaterThan(0);
  });

  it('fails listing when city missing', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/pets',
    });
    expect(res.statusCode).toBe(400);
  });

  it('allows owner to mark pet as adopted', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/pets/${createdPetId}/adopt`,
      headers: { Authorization: `Bearer ${tokenOwner}` },
    });
    expect(res.statusCode).toBe(204);
    const pet = await prisma.pet.findUnique({ where: { id: createdPetId } });
    expect(pet?.adopted).toBe(true);
  });

  it('prevents non-owner from marking adopted', async () => {
    // create a pet by owner2
    const resCreate = await app.inject({
      method: 'POST',
      url: '/pets',
      headers: { Authorization: `Bearer ${tokenOther}` },
      payload: {
        name: 'OtherPet',
        species: 'cat',
        photo_urls: ['https://example.com/2.jpg'],
      },
    });
    const otherPetId = resCreate.json().id;

    const res = await app.inject({
      method: 'PATCH',
      url: `/pets/${otherPetId}/adopt`,
      headers: { Authorization: `Bearer ${tokenOwner}` }, // trying to adopt otherOrg pet
    });
    expect(res.statusCode).toBe(403);
  });
});