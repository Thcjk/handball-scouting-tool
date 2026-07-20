/** Banditen & Wildtiere */

import { cryptoRandomId, makeChronicle, type ChronicleEntry } from './worldState';

export interface BanditCamp {
  id: string;
  regionName: string;
  strength: number;
  active: boolean;
}

export type WildlifeKind = 'wolf' | 'deer' | 'bear' | 'boar' | 'horse' | 'sheep' | 'cow';

export interface WildlifeSighting {
  id: string;
  kind: WildlifeKind;
  provinceId: string;
  count: number;
}

export const WILDLIFE_GLYPH: Record<WildlifeKind, string> = {
  wolf: '🐺',
  deer: '🦌',
  bear: '🐻',
  boar: '🐗',
  horse: '🐴',
  sheep: '🐑',
  cow: '🐄',
};

export function rollBandits(
  tick: number,
  insecureRegions: string[],
  prosperityLow: boolean,
): { camp: BanditCamp | null; entry?: ChronicleEntry } {
  if (insecureRegions.length === 0 || Math.random() > (prosperityLow ? 0.18 : 0.08)) {
    return { camp: null };
  }
  const regionName = insecureRegions[Math.floor(Math.random() * insecureRegions.length)];
  const camp: BanditCamp = {
    id: cryptoRandomId(),
    regionName,
    strength: 6 + Math.floor(Math.random() * 12),
    active: true,
  };
  return {
    camp,
    entry: makeChronicle(
      tick,
      'battle',
      'Banditen',
      `Banditen terrorisieren ${regionName}. Händler meiden die Straßen.`,
    ),
  };
}

export function fightBandits(camps: BanditCamp[], troopPower: number): {
  camps: BanditCamp[];
  entry: ChronicleEntry;
  fame: number;
  gold: number;
} {
  const active = camps.filter((c) => c.active);
  if (active.length === 0) {
    return {
      camps,
      fame: 0,
      gold: 0,
      entry: makeChronicle(0, 'event', 'Keine Banditen', 'Die Straßen sind ruhig.'),
    };
  }
  const target = active[0];
  if (troopPower >= target.strength) {
    return {
      camps: camps.map((c) => (c.id === target.id ? { ...c, active: false } : c)),
      fame: 4,
      gold: 15 + target.strength,
      entry: makeChronicle(
        0,
        'battle',
        'Banditen besiegt',
        `Die Straßen um ${target.regionName} sind wieder sicher.`,
      ),
    };
  }
  return {
    camps,
    fame: 0,
    gold: -10,
    entry: makeChronicle(
      0,
      'battle',
      'Banditen widerstehen',
      `Die Räuber bei ${target.regionName} schlagen zurück.`,
    ),
  };
}

export function spawnWildlife(
  provinces: Array<{ id: string; terrain: string }>,
): WildlifeSighting[] {
  const out: WildlifeSighting[] = [];
  for (const p of provinces) {
    if (Math.random() > 0.35) continue;
    let kind: WildlifeKind = 'deer';
    if (p.terrain === 'FOREST') kind = Math.random() < 0.5 ? 'wolf' : 'boar';
    else if (p.terrain === 'MOUNTAINS') kind = Math.random() < 0.4 ? 'bear' : 'deer';
    else if (p.terrain === 'PLAINS') kind = Math.random() < 0.5 ? 'sheep' : 'horse';
    else if (p.terrain === 'HILLS') kind = Math.random() < 0.5 ? 'cow' : 'deer';
    else kind = 'deer';
    out.push({
      id: cryptoRandomId(),
      kind,
      provinceId: p.id,
      count: 1 + Math.floor(Math.random() * 4),
    });
  }
  return out.slice(0, 20);
}
