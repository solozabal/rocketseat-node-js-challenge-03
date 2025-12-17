// api/test/utils/clear-db.ts
import { prisma } from '../../src/lib/prisma';

export async function clearDb() {
  // Clear in reverse order to avoid constraints
  try {
    await prisma.photo.deleteMany();
    await prisma.pet.deleteMany();
    await prisma.org.deleteMany();
  } catch (error) {
    console.error('Error clearing database:', error);
    // Don't fail the test due to cleanup error
  }
}