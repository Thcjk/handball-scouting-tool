/** Technologiebaum */

export type TechBranch =
  | 'military'
  | 'economy'
  | 'architecture'
  | 'agriculture'
  | 'trade'
  | 'naval'
  | 'learning'
  | 'admin'
  | 'faith';

export interface TechNode {
  id: string;
  name: string;
  branch: TechBranch;
  cost: number;
  requires?: string[];
  unlocks: string;
  effect: { gold?: number; food?: number; military?: number; naval?: number; faith?: number };
}

export const TECH_TREE: TechNode[] = [
  { id: 'mil_1', name: 'Kettenhemden', branch: 'military', cost: 40, unlocks: 'Bessere Infanterie', effect: { military: 0.05 } },
  { id: 'mil_2', name: 'Belagerungstechnik', branch: 'military', cost: 80, requires: ['mil_1'], unlocks: 'Schnellere Belagerungen', effect: { military: 0.08 } },
  { id: 'mil_3', name: 'Ritterkodex', branch: 'military', cost: 120, requires: ['mil_2'], unlocks: 'Elite-Kavallerie', effect: { military: 0.12 } },
  { id: 'eco_1', name: 'Münzwesen', branch: 'economy', cost: 35, unlocks: 'Mehr Steuereinnahmen', effect: { gold: 0.08 } },
  { id: 'eco_2', name: 'Zünfte', branch: 'economy', cost: 70, requires: ['eco_1'], unlocks: 'Werkstatt-Bonus', effect: { gold: 0.1 } },
  { id: 'eco_3', name: 'Banken', branch: 'economy', cost: 110, requires: ['eco_2'], unlocks: 'Große Kredite', effect: { gold: 0.15 } },
  { id: 'arch_1', name: 'Steinbau', branch: 'architecture', cost: 45, unlocks: 'Stärkere Mauern', effect: { military: 0.04 } },
  { id: 'arch_2', name: 'Gotik', branch: 'architecture', cost: 90, requires: ['arch_1'], unlocks: 'Kathedralen & Wunder', effect: { faith: 5 } },
  { id: 'agr_1', name: 'Dreifelderwirtschaft', branch: 'agriculture', cost: 40, unlocks: 'Mehr Getreide', effect: { food: 0.12 } },
  { id: 'agr_2', name: 'Bewässerung', branch: 'agriculture', cost: 75, requires: ['agr_1'], unlocks: 'Dürre-Resistenz', effect: { food: 0.1 } },
  { id: 'trd_1', name: 'Handelsrecht', branch: 'trade', cost: 40, unlocks: 'Bessere Märkte', effect: { gold: 0.07 } },
  { id: 'trd_2', name: 'Karawanenwege', branch: 'trade', cost: 80, requires: ['trd_1'], unlocks: 'Landhandelsbonus', effect: { gold: 0.1 } },
  { id: 'nav_1', name: 'Küstenschifffahrt', branch: 'naval', cost: 50, unlocks: 'Handelsschiffe', effect: { naval: 0.1, gold: 0.05 } },
  { id: 'nav_2', name: 'Hochseeschiffe', branch: 'naval', cost: 100, requires: ['nav_1'], unlocks: 'Kriegsflotten', effect: { naval: 0.2 } },
  { id: 'nav_3', name: 'Seekarten', branch: 'naval', cost: 130, requires: ['nav_2'], unlocks: 'Schnellere Flotten', effect: { naval: 0.15, gold: 0.08 } },
  { id: 'lrn_1', name: 'Skriptorien', branch: 'learning', cost: 45, unlocks: 'Bildung +', effect: { faith: 2 } },
  { id: 'lrn_2', name: 'Universitäten', branch: 'learning', cost: 100, requires: ['lrn_1'], unlocks: 'Tech-Rabatt', effect: { gold: 0.05 } },
  { id: 'adm_1', name: 'Kanzleiwesen', branch: 'admin', cost: 40, unlocks: 'Bessere Verwaltung', effect: { gold: 0.06 } },
  { id: 'adm_2', name: 'Reichsregister', branch: 'admin', cost: 85, requires: ['adm_1'], unlocks: 'Vasallenkontrolle', effect: { gold: 0.08 } },
  { id: 'fth_1', name: 'Kirchenrecht', branch: 'faith', cost: 40, unlocks: 'Glaubensbonus', effect: { faith: 5 } },
  { id: 'fth_2', name: 'Heilige Orden', branch: 'faith', cost: 95, requires: ['fth_1'], unlocks: 'Ritterorden', effect: { faith: 8, military: 0.05 } },
];

export interface TechState {
  researched: string[];
  progress: Record<string, number>;
  researching: string | null;
}

export function defaultTechState(): TechState {
  return { researched: [], progress: {}, researching: null };
}

export function canResearch(state: TechState, techId: string): boolean {
  const t = TECH_TREE.find((x) => x.id === techId);
  if (!t || state.researched.includes(techId)) return false;
  if (t.requires) {
    return t.requires.every((r) => state.researched.includes(r));
  }
  return true;
}

export function techBonuses(state: TechState): {
  gold: number;
  food: number;
  military: number;
  naval: number;
  faith: number;
} {
  let gold = 0;
  let food = 0;
  let military = 0;
  let naval = 0;
  let faith = 0;
  for (const id of state.researched) {
    const t = TECH_TREE.find((x) => x.id === id);
    if (!t) continue;
    gold += t.effect.gold ?? 0;
    food += t.effect.food ?? 0;
    military += t.effect.military ?? 0;
    naval += t.effect.naval ?? 0;
    faith += t.effect.faith ?? 0;
  }
  return { gold, food, military, naval, faith };
}

/** Fortschritt: goldInvested pro Tick */
export function advanceResearch(state: TechState, goldInvested: number): TechState {
  if (!state.researching) return state;
  const t = TECH_TREE.find((x) => x.id === state.researching);
  if (!t) return { ...state, researching: null };
  const prog = (state.progress[t.id] ?? 0) + goldInvested;
  if (prog >= t.cost) {
    const rest = { ...state.progress };
    delete rest[t.id];
    return {
      researched: [...state.researched, t.id],
      progress: rest,
      researching: null,
    };
  }
  return {
    ...state,
    progress: { ...state.progress, [t.id]: prog },
  };
}

export const TECH_BRANCH_LABEL: Record<TechBranch, string> = {
  military: 'Militär',
  economy: 'Wirtschaft',
  architecture: 'Architektur',
  agriculture: 'Landwirtschaft',
  trade: 'Handel',
  naval: 'Schifffahrt',
  learning: 'Bildung',
  admin: 'Verwaltung',
  faith: 'Religion',
};
