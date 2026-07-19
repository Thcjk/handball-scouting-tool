export const TRAITS = [
  'mutig',
  'gerecht',
  'grausam',
  'ehrlich',
  'gierig',
  'intelligent',
  'charismatisch',
  'ehrgeizig',
  'loyal',
  'listig',
  'tapfer',
  'fromm',
] as const;

export type Trait = (typeof TRAITS)[number];

export const CULTURES = [
  'germanisch',
  'frankisch',
  'slawisch',
  'nordisch',
  'romanisch',
] as const;

export const RELIGIONS = [
  'lichtglaube',
  'alte_goetter',
  'naturkult',
] as const;

export const AI_KINGDOMS = [
  {
    name: 'Königreich Nordmark',
    rulerName: 'Konrad von Nordmark',
    culture: 'nordisch',
    religion: 'alte_goetter',
    traits: ['mutig', 'ehrgeizig'] as Trait[],
  },
  {
    name: 'Haus Rothfeld',
    rulerName: 'Albrecht Rothfeld',
    culture: 'frankisch',
    religion: 'lichtglaube',
    traits: ['gerecht', 'loyal'] as Trait[],
  },
  {
    name: 'Herzogtum Steinberg',
    rulerName: 'Gerhard Steinberg',
    culture: 'germanisch',
    religion: 'lichtglaube',
    traits: ['intelligent', 'listig'] as Trait[],
  },
  {
    name: 'Markgrafschaft Ostwall',
    rulerName: 'Wulf Ostwall',
    culture: 'slawisch',
    religion: 'naturkult',
    traits: ['tapfer', 'grausam'] as Trait[],
  },
] as const;

export function randomTraits(count = 2): Trait[] {
  const pool = [...TRAITS];
  const picked: Trait[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

export function traitBonus(trait: Trait, skill: 'martial' | 'diplomacy' | 'stewardship' | 'intrigue'): number {
  const map: Partial<Record<Trait, Partial<Record<string, number>>>> = {
    mutig: { martial: 2 },
    gerecht: { diplomacy: 2 },
    grausam: { martial: 1, diplomacy: -1 },
    ehrlich: { diplomacy: 1 },
    gierig: { stewardship: 2, diplomacy: -1 },
    intelligent: { intrigue: 2, stewardship: 1 },
    charismatisch: { diplomacy: 2 },
    ehrgeizig: { martial: 1, stewardship: 1 },
    loyal: { diplomacy: 1 },
    listig: { intrigue: 2 },
    tapfer: { martial: 2 },
    fromm: { diplomacy: 1, stewardship: 1 },
  };
  return map[trait]?.[skill] ?? 0;
}

export function effectiveSkill(
  base: number,
  traits: string[],
  skill: 'martial' | 'diplomacy' | 'stewardship' | 'intrigue',
): number {
  let total = base;
  for (const t of traits) {
    total += traitBonus(t as Trait, skill);
  }
  return Math.max(1, total);
}
