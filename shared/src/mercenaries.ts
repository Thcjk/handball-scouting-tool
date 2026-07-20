/** Söldner & Helden */

import { cryptoRandomId } from './worldState';

export type MercenaryId = 'free_company' | 'crossbow_band' | 'heavy_riders' | 'sellsword_mob';

export interface MercenaryCompany {
  id: string;
  defId: MercenaryId;
  name: string;
  troops: number;
  morale: number;
  wage: number;
  desertRisk: number;
  provinceId: string;
}

export const MERCENARY_DEFS: Array<{
  id: MercenaryId;
  name: string;
  hireCost: number;
  wage: number;
  troops: number;
  desertRisk: number;
}> = [
  { id: 'free_company', name: 'Freie Kompanie', hireCost: 120, wage: 18, troops: 20, desertRisk: 12 },
  { id: 'crossbow_band', name: 'Armbrustbande', hireCost: 100, wage: 15, troops: 16, desertRisk: 10 },
  { id: 'heavy_riders', name: 'Schwere Reiter', hireCost: 180, wage: 28, troops: 12, desertRisk: 8 },
  { id: 'sellsword_mob', name: 'Söldnerhaufen', hireCost: 70, wage: 12, troops: 25, desertRisk: 22 },
];

export type HeroKind =
  | 'field_marshal'
  | 'master_builder'
  | 'great_merchant'
  | 'famed_physician'
  | 'master_smith'
  | 'legend_knight';

export interface HeroCharacter {
  id: string;
  kind: HeroKind;
  name: string;
  title: string;
  ability: string;
  bonus: { gold?: number; food?: number; military?: number; fame?: number; build?: number };
  loyalty: number;
}

export const HERO_DEFS: Array<{
  kind: HeroKind;
  title: string;
  names: string[];
  ability: string;
  bonus: HeroCharacter['bonus'];
  hireCost: number;
}> = [
  {
    kind: 'field_marshal',
    title: 'Legendärer Feldherr',
    names: ['Gormund Eisenfaust', 'Helga Sturmruf'],
    ability: 'Heere kämpfen tapferer',
    bonus: { military: 0.12, fame: 1 },
    hireCost: 200,
  },
  {
    kind: 'master_builder',
    title: 'Genialer Baumeister',
    names: ['Master Alden', 'Petra Steinhand'],
    ability: 'Bauwerke günstiger',
    bonus: { build: 0.15 },
    hireCost: 160,
  },
  {
    kind: 'great_merchant',
    title: 'Großer Händler',
    names: ['Marco Goldkette', 'Livia Seehandel'],
    ability: 'Mehr Handelsgold',
    bonus: { gold: 6 },
    hireCost: 150,
  },
  {
    kind: 'famed_physician',
    title: 'Berühmter Arzt',
    names: ['Bruder Remigius', 'Magistra Elsa'],
    ability: 'Weniger Seuchenverluste',
    bonus: { food: 2 },
    hireCost: 140,
  },
  {
    kind: 'master_smith',
    title: 'Meisterschmied',
    names: ['Thorvald Funken', 'Inga Hammer'],
    ability: 'Bessere Ausrüstung',
    bonus: { military: 0.06, gold: 2 },
    hireCost: 130,
  },
  {
    kind: 'legend_knight',
    title: 'Legendärer Ritter',
    names: ['Sir Caelan', 'Dame Freya'],
    ability: 'Ruhm und Moral',
    bonus: { fame: 2, military: 0.08 },
    hireCost: 170,
  },
];

export function hireMercenary(defId: MercenaryId, provinceId: string): {
  company?: MercenaryCompany;
  cost: number;
  error?: string;
} {
  const def = MERCENARY_DEFS.find((d) => d.id === defId);
  if (!def) return { cost: 0, error: 'Unbekannte Söldner' };
  return {
    cost: def.hireCost,
    company: {
      id: cryptoRandomId(),
      defId,
      name: def.name,
      troops: def.troops,
      morale: 75,
      wage: def.wage,
      desertRisk: def.desertRisk,
      provinceId,
    },
  };
}

export function tickMercenaries(
  companies: MercenaryCompany[],
  canPay: boolean,
): { companies: MercenaryCompany[]; wageTotal: number; deserted: string[] } {
  const deserted: string[] = [];
  let wageTotal = 0;
  const next: MercenaryCompany[] = [];
  for (const c of companies) {
    wageTotal += c.wage;
    if (!canPay || Math.random() * 100 < c.desertRisk * (canPay ? 0.3 : 1.5)) {
      if (!canPay || Math.random() < 0.2) {
        deserted.push(c.name);
        continue;
      }
    }
    next.push({
      ...c,
      morale: Math.max(20, Math.min(100, c.morale + (canPay ? 1 : -8))),
    });
  }
  return { companies: next, wageTotal, deserted };
}

export function hireHero(kind: HeroKind): { hero?: HeroCharacter; cost: number; error?: string } {
  const def = HERO_DEFS.find((h) => h.kind === kind);
  if (!def) return { cost: 0, error: 'Unbekannter Held' };
  const name = def.names[Math.floor(Math.random() * def.names.length)];
  return {
    cost: def.hireCost,
    hero: {
      id: cryptoRandomId(),
      kind,
      name,
      title: def.title,
      ability: def.ability,
      bonus: { ...def.bonus },
      loyalty: 60 + Math.floor(Math.random() * 25),
    },
  };
}

export function heroTickBonus(heroes: HeroCharacter[]): {
  gold: number;
  food: number;
  fame: number;
} {
  let gold = 0;
  let food = 0;
  let fame = 0;
  for (const h of heroes) {
    gold += h.bonus.gold ?? 0;
    food += h.bonus.food ?? 0;
    fame += h.bonus.fame ?? 0;
  }
  return { gold, food, fame };
}
