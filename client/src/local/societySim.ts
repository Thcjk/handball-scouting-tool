/**
 * Gesellschaft-Simulation Phase 5.2 –
 * Adel, Fraktionen, Spione, Quests, Turniere, Söldner, Wirtschaft, Klima
 */
import {
  ATMOSPHERE_LABEL,
  MERCENARY_DEFS,
  HERO_DEFS,
  MARKET_GOOD_LABEL,
  QUEST_DEFS,
  SEASON_LABEL,
  SPY_MISSION_DEFS,
  TOURNAMENT_DISCIPLINES,
  WEATHER_LABEL,
  WILDLIFE_GLYPH,
  appeaseFaction,
  attemptAssassination,
  climateModifiers,
  createSpyAgent,
  defaultFactions,
  defaultPrices,
  fightBandits,
  heroTickBonus,
  hireHero,
  hireMercenary,
  maybeStartFair,
  pickAtmosphereMood,
  questToPendingEvent,
  resolveQuestChoice,
  rollBandits,
  rollDisaster,
  rollDisease,
  rollIncomingAssassination,
  rollQuest,
  seasonFromTick,
  spawnNobleHouses,
  spawnWildlife,
  startSpyOp,
  startTournament,
  tickDiseases,
  tickDisasters,
  tickFair,
  tickFactions,
  tickMarketPrices,
  tickMercenaries,
  tickNobleHouses,
  tickSpyOps,
  tickTournament,
  tradeAtMarket,
  weatherForSeason,
  makeChronicle,
  type ActiveDisaster,
  type ActiveDisease,
  type ActiveQuest,
  type ActiveSpyOp,
  type AssassinationMethod,
  type AtmosphereMood,
  type BanditCamp,
  type ClimateState,
  type EspionageMissionType,
  type FactionId,
  type FactionState,
  type FairEvent,
  type HeroCharacter,
  type HeroKind,
  type MarketGood,
  type MarketPrices,
  type MercenaryCompany,
  type MercenaryId,
  type NobleHouse,
  type SpyAgent,
  type TournamentDiscipline,
  type TournamentState,
  type WildlifeSighting,
  type ChronicleEntry,
  type PendingWorldEvent,
  FACTION_DEFS,
  ASSASSINATION_METHODS,
  NOBLE_RANK_LABEL,
} from '@kronenchronik/shared';

export interface SocietySimState {
  houses: NobleHouse[];
  factions: FactionState[];
  spies: SpyAgent[];
  spyOps: ActiveSpyOp[];
  quests: ActiveQuest[];
  tournament: TournamentState | null;
  mercenaries: MercenaryCompany[];
  heroes: HeroCharacter[];
  prices: MarketPrices;
  fair: FairEvent | null;
  climate: ClimateState;
  disasters: ActiveDisaster[];
  diseases: ActiveDisease[];
  bandits: BanditCamp[];
  wildlife: WildlifeSighting[];
  atmosphere: AtmosphereMood;
  rulerProtection: number;
  pendingAssassination?: AssassinationMethod | null;
}

export function defaultSocietySim(tick = 0): SocietySimState {
  const climate = seasonFromTick(tick);
  return {
    houses: spawnNobleHouses(5),
    factions: defaultFactions(),
    spies: [createSpyAgent('Schatten'), createSpyAgent('Rabe')],
    spyOps: [],
    quests: [],
    tournament: null,
    mercenaries: [],
    heroes: [],
    prices: defaultPrices(),
    fair: null,
    climate,
    disasters: [],
    diseases: [],
    bandits: [],
    wildlife: [],
    atmosphere: 'peace',
    rulerProtection: 40,
    pendingAssassination: null,
  };
}

export function migrateSocietyState(
  existing: Partial<SocietySimState> | undefined,
  tick: number,
): SocietySimState {
  const base = defaultSocietySim(tick);
  if (!existing) return base;
  return {
    ...base,
    ...existing,
    houses: existing.houses?.length ? existing.houses : base.houses,
    factions: existing.factions?.length ? existing.factions : base.factions,
    spies: existing.spies?.length ? existing.spies : base.spies,
    prices: existing.prices ?? base.prices,
    climate: existing.climate ?? seasonFromTick(tick),
    disasters: existing.disasters ?? [],
    diseases: existing.diseases ?? [],
    bandits: existing.bandits ?? [],
    wildlife: existing.wildlife ?? [],
    mercenaries: existing.mercenaries ?? [],
    heroes: existing.heroes ?? [],
    quests: existing.quests ?? [],
    spyOps: existing.spyOps ?? [],
    atmosphere: existing.atmosphere ?? 'peace',
    rulerProtection: existing.rulerProtection ?? 40,
  };
}

export type SocietyTickInput = {
  state: SocietySimState;
  tickCount: number;
  taxRateAvg: number;
  prosperityAvg: number;
  atWar: boolean;
  siegeActive: boolean;
  pirateDisruption: boolean;
  piety: number;
  tradeOpen: boolean;
  provinceNames: string[];
  cityNames: string[];
  provinces: Array<{ id: string; terrain: string; name: string; prosperity: number }>;
  goldAvailable: number;
};

export type SocietyTickResult = {
  state: SocietySimState;
  chronicle: ChronicleEntry[];
  newEvents: PendingWorldEvent[];
  goldDelta: number;
  foodDelta: number;
  fameDelta: number;
  influenceDelta: number;
  prestigeDelta: number;
  popLoss: number;
  alert?: string;
  rulerHurt?: boolean;
};

export function runSocietyTick(opts: SocietyTickInput): SocietyTickResult {
  const chronicle: ChronicleEntry[] = [];
  const newEvents: PendingWorldEvent[] = [];
  const state: SocietySimState = {
    ...opts.state,
    houses: opts.state.houses.map((h) => ({ ...h })),
    factions: opts.state.factions.map((f) => ({ ...f })),
    spies: opts.state.spies.map((s) => ({ ...s })),
    spyOps: [...opts.state.spyOps],
    quests: [...opts.state.quests],
    mercenaries: [...opts.state.mercenaries],
    heroes: [...opts.state.heroes],
    disasters: [...opts.state.disasters],
    diseases: [...opts.state.diseases],
    bandits: opts.state.bandits.map((b) => ({ ...b })),
  };

  let goldDelta = 0;
  let foodDelta = 0;
  let fameDelta = 0;
  const influenceDelta = 0;
  let prestigeDelta = 0;
  let alert: string | undefined;
  let rulerHurt = false;

  // Klima
  const climate = seasonFromTick(opts.tickCount);
  climate.weather = weatherForSeason(climate.season);
  state.climate = climate;
  const clim = climateModifiers(climate);
  foodDelta += Math.floor(6 * (clim.food - 1));
  goldDelta += Math.floor(4 * (clim.trade - 1));

  // Adel
  const nobles = tickNobleHouses(state.houses, opts.taxRateAvg > 40, opts.atWar);
  state.houses = nobles.houses;
  for (const n of nobles.notes.slice(0, 1)) {
    chronicle.push(makeChronicle(opts.tickCount, 'event', 'Adel', n));
  }

  // Fraktionen
  const fac = tickFactions(state.factions, {
    taxRate: opts.taxRateAvg,
    piety: opts.piety,
    atWar: opts.atWar,
    prosperity: opts.prosperityAvg,
    tradeOpen: opts.tradeOpen,
  });
  state.factions = fac.factions;
  if (fac.unrest) {
    chronicle.push(makeChronicle(opts.tickCount, 'war', 'Fraktionsunruhe', fac.unrest));
    alert = fac.unrest;
  }

  // Spionage-Ticks
  const spy = tickSpyOps(state.spies, state.spyOps, opts.tickCount);
  state.spies = spy.agents;
  state.spyOps = spy.ops;
  chronicle.push(...spy.chronicle);
  goldDelta += spy.goldStolen;
  if (spy.alert) alert = spy.alert;

  // Attentat-Risiko
  const lowFaction = state.factions.filter((f) => f.loyalty < 30).length;
  const lowNoble = state.houses.filter((h) => h.loyalty < 35).length;
  const risk = lowFaction * 12 + lowNoble * 10 + (opts.atWar ? 8 : 0);
  if (!state.pendingAssassination) {
    const plot = rollIncomingAssassination(risk, opts.tickCount);
    if (plot) {
      state.pendingAssassination = plot.method;
      chronicle.push(plot.entry);
      alert = 'Mordkomplott am Hof!';
    }
  } else if (Math.random() < 0.35) {
    const result = attemptAssassination(
      state.pendingAssassination,
      state.rulerProtection,
      opts.tickCount,
    );
    chronicle.push(result.entry);
    if (result.rulerHurt) rulerHurt = true;
    state.pendingAssassination = null;
    if (result.success) alert = 'Attentat auf den Herrscher!';
  }

  // Quests
  state.quests = state.quests.filter((q) => q.expiresTick > opts.tickCount);
  if (state.quests.length < 3) {
    const q = rollQuest(opts.tickCount, opts.provinceNames);
    if (q) state.quests.push(q);
  }

  // Turnier
  if (state.tournament?.active) {
    const tr = tickTournament(state.tournament, opts.tickCount);
    state.tournament = tr.tournament;
    if (tr.entry) chronicle.push(tr.entry);
    fameDelta += tr.fame;
    prestigeDelta += tr.prestige;
  }

  // Söldner
  const canPay = opts.goldAvailable + goldDelta > 30;
  const merc = tickMercenaries(state.mercenaries, canPay);
  state.mercenaries = merc.companies;
  goldDelta -= merc.wageTotal;
  for (const d of merc.deserted) {
    chronicle.push(
      makeChronicle(
        opts.tickCount,
        'battle',
        'Desertion',
        `${d} desertiert – der Sold blieb aus oder die Moral brach.`,
      ),
    );
  }

  // Helden
  const hb = heroTickBonus(state.heroes);
  goldDelta += hb.gold;
  foodDelta += hb.food;
  fameDelta += hb.fame;

  // Wirtschaft
  const famine = state.diseases.some((d) => d.kind === 'plague') || climate.season === 'winter';
  state.prices = tickMarketPrices(state.prices, {
    war: opts.atWar,
    famine,
    pirateDisruption: opts.pirateDisruption,
    surplusGrain: opts.prosperityAvg > 70 && climate.season === 'autumn',
  });
  if (!state.fair) {
    state.fair = maybeStartFair(opts.cityNames);
    if (state.fair) {
      chronicle.push(
        makeChronicle(
          opts.tickCount,
          'city',
          'Messe',
          `${state.fair.kind} in ${state.fair.cityName} – Händler aus vielen Reichen reisen an.`,
        ),
      );
    }
  } else {
    const fr = tickFair(state.fair);
    state.fair = fr.fair;
    goldDelta += fr.gold;
    fameDelta += fr.satisfaction > 2 ? 1 : 0;
  }

  // Katastrophen & Seuchen
  state.disasters = tickDisasters(state.disasters);
  if (state.disasters.length < 2) {
    const d = rollDisaster(opts.tickCount, opts.provinceNames);
    if (d.disaster) {
      state.disasters.push(d.disaster);
      if (d.entry) chronicle.push(d.entry);
      foodDelta -= 8;
      goldDelta -= 5;
    }
  }
  const hasPhysician = state.heroes.some((h) => h.kind === 'famed_physician');
  const dis = tickDiseases(state.diseases, hasPhysician);
  state.diseases = dis.diseases;
  if (state.diseases.length < 2) {
    const nd = rollDisease(opts.tickCount, opts.provinceNames, hasPhysician);
    if (nd.disease) {
      state.diseases.push(nd.disease);
      if (nd.entry) chronicle.push(nd.entry);
    }
  }

  // Banditen
  state.bandits = state.bandits.filter((b) => b.active).slice(-5);
  const insecure = opts.provinces.filter((p) => p.prosperity < 45).map((p) => p.name);
  const band = rollBandits(opts.tickCount, insecure.length ? insecure : opts.provinceNames, opts.prosperityAvg < 40);
  if (band.camp) {
    state.bandits.push(band.camp);
    if (band.entry) chronicle.push(band.entry);
    goldDelta -= 3;
  }

  // Wildlife
  state.wildlife = spawnWildlife(opts.provinces);

  // Atmosphäre
  state.atmosphere = pickAtmosphereMood({
    season: climate.season,
    weather: climate.weather,
    atWar: opts.atWar,
    siege: opts.siegeActive,
    tournament: !!state.tournament?.active,
    fair: !!state.fair?.active,
    coastalFocus: opts.provinces.some((p) => p.terrain === 'COAST'),
  });

  return {
    state,
    chronicle,
    newEvents,
    goldDelta,
    foodDelta,
    fameDelta,
    influenceDelta,
    prestigeDelta,
    popLoss: dis.popLoss,
    alert,
    rulerHurt,
  };
}

/** Quest als PendingEvent (wenn Slot frei) */
export function pickQuestEvent(state: SocietySimState): PendingWorldEvent | null {
  const q = state.quests[0];
  if (!q) return null;
  return questToPendingEvent(q);
}

export function societyAcceptQuest(
  state: SocietySimState,
  questId: string,
  choiceId: string,
  tick: number,
): {
  state: SocietySimState;
  result: ReturnType<typeof resolveQuestChoice>;
} {
  const q = state.quests.find((x) => x.id === questId);
  if (!q) {
    return {
      state,
      result: {
        gold: 0,
        food: 0,
        fame: 0,
        prestige: 0,
        influence: 0,
        entry: {
          id: 'x',
          tick,
          year: 1042,
          category: 'event',
          title: 'Quest',
          text: 'Quest nicht gefunden',
          at: Date.now(),
        },
      },
    };
  }
  const result = resolveQuestChoice(q, choiceId, tick);
  return {
    state: { ...state, quests: state.quests.filter((x) => x.id !== questId) },
    result,
  };
}

export function societyStartSpy(
  state: SocietySimState,
  type: EspionageMissionType,
  targetName: string,
  tick: number,
) {
  return startSpyOp(state.spies, state.spyOps, type, targetName, tick);
}

export function societyHireMerc(_state: SocietySimState, defId: MercenaryId, provinceId: string) {
  return hireMercenary(defId, provinceId);
}

export function societyHireHero(_state: SocietySimState, kind: HeroKind) {
  return hireHero(kind);
}

export function societyStartTournament(
  state: SocietySimState,
  discipline: TournamentDiscipline,
  participate: boolean,
) {
  return {
    ...state,
    tournament: startTournament(discipline, participate),
  };
}

export function societyAppeaseFaction(state: SocietySimState, id: FactionId, gold: number) {
  return { ...state, factions: appeaseFaction(state.factions, id, gold) };
}

export function societyTrade(
  state: SocietySimState,
  good: MarketGood,
  amount: number,
  buy: boolean,
) {
  return tradeAtMarket(state.prices, good, amount, buy);
}

export function societyFightBandits(state: SocietySimState, troopPower: number, tick: number) {
  const r = fightBandits(state.bandits, troopPower);
  return {
    state: { ...state, bandits: r.camps },
    fame: r.fame,
    gold: r.gold,
    entry: { ...r.entry, tick, year: 1042 + Math.floor(tick / 12) },
  };
}

export function societyIncreaseProtection(state: SocietySimState, amount: number) {
  return {
    ...state,
    rulerProtection: Math.min(100, state.rulerProtection + amount),
  };
}

export function societyUiCatalog() {
  return {
    seasons: SEASON_LABEL,
    weather: WEATHER_LABEL,
    atmosphere: ATMOSPHERE_LABEL,
    factions: FACTION_DEFS,
    spyMissions: SPY_MISSION_DEFS,
    assassinations: ASSASSINATION_METHODS,
    quests: QUEST_DEFS,
    tournaments: TOURNAMENT_DISCIPLINES,
    mercenaries: MERCENARY_DEFS,
    heroes: HERO_DEFS,
    marketGoods: MARKET_GOOD_LABEL,
    nobleRanks: NOBLE_RANK_LABEL,
    wildlife: WILDLIFE_GLYPH,
  };
}
