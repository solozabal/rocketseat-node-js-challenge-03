import { prisma } from '../../lib/prisma';
import type { CreatePetInput, ListPetsInput, UpdatePetInput } from './pets.schemas';
import type { Prisma } from '@prisma/client';
import { NotFoundError, ForbiddenError } from '../../lib/errors';

// Helper to normalize/format pet responses
function formatPet(pet: any) {
  const photosArr = Array.isArray(pet.photos) ? pet.photos.map((photo: any) => photo.url) : [];

  return {
    id: pet.id,
    name: pet.name,
    description: pet.description,
    species: pet.species,
    age: pet.age,
    size: pet.size,
    energy_level: pet.energy_level,
    independence: pet.independence,
    environment: pet.environment,
    adopted: pet.adopted,
    // return both keys for compatibility: `photos` (used by tests) and `photo_urls` (optional)
    photos: photosArr,
    photo_urls: photosArr,
    org: pet.org
      ? {
          id: pet.org.id,
          name: pet.org.name,
          whatsapp: pet.org.whatsapp,
          email: (pet.org as any).email,
          address:
            typeof pet.org.address === 'string' && pet.org.address.length
              ? JSON.parse(pet.org.address)
              : pet.org.address || null,
        }
      : null,
    createdAt: pet.createdAt,
    updatedAt: pet.updatedAt,
  };
}

export async function createPet(orgId: string, data: CreatePetInput) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // create pet
    const pet = await tx.pet.create({
      data: {
        name: data.name,
        description: data.description,
        species: data.species,
        age: data.age,
        size: data.size,
        energy_level: data.energy_level,
        independence: data.independence,
        environment: data.environment,
        orgId,
      },
    });

    // create photos (try createMany, fallback to individual creates)
    if (data.photo_urls && data.photo_urls.length > 0) {
      const photosData = data.photo_urls.map((url) => ({ url, petId: pet.id }));
      try {
        await (tx.photo as any).createMany({ data: photosData });
      } catch {
        await Promise.all(photosData.map((p) => tx.photo.create({ data: p })));
      }
    }

    const fullPet = await tx.pet.findUnique({
      where: { id: pet.id },
      include: {
        photos: true,
        org: {
          select: {
            id: true,
            name: true,
            email: true,
            whatsapp: true,
            address: true,
          },
        },
      },
    });

    if (!fullPet) throw new NotFoundError('Pet');

    return formatPet(fullPet);
  });
}

export async function listPets(filters: ListPetsInput) {
  const {
    city,
    page = 1,
    limit = 12,
    species,
    size,
    energy_level,
    independence,
    environment,
    adopted,
  } = filters;
  const skip = (page - 1) * limit;

  // Use any here to avoid tight typing issues with generated Prisma types
  const where: any = {};

  if (species) where.species = species;
  if (size) where.size = size;
  if (energy_level) where.energy_level = energy_level;
  if (independence) where.independence = independence;
  if (environment) where.environment = environment;
  if (typeof adopted === 'boolean') where.adopted = adopted;

  // FILTRO por cidade: busca orgs que contenham a city no address e filtra por orgId
  if (city) {
    // encontra orgs que tenham address contendo a city
    const matchingOrgs = await prisma.org.findMany({
      where: {
        address: { contains: city } as any,
      },
      select: { id: true },
    });

    const orgIds = matchingOrgs.map((o) => o.id);

    // se não encontrou orgs, retorna resultado vazio imediato
    if (orgIds.length === 0) {
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    // filtra por orgId (array)
    where.orgId = { in: orgIds };
  }

  const [items, total] = await Promise.all([
    prisma.pet.findMany({
      where,
      include: {
        photos: true,
        org: {
          select: { id: true, name: true, whatsapp: true, address: true, email: true },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.pet.count({ where }),
  ]);

  const formatted = items.map(formatPet);

  return {
    items: formatted,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getPetById(id: string) {
  const pet = await prisma.pet.findUnique({
    where: { id },
    include: {
      photos: true,
      org: {
        select: { id: true, name: true, whatsapp: true, email: true, address: true },
      },
    },
  });

  if (!pet) throw new NotFoundError('Pet');

  return formatPet(pet);
}

export async function adoptPet(orgId: string, petId: string, adopted: boolean) {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: { orgId: true },
  });

  if (!pet) throw new NotFoundError('Pet');

  if (pet.orgId !== orgId) throw new ForbiddenError('You are not the owner of this pet');

  await prisma.pet.update({
    where: { id: petId },
    data: { adopted },
  });

  return getPetById(petId);
}

export async function updatePet(orgId: string, petId: string, data: UpdatePetInput) {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: { orgId: true },
  });

  if (!pet) throw new NotFoundError('Pet');

  if (pet.orgId !== orgId) throw new ForbiddenError('You are not the owner of this pet');

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updateData: any = {
      name: data.name,
      description: data.description,
      species: data.species,
      age: data.age,
      size: data.size,
      energy_level: data.energy_level,
      independence: data.independence,
      environment: data.environment,
    };

    await tx.pet.update({
      where: { id: petId },
      data: updateData,
    });

    if (data.photo_urls) {
      await tx.photo.deleteMany({ where: { petId } });

      if (data.photo_urls.length > 0) {
        const photosData = data.photo_urls.map((url) => ({ url, petId }));
        try {
          await (tx.photo as any).createMany({ data: photosData });
        } catch {
          await Promise.all(photosData.map((p) => tx.photo.create({ data: p })));
        }
      }
    }

    const fullPet = await tx.pet.findUnique({
      where: { id: petId },
      include: {
        photos: true,
        org: {
          select: { id: true, name: true, whatsapp: true, address: true, email: true },
        },
      },
    });

    if (!fullPet) throw new NotFoundError('Pet');

    return formatPet(fullPet);
  });
}

export async function deletePet(orgId: string, petId: string) {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: { orgId: true },
  });

  if (!pet) throw new NotFoundError('Pet');

  if (pet.orgId !== orgId) throw new ForbiddenError('You are not the owner of this pet');

  await prisma.pet.delete({ where: { id: petId } });

  return { success: true, message: 'Pet deleted successfully' };
}

// helper: list pets by org
export async function getPetsByOrg(orgId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.pet.findMany({
      where: { orgId },
      include: {
        photos: true,
        org: {
          select: { id: true, name: true, whatsapp: true, address: true },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.pet.count({ where: { orgId } }),
  ]);

  const formatted = items.map(formatPet);

  return { items: formatted, total, page, limit, totalPages: Math.ceil(total / limit) };
}