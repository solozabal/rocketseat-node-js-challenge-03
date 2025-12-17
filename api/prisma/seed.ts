// api/prisma/seed.ts
import { prisma } from '../src/lib/prisma';
import { hash } from 'bcryptjs';

async function main() {
  // Create sample organization
  const passwordHash = await hash('123456', 8);
  const org = await prisma.org.create({
    data: {
      name: 'Seed Org',
      email: 'seed@org.local',
      password: passwordHash,
      whatsapp: '+5511999999999',
      address: JSON.stringify({ city: 'SeedCity', street: 'Seed Street 1' }),
    },
  });

  // Create a sample pet with nested photos
  await prisma.pet.create({
    data: {
      name: 'Rex',
      species: 'dog',
      description: 'Friendly seed dog',
      age: 3,
      size: 'medium',
      energy_level: 'medium',
      orgId: org.id,
      photos: {
        create: [
          {
            url: 'https://placekitten.com/400/400',
          },
        ],
      },
    },
  });

  console.log('Seed finished successfully.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });