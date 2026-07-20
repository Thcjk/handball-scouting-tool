/** Erfolge / Achievements */

export type AchievementId =
  | 'first_castle'
  | 'first_kingdom'
  | 'reign_100'
  | 'provinces_10'
  | 'provinces_25'
  | 'capital_glory'
  | 'gold_1000'
  | 'gold_5000'
  | 'great_cathedral'
  | 'all_tech_branch'
  | 'first_wonder'
  | 'defeat_invasion'
  | 'survive_crisis'
  | 'hire_hero'
  | 'win_tournament'
  | 'fleet_built'
  | 'peace_long';

export interface AchievementDef {
  id: AchievementId;
  name: string;
  description: string;
}

export interface AchievementProgress {
  id: AchievementId;
  unlocked: boolean;
  unlockedTick?: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_castle', name: 'Erste Burg', description: 'Errichte eine Burg.' },
  { id: 'first_kingdom', name: 'Königreich', description: 'Erreiche den Titel König oder höher.' },
  { id: 'reign_100', name: 'Jahrhundert', description: 'Regiere 100 Ticks (≈100 Jahre).' },
  { id: 'provinces_10', name: 'Zehn Provinzen', description: 'Kontrolliere 10 Provinzen.' },
  { id: 'provinces_25', name: 'Großreich', description: 'Kontrolliere 25 Provinzen.' },
  { id: 'capital_glory', name: 'Prächtige Hauptstadt', description: 'Hauptstadt mit Stadtstufe ≥ 3.' },
  { id: 'gold_1000', name: 'Tausend Gold', description: 'Besitze 1000 Gold.' },
  { id: 'gold_5000', name: 'Schatzmeister', description: 'Besitze 5000 Gold.' },
  { id: 'great_cathedral', name: 'Große Kathedrale', description: 'Vollende die Große Kathedrale.' },
  { id: 'all_tech_branch', name: 'Gelehrsamkeit', description: 'Erforsche mindestens 8 Technologien.' },
  { id: 'first_wonder', name: 'Weltwunder', description: 'Vollende ein Weltwunder.' },
  { id: 'defeat_invasion', name: 'Küstenwächter', description: 'Wehre eine große Invasion ab.' },
  { id: 'survive_crisis', name: 'Krisenfest', description: 'Überstehe eine Endgame-Krise.' },
  { id: 'hire_hero', name: 'Heldenruf', description: 'Stelle einen Helden ein.' },
  { id: 'win_tournament', name: 'Turniersieger', description: 'Gewinne ein Turnier als Herrscher.' },
  { id: 'fleet_built', name: 'Seemacht', description: 'Baue eine Flotte.' },
  { id: 'peace_long', name: 'Friedensfürst', description: 'Halte 50 Ticks ohne eigenen Krieg.' },
];

export function defaultAchievements(): AchievementProgress[] {
  return ACHIEVEMENTS.map((a) => ({ id: a.id, unlocked: false }));
}

export type AchievementSnapshot = {
  tick: number;
  hasCastle: boolean;
  titleRank?: string;
  provinceCount: number;
  capitalCityLevel: number;
  gold: number;
  wondersCompleted: number;
  hasCathedral: boolean;
  techCount: number;
  defeatedInvasion: boolean;
  survivedCrisis: boolean;
  heroCount: number;
  wonTournament: boolean;
  fleetCount: number;
  peaceTicks: number;
};

export function evaluateAchievements(
  progress: AchievementProgress[],
  snap: AchievementSnapshot,
): { progress: AchievementProgress[]; newlyUnlocked: AchievementDef[] } {
  const newlyUnlocked: AchievementDef[] = [];
  const map = new Map(progress.map((p) => [p.id, { ...p }]));

  const unlock = (id: AchievementId, cond: boolean) => {
    const cur = map.get(id);
    if (!cur || cur.unlocked || !cond) return;
    cur.unlocked = true;
    cur.unlockedTick = snap.tick;
    map.set(id, cur);
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (def) newlyUnlocked.push(def);
  };

  unlock('first_castle', snap.hasCastle);
  unlock('first_kingdom', ['koenig', 'kaiser'].includes(snap.titleRank ?? ''));
  unlock('reign_100', snap.tick >= 100);
  unlock('provinces_10', snap.provinceCount >= 10);
  unlock('provinces_25', snap.provinceCount >= 25);
  unlock('capital_glory', snap.capitalCityLevel >= 3);
  unlock('gold_1000', snap.gold >= 1000);
  unlock('gold_5000', snap.gold >= 5000);
  unlock('great_cathedral', snap.hasCathedral);
  unlock('all_tech_branch', snap.techCount >= 8);
  unlock('first_wonder', snap.wondersCompleted >= 1);
  unlock('defeat_invasion', snap.defeatedInvasion);
  unlock('survive_crisis', snap.survivedCrisis);
  unlock('hire_hero', snap.heroCount >= 1);
  unlock('win_tournament', snap.wonTournament);
  unlock('fleet_built', snap.fleetCount >= 1);
  unlock('peace_long', snap.peaceTicks >= 50);

  return { progress: ACHIEVEMENTS.map((a) => map.get(a.id)!), newlyUnlocked };
}
