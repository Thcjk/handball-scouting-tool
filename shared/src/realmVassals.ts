/** Vasallensystem – Grafen/Herzöge handeln autonom */

import { cryptoRandomId } from './worldState';

export type VassalRank = 'graf' | 'markgraf' | 'herzog' | 'fuerst' | 'koenigsvassal';

export interface VassalState {
  id: string;
  characterId: string;
  name: string;
  rank: VassalRank;
  provinceIds: string[];
  loyalty: number;
  power: number;
  opinion: number;
  gold: number;
  troops: number;
  goals: string;
  lastAction?: string;
}

export const VASSAL_RANK_LABEL: Record<VassalRank, string> = {
  graf: 'Graf',
  markgraf: 'Markgraf',
  herzog: 'Herzog',
  fuerst: 'Fürst',
  koenigsvassal: 'Königlicher Vasall',
};

export function createVassal(input: {
  name: string;
  characterId: string;
  rank: VassalRank;
  provinceIds: string[];
}): VassalState {
  return {
    id: cryptoRandomId(),
    characterId: input.characterId,
    name: input.name,
    rank: input.rank,
    provinceIds: [...input.provinceIds],
    loyalty: 55 + Math.floor(Math.random() * 25),
    power: 10 + input.provinceIds.length * 8,
    opinion: 40 + Math.floor(Math.random() * 30),
    gold: 40 + Math.floor(Math.random() * 40),
    troops: 8 + input.provinceIds.length * 4,
    goals: 'Macht und Wohlstand mehren',
  };
}

export type VassalAction =
  | { type: 'tax'; gold: number }
  | { type: 'build'; note: string }
  | { type: 'recruit'; troops: number }
  | { type: 'complain'; message: string }
  | { type: 'demand_rights'; message: string }
  | { type: 'idle' };

/** Ein Vasall-Tick – keine Cheats, begrenzte Aktionen */
export function decideVassalAction(v: VassalState, taxRate: number): VassalAction {
  if (v.loyalty < 25 && Math.random() < 0.4) {
    return { type: 'demand_rights', message: `${v.name} fordert mehr Rechte und weniger Abgaben.` };
  }
  if (v.loyalty < 40 && Math.random() < 0.3) {
    return { type: 'complain', message: `${v.name} beschwert sich über die Herrschaft.` };
  }
  if (v.gold > 60 && Math.random() < 0.35) {
    return { type: 'build', note: `${v.name} baut in seinen Landen aus.` };
  }
  if (v.gold > 30 && Math.random() < 0.3) {
    const n = 2 + Math.floor(Math.random() * 4);
    return { type: 'recruit', troops: n };
  }
  // Steuern an den Lehnsherrn
  const pay = Math.floor(8 + v.provinceIds.length * 4 * (taxRate / 30));
  if (v.gold >= pay && Math.random() < 0.7) {
    return { type: 'tax', gold: Math.min(v.gold, pay) };
  }
  return { type: 'idle' };
}

export function applyVassalLoyaltyDrift(v: VassalState, taxRate: number, atWar: boolean): VassalState {
  let loyalty = v.loyalty;
  if (taxRate > 40) loyalty -= 2;
  if (taxRate < 25) loyalty += 1;
  if (atWar) loyalty -= 1;
  if (v.opinion > 60) loyalty += 1;
  return {
    ...v,
    loyalty: Math.max(0, Math.min(100, loyalty)),
    opinion: Math.max(-100, Math.min(100, v.opinion + (loyalty > 60 ? 1 : -1))),
    power: Math.min(100, v.power + Math.floor(v.troops / 20)),
  };
}
