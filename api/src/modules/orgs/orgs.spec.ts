import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { buildServer } from '../../app/server';
import { prisma } from '../../lib/prisma';

let app: any;

// helper: limpar DB de forma atômica com retry para lidar com locks do SQLite
async function clearDb(retries = 3) {
  try {
    await prisma.$transaction([
      prisma.photo.deleteMany(),
      prisma.pet.deleteMany(),
      prisma.org.deleteMany(),
    ]);
  } catch (err) {
    if (retries > 0) {
      // pequeno backoff e tenta de novo
      await new Promise((r) => setTimeout(r, 100));
      return clearDb(retries - 1);
    }
    // rethrow para casos permanentes
    throw err;
  }
}

beforeAll(async () => {
  app = await buildServer();
  await app.ready();
  // clear DB atomically (with retry)
  await clearDb();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe('Orgs module', () => {
  it('registers with valid data', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/orgs',
      payload: {
        name: 'Teste',
        email: 'org@test.local',
        password: '123456',
        whatsapp: '+5511999999999',
        address: { street: 'Rua X' },
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.org.email).toBe('org@test.local');
    expect(body.token).toBeTruthy();
  });

  it('rejects duplicate email', async () => {
    // try registering same email again
    const res = await app.inject({
      method: 'POST',
      url: '/orgs',
      payload: {
        name: 'Teste2',
        email: 'org@test.local',
        password: '123456',
        whatsapp: '+5511999999999',
        address: { street: 'Rua X' },
      },
    });
    expect(res.statusCode).toBe(409);
  });

  it('login with valid credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/sessions',
      payload: { email: 'org@test.local', password: '123456' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.token).toBeTruthy();
  });

  it('rejects login with invalid credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/sessions',
      payload: { email: 'org@test.local', password: 'wrong' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('blocks access to protected route without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/orgs/me' });
    expect(res.statusCode).toBe(401);
  });

  it('allows access to protected route with token', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/sessions',
      payload: { email: 'org@test.local', password: '123456' },
    });
    const token = login.json().token;
    const res = await app.inject({
      method: 'GET',
      url: '/orgs/me',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.email).toBe('org@test.local');
  });
});