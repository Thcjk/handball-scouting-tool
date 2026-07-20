/** Adelsfamilien im Reich */

import { cryptoRandomId } from './worldState';

export type NobleRank = 'herzog' | 'fuerst' | 'graf' | 'baron' | 'ritter';

export interface NobleHouse {
  id: string;
  name: string;
  rank: NobleRank;
  motto: string;
  coat: string;
  wealth: number;
  land: number;
  prestige: number;
  loyalty: number;
  goal: string;
  allies: string[];
  rivals: string[];
  members: number;
}

export const NOBLE_RANK_LABEL: Record<NobleRank, string> = {
  herzog: 'Herzogshaus',
  fuerst: 'Fürstenhaus',
  graf: 'Grafenhaus',
  baron: 'Baronat',
  ritter: 'Rittergeschlecht',
};

const HOUSE_NAMES = [
  'von Eisenfels',
  'zu Hochwacht',
  'von Silberbach',
  'zu Dornwald',
  'von Krähenstein',
  'zu Meerheim',
  'von Löwenau',
  'zu Bergwacht',
  'von Rabenfels',
  'zu Goldhain',
];

const MOTTOS = [
  'Treue bis zum Stahl',
  'Land und Ehre',
  'Niemals knien',
  'Blut und Banner',
  'Im Schatten der Krone',
];

const COATS = ['🛡️🦁', '🛡️🦅', '🛡️🐺', '🛡️🌳', '🛡️⚓', '🛡️🔥', '🛡️🌙', '🛡️⚔️'];

const GOALS = [
  'Mehr Land gewinnen',
  'Familie vergrößern',
  'Hofeinfluss mehren',
  'Rivalen schwächen',
  'Prestige maximieren',
];

export function spawnNobleHouses(count = 5): NobleHouse[] {
  const shuffled = [...HOUSE_NAMES].sort(() => Math.random() - 0.5);
  const ranks: NobleRank[] = ['herzog', 'graf', 'graf', 'baron', 'ritter', 'fuerst', 'baron'];
  const houses: NobleHouse[] = [];
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    houses.push({
      id: cryptoRandomId(),
      name: shuffled[i],
      rank: ranks[i % ranks.length],
      motto: MOTTOS[i % MOTTOS.length],
      coat: COATS[i % COATS.length],
      wealth: 40 + Math.floor(Math.random() * 80),
      land: 1 + Math.floor(Math.random() * 3),
      prestige: 10 + Math.floor(Math.random() * 40),
      loyalty: 35 + Math.floor(Math.random() * 50),
      goal: GOALS[i % GOALS.length],
      allies: [],
      rivals: [],
      members: 3 + Math.floor(Math.random() * 5),
    });
  }
  // Rivalitäten / Allianzen
  for (let i = 0; i < houses.length; i++) {
    const other = houses[(i + 1) % houses.length];
    if (i % 2 === 0) houses[i].rivals.push(other.id);
    else houses[i].allies.push(other.id);
  }
  return houses;
}

export function tickNobleHouses(houses: NobleHouse[], taxHigh: boolean, atWar: boolean): {
  houses: NobleHouse[];
  notes: string[];
} {
  const notes: string[] = [];
  const next = houses.map((h) => {
    let loyalty = h.loyalty;
    let wealth = h.wealth + Math.floor(h.land * 2 + Math.random() * 4);
    let prestige = h.prestige;
    if (taxHigh) loyalty -= 2;
    if (atWar) loyalty -= 1;
    if (loyalty > 70) prestige += 1;
    if (Math.random() < 0.08) {
      wealth += 10;
      notes.push(`${h.name} mehrt seinen Reichtum.`);
    }
    if (Math.random() < 0.05 && loyalty < 40) {
      notes.push(`${h.name} intrigiert gegen die Krone.`);
      loyalty -= 3;
    }
    return {
      ...h,
      loyalty: Math.max(0, Math.min(100, loyalty)),
      wealth: Math.min(500, wealth),
      prestige: Math.min(100, prestige),
      members: h.members + (Math.random() < 0.03 ? 1 : 0),
    };
  });
  return { houses: next, notes };
}
