/** Weltwunder – einzigartige Großbauten */

import { cryptoRandomId } from './worldState';

export type WonderId =
  | 'great_cathedral'
  | 'imperial_palace'
  | 'great_library'
  | 'grand_harbor'
  | 'imperial_fortress'
  | 'royal_garden';

export interface WonderDef {
  id: WonderId;
  name: string;
  description: string;
  cost: { gold: number; wood: number; stone: number; iron: number };
  buildTicks: number;
  requiresTech?: string;
  bonus: { fame: number; goldPerTick?: number; faith?: number; defense?: number; food?: number };
}

export const WONDERS: WonderDef[] = [
  {
    id: 'great_cathedral',
    name: 'Große Kathedrale',
    description: 'Ein Gotteshaus, das Pilger aus aller Welt anzieht.',
    cost: { gold: 400, wood: 80, stone: 350, iron: 40 },
    buildTicks: 12,
    requiresTech: 'arch_2',
    bonus: { fame: 40, faith: 15, goldPerTick: 4 },
  },
  {
    id: 'imperial_palace',
    name: 'Kaiserpalast',
    description: 'Sitz der Macht – Prestige und Verwaltung.',
    cost: { gold: 500, wood: 120, stone: 400, iron: 60 },
    buildTicks: 14,
    requiresTech: 'arch_2',
    bonus: { fame: 50, goldPerTick: 6 },
  },
  {
    id: 'great_library',
    name: 'Große Bibliothek',
    description: 'Wissen der Jahrhunderte unter einem Dach.',
    cost: { gold: 320, wood: 150, stone: 200, iron: 30 },
    buildTicks: 10,
    requiresTech: 'lrn_2',
    bonus: { fame: 30, goldPerTick: 3, faith: 5 },
  },
  {
    id: 'grand_harbor',
    name: 'Riesiger Hafen',
    description: 'Zentrum des Seehandels.',
    cost: { gold: 380, wood: 280, stone: 180, iron: 50 },
    buildTicks: 11,
    requiresTech: 'nav_2',
    bonus: { fame: 35, goldPerTick: 8, food: 2 },
  },
  {
    id: 'imperial_fortress',
    name: 'Imperiale Festung',
    description: 'Uneinnehmbare Zitadelle.',
    cost: { gold: 450, wood: 60, stone: 450, iron: 100 },
    buildTicks: 13,
    requiresTech: 'mil_2',
    bonus: { fame: 35, defense: 40 },
  },
  {
    id: 'royal_garden',
    name: 'Königlicher Garten',
    description: 'Schönheit und Feste für den Hof.',
    cost: { gold: 250, wood: 100, stone: 80, iron: 10 },
    buildTicks: 8,
    bonus: { fame: 20, goldPerTick: 2, food: 3 },
  },
];

export interface WonderProject {
  id: string;
  wonderId: WonderId;
  provinceId: string;
  remainingTicks: number;
  completed: boolean;
}

export function startWonder(
  wonderId: WonderId,
  provinceId: string,
  researched: string[],
  existing: WonderProject[],
): { project?: WonderProject; error?: string } {
  const def = WONDERS.find((w) => w.id === wonderId);
  if (!def) return { error: 'Unbekanntes Wunder' };
  if (existing.some((p) => p.wonderId === wonderId && p.completed)) {
    return { error: 'Dieses Wunder existiert bereits (einzigartig)' };
  }
  if (existing.some((p) => !p.completed)) {
    return { error: 'Ein Wunder wird bereits gebaut' };
  }
  if (def.requiresTech && !researched.includes(def.requiresTech)) {
    return { error: `Benötigt Technologie: ${def.requiresTech}` };
  }
  return {
    project: {
      id: cryptoRandomId(),
      wonderId,
      provinceId,
      remainingTicks: def.buildTicks,
      completed: false,
    },
  };
}

export function tickWonders(projects: WonderProject[]): {
  projects: WonderProject[];
  justCompleted: WonderProject[];
} {
  const justCompleted: WonderProject[] = [];
  const next = projects.map((p) => {
    if (p.completed) return p;
    const remaining = p.remainingTicks - 1;
    if (remaining <= 0) {
      const done = { ...p, remainingTicks: 0, completed: true };
      justCompleted.push(done);
      return done;
    }
    return { ...p, remainingTicks: remaining };
  });
  return { projects: next, justCompleted };
}

export function wonderIncome(projects: WonderProject[]): {
  gold: number;
  food: number;
  fame: number;
  defense: number;
  faith: number;
} {
  let gold = 0;
  let food = 0;
  let defense = 0;
  let faith = 0;
  for (const p of projects) {
    if (!p.completed) continue;
    const d = WONDERS.find((w) => w.id === p.wonderId);
    if (!d) continue;
    gold += d.bonus.goldPerTick ?? 0;
    food += d.bonus.food ?? 0;
    defense += d.bonus.defense ?? 0;
    faith += d.bonus.faith ?? 0;
  }
  return { gold, food, fame: 0, defense, faith };
}
