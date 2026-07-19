import { PrismaClient } from '@prisma/client';
import { WORLD_PROVINCES } from '@kronenchronik/shared';

const prisma = new PrismaClient();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  console.log('Seeding world provinces...');

  const provinceMap = new Map<string, string>();

  for (const seed of WORLD_PROVINCES) {
    const slug = slugify(seed.name);
    const province = await prisma.province.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name: seed.name,
        x: seed.x,
        y: seed.y,
        terrain: seed.terrain,
        population: seed.population,
        prosperity: 50,
        defense: 10,
      },
    });
    provinceMap.set(seed.name, province.id);
  }

  for (const seed of WORLD_PROVINCES) {
    const provinceId = provinceMap.get(seed.name)!;
    for (const neighborName of seed.neighbors) {
      const neighborId = provinceMap.get(neighborName);
      if (!neighborId) continue;

      await prisma.provinceNeighbor.upsert({
        where: { provinceId_neighborId: { provinceId, neighborId } },
        update: {},
        create: { provinceId, neighborId },
      });
    }
  }

  console.log(`Seeded ${WORLD_PROVINCES.length} provinces with neighbor relations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
