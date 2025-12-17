// api/src/modules/orgs/orgs.spec.ts
import { beforeAll, afterAll, describe, it, expect, beforeEach } from 'vitest';
import { buildServer } from '../../app/server';
import { prisma } from '../../lib/prisma';

let app: Awaited<ReturnType<typeof buildServer>>;
let testOrgToken: string; // Store token for use in tests

// Helper: clear DB atomically with retry to handle SQLite locks
async function clearDb(retries = 3): Promise<void> {
  try {
    await prisma.$transaction([
      prisma.photo.deleteMany(),
      prisma.pet.deleteMany(),
      prisma.org.deleteMany(),
    ]);
  } catch (err) {
    if (retries > 0) {
      // Small backoff and retry
      await new Promise((resolve) => setTimeout(resolve, 100));
      return clearDb(retries - 1);
    }
    // Rethrow for permanent errors
    throw err;
  }
}

beforeAll(async () => {
  app = await buildServer();
  await app.ready();
});

beforeEach(async () => {
  // Clear DB before each test for isolation
  await clearDb();
  
  // Create a fresh org for tests that need it
  const registerResponse = await app.inject({
    method: 'POST',
    url: '/orgs',
    payload: {
      name: 'Test Org',
      email: 'org@test.local',
      password: '123456',
      whatsapp: '+5511999999999',
      address: { street: 'Street X' },
    },
  });
  
  // Store the token for protected route tests
  if (registerResponse.statusCode === 201) {
    testOrgToken = registerResponse.json().token;
  }
});

afterAll(async () => {
  // Guard against app being undefined if buildServer failed
  if (app && typeof app.close === 'function') {
    await app.close();
  }
  await prisma.$disconnect();
});

describe('Orgs module', () => {
  it('registers with valid data', async () => {
    // This test uses a different org than the one created in beforeEach
    const res = await app.inject({
      method: 'POST',
      url: '/orgs',
      payload: {
        name: 'Another Test',
        email: 'another@test.local',
        password: '123456',
        whatsapp: '+5511999999998',
        address: { street: 'Street Y' },
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.org.email).toBe('another@test.local');
    expect(body.token).toBeTruthy();
  });

  it('rejects duplicate email', async () => {
    // Try registering same email again (org@test.local already created in beforeEach)
    const res = await app.inject({
      method: 'POST',
      url: '/orgs',
      payload: {
        name: 'Test2',
        email: 'org@test.local', // Duplicate email
        password: '123456',
        whatsapp: '+5511999999999',
        address: { street: 'Street X' },
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
    // DEBUG: print token & decoded payload to help during troubleshooting
    // (safe to keep while debugging tests; remove when stable)
    console.log('=== DEBUG TOKEN ANALYSIS ===');
    console.log('Generated token:', testOrgToken);

    if (testOrgToken) {
      const tokenParts = testOrgToken.split('.');
      if (tokenParts.length === 3) {
        try {
          const payloadBase64 = tokenParts[1];
          const padded = payloadBase64.padEnd(payloadBase64.length + (4 - (payloadBase64.length % 4)) % 4, '=');
          const payloadJson = Buffer.from(padded, 'base64').toString('utf-8');
          const decodedPayload = JSON.parse(payloadJson);
          console.log('Decoded token payload:', JSON.stringify(decodedPayload, null, 2));
          console.log('Has orgId?:', 'orgId' in decodedPayload);
          console.log('Has id?:', 'id' in decodedPayload);
          console.log('Has email?:', 'email' in decodedPayload);
          console.log('All keys:', Object.keys(decodedPayload));
        } catch (e) {
          console.error('Error decoding token:', e);
        }
      }
    }

    const res = await app.inject({
      method: 'GET',
      url: '/orgs/me',
      headers: { 
        Authorization: `Bearer ${testOrgToken}`,
        'Content-Type': 'application/json'
      },
    });

    console.log('Response status:', res.statusCode);
    console.log('Response body:', res.body);

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.email).toBe('org@test.local');
  });
});