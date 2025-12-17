import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

declare global {
  // avoid multiple PrismaClient instances during HMR/dev
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * When running tests, use a per-worker sqlite DB.
 * If the per-worker DB file does not exist, copy the template dev.db (which contains the schema)
 * so the tables exist and tests won't fail with "table ... does not exist".
 */
if (process.env.NODE_ENV === 'test') {
  const wid = process.env.VITEST_WORKER_ID ?? '0';

  // paths relative to this file: src/lib -> project root / prisma
  const prismaDir = path.resolve(__dirname, '..', '..', 'prisma');
  const templateDb = path.join(prismaDir, 'dev.db');
  const workerDb = path.join(prismaDir, `dev-test-${wid}.db`);

  try {
    // If template doesn't exist, fall back to existing DATABASE_URL (may error later)
    if (!fs.existsSync(templateDb)) {
      // no template; do nothing — Prisma will error later if DB missing
      // console.warn(`[prisma] template DB not found: ${templateDb}`);
    } else {
      // copy template to worker db if worker db doesn't exist yet
      if (!fs.existsSync(workerDb)) {
        fs.copyFileSync(templateDb, workerDb);
        // console.log(`[prisma] created worker DB: ${workerDb}`);
      }
      // Use absolute path for DATABASE_URL to avoid relativity issues
      process.env.DATABASE_URL = `file:${workerDb}`;
    }
  } catch (e) {
    // if copy fails, let it surface later when Prisma tries to access DB
    // console.error('[prisma] failed to prepare test DB:', e);
  }
} else {
  // in non-test env, if DATABASE_URL is not set, default to prisma/dev.db if present
  if (!process.env.DATABASE_URL) {
    const defaultDb = path.resolve(__dirname, '..', '..', 'prisma', 'dev.db');
    if (fs.existsSync(defaultDb)) {
      process.env.DATABASE_URL = `file:${defaultDb}`;
    }
  }
}

const isTest = process.env.NODE_ENV === 'test';

// Configure Prisma logging: verbose in dev, minimal in test
const prismaClient = global.__prisma ?? new PrismaClient({
  log: isTest ? ['error'] : ['query', 'info', 'warn', 'error'],
});

export const prisma = prismaClient;

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prismaClient;
}