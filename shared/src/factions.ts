/** Politische Fraktionen im Reich */

export type FactionId = 'hochadel' | 'klerus' | 'haendler' | 'ritter' | 'bauern' | 'militaer';

export interface FactionState {
  id: FactionId;
  name: string;
  influence: number;
  loyalty: number;
  demand: string;
  goal: string;
}

export const FACTION_DEFS: Array<{
  id: FactionId;
  name: string;
  demand: string;
  goal: string;
}> = [
  { id: 'hochadel', name: 'Hochadel', demand: 'Mehr Rechte & weniger Steuern', goal: 'Kontrolle über den Rat' },
  { id: 'klerus', name: 'Klerus', demand: 'Kirchenbau & Spenden', goal: 'Glaubensmacht' },
  { id: 'haendler', name: 'Händler', demand: 'Freier Handel & sichere Straßen', goal: 'Reichtum durch Märkte' },
  { id: 'ritter', name: 'Ritterschaft', demand: 'Turniere & Kriegsruhm', goal: 'Ehre und Land' },
  { id: 'bauern', name: 'Bauern', demand: 'Niedrige Abgaben & Schutz', goal: 'Überleben und Brot' },
  { id: 'militaer', name: 'Militär', demand: 'Sold & Ausrüstung', goal: 'Starke Heere' },
];

export function defaultFactions(): FactionState[] {
  return FACTION_DEFS.map((f) => ({
    id: f.id,
    name: f.name,
    influence: 20 + Math.floor(Math.random() * 30),
    loyalty: 40 + Math.floor(Math.random() * 35),
    demand: f.demand,
    goal: f.goal,
  }));
}

export function tickFactions(
  factions: FactionState[],
  opts: { taxRate: number; piety: number; atWar: boolean; prosperity: number; tradeOpen: boolean },
): { factions: FactionState[]; unrest: string | null } {
  let unrest: string | null = null;
  const next = factions.map((f) => {
    let loyalty = f.loyalty;
    let influence = f.influence;
    switch (f.id) {
      case 'hochadel':
        if (opts.taxRate > 40) loyalty -= 2;
        else loyalty += 1;
        break;
      case 'klerus':
        loyalty += opts.piety > 50 ? 1 : -1;
        break;
      case 'haendler':
        loyalty += opts.tradeOpen ? 2 : -1;
        break;
      case 'ritter':
        loyalty += opts.atWar ? 1 : -0.5;
        break;
      case 'bauern':
        if (opts.taxRate > 35) loyalty -= 3;
        if (opts.prosperity < 40) loyalty -= 2;
        else loyalty += 1;
        break;
      case 'militaer':
        loyalty += opts.atWar ? 2 : -1;
        influence += opts.atWar ? 1 : 0;
        break;
    }
    loyalty = Math.max(0, Math.min(100, Math.round(loyalty)));
    influence = Math.max(5, Math.min(100, influence));
    if (loyalty < 25 && influence > 35 && Math.random() < 0.15) {
      unrest = `${f.name} protestiert: ${f.demand}`;
      loyalty -= 5;
    }
    return { ...f, loyalty, influence };
  });
  return { factions: next, unrest };
}

export function appeaseFaction(factions: FactionState[], id: FactionId, goldSpent: number): FactionState[] {
  return factions.map((f) =>
    f.id === id
      ? {
          ...f,
          loyalty: Math.min(100, f.loyalty + 8 + Math.floor(goldSpent / 20)),
          influence: Math.min(100, f.influence + 2),
        }
      : f,
  );
}
