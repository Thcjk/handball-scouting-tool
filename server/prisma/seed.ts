import { PrismaClient } from '@prisma/client';
import { WORLD_PROVINCES, AI_KINGDOMS, STARTING_RESOURCES } from '@kronenchronik/shared';

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

const CULTURE_BY_TERRAIN: Record<string, string> = {
  PLAINS: 'germanisch',
  FOREST: 'slawisch',
  HILLS: 'frankisch',
  MOUNTAINS: 'nordisch',
  COAST: 'romanisch',
};

async function main() {
  console.log('Seeding world provinces...');

  const provinceMap = new Map<string, string>();

  for (const seed of WORLD_PROVINCES) {
    const slug = slugify(seed.name);
    const province = await prisma.province.upsert({
      where: { slug },
      update: {
        culture: CULTURE_BY_TERRAIN[seed.terrain] ?? 'germanisch',
        religion: 'lichtglaube',
      },
      create: {
        slug,
        name: seed.name,
        x: seed.x,
        y: seed.y,
        terrain: seed.terrain,
        population: seed.population,
        prosperity: 50,
        defense: 10,
        culture: CULTURE_BY_TERRAIN[seed.terrain] ?? 'germanisch',
        religion: 'lichtglaube',
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

  // AI-Königreiche auf freien Provinzen
  const freeProvinces = await prisma.province.findMany({
    where: { kingdomId: null },
    orderBy: { population: 'desc' },
  });

  let provinceIdx = 0;
  for (const ai of AI_KINGDOMS) {
    if (provinceIdx >= freeProvinces.length) break;
    const province = freeProvinces[provinceIdx++];

    const existing = await prisma.kingdom.findFirst({ where: { name: ai.name, isAi: true } });
    if (existing) continue;

    const dynasty = await prisma.dynasty.create({
      data: { name: `Haus ${ai.rulerName.split(' ').pop()}`, motto: 'Durch Stahl und Ehre' },
    });

    const kingdom = await prisma.kingdom.create({
      data: {
        name: ai.name,
        isAi: true,
        culture: ai.culture,
        religion: ai.religion,
        gold: STARTING_RESOURCES.gold,
        food: STARTING_RESOURCES.food,
        wood: STARTING_RESOURCES.wood,
        stone: STARTING_RESOURCES.stone,
        iron: STARTING_RESOURCES.iron,
        influence: STARTING_RESOURCES.influence,
        fame: 5,
        dynastyId: dynasty.id,
        characters: {
          create: {
            name: ai.rulerName,
            isRuler: true,
            gender: 'MALE',
            traits: [...ai.traits],
            dynastyId: dynasty.id,
            martial: 9,
            diplomacy: 6,
            stewardship: 7,
            intrigue: 5,
            prestige: 10,
          },
        },
      },
    });

    await prisma.province.update({
      where: { id: province.id },
      data: {
        kingdomId: kingdom.id,
        culture: ai.culture,
        religion: ai.religion,
        castle: { create: { level: 1 } },
        village: { create: { level: 1 } },
        city: { create: { level: 0 } },
      },
    });

    await prisma.army.create({
      data: {
        name: 'Garnison',
        kingdomId: kingdom.id,
        provinceId: province.id,
        isGarrison: true,
        units: {
          create: [
            { type: 'MILITIA', count: 15 },
            { type: 'SPEARMAN', count: 8 },
            { type: 'ARCHER', count: 5 },
          ],
        },
      },
    });

    console.log(`Seeded AI kingdom: ${ai.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
