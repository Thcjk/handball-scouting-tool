/**
 * Endgame-Simulation Phase 5.3 –
 * Krisen, Invasionen, Weltgeschichte, Erfolge, Statistiken
 */
import {
  ACHIEVEMENTS,
  CRISIS_DEFS,
  HISTORY_LABELS,
  INVASION_DEFS,
  SPEED_LABEL,
  addHistoryMilestone,
  defaultAchievements,
  defaultGameSettings,
  defaultWorldHistory,
  evaluateAchievements,
  makeChronicle,
  resistInvasion,
  rollEndgameCrisis,
  rollGreatInvasion,
  shouldRollEndgame,
  tickCrises,
  tickInvasions,
  updateWorldHistory,
  type AchievementProgress,
  type EndgameCrisis,
  type GameSettings,
  type GameSpeed,
  type GreatInvasion,
  type WorldHistoryState,
  type ChronicleEntry,
} from '@kronenchronik/shared';

export interface RealmStats {
  population: number;
  gold: number;
  food: number;
  provinces: number;
  armies: number;
  wars: number;
  fame: number;
  tech: number;
  piety: number;
  tradeRoutes: number;
  heroes: number;
  tick: number;
  history: Array<{ tick: number; gold: number; population: number; provinces: number }>;
}

export interface EndgameSimState {
  crises: EndgameCrisis[];
  invasions: GreatInvasion[];
  history: WorldHistoryState;
  achievements: AchievementProgress[];
  settings: GameSettings;
  stats: RealmStats;
  peaceTicks: number;
  survivedCrisis: boolean;
  defeatedInvasion: boolean;
  wonTournament: boolean;
  lastTipIndex: number;
}

export function defaultEndgameSim(): EndgameSimState {
  return {
    crises: [],
    invasions: [],
    history: defaultWorldHistory(),
    achievements: defaultAchievements(),
    settings: defaultGameSettings(),
    stats: {
      population: 0,
      gold: 0,
      food: 0,
      provinces: 0,
      armies: 0,
      wars: 0,
      fame: 0,
      tech: 0,
      piety: 0,
      tradeRoutes: 0,
      heroes: 0,
      tick: 0,
      history: [],
    },
    peaceTicks: 0,
    survivedCrisis: false,
    defeatedInvasion: false,
    wonTournament: false,
    lastTipIndex: 0,
  };
}

export function migrateEndgameState(existing?: Partial<EndgameSimState>): EndgameSimState {
  const base = defaultEndgameSim();
  if (!existing) return base;
  return {
    ...base,
    ...existing,
    crises: existing.crises ?? [],
    invasions: existing.invasions ?? [],
    history: existing.history ?? base.history,
    achievements: existing.achievements?.length ? existing.achievements : base.achievements,
    settings: { ...base.settings, ...existing.settings },
    stats: { ...base.stats, ...existing.stats, history: existing.stats?.history ?? [] },
  };
}

export type EndgameTickInput = {
  state: EndgameSimState;
  tickCount: number;
  year: number;
  provinceCount: number;
  coastalNames: string[];
  gold: number;
  food: number;
  fame: number;
  population: number;
  capitalPop: number;
  capitalName: string;
  capitalCityLevel: number;
  rulerName: string;
  dynastyName: string;
  dynastyPrestige: number;
  titleRank?: string;
  hasCastle: boolean;
  warCount: number;
  longestWarTicks: number;
  armyCount: number;
  techCount: number;
  piety: number;
  tradeRoutes: number;
  heroes: number;
  wondersCompleted: number;
  hasCathedral: boolean;
  fleetCount: number;
  famineSeverity?: number;
  plagueSeverity?: number;
  rebellionStrength?: number;
  generalFame?: number;
  generalName?: string;
  tournamentWonThisTick?: boolean;
};

export type EndgameTickResult = {
  state: EndgameSimState;
  chronicle: ChronicleEntry[];
  goldDelta: number;
  foodDelta: number;
  fameDelta: number;
  alert?: string;
};

export function runEndgameTick(opts: EndgameTickInput): EndgameTickResult {
  const chronicle: ChronicleEntry[] = [];
  const state: EndgameSimState = {
    ...opts.state,
    crises: [...opts.state.crises],
    invasions: [...opts.state.invasions],
    achievements: opts.state.achievements.map((a) => ({ ...a })),
    stats: { ...opts.state.stats, history: [...(opts.state.stats.history ?? [])] },
    history: {
      records: [...opts.state.history.records],
      milestones: [...opts.state.history.milestones],
    },
    settings: { ...opts.state.settings },
  };

  let goldDelta = 0;
  let foodDelta = 0;
  let fameDelta = 0;
  let alert: string | undefined;

  if (state.settings.speed === 'pause') {
    return { state, chronicle, goldDelta, foodDelta, fameDelta };
  }

  if (opts.warCount === 0) state.peaceTicks += 1;
  else state.peaceTicks = 0;

  if (opts.tournamentWonThisTick) state.wonTournament = true;

  const hadCrisis = state.crises.length > 0;
  const ct = tickCrises(state.crises);
  state.crises = ct.crises;
  goldDelta += ct.goldMod;
  foodDelta += ct.foodMod;
  fameDelta += ct.fameMod;
  for (const title of ct.ended) {
    state.survivedCrisis = true;
    chronicle.push(makeChronicle(opts.tickCount, 'peace', 'Krise überstanden', `${title} ebbt ab.`));
    state.history = addHistoryMilestone(state.history, opts.tickCount, opts.year, `Krise beendet: ${title}`);
  }

  const inv = tickInvasions(state.invasions);
  state.invasions = inv.invasions;
  goldDelta -= inv.pressure;
  foodDelta -= Math.floor(inv.pressure / 2);
  for (const name of inv.ended) {
    chronicle.push(
      makeChronicle(opts.tickCount, 'peace', 'Invasion vorbei', `${name} zieht ab oder zerfällt.`),
    );
  }

  if (
    shouldRollEndgame(opts.provinceCount, opts.tickCount, state.crises.length + state.invasions.length)
  ) {
    const rolled = rollEndgameCrisis(opts.provinceCount, opts.tickCount);
    if (rolled) {
      if (rolled.crisis.kind === 'great_invasion') {
        const invasion = rollGreatInvasion(opts.coastalNames, opts.tickCount);
        if (invasion) {
          state.invasions.push(invasion.invasion);
          chronicle.push(invasion.entry);
          alert = invasion.entry.title;
          state.history = addHistoryMilestone(
            state.history,
            opts.tickCount,
            opts.year,
            invasion.entry.text,
          );
        } else {
          state.crises.push(rolled.crisis);
          chronicle.push(rolled.entry);
          alert = rolled.crisis.title;
        }
      } else {
        state.crises.push(rolled.crisis);
        chronicle.push(rolled.entry);
        alert = rolled.crisis.title;
        state.history = addHistoryMilestone(state.history, opts.tickCount, opts.year, rolled.crisis.title);
      }
    }
  }

  state.history = updateWorldHistory(state.history, {
    tick: opts.tickCount,
    year: opts.year,
    gold: opts.gold,
    rulerName: opts.rulerName,
    provinceCount: opts.provinceCount,
    capitalPop: opts.capitalPop,
    capitalName: opts.capitalName,
    dynastyPrestige: opts.dynastyPrestige,
    dynastyName: opts.dynastyName,
    warCount: opts.warCount,
    longestWarTicks: opts.longestWarTicks,
    famineSeverity: opts.famineSeverity,
    plagueSeverity: opts.plagueSeverity,
    rebellionStrength: opts.rebellionStrength,
    generalFame: opts.generalFame,
    generalName: opts.generalName,
  });

  state.stats = {
    population: opts.population,
    gold: opts.gold,
    food: opts.food,
    provinces: opts.provinceCount,
    armies: opts.armyCount,
    wars: opts.warCount,
    fame: opts.fame,
    tech: opts.techCount,
    piety: opts.piety,
    tradeRoutes: opts.tradeRoutes,
    heroes: opts.heroes,
    tick: opts.tickCount,
    history: [
      ...state.stats.history,
      {
        tick: opts.tickCount,
        gold: opts.gold,
        population: opts.population,
        provinces: opts.provinceCount,
      },
    ].slice(-60),
  };

  const evaled = evaluateAchievements(state.achievements, {
    tick: opts.tickCount,
    hasCastle: opts.hasCastle,
    titleRank: opts.titleRank,
    provinceCount: opts.provinceCount,
    capitalCityLevel: opts.capitalCityLevel,
    gold: opts.gold,
    wondersCompleted: opts.wondersCompleted,
    hasCathedral: opts.hasCathedral,
    techCount: opts.techCount,
    defeatedInvasion: state.defeatedInvasion,
    survivedCrisis: state.survivedCrisis || (hadCrisis && ct.ended.length > 0),
    heroCount: opts.heroes,
    wonTournament: state.wonTournament,
    fleetCount: opts.fleetCount,
    peaceTicks: state.peaceTicks,
  });
  state.achievements = evaled.progress;
  for (const a of evaled.newlyUnlocked) {
    chronicle.push(makeChronicle(opts.tickCount, 'hero', `Erfolg: ${a.name}`, a.description));
    fameDelta += 2;
  }

  return { state, chronicle, goldDelta, foodDelta, fameDelta, alert };
}

export function setGameSpeed(state: EndgameSimState, speed: GameSpeed): EndgameSimState {
  return { ...state, settings: { ...state.settings, speed } };
}

export function endgameResistInvasion(state: EndgameSimState, militaryPower: number, tick: number) {
  const r = resistInvasion(state.invasions, militaryPower, tick);
  const defeated = r.fame > 0;
  return {
    state: {
      ...state,
      invasions: r.invasions,
      defeatedInvasion: state.defeatedInvasion || defeated,
    },
    entry: r.entry,
    fame: r.fame,
    goldCost: r.goldCost,
  };
}

export function endgameUiCatalog() {
  return {
    crises: CRISIS_DEFS,
    invasions: INVASION_DEFS,
    achievements: ACHIEVEMENTS,
    historyLabels: HISTORY_LABELS,
    speeds: SPEED_LABEL,
  };
}
