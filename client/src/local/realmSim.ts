/**
 * Reich-Simulation Phase 5.1 – Vasallen, Gesetze, Tech, Wunder, Flotten, Religion, Bürgerkrieg
 */
import {
  WORLD_REGIONS,
  advanceResearch,
  applyVassalLoyaltyDrift,
  canResearch,
  createFleet,
  createVassal,
  decideVassalAction,
  defaultFaithState,
  defaultRealmLaws,
  defaultSeaRoutes,
  defaultTechState,
  evaluateCivilWarRisk,
  fightPirates,
  foundOrder,
  lawModifiers,
  makeChronicle,
  maybeStartCivilWar,
  orderMilitaryBonus,
  pilgrimage,
  rollPirateThreat,
  seaTradeIncome,
  startWonder,
  techBonuses,
  tickCivilWar,
  tickWonders,
  toggleLaw,
  wonderIncome,
  type CivilWarState,
  type FaithState,
  type Fleet,
  type KnightOrderId,
  type PirateThreat,
  type RealmLawId,
  type RealmLawState,
  type SeaRoute,
  type ShipType,
  type SuccessionLaw,
  type TechState,
  type VassalRank,
  type VassalState,
  type WonderId,
  type WonderProject,
  type ChronicleEntry,
  SHIP_COSTS,
  WONDERS,
  SUCCESSION_LAWS,
  REALM_LAWS,
  TECH_TREE,
  RELIGIONS_FULL,
  VASSAL_RANK_LABEL,
  TECH_BRANCH_LABEL,
} from '@kronenchronik/shared';

export interface RealmSimState {
  laws: RealmLawState;
  tech: TechState;
  faith: FaithState;
  vassals: VassalState[];
  wonders: WonderProject[];
  fleets: Fleet[];
  seaRoutes: SeaRoute[];
  pirates: PirateThreat[];
  civilWar: CivilWarState | null;
  /** Gold pro Tick in Forschung */
  researchBudget: number;
  lastCivilWarRisk: number;
  lastCivilWarReason: string;
}

export function defaultRealmSim(coastalProvinceIds: string[] = []): RealmSimState {
  return {
    laws: defaultRealmLaws(),
    tech: defaultTechState(),
    faith: defaultFaithState('lichtglaube'),
    vassals: [],
    wonders: [],
    fleets: [],
    seaRoutes: defaultSeaRoutes(coastalProvinceIds),
    pirates: [],
    civilWar: null,
    researchBudget: 5,
    lastCivilWarRisk: 0,
    lastCivilWarReason: '',
  };
}

export function migrateRealmState(
  existing: Partial<RealmSimState> | undefined,
  coastalProvinceIds: string[],
): RealmSimState {
  const base = defaultRealmSim(coastalProvinceIds);
  if (!existing) return base;
  return {
    laws: existing.laws ?? base.laws,
    tech: existing.tech ?? base.tech,
    faith: existing.faith ?? base.faith,
    vassals: existing.vassals ?? base.vassals,
    wonders: existing.wonders ?? base.wonders,
    fleets: existing.fleets ?? base.fleets,
    seaRoutes:
      existing.seaRoutes && existing.seaRoutes.length > 0
        ? existing.seaRoutes
        : base.seaRoutes,
    pirates: existing.pirates ?? base.pirates,
    civilWar: existing.civilWar ?? null,
    researchBudget: existing.researchBudget ?? 5,
    lastCivilWarRisk: existing.lastCivilWarRisk ?? 0,
    lastCivilWarReason: existing.lastCivilWarReason ?? '',
  };
}

export type RealmTickInput = {
  state: RealmSimState;
  tickCount: number;
  playerName: string;
  taxRateAvg: number;
  prosperityAvg: number;
  warCount: number;
  atWar: boolean;
  coastalProvinceIds: string[];
};

export type RealmTickResult = {
  state: RealmSimState;
  chronicle: ChronicleEntry[];
  goldDelta: number;
  foodDelta: number;
  fameDelta: number;
  alert?: string;
};

/** Ein Reich-Tick nach Dynastie */
export function runRealmTick(opts: RealmTickInput): RealmTickResult {
  const chronicle: ChronicleEntry[] = [];
  const state: RealmSimState = {
    ...opts.state,
    vassals: opts.state.vassals.map((v) => ({ ...v })),
    wonders: [...opts.state.wonders],
    fleets: opts.state.fleets.map((f) => ({ ...f, ships: f.ships.map((s) => ({ ...s })) })),
    seaRoutes: opts.state.seaRoutes.map((r) => ({ ...r })),
    pirates: opts.state.pirates.map((p) => ({ ...p })),
  };

  let goldDelta = 0;
  let foodDelta = 0;
  let fameDelta = 0;

  const mods = lawModifiers(state.laws);
  const tech = techBonuses(state.tech);
  const wonders = wonderIncome(state.wonders);
  const orderMil = orderMilitaryBonus(state.faith);

  // Gesetzes-/Tech-/Wunder-Einkommen (+ Orden stärken die Wirtschaft leicht)
  goldDelta += Math.floor(8 * (mods.gold - 1 + tech.gold)) + wonders.gold + Math.floor(orderMil * 5);
  foodDelta += Math.floor(4 * (mods.food - 1 + tech.food)) + wonders.food;
  if (wonders.defense > 0) {
    // Imperiale Festung: Prestige-Trickle
    fameDelta += 1;
  }
  state.faith = {
    ...state.faith,
    piety: Math.min(
      100,
      state.faith.piety +
        Math.floor(mods.faith / 5) +
        Math.floor(tech.faith / 3) +
        (wonders.faith > 0 ? 1 : 0),
    ),
  };

  // Forschung
  const budget = Math.min(state.researchBudget, 40);
  if (state.tech.researching && budget > 0) {
    goldDelta -= budget;
    state.tech = advanceResearch(state.tech, budget);
    if (!state.tech.researching) {
      const done = state.tech.researched[state.tech.researched.length - 1];
      const node = TECH_TREE.find((t) => t.id === done);
      if (node) {
        chronicle.push(
          makeChronicle(
            opts.tickCount,
            'event',
            `Forschung: ${node.name}`,
            `Die Gelehrten vollenden „${node.name}“. Freigeschaltet: ${node.unlocks}.`,
          ),
        );
      }
    }
  }

  // Wunderbau
  const wonderTick = tickWonders(state.wonders);
  state.wonders = wonderTick.projects;
  for (const done of wonderTick.justCompleted) {
    const def = WONDERS.find((w) => w.id === done.wonderId);
    chronicle.push(
      makeChronicle(
        opts.tickCount,
        'city',
        `Wunder vollendet: ${def?.name ?? done.wonderId}`,
        `${def?.description ?? 'Ein großes Bauwerk'} verändert das Reich.`,
      ),
    );
    fameDelta += def?.bonus.fame ?? 10;
  }

  // Vasallen handeln
  const taxRate = opts.taxRateAvg;
  for (let i = 0; i < state.vassals.length; i++) {
    let v = applyVassalLoyaltyDrift(state.vassals[i], taxRate, opts.atWar);
    v = { ...v, opinion: v.opinion + Math.floor(mods.loyalty / 4) };
    const action = decideVassalAction(v, taxRate);
    switch (action.type) {
      case 'tax':
        v = { ...v, gold: v.gold - action.gold, lastAction: `zahlt ${action.gold} Gold Tribut` };
        goldDelta += action.gold;
        break;
      case 'build':
        v = {
          ...v,
          gold: Math.max(0, v.gold - 20),
          power: Math.min(100, v.power + 2),
          lastAction: action.note,
        };
        if (Math.random() < 0.35) {
          chronicle.push(makeChronicle(opts.tickCount, 'city', 'Vasall baut', action.note));
        }
        break;
      case 'recruit':
        v = {
          ...v,
          gold: Math.max(0, v.gold - 15),
          troops: v.troops + action.troops,
          lastAction: `wirbt ${action.troops} Krieger`,
        };
        break;
      case 'complain':
        v = { ...v, loyalty: Math.max(0, v.loyalty - 2), lastAction: action.message };
        chronicle.push(makeChronicle(opts.tickCount, 'event', 'Vasallenklage', action.message));
        break;
      case 'demand_rights':
        v = { ...v, loyalty: Math.max(0, v.loyalty - 5), opinion: v.opinion - 8, lastAction: action.message };
        chronicle.push(makeChronicle(opts.tickCount, 'war', 'Rechte gefordert', action.message));
        break;
      default:
        v = { ...v, gold: v.gold + 3 + v.provinceIds.length, lastAction: 'verwaltet seine Lande' };
    }
    state.vassals[i] = v;
  }

  // Seehandel & Piraten
  if (state.seaRoutes.length === 0 && opts.coastalProvinceIds.length >= 2) {
    state.seaRoutes = defaultSeaRoutes(opts.coastalProvinceIds);
  }
  const navalBonus = tech.naval + (state.tech.researched.includes('nav_1') ? 0.1 : 0);
  const pirate = rollPirateThreat(opts.tickCount, navalBonus);
  if (pirate) {
    state.pirates = [...state.pirates.filter((p) => p.active), pirate].slice(-5);
    chronicle.push(
      makeChronicle(
        opts.tickCount,
        'battle',
        'Piraten gesichtet',
        `Piraten bedrohen ${pirate.region} (Stärke ${pirate.strength}).`,
      ),
    );
  }
  const tradeOpen = state.laws.active.includes('trade_open');
  const sea = seaTradeIncome(state.seaRoutes, state.fleets, state.pirates, tradeOpen);
  goldDelta += sea.gold;
  if (sea.disrupted > 0) {
    state.seaRoutes = state.seaRoutes.map((r, i) =>
      i < sea.disrupted ? { ...r, disrupted: true } : { ...r, disrupted: false },
    );
  } else {
    state.seaRoutes = state.seaRoutes.map((r) => ({ ...r, disrupted: false }));
  }

  // Bürgerkrieg
  const riskEval = evaluateCivilWarRisk({
    vassals: state.vassals,
    taxRate,
    atWar: opts.warCount,
    prosperityAvg: opts.prosperityAvg,
    successionRisk: mods.civilWarRisk,
    lawLoyalty: mods.loyalty,
  });
  state.lastCivilWarRisk = riskEval.risk;
  state.lastCivilWarReason = riskEval.reason;

  if (state.civilWar?.active) {
    const cw = tickCivilWar(state.civilWar, opts.tickCount);
    state.civilWar = cw.war;
    if (cw.entry) chronicle.push(cw.entry);
    if (!cw.war.active) {
      goldDelta -= 20;
      foodDelta -= 10;
    } else {
      goldDelta -= 8;
      foodDelta -= 5;
    }
  } else {
    const start = maybeStartCivilWar(
      {
        risk: riskEval.risk,
        reason: riskEval.reason,
        tick: opts.tickCount,
        vassals: state.vassals,
        playerName: opts.playerName,
      },
      state.civilWar,
    );
    state.civilWar = start.war;
    if (start.entry) {
      chronicle.push(start.entry);
    }
  }

  // Ritterorden wachsen leicht
  state.faith = {
    ...state.faith,
    orders: state.faith.orders.map((o) =>
      o.founded
        ? { ...o, strength: Math.min(40, o.strength + (Math.random() < 0.3 ? 1 : 0)) }
        : o,
    ),
  };

  let alert: string | undefined;
  if (state.civilWar?.active) alert = `Bürgerkrieg: ${state.civilWar.reason}`;
  else if (state.pirates.some((p) => p.active)) alert = 'Piraten bedrohen die Seewege';

  return { state, chronicle, goldDelta, foodDelta, fameDelta, alert };
}

export function grantVassal(
  state: RealmSimState,
  input: { name: string; characterId: string; rank: VassalRank; provinceIds: string[] },
): { state: RealmSimState; error?: string } {
  if (input.provinceIds.length === 0) return { state, error: 'Keine Provinzen zugewiesen' };
  const taken = new Set(state.vassals.flatMap((v) => v.provinceIds));
  if (input.provinceIds.some((id) => taken.has(id))) {
    return { state, error: 'Provinz bereits an einen Vasallen vergeben' };
  }
  const v = createVassal(input);
  return { state: { ...state, vassals: [...state.vassals, v] } };
}

export function setSuccession(state: RealmSimState, law: SuccessionLaw): RealmSimState {
  return { ...state, laws: { ...state.laws, succession: law } };
}

export function setRealmLaw(state: RealmSimState, id: RealmLawId): RealmSimState {
  return { ...state, laws: toggleLaw(state.laws, id) };
}

export function startResearch(state: RealmSimState, techId: string): {
  state: RealmSimState;
  error?: string;
} {
  if (!canResearch(state.tech, techId)) {
    return { state, error: 'Technologie nicht verfügbar oder Voraussetzungen fehlen' };
  }
  return {
    state: {
      ...state,
      tech: { ...state.tech, researching: techId },
    },
  };
}

export function setResearchBudget(state: RealmSimState, gold: number): RealmSimState {
  return { ...state, researchBudget: Math.max(0, Math.min(40, Math.floor(gold))) };
}

export function beginWonder(
  state: RealmSimState,
  wonderId: WonderId,
  provinceId: string,
): { state: RealmSimState; error?: string; cost?: (typeof WONDERS)[0]['cost'] } {
  const result = startWonder(wonderId, provinceId, state.tech.researched, state.wonders);
  if (result.error || !result.project) return { state, error: result.error ?? 'Fehler' };
  const def = WONDERS.find((w) => w.id === wonderId)!;
  return { state: { ...state, wonders: [...state.wonders, result.project] }, cost: def.cost };
}

export function doPilgrimage(state: RealmSimState): RealmSimState {
  return { ...state, faith: pilgrimage(state.faith) };
}

export function foundKnightOrder(
  state: RealmSimState,
  orderId: KnightOrderId,
): { state: RealmSimState; error?: string } {
  const r = foundOrder(state.faith, orderId, state.tech.researched);
  if (r.error) return { state, error: r.error };
  return { state: { ...state, faith: r.state } };
}

export function buildFleet(
  state: RealmSimState,
  input: { name: string; provinceId: string; type: ShipType; count: number },
): { state: RealmSimState; cost: (typeof SHIP_COSTS)[ShipType]; error?: string } {
  if (input.count < 1) return { state, cost: SHIP_COSTS.trade, error: 'Mindestens 1 Schiff' };
  const cost = SHIP_COSTS[input.type];
  const fleet = createFleet(input.name, input.provinceId, input.type, input.count);
  return {
    state: { ...state, fleets: [...state.fleets, fleet] },
    cost: {
      gold: cost.gold * input.count,
      wood: cost.wood * input.count,
      iron: cost.iron * input.count,
    },
  };
}

export function huntPirates(state: RealmSimState): {
  state: RealmSimState;
  message: string;
  victory: boolean;
} {
  const r = fightPirates(state.fleets, state.pirates);
  return {
    state: { ...state, fleets: r.fleets, pirates: r.pirates },
    message: r.message,
    victory: r.victory,
  };
}

export function realmUiCatalog() {
  return {
    regions: WORLD_REGIONS,
    successionLaws: SUCCESSION_LAWS,
    realmLaws: REALM_LAWS,
    techTree: TECH_TREE,
    techBranchLabel: TECH_BRANCH_LABEL,
    wonders: WONDERS,
    religions: RELIGIONS_FULL,
    vassalRanks: VASSAL_RANK_LABEL,
    shipCosts: SHIP_COSTS,
  };
}
