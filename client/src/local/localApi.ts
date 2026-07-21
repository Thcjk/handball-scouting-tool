import {
  STARTING_RESOURCES,
  allWorldProvinceSeeds,
  cultureReligionForRegion,
  regionForProvince,
  resolveBattle,
  UNIT_DEFINITIONS,
  BUILDING_DEFINITIONS,
  canAfford,
  subtractResources,
  calculateProvinceIncome,
  calculateUpkeep,
  CITY_FOUND_COST,
  CITY_FOUND_REQUIREMENTS,
  CITY_UPGRADE_COST_PER_LEVEL,
  MAX_CITY_LEVEL,
  getCityBuildingMinLevel,
  Terrain,
  UnitType,
  BuildingType,
  createEmptyCityGrid,
  CITY_TILE_DEFS,
  CityTileKind,
  runCityProduction,
  recalcDevStats,
  defaultDevStats,
  computeSettlementVisualLevel,
  migrateStock,
  constructionTicks,
  advanceConstruction,
  autoTradeBetween,
  computeCityTier,
  countProfessions,
  upgradeCostMultiplier,
  hasAdjacentRoad,
  areAtWar,
  ensureRelation,
  adjustOpinion,
  makeChronicle,
  createSiege,
  stormAttackerBonus,
  resolveEventChoice,
  resolveImmersionChoice,
  relationLabel,
  personalityLabel,
  WAR_REASONS,
  WONDERS,
  type CityTile,
  type ProvinceDevStats,
  type AiKingdomState,
  type KingdomRelation,
  type ActiveWar,
  type ActiveSiege,
  type ChronicleEntry,
  type PendingWorldEvent,
  type WorldGeneral,
  type SpyMission,
  type LongTermGoal,
  type WarReasonId,
} from '@kronenchronik/shared';
import type {
  User,
  Profile,
  GameState,
  DynastyInfo,
  DiplomacyState,
  Battle,
} from '../api/client';
import { mottoFromName } from '../lore/intro';
import {
  defaultWorldExtras,
  simulateWorldTick,
  spawnAiKingdoms,
  type SimWorld,
} from './worldSim';
import {
  arrangeMarriage,
  assignCouncil,
  getCouncilSuggestions,
  migrateDynastyState,
  refreshSpouseCandidates,
  runDynastyTick,
  setEducation,
  titleProgressHint,
  type DynastySimState,
} from './dynastySim';
import {
  beginWonder,
  buildFleet,
  defaultRealmSim,
  doPilgrimage,
  foundKnightOrder,
  grantVassal,
  huntPirates,
  migrateRealmState,
  realmUiCatalog,
  runRealmTick,
  setRealmLaw,
  setResearchBudget,
  setSuccession,
  startResearch,
  type RealmSimState,
} from './realmSim';
import {
  defaultSocietySim,
  migrateSocietyState,
  pickQuestEvent,
  runSocietyTick,
  societyAcceptQuest,
  societyAppeaseFaction,
  societyFightBandits,
  societyHireHero,
  societyHireMerc,
  societyIncreaseProtection,
  societyStartSpy,
  societyStartTournament,
  societyTrade,
  societyUiCatalog,
  type SocietySimState,
} from './societySim';
import {
  defaultEndgameSim,
  endgameResistInvasion,
  endgameUiCatalog,
  migrateEndgameState,
  runEndgameTick,
  setGameSpeed,
  type EndgameSimState,
} from './endgameSim';
import {
  autoSave,
  deleteNamedSlot,
  listSaveSlots,
  loadNamedSlot,
  quickLoad,
  quickSave,
  readSaveBlob,
  saveToNamedSlot,
  writeSaveBlob,
} from './saveManager';
import { tickIntervalMs } from '@kronenchronik/shared';

const USERS_KEY = 'kronenchronik_users';
const SESSION_KEY = 'kronenchronik_session';

interface StoredUser {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

interface SaveBuilding {
  id: string;
  type: string;
  level: number;
}

interface SaveUnit {
  id: string;
  type: string;
  count: number;
}

interface SaveArmy {
  id: string;
  name: string;
  provinceId: string;
  morale: number;
  isGarrison: boolean;
  kingdomId?: string;
  generalId?: string;
  units: SaveUnit[];
}

interface SaveProvince {
  id: string;
  slug: string;
  name: string;
  x: number;
  y: number;
  terrain: string;
  culture?: string;
  religion?: string;
  population: number;
  prosperity: number;
  defense: number;
  ownerId: string | null;
  ownerName: string | null;
  castle: { level: number } | null;
  village: { level: number } | null;
  city: { level: number } | null;
  buildings: SaveBuilding[];
  neighborSlugs: string[];
  cityGrid?: CityTile[];
  devStats?: ProvinceDevStats;
  forestStock?: number;
  mineStock?: number;
}

interface GameSave {
  kingdom: {
    id: string;
    name: string;
    gold: number;
    food: number;
    wood: number;
    stone: number;
    iron: number;
    influence: number;
    fame: number;
  };
  /** Hauptstadt-Provinz (Herz des Reiches) */
  capitalProvinceId?: string;
  provinces: SaveProvince[];
  armies: SaveArmy[];
  battles: Battle[];
  dynasty: DynastyInfo;
  lastTickAt: number;
  /** Phase 3 – lebendige Welt */
  tickCount?: number;
  aiKingdoms?: AiKingdomState[];
  relations?: KingdomRelation[];
  wars?: ActiveWar[];
  sieges?: ActiveSiege[];
  chronicle?: ChronicleEntry[];
  pendingEvents?: PendingWorldEvent[];
  generals?: WorldGeneral[];
  spyMissions?: SpyMission[];
  goals?: LongTermGoal[];
  playerSpies?: number;
  lastWorldAlert?: string;
  /** Phase 4 – Dynastie & Hof */
  dynastySim?: DynastySimState;
  /** Phase 5.1 – Großes Königreich */
  realmSim?: RealmSimState;
  worldExpanded?: boolean;
  /** Phase 5.2 – Gesellschaft & Atmosphäre */
  societySim?: SocietySimState;
  /** Phase 5.3 – Endgame, Geschichte, Erfolge, Speed */
  endgameSim?: EndgameSimState;
}

function saveKey(userId: string) {
  return `kronenchronik_save_${userId}`;
}

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password + 'kronenchronik');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function uid(): string {
  return crypto.randomUUID();
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getUsers(): StoredUser[] {
  return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]');
}

function setUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSessionUserId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

function ensureProvinceDev(p: SaveProvince) {
  if (!p.cityGrid || p.cityGrid.length === 0) {
    p.cityGrid = createEmptyCityGrid();
  }
  if (!p.devStats) {
    p.devStats = defaultDevStats();
  } else {
    p.devStats.stock = migrateStock(p.devStats.stock);
    if (p.devStats.taxRate === undefined) p.devStats.taxRate = 30;
  }
  if (p.forestStock === undefined) p.forestStock = 1000;
  if (p.mineStock === undefined) p.mineStock = 800;
}

/** Gebäude brauchen Straße – Felder/Mauern/Brunnen etwas lockerer */
function hasRoadOrIsRoad(
  tiles: CityTile[],
  x: number,
  y: number,
  kind: CityTileKind,
): boolean {
  const def = CITY_TILE_DEFS[kind];
  if (kind === CityTileKind.ROAD || def.category === 'field' || def.category === 'wall') return true;
  if (kind === CityTileKind.WELL || kind === CityTileKind.HOUSE) return true;
  return hasAdjacentRoad(tiles, x, y);
}

function loadSave(userId: string): GameSave | null {
  const save = readSaveBlob<GameSave>(saveKey(userId));
  if (!save) return null;
  ensureWorldFields(save);
  for (const p of save.provinces) {
    if (p.ownerId === save.kingdom.id) ensureProvinceDev(p);
  }
  // Migration: KI-Reiche nachträglich spawnen
  const sim = toSimWorld(save);
  if (sim.aiKingdoms.length === 0) {
    spawnAiKingdoms(sim);
    fromSimWorld(save, sim);
    storeSave(userId, save);
  }
  return save;
}

function ensureWorldFields(save: GameSave) {
  const extras = defaultWorldExtras();
  if (!save.aiKingdoms) save.aiKingdoms = extras.aiKingdoms;
  if (!save.relations) save.relations = extras.relations;
  if (!save.wars) save.wars = extras.wars;
  if (!save.sieges) save.sieges = extras.sieges;
  if (!save.chronicle) save.chronicle = extras.chronicle;
  if (!save.pendingEvents) save.pendingEvents = extras.pendingEvents;
  if (!save.generals) save.generals = extras.generals;
  if (!save.spyMissions) save.spyMissions = extras.spyMissions;
  if (!save.goals) save.goals = extras.goals;
  if (save.playerSpies === undefined) save.playerSpies = 1;
  if (save.tickCount === undefined) save.tickCount = 0;
  for (const a of save.armies) {
    if (!a.kingdomId) {
      const owner = save.provinces.find((p) => p.id === a.provinceId)?.ownerId;
      a.kingdomId = owner ?? save.kingdom.id;
    }
  }
  ensureDynastySim(save);
  expandWorldIfNeeded(save);
  ensureRealmSim(save);
  ensureSocietySim(save);
  ensureEndgameSim(save);
}

function ensureEndgameSim(save: GameSave) {
  save.endgameSim = migrateEndgameState(save.endgameSim);
}

function ensureSocietySim(save: GameSave) {
  save.societySim = migrateSocietyState(save.societySim, save.tickCount ?? 0);
}

function ensureRealmSim(save: GameSave) {
  const coastal = save.provinces
    .filter((p) => p.terrain === 'COAST' || p.terrain === Terrain.COAST)
    .map((p) => p.id);
  save.realmSim = migrateRealmState(save.realmSim, coastal);
}

/** Bestehende Spielstände um Phase-5-Provinzen erweitern */
function expandWorldIfNeeded(save: GameSave) {
  if (save.worldExpanded && save.provinces.length >= allWorldProvinceSeeds().length) return;
  const seeds = allWorldProvinceSeeds();
  const byName = new Map(save.provinces.map((p) => [p.name, p]));
  const cultureByTerrain: Record<string, string> = {
    PLAINS: 'germanisch',
    FOREST: 'slawisch',
    HILLS: 'frankisch',
    MOUNTAINS: 'nordisch',
    COAST: 'romanisch',
  };
  for (const seed of seeds) {
    if (byName.has(seed.name)) continue;
    const region = regionForProvince(seed.name);
    const cr = cultureReligionForRegion(region);
    const p: SaveProvince = {
      id: slugify(seed.name),
      slug: slugify(seed.name),
      name: seed.name,
      x: seed.x,
      y: seed.y,
      terrain: seed.terrain,
      culture: cr.culture || cultureByTerrain[seed.terrain] || 'germanisch',
      religion: cr.religion || 'lichtglaube',
      population: seed.population,
      prosperity: 45,
      defense: 10,
      ownerId: null,
      ownerName: null,
      castle: null,
      village: null,
      city: null,
      buildings: [],
      neighborSlugs: seed.neighbors.map(slugify),
      forestStock: 1000,
      mineStock: 800,
    };
    save.provinces.push(p);
    byName.set(p.name, p);
  }
  // Nachbarn synchronisieren (reziprok)
  for (const seed of seeds) {
    const p = byName.get(seed.name);
    if (!p) continue;
    const wanted = new Set(seed.neighbors.map(slugify));
    for (const slug of wanted) {
      if (!p.neighborSlugs.includes(slug)) p.neighborSlugs.push(slug);
    }
  }
  save.worldExpanded = true;
}

function ensureDynastySim(save: GameSave) {
  const capital =
    save.provinces.find((p) => p.id === save.capitalProvinceId)?.name ??
    save.provinces.find((p) => p.ownerId === save.kingdom.id)?.name ??
    'Grenzburg';
  const d = save.dynasty;
  save.dynastySim = migrateDynastyState({
    dynastyId: d.dynasty?.id ?? uid(),
    dynastyName: d.dynasty?.name ?? `Haus ${save.kingdom.name}`,
    motto: d.dynasty?.motto ?? null,
    characters: (d.characters ?? []) as unknown as Array<Record<string, unknown>>,
    tickCount: save.tickCount ?? 0,
    birthPlace: capital,
    existing: save.dynastySim,
  });
  // Sync zurück in DynastyInfo (UI-Kompatibilität)
  const sim = save.dynastySim;
  save.dynasty = {
    dynasty: {
      id: sim.meta.id,
      name: sim.meta.name,
      motto: sim.meta.motto,
    },
    characters: sim.characters,
    ruler: sim.characters.find((c) => c.isRuler) ?? null,
    heir: sim.characters.find((c) => c.isHeir) ?? null,
  };
}

function toSimWorld(save: GameSave): SimWorld {
  ensureWorldFields(save);
  return {
    playerKingdomId: save.kingdom.id,
    playerName: save.kingdom.name,
    tickCount: save.tickCount ?? 0,
    provinces: save.provinces,
    armies: save.armies,
    aiKingdoms: save.aiKingdoms!,
    relations: save.relations!,
    wars: save.wars!,
    sieges: save.sieges!,
    chronicle: save.chronicle!,
    pendingEvents: save.pendingEvents!,
    generals: save.generals!,
    spyMissions: save.spyMissions!,
    goals: save.goals!,
    playerSpies: save.playerSpies ?? 1,
    playerResources: {
      gold: save.kingdom.gold,
      food: save.kingdom.food,
      wood: save.kingdom.wood,
      stone: save.kingdom.stone,
      iron: save.kingdom.iron,
      influence: save.kingdom.influence,
      fame: save.kingdom.fame,
    },
    playerDynasty: {
      characters: save.dynasty.characters,
      ruler: save.dynasty.ruler,
      heir: save.dynasty.heir,
    },
  };
}

function fromSimWorld(save: GameSave, sim: SimWorld) {
  save.tickCount = sim.tickCount;
  save.aiKingdoms = sim.aiKingdoms;
  save.relations = sim.relations;
  save.wars = sim.wars;
  save.sieges = sim.sieges;
  save.chronicle = sim.chronicle;
  save.pendingEvents = sim.pendingEvents;
  save.generals = sim.generals;
  save.spyMissions = sim.spyMissions;
  save.goals = sim.goals;
  save.playerSpies = sim.playerSpies;
  save.kingdom.gold = sim.playerResources.gold;
  save.kingdom.food = sim.playerResources.food;
  save.kingdom.wood = sim.playerResources.wood;
  save.kingdom.stone = sim.playerResources.stone;
  save.kingdom.iron = sim.playerResources.iron;
  save.kingdom.influence = sim.playerResources.influence;
  save.kingdom.fame = sim.playerResources.fame;
  save.dynasty.characters = sim.playerDynasty.characters;
  save.dynasty.ruler = sim.playerDynasty.ruler;
  save.dynasty.heir = sim.playerDynasty.heir;
}

function storeSave(userId: string, save: GameSave) {
  writeSaveBlob(saveKey(userId), save);
  try {
    autoSave(userId, saveKey(userId), save);
  } catch {
    /* autosave best-effort */
  }
}

function createWorld(): SaveProvince[] {
  const cultureByTerrain: Record<string, string> = {
    PLAINS: 'germanisch',
    FOREST: 'slawisch',
    HILLS: 'frankisch',
    MOUNTAINS: 'nordisch',
    COAST: 'romanisch',
  };
  return allWorldProvinceSeeds().map((seed) => {
    const region = regionForProvince(seed.name);
    const cr = cultureReligionForRegion(region);
    return {
      id: slugify(seed.name),
      slug: slugify(seed.name),
      name: seed.name,
      x: seed.x,
      y: seed.y,
      terrain: seed.terrain,
      culture: cr.culture || cultureByTerrain[seed.terrain] || 'germanisch',
      religion: cr.religion || 'lichtglaube',
      population: seed.population,
      prosperity: 50,
      defense: 10,
      ownerId: null,
      ownerName: null,
      castle: null,
      village: null,
      city: null,
      buildings: [],
      neighborSlugs: seed.neighbors.map(slugify),
      cityGrid: undefined,
      devStats: undefined,
      forestStock: 1000,
      mineStock: 800,
    };
  });
}

function createNewSave(kingdomName: string, rulerName: string): GameSave {
  const provinces = createWorld();
  const startProvince = [...provinces].sort((a, b) => b.population - a.population).find((p) => !p.ownerId)!;
  const kingdomId = uid();

  startProvince.ownerId = kingdomId;
  startProvince.ownerName = kingdomName;
  startProvince.castle = { level: 1 };
  startProvince.village = { level: 1 };
  startProvince.city = { level: 0 };
  ensureProvinceDev(startProvince);

  const dynastyId = uid();
  const rulerId = uid();
  const heirId = uid();

  const armies: SaveArmy[] = [
    {
      id: uid(),
      name: 'Garnison',
      provinceId: startProvince.id,
      morale: 100,
      isGarrison: true,
      kingdomId: kingdomId,
      units: [
        { id: uid(), type: 'MILITIA', count: 10 },
        { id: uid(), type: 'SPEARMAN', count: 5 },
      ],
    },
  ];

  return {
    kingdom: {
      id: kingdomId,
      name: kingdomName,
      ...STARTING_RESOURCES,
    },
    capitalProvinceId: startProvince.id,
    provinces,
    armies,
    battles: [],
    dynasty: {
      dynasty: { id: dynastyId, name: `Haus ${rulerName}`, motto: mottoFromName(rulerName) },
      characters: [
        {
          id: rulerId,
          name: rulerName,
          age: 28,
          gender: 'MALE',
          traits: ['mutig', 'ehrgeizig'],
          experience: 0,
          health: 100,
          prestige: 0,
          isAlive: true,
          isRuler: true,
          isHeir: false,
          martial: 10,
          diplomacy: 7,
          stewardship: 8,
          intrigue: 5,
        },
        {
          id: heirId,
          name: `${rulerName} Jr.`,
          age: 8,
          gender: 'MALE',
          traits: ['loyal'],
          experience: 0,
          health: 100,
          prestige: 0,
          isAlive: true,
          isRuler: false,
          isHeir: true,
          martial: 6,
          diplomacy: 5,
          stewardship: 5,
          intrigue: 4,
        },
      ],
      ruler: {
        id: rulerId,
        name: rulerName,
        age: 28,
        gender: 'MALE',
        traits: ['mutig', 'ehrgeizig'],
        experience: 0,
        health: 100,
        prestige: 0,
        isAlive: true,
        isRuler: true,
        isHeir: false,
        martial: 10,
        diplomacy: 7,
        stewardship: 8,
        intrigue: 5,
      },
      heir: {
        id: heirId,
        name: `${rulerName} Jr.`,
        age: 8,
        gender: 'MALE',
        traits: ['loyal'],
        experience: 0,
        health: 100,
        prestige: 0,
        isAlive: true,
        isRuler: false,
        isHeir: true,
        martial: 6,
        diplomacy: 5,
        stewardship: 5,
        intrigue: 4,
      },
    },
    lastTickAt: Date.now(),
    worldExpanded: true,
    ...defaultWorldExtras(),
    realmSim: defaultRealmSim(
      provinces.filter((p) => p.terrain === Terrain.COAST || p.terrain === 'COAST').map((p) => p.id),
    ),
    societySim: defaultSocietySim(0),
    endgameSim: defaultEndgameSim(),
  };
}

function finalizeNewSave(save: GameSave): GameSave {
  ensureWorldFields(save);
  const sim = toSimWorld(save);
  spawnAiKingdoms(sim);
  fromSimWorld(save, sim);
  save.chronicle!.unshift(
    makeChronicle(
      0,
      'coronation',
      'Die Chronik beginnt',
      `${save.dynasty.ruler?.name ?? 'Ein Herrscher'} begründet ${save.kingdom.name}. Das Jahr ${1042} bricht an.`,
    ),
  );
  return save;
}

function toGameState(save: GameSave): GameState {
  const kid = save.kingdom.id;
  const capitalId = save.capitalProvinceId ?? save.provinces.find((p) => p.ownerId === kid)?.id;
  return {
    kingdom: {
      id: save.kingdom.id,
      name: save.kingdom.name,
      resources: {
        gold: save.kingdom.gold,
        food: save.kingdom.food,
        wood: save.kingdom.wood,
        stone: save.kingdom.stone,
        iron: save.kingdom.iron,
        influence: save.kingdom.influence,
        fame: save.kingdom.fame,
      },
    },
    dynasty: save.dynasty,
    capitalProvinceId: capitalId,
    provinces: save.provinces.map((p) => {
      const isCapital = p.id === capitalId;
      const cityLevel = p.city?.level ?? 0;
      const villageLevel = p.village?.level ?? 0;
      const tier = p.cityGrid
        ? computeCityTier(p.cityGrid, cityLevel, isCapital)
        : undefined;
      const professions = p.cityGrid ? countProfessions(p.cityGrid) : undefined;
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        x: p.x,
        y: p.y,
        terrain: p.terrain,
        culture: p.culture,
        religion: p.religion,
        population: p.population,
        prosperity: p.prosperity,
        defense: p.defense,
        ownerId: p.ownerId,
        ownerName: p.ownerName,
        isOwned: p.ownerId === kid,
        isCapital,
        castle: p.castle,
        village: p.village,
        city: p.city,
        buildings: p.buildings,
        armies: save.armies
          .filter((a) => a.provinceId === p.id)
          .map((a) => ({
            id: a.id,
            name: a.name,
            morale: a.morale,
            isGarrison: a.isGarrison,
            provinceId: a.provinceId,
            units: a.units,
          })),
        neighbors: p.neighborSlugs.map((slug) => {
          const n = save.provinces.find((x) => x.slug === slug)!;
          return { id: n.id, slug: n.slug, name: n.name };
        }),
        cityGrid: p.cityGrid,
        devStats: p.devStats,
        visualLevel: p.cityGrid
          ? computeSettlementVisualLevel(p.cityGrid, cityLevel, villageLevel, isCapital)
          : 1,
        cityTier: tier
          ? { id: tier.id, name: tier.name, description: tier.description }
          : undefined,
        professions,
        forestStock: p.forestStock,
        mineStock: p.mineStock,
      };
    }),
    armies: save.armies.map((a) => {
      const prov = save.provinces.find((p) => p.id === a.provinceId);
      return {
        id: a.id,
        name: a.name,
        morale: a.morale,
        isGarrison: a.isGarrison,
        provinceId: a.provinceId,
        generalId: a.generalId,
        kingdomId: a.kingdomId,
        units: a.units,
        province: prov ? { id: prov.id, name: prov.name } : undefined,
      };
    }),
    recentBattles: save.battles.slice(0, 10),
    tickCount: save.tickCount ?? 0,
    worldYear: 1042 + Math.floor((save.tickCount ?? 0) / 12),
    aiKingdoms: (save.aiKingdoms ?? []).map((k) => ({
      id: k.id,
      name: k.name,
      personality: k.personality,
      personalityLabel: personalityLabel(k.personality),
      culture: k.culture,
      religion: k.religion,
      gold: k.gold,
      provinceCount: save.provinces.filter((p) => p.ownerId === k.id).length,
      rulerName: k.ruler.name,
      rulerAge: k.ruler.age,
    })),
    diplomacyBrief: (save.aiKingdoms ?? []).map((k) => {
      const rel = ensureRelation(save.relations ?? [], kid, k.id);
      const atWar = areAtWar(save.wars ?? [], kid, k.id);
      return {
        kingdomId: k.id,
        kingdomName: k.name,
        rulerName: k.ruler.name,
        opinion: rel.opinion,
        status: atWar ? 'AT_WAR' : rel.status,
        label: relationLabel(rel.opinion, atWar),
        atWar,
        lastReason: rel.lastReason,
      };
    }),
    wars: save.wars ?? [],
    sieges: (save.sieges ?? []).map((s) => ({
      ...s,
      provinceName: save.provinces.find((p) => p.id === s.provinceId)?.name,
    })),
    chronicle: (save.chronicle ?? []).slice(-80).reverse(),
    pendingEvents: save.pendingEvents ?? [],
    generals: (save.generals ?? []).filter((g) => g.kingdomId === kid && g.alive),
    goals: save.goals ?? [],
    playerSpies: save.playerSpies ?? 1,
    worldAlert: save.lastWorldAlert,
    title: save.dynastySim?.title,
    titleHint: save.dynastySim
      ? titleProgressHint(
          save.dynastySim,
          save.provinces.filter((p) => p.ownerId === kid).length,
          save.kingdom.fame,
        )
      : null,
    court: save.dynastySim
      ? {
          visitors: save.dynastySim.visitors,
          council: save.dynastySim.council,
          councilAdvice: getCouncilSuggestions(save.dynastySim),
          marriages: save.dynastySim.marriages,
          spouseCandidates: save.dynastySim.spouseCandidates,
          meta: save.dynastySim.meta,
        }
      : undefined,
    realm: save.realmSim
      ? {
          laws: save.realmSim.laws,
          tech: save.realmSim.tech,
          faith: save.realmSim.faith,
          vassals: save.realmSim.vassals,
          wonders: save.realmSim.wonders,
          fleets: save.realmSim.fleets,
          seaRoutes: save.realmSim.seaRoutes,
          pirates: save.realmSim.pirates.filter((p) => p.active),
          civilWar: save.realmSim.civilWar,
          researchBudget: save.realmSim.researchBudget,
          civilWarRisk: save.realmSim.lastCivilWarRisk,
          civilWarReason: save.realmSim.lastCivilWarReason,
          catalog: realmUiCatalog(),
        }
      : undefined,
    society: save.societySim
      ? {
          houses: save.societySim.houses,
          factions: save.societySim.factions,
          spies: save.societySim.spies.filter((s) => s.alive),
          spyOps: save.societySim.spyOps,
          quests: save.societySim.quests,
          tournament: save.societySim.tournament,
          mercenaries: save.societySim.mercenaries,
          heroes: save.societySim.heroes,
          prices: { ...save.societySim.prices } as Record<string, number>,
          fair: save.societySim.fair,
          climate: save.societySim.climate,
          disasters: save.societySim.disasters,
          diseases: save.societySim.diseases,
          bandits: save.societySim.bandits.filter((b) => b.active),
          wildlife: save.societySim.wildlife,
          atmosphere: save.societySim.atmosphere,
          rulerProtection: save.societySim.rulerProtection,
          pendingAssassination: save.societySim.pendingAssassination ?? null,
          catalog: societyUiCatalog(),
        }
      : undefined,
    endgame: save.endgameSim
      ? {
          crises: save.endgameSim.crises,
          invasions: save.endgameSim.invasions,
          history: save.endgameSim.history,
          achievements: save.endgameSim.achievements,
          settings: save.endgameSim.settings,
          stats: save.endgameSim.stats,
          peaceTicks: save.endgameSim.peaceTicks,
          catalog: endgameUiCatalog(),
        }
      : undefined,
  };
}

function requireSave(): { userId: string; save: GameSave } {
  const userId = getSessionUserId();
  if (!userId) throw new Error('Nicht eingeloggt');
  const save = loadSave(userId);
  if (!save) throw new Error('Kein Spielstand gefunden');
  return { userId, save };
}

function persist(userId: string, save: GameSave): GameState {
  storeSave(userId, save);
  return toGameState(save);
}

export function applyResourceTick(userId: string): GameState | null {
  const save = loadSave(userId);
  if (!save) return null;

  ensureEndgameSim(save);
  const speed = save.endgameSim!.settings.speed;
  if (speed === 'pause') return toGameState(save);

  const now = Date.now();
  const interval = tickIntervalMs(speed);
  if (now - save.lastTickAt < interval) return toGameState(save);

  const kid = save.kingdom.id;
  if (!save.capitalProvinceId) {
    const first = save.provinces.find((p) => p.ownerId === kid);
    if (first) save.capitalProvinceId = first.id;
  }
  const owned = save.provinces.filter((p) => p.ownerId === kid);

  const totalIncome = { gold: 0, food: 0, wood: 0, stone: 0, iron: 0, influence: 0 };
  for (const p of owned) {
    ensureProvinceDev(p);
    // Bauphasen
    advanceConstruction(p.cityGrid!);

    const income = calculateProvinceIncome({
      buildings: p.buildings.map((b) => ({ type: b.type as BuildingType, level: b.level })),
      population: p.population,
      cityLevel: p.city?.level ?? 0,
      villageLevel: p.village?.level ?? 0,
    });
    totalIncome.gold += income.gold ?? 0;
    totalIncome.food += income.food ?? 0;
    totalIncome.wood += income.wood ?? 0;
    totalIncome.stone += income.stone ?? 0;
    totalIncome.iron += income.iron ?? 0;
    totalIncome.influence += income.influence ?? 0;

    // Stadt-Produktionsketten
    if (p.cityGrid && p.devStats) {
      const chain = runCityProduction(p.cityGrid, p.devStats.stock);
      totalIncome.gold += chain.kingdomIncome.gold;
      totalIncome.food += chain.kingdomIncome.food;
      totalIncome.wood += chain.kingdomIncome.wood;
      totalIncome.stone += chain.kingdomIncome.stone;
      totalIncome.iron += chain.kingdomIncome.iron;

      // Steuern aus Bevölkerung
      const taxRate = p.devStats.taxRate ?? 30;
      const taxGold = Math.floor((p.population / 100) * (taxRate / 30) * (1 + (p.prosperity ?? 50) / 100));
      totalIncome.gold += taxGold;

      p.population = Math.min(50000, Math.max(50, p.population + chain.populationDelta));
      p.prosperity = Math.min(100, Math.max(0, p.prosperity + chain.prosperityDelta));
      p.defense = Math.max(p.defense, 10 + chain.defenseBonus);
      p.devStats = recalcDevStats(p.cityGrid, p.devStats, chain);

      // Dorfwachstum: bei hoher Zufriedenheit und Nahrung
      if (p.village && p.devStats.satisfaction > 65 && (p.devStats.stock.bread ?? 0) > 8) {
        if (Math.random() < 0.15 && p.village.level < 5) {
          // gelegentlich sichtbares Wachstum über Population
          p.population += 15;
        }
      }

      const lumber = p.cityGrid.filter((t) => t.kind === CityTileKind.LUMBER_CAMP).length;
      const mines = p.cityGrid.filter((t) => t.kind === CityTileKind.MINE).length;
      p.forestStock = Math.max(0, (p.forestStock ?? 0) - lumber * 2);
      p.mineStock = Math.max(0, (p.mineStock ?? 0) - mines * 1);
      if ((p.forestStock ?? 0) < 100) totalIncome.wood = Math.floor(totalIncome.wood * 0.5);
      if ((p.mineStock ?? 0) < 80) totalIncome.iron = Math.floor(totalIncome.iron * 0.5);
      p.forestStock = Math.min(1200, (p.forestStock ?? 0) + 1);
    }
  }

  // Interprovinz-Handel zwischen Nachbarn
  for (let i = 0; i < owned.length; i++) {
    const a = owned[i];
    if (!a.devStats) continue;
    for (const slug of a.neighborSlugs) {
      const b = owned.find((p) => p.slug === slug);
      if (!b?.devStats || b.id <= a.id) continue;
      const traded = autoTradeBetween(a.devStats.stock, b.devStats.stock);
      a.devStats.stock = traded.a;
      b.devStats.stock = traded.b;
      totalIncome.gold += traded.gold;
    }
  }

  const allUnits = save.armies.flatMap((a) => a.units);
  const upkeep = calculateUpkeep(allUnits.map((u) => ({ type: u.type as UnitType, count: u.count })));

  save.kingdom.gold = Math.max(0, save.kingdom.gold + totalIncome.gold - (upkeep.gold ?? 0));
  save.kingdom.food = Math.max(0, save.kingdom.food + totalIncome.food - (upkeep.food ?? 0));
  save.kingdom.wood += totalIncome.wood;
  save.kingdom.stone += totalIncome.stone;
  save.kingdom.iron += totalIncome.iron;
  save.kingdom.influence += totalIncome.influence;
  save.lastTickAt = now;

  // Phase 3: lebendige Welt (KI, Belagerungen, Ereignisse, Chronik)
  ensureWorldFields(save);
  const sim = toSimWorld(save);
  const alerts = simulateWorldTick(sim);
  fromSimWorld(save, sim);

  // Phase 4: Dynastie & Hof
  ensureDynastySim(save);
  const ownedCount = save.provinces.filter((p) => p.ownerId === save.kingdom.id).length;
  const capitalName =
    save.provinces.find((p) => p.id === save.capitalProvinceId)?.name ??
    save.provinces.find((p) => p.ownerId === save.kingdom.id)?.name ??
    'Hauptstadt';
  const dyn = runDynastyTick({
    state: save.dynastySim!,
    tickCount: save.tickCount ?? 0,
    provinceCount: ownedCount,
    fame: save.kingdom.fame,
    kingdomName: save.kingdom.name,
    capitalName,
    pendingEvents: save.pendingEvents ?? [],
  });
  save.dynastySim = dyn.state;
  save.chronicle = [...(save.chronicle ?? []), ...dyn.chronicle];
  if (dyn.newEvents.length && (save.pendingEvents?.length ?? 0) === 0) {
    save.pendingEvents = dyn.newEvents;
  }
  // Sync dynasty info
  save.dynasty = {
    dynasty: {
      id: dyn.state.meta.id,
      name: dyn.state.meta.name,
      motto: dyn.state.meta.motto,
    },
    characters: dyn.state.characters,
    ruler: dyn.state.characters.find((c) => c.isRuler) ?? null,
    heir: dyn.state.characters.find((c) => c.isHeir) ?? null,
  };

  if (dyn.successionMsg) save.lastWorldAlert = dyn.successionMsg;
  else if (alerts.warAlert) save.lastWorldAlert = alerts.warAlert;
  else if (alerts.successionMsg) save.lastWorldAlert = alerts.successionMsg;
  else save.lastWorldAlert = undefined;

  // Phase 5.1: Großes Königreich
  ensureRealmSim(save);
  const ownedProv = save.provinces.filter((p) => p.ownerId === save.kingdom.id);
  const taxAvg =
    ownedProv.reduce((s, p) => s + (p.devStats?.taxRate ?? 30), 0) / Math.max(1, ownedProv.length);
  const prospAvg =
    ownedProv.reduce((s, p) => s + (p.prosperity ?? 50), 0) / Math.max(1, ownedProv.length);
  const coastalIds = save.provinces
    .filter((p) => p.terrain === Terrain.COAST || p.terrain === 'COAST')
    .map((p) => p.id);
  const realm = runRealmTick({
    state: save.realmSim!,
    tickCount: save.tickCount ?? 0,
    playerName: save.dynasty.ruler?.name ?? save.kingdom.name,
    taxRateAvg: taxAvg,
    prosperityAvg: prospAvg,
    warCount: (save.wars ?? []).filter(
      (w) => w.attackerId === save.kingdom.id || w.defenderId === save.kingdom.id,
    ).length,
    atWar: (save.wars ?? []).some(
      (w) => w.attackerId === save.kingdom.id || w.defenderId === save.kingdom.id,
    ),
    coastalProvinceIds: coastalIds,
  });
  save.realmSim = realm.state;
  save.chronicle = [...(save.chronicle ?? []), ...realm.chronicle];
  save.kingdom.gold = Math.max(0, save.kingdom.gold + realm.goldDelta);
  save.kingdom.food = Math.max(0, save.kingdom.food + realm.foodDelta);
  save.kingdom.fame += realm.fameDelta;
  if (realm.alert) save.lastWorldAlert = realm.alert;

  // Phase 5.2: Gesellschaft & Atmosphäre
  ensureSocietySim(save);
  const society = runSocietyTick({
    state: save.societySim!,
    tickCount: save.tickCount ?? 0,
    taxRateAvg: taxAvg,
    prosperityAvg: prospAvg,
    atWar: (save.wars ?? []).some(
      (w) => w.attackerId === save.kingdom.id || w.defenderId === save.kingdom.id,
    ),
    siegeActive: (save.sieges ?? []).some(
      (s) => s.attackerKingdomId === save.kingdom.id || s.defenderKingdomId === save.kingdom.id,
    ),
    pirateDisruption: (save.realmSim?.pirates ?? []).some((p) => p.active),
    piety: save.realmSim?.faith.piety ?? 20,
    tradeOpen: save.realmSim?.laws.active.includes('trade_open') ?? true,
    provinceNames: ownedProv.map((p) => p.name),
    cityNames: ownedProv.filter((p) => (p.city?.level ?? 0) > 0).map((p) => p.name),
    provinces: ownedProv.map((p) => ({
      id: p.id,
      terrain: p.terrain,
      name: p.name,
      prosperity: p.prosperity ?? 50,
    })),
    goldAvailable: save.kingdom.gold,
  });
  save.societySim = society.state;
  save.chronicle = [...(save.chronicle ?? []), ...society.chronicle];
  save.kingdom.gold = Math.max(0, save.kingdom.gold + society.goldDelta);
  save.kingdom.food = Math.max(0, save.kingdom.food + society.foodDelta);
  save.kingdom.fame += society.fameDelta;
  save.kingdom.influence += society.influenceDelta;
  if (society.prestigeDelta && save.dynastySim) {
    const ruler = save.dynastySim.characters.find((c) => c.isRuler);
    if (ruler) ruler.prestige += society.prestigeDelta;
    save.dynastySim.meta.prestige += society.prestigeDelta;
  }
  if (society.popLoss > 0 && ownedProv.length) {
    const victim = ownedProv[Math.floor(Math.random() * ownedProv.length)];
    victim.population = Math.max(50, victim.population - society.popLoss);
  }
  if (society.rulerHurt && save.dynastySim) {
    const ruler = save.dynastySim.characters.find((c) => c.isRuler);
    if (ruler) {
      ruler.health = Math.max(5, (ruler.health ?? 100) - 25);
      ruler.stress = Math.min(100, (ruler.stress ?? 0) + 20);
    }
  }
  if (
    society.newEvents.length === 0 &&
    (save.pendingEvents?.length ?? 0) === 0
  ) {
    const qev = pickQuestEvent(save.societySim);
    if (qev) save.pendingEvents = [qev];
  }
  if (society.alert) save.lastWorldAlert = society.alert;

  // Phase 5.3: Endgame, Weltgeschichte, Erfolge
  ensureEndgameSim(save);
  const capital =
    save.provinces.find((p) => p.id === save.capitalProvinceId) ??
    save.provinces.find((p) => p.ownerId === save.kingdom.id);
  const wars = save.wars ?? [];
  const playerWars = wars.filter(
    (w) => w.attackerId === save.kingdom.id || w.defenderId === save.kingdom.id,
  );
  const longestWar = playerWars.reduce(
    (m, w) => Math.max(m, (save.tickCount ?? 0) - (w.startedTick ?? 0)),
    0,
  );
  const endgame = runEndgameTick({
    state: save.endgameSim!,
    tickCount: save.tickCount ?? 0,
    year: 1042 + Math.floor((save.tickCount ?? 0) / 12),
    provinceCount: ownedProv.length,
    coastalNames: save.provinces
      .filter((p) => p.terrain === Terrain.COAST || p.terrain === 'COAST')
      .map((p) => p.name),
    gold: save.kingdom.gold,
    food: save.kingdom.food,
    fame: save.kingdom.fame,
    population: ownedProv.reduce((s, p) => s + p.population, 0),
    capitalPop: capital?.population ?? 0,
    capitalName: capital?.name ?? 'Hauptstadt',
    capitalCityLevel: capital?.city?.level ?? 0,
    rulerName: save.dynasty.ruler?.name ?? save.kingdom.name,
    dynastyName: save.dynastySim?.meta.name ?? save.kingdom.name,
    dynastyPrestige: save.dynastySim?.meta.prestige ?? 0,
    titleRank: save.dynastySim?.title.rank,
    hasCastle: ownedProv.some((p) => (p.castle?.level ?? 0) > 0),
    warCount: playerWars.length,
    longestWarTicks: longestWar,
    armyCount: save.armies.filter((a) => a.kingdomId === save.kingdom.id).length,
    techCount: save.realmSim?.tech.researched.length ?? 0,
    piety: save.realmSim?.faith.piety ?? 0,
    tradeRoutes: save.realmSim?.seaRoutes.length ?? 0,
    heroes: save.societySim?.heroes.length ?? 0,
    wondersCompleted: save.realmSim?.wonders.filter((w) => w.completed).length ?? 0,
    hasCathedral: save.realmSim?.wonders.some((w) => w.wonderId === 'great_cathedral' && w.completed) ?? false,
    fleetCount: save.realmSim?.fleets.length ?? 0,
    famineSeverity: save.societySim?.disasters.some((d) => d.kind === 'drought' || d.kind === 'harsh_winter')
      ? 5
      : save.endgameSim?.crises.some((c) => c.kind === 'famine')
        ? 8
        : undefined,
    plagueSeverity: save.societySim?.diseases[0]?.severity,
    rebellionStrength: save.realmSim?.civilWar?.active
      ? save.realmSim.civilWar.factions.reduce((s, f) => s + f.strength, 0)
      : undefined,
    generalFame: save.generals?.[0]?.fame,
    generalName: save.generals?.[0]?.name,
    tournamentWonThisTick: save.societySim?.tournament?.winner === 'Ihr Herrscher',
  });
  save.endgameSim = endgame.state;
  save.chronicle = [...(save.chronicle ?? []), ...endgame.chronicle];
  save.kingdom.gold = Math.max(0, save.kingdom.gold + endgame.goldDelta);
  save.kingdom.food = Math.max(0, save.kingdom.food + endgame.foodDelta);
  save.kingdom.fame += endgame.fameDelta;
  if (endgame.alert) save.lastWorldAlert = endgame.alert;

  storeSave(userId, save);
  return toGameState(save);
}

export const localApi = {
  async register(data: {
    email: string;
    username: string;
    password: string;
    kingdomName: string;
    rulerName: string;
  }) {
    const users = getUsers();
    if (users.some((u) => u.email === data.email || u.username === data.username)) {
      throw new Error('E-Mail oder Benutzername bereits vergeben');
    }
    const user: StoredUser = {
      id: uid(),
      email: data.email,
      username: data.username,
      passwordHash: await hashPassword(data.password),
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    setUsers(users);
    const save = finalizeNewSave(createNewSave(data.kingdomName, data.rulerName));
    storeSave(user.id, save);
    localStorage.setItem(SESSION_KEY, user.id);
    return {
      accessToken: user.id,
      user: { id: user.id, email: user.email, username: user.username, hasKingdom: true },
    };
  },

  async login(data: { email: string; password: string }) {
    const users = getUsers();
    const hash = await hashPassword(data.password);
    const user = users.find((u) => u.email === data.email && u.passwordHash === hash);
    if (!user) throw new Error('Ungültige Anmeldedaten');
    localStorage.setItem(SESSION_KEY, user.id);
    return {
      accessToken: user.id,
      user: { id: user.id, email: user.email, username: user.username, hasKingdom: true },
    };
  },

  async getMe(): Promise<User> {
    const userId = getSessionUserId();
    if (!userId) throw new Error('Nicht eingeloggt');
    const user = getUsers().find((u) => u.id === userId);
    if (!user) throw new Error('Benutzer nicht gefunden');
    return { id: user.id, email: user.email, username: user.username, hasKingdom: true };
  },

  async getProfile(): Promise<Profile> {
    const userId = getSessionUserId()!;
    const user = getUsers().find((u) => u.id === userId)!;
    const save = loadSave(userId)!;
    const owned = save.provinces.filter((p) => p.ownerId === save.kingdom.id);
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      kingdom: {
        id: save.kingdom.id,
        name: save.kingdom.name,
        resources: {
          gold: save.kingdom.gold,
          food: save.kingdom.food,
          wood: save.kingdom.wood,
          stone: save.kingdom.stone,
          iron: save.kingdom.iron,
          influence: save.kingdom.influence,
          fame: save.kingdom.fame,
        },
        dynasty: save.dynasty.dynasty,
        ruler: save.dynasty.ruler,
        provinceCount: owned.length,
        provinces: owned.map((p) => ({
          id: p.id,
          name: p.name,
          castle: p.castle,
          village: p.village,
          city: p.city,
        })),
      },
    };
  },

  async updateProfile(data: { username: string }) {
    const userId = getSessionUserId()!;
    const users = getUsers();
    if (users.some((u) => u.username === data.username && u.id !== userId)) {
      throw new Error('Benutzername bereits vergeben');
    }
    const idx = users.findIndex((u) => u.id === userId);
    users[idx].username = data.username;
    setUsers(users);
    return localApi.getProfile();
  },

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    const userId = getSessionUserId()!;
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    const hash = await hashPassword(data.currentPassword);
    if (users[idx].passwordHash !== hash) throw new Error('Aktuelles Passwort ist falsch');
    users[idx].passwordHash = await hashPassword(data.newPassword);
    setUsers(users);
    return { message: 'Passwort erfolgreich geändert' };
  },

  async getGameState(): Promise<GameState> {
    const userId = getSessionUserId()!;
    applyResourceTick(userId);
    const save = loadSave(userId)!;
    return toGameState(save);
  },

  async build(data: { provinceId: string; buildingType: string }) {
    const { userId, save } = requireSave();
    const province = save.provinces.find((p) => p.id === data.provinceId);
    if (!province || province.ownerId !== save.kingdom.id) throw new Error('Provinz gehört dir nicht');

    const def = BUILDING_DEFINITIONS[data.buildingType as BuildingType];
    if (!def) throw new Error('Unbekannter Gebäudetyp');

    const minCity = getCityBuildingMinLevel(def.category);
    if (minCity > 0 && (province.city?.level ?? 0) < minCity) {
      throw new Error('Stadt muss zuerst gegründet werden');
    }

    const existing = province.buildings.find((b) => b.type === data.buildingType);
    const nextLevel = existing ? existing.level + 1 : 1;
    if (nextLevel > def.maxLevel) throw new Error('Maximales Gebäudelevel erreicht');

    const cost = {
      gold: def.costPerLevel.gold * nextLevel,
      food: def.costPerLevel.food * nextLevel,
      wood: def.costPerLevel.wood * nextLevel,
      stone: def.costPerLevel.stone * nextLevel,
      iron: def.costPerLevel.iron * nextLevel,
    };
    const res = save.kingdom;
    if (!canAfford(res, cost)) throw new Error('Nicht genügend Ressourcen');
    const updated = subtractResources(res, cost);
    Object.assign(save.kingdom, updated);

    if (existing) existing.level = nextLevel;
    else province.buildings.push({ id: uid(), type: data.buildingType, level: 1 });

    if (def.effects.defense) province.defense += def.effects.defense;
    return persist(userId, save);
  },

  async recruit(data: { provinceId: string; unitType: string; count: number }) {
    const { userId, save } = requireSave();
    const def = UNIT_DEFINITIONS[data.unitType as UnitType];
    const cost = {
      gold: def.gold * data.count,
      food: def.food * data.count,
      wood: def.wood * data.count,
      stone: def.stone * data.count,
      iron: def.iron * data.count,
    };
    if (!canAfford(save.kingdom, cost)) throw new Error('Nicht genügend Ressourcen');
    Object.assign(save.kingdom, subtractResources(save.kingdom, cost));

    let garrison = save.armies.find(
      (a) => a.provinceId === data.provinceId && a.isGarrison,
    );
    if (!garrison) {
      garrison = { id: uid(), name: 'Garnison', provinceId: data.provinceId, morale: 100, isGarrison: true, units: [] };
      save.armies.push(garrison);
    }
    const unit = garrison.units.find((u) => u.type === data.unitType);
    if (unit) unit.count += data.count;
    else garrison.units.push({ id: uid(), type: data.unitType, count: data.count });

    return persist(userId, save);
  },

  async createArmy(data: { name: string; provinceId: string }) {
    const { userId, save } = requireSave();
    const garrison = save.armies.find((a) => a.provinceId === data.provinceId && a.isGarrison);
    if (!garrison?.units.length) throw new Error('Keine Truppen in der Garnison');

    save.armies.push({
      id: uid(),
      name: data.name,
      provinceId: data.provinceId,
      morale: 100,
      isGarrison: false,
      kingdomId: save.kingdom.id,
      units: garrison.units.map((u) => ({
        id: uid(),
        type: u.type,
        count: Math.floor(u.count / 2) || 1,
      })),
    });
    for (const u of garrison.units) {
      u.count = Math.max(0, u.count - (Math.floor(u.count / 2) || 1));
    }
    return { gameState: persist(userId, save) };
  },

  async upgradeCastle(data: { provinceId: string }) {
    const { userId, save } = requireSave();
    const province = save.provinces.find((p) => p.id === data.provinceId)!;
    if (!province.castle) throw new Error('Keine Burg');
    const next = province.castle.level + 1;
    if (next > 5) throw new Error('Maximale Burgstufe');
    const cost = { gold: 100 * next, food: 0, wood: 50 * next, stone: 80 * next, iron: 20 * next };
    if (!canAfford(save.kingdom, cost)) throw new Error('Nicht genügend Ressourcen');
    Object.assign(save.kingdom, subtractResources(save.kingdom, cost));
    province.castle.level = next;
    province.defense += 10;
    return persist(userId, save);
  },

  async foundCity(data: { provinceId: string }) {
    const { userId, save } = requireSave();
    const p = save.provinces.find((x) => x.id === data.provinceId)!;
    if ((p.village?.level ?? 0) < CITY_FOUND_REQUIREMENTS.minVillageLevel) {
      throw new Error('Dorf zu niedrig');
    }
    if (p.population < CITY_FOUND_REQUIREMENTS.minPopulation) throw new Error('Zu wenig Bevölkerung');
    if ((p.city?.level ?? 0) > 0) throw new Error('Stadt existiert bereits');
    if (!canAfford(save.kingdom, CITY_FOUND_COST)) throw new Error('Nicht genügend Ressourcen');
    Object.assign(save.kingdom, subtractResources(save.kingdom, CITY_FOUND_COST));
    p.city = { level: 1 };
    p.population += 500;
    p.prosperity += 15;
    save.kingdom.fame += 5;
    ensureProvinceDev(p);
    return persist(userId, save);
  },

  async upgradeCity(data: { provinceId: string }) {
    const { userId, save } = requireSave();
    const p = save.provinces.find((x) => x.id === data.provinceId)!;
    if (!p.city || p.city.level === 0) throw new Error('Keine Stadt');
    const next = p.city.level + 1;
    if (next > MAX_CITY_LEVEL) throw new Error('Maximale Stadtstufe');
    const cost = {
      gold: CITY_UPGRADE_COST_PER_LEVEL.gold * next,
      food: CITY_UPGRADE_COST_PER_LEVEL.food * next,
      wood: CITY_UPGRADE_COST_PER_LEVEL.wood * next,
      stone: CITY_UPGRADE_COST_PER_LEVEL.stone * next,
      iron: CITY_UPGRADE_COST_PER_LEVEL.iron * next,
    };
    if (!canAfford(save.kingdom, cost)) throw new Error('Nicht genügend Ressourcen');
    Object.assign(save.kingdom, subtractResources(save.kingdom, cost));
    p.city.level = next;
    p.prosperity += 10;
    return persist(userId, save);
  },

  async attack(data: { armyId: string; targetProvinceId: string; storm?: boolean }) {
    const { userId, save } = requireSave();
    ensureWorldFields(save);
    const army = save.armies.find((a) => a.id === data.armyId);
    if (!army || army.isGarrison) throw new Error('Armee nicht gefunden');
    army.kingdomId = save.kingdom.id;
    const target = save.provinces.find((p) => p.id === data.targetProvinceId)!;
    const source = save.provinces.find((p) => p.id === army.provinceId)!;

    if (!source.neighborSlugs.includes(target.slug) && army.provinceId !== target.id) {
      throw new Error('Muss Nachbar sein');
    }
    if (target.ownerId === save.kingdom.id) throw new Error('Eigene Provinz');

    // Kriegspflicht gegen KI-Reiche
    if (target.ownerId) {
      const isAi = save.aiKingdoms!.some((k) => k.id === target.ownerId);
      if (isAi && !areAtWar(save.wars!, save.kingdom.id, target.ownerId)) {
        throw new Error('Erst Krieg erklären (Diplomatie)');
      }
    }

    // Belagerung statt Sofortangriff bei Burg
    const castleLevel = target.castle?.level ?? 0;
    const existingSiege = save.sieges!.find((s) => s.provinceId === target.id);
    if (castleLevel >= 1 && !data.storm && !existingSiege) {
      army.provinceId = target.id;
      const siege = createSiege({
        id: uid(),
        provinceId: target.id,
        attackerKingdomId: save.kingdom.id,
        defenderKingdomId: target.ownerId ?? 'neutral',
        armyId: army.id,
        castleLevel,
        tick: save.tickCount ?? 0,
      });
      save.sieges!.push(siege);
      save.chronicle!.push(
        makeChronicle(
          save.tickCount ?? 0,
          'siege',
          `Belagerung von ${target.name}`,
          `Dein Heer schließt ${target.name} ein. Nahrung und Moral der Besatzung sinken mit der Zeit.`,
        ),
      );
      return {
        battle: {
          id: uid(),
          attackerWon: false,
          createdAt: new Date().toISOString(),
          province: { name: target.name },
          attacker: { name: save.kingdom.name },
          defender: { name: target.ownerName ?? 'Garnison' },
        },
        result: {
          attackerWon: false,
          summary: `Belagerung von ${target.name} begonnen (Fortschritt 0%). Stürmen oder warten.`,
          rounds: [],
          attackerCasualties: [],
          defenderCasualties: [],
        },
        gameState: persist(userId, save),
      };
    }

    const siege = existingSiege ?? save.sieges!.find((s) => s.provinceId === target.id);
    const stormBonus = siege ? stormAttackerBonus(siege) : 0;

    const defenderArmies = save.armies.filter((a) => a.provinceId === target.id && a.id !== army.id);
    let defenderUnits = defenderArmies.flatMap((a) =>
      a.units.map((u) => ({ type: u.type as UnitType, count: u.count })),
    );
    if (defenderUnits.length === 0) {
      defenderUnits = [{ type: UnitType.MILITIA, count: 5 + castleLevel * 3 }];
    }

    const aiDef = save.aiKingdoms!.find((k) => k.id === target.ownerId);
    const ruler = save.dynasty.ruler;
    const general = save.generals?.find((g) => g.id === army.generalId && g.alive);
    const result = resolveBattle({
      attackerUnits: army.units.map((u) => ({ type: u.type as UnitType, count: u.count })),
      defenderUnits,
      terrain: target.terrain as Terrain,
      attackerMorale: army.morale + stormBonus * 2,
      defenderMorale: siege ? Math.max(20, siege.morale) : 80,
      castleLevel: data.storm || siege ? Math.max(0, castleLevel - Math.floor(stormBonus / 3)) : castleLevel,
      attackerCommanderMartial: (general?.martial ?? ruler?.martial ?? 5) + stormBonus,
      defenderCommanderMartial: aiDef?.ruler.martial ?? 5,
    });

    for (const c of result.attackerCasualties) {
      const u = army.units.find((x) => x.type === c.type);
      if (u) u.count = Math.max(0, u.count - c.count);
    }
    army.units = army.units.filter((u) => u.count > 0);

    for (const d of defenderArmies) {
      for (const c of result.defenderCasualties) {
        const u = d.units.find((x) => x.type === c.type);
        if (u) u.count = Math.max(0, u.count - Math.ceil(c.count / Math.max(1, defenderArmies.length)));
      }
      d.units = d.units.filter((u) => u.count > 0);
    }
    save.armies = save.armies.filter((a) => a.units.reduce((s, u) => s + u.count, 0) > 0 || a.isGarrison);

    if (army.units.length === 0) {
      save.armies = save.armies.filter((a) => a.id !== army.id);
      if (siege) save.sieges = save.sieges!.filter((s) => s.id !== siege.id);
    }

    if (result.attackerWon) {
      const oldOwner = target.ownerId;
      const wasEnemy = Boolean(oldOwner);
      target.ownerId = save.kingdom.id;
      target.ownerName = save.kingdom.name;
      army.provinceId = target.id;
      if (!target.castle) target.castle = { level: 1 };
      if (!target.village) target.village = { level: 1 };
      if (!target.city) target.city = { level: 0 };
      ensureProvinceDev(target);
      save.kingdom.fame += wasEnemy ? 10 : 5;
      if (siege) save.sieges = save.sieges!.filter((s) => s.provinceId !== target.id);
      if (oldOwner) adjustOpinion(save.relations!, oldOwner, save.kingdom.id, -25, 'defeat');
      save.chronicle!.push(
        makeChronicle(
          save.tickCount ?? 0,
          'battle',
          `${target.name} erobert`,
          result.summary,
        ),
      );
    }

    const battle: Battle = {
      id: uid(),
      attackerWon: result.attackerWon,
      createdAt: new Date().toISOString(),
      province: { name: target.name },
      attacker: { name: save.kingdom.name },
      defender: { name: target.ownerName ?? 'Garnison' },
    };
    save.battles.unshift(battle);

    return { battle, result, gameState: persist(userId, save) };
  },

  async abandonSiege(data: { siegeId: string }) {
    const { userId, save } = requireSave();
    ensureWorldFields(save);
    save.sieges = save.sieges!.filter((s) => s.id !== data.siegeId);
    return persist(userId, save);
  },

  async resolveWorldEvent(data: { eventId: string; choiceId: string }) {
    const { userId, save } = requireSave();
    ensureWorldFields(save);
    const ev = save.pendingEvents!.find((e) => e.id === data.eventId);
    if (!ev) throw new Error('Ereignis nicht gefunden');

    // Immersion / Hof-Ereignisse (Phase 4)
    if (ev.templateId.startsWith('immersion:')) {
      const effect = resolveImmersionChoice(ev.templateId, data.choiceId);
      if (!effect) throw new Error('Ungültige Wahl');
      save.kingdom.gold = Math.max(0, save.kingdom.gold + (effect.gold ?? 0));
      save.kingdom.food = Math.max(0, save.kingdom.food + (effect.food ?? 0));
      save.kingdom.influence += effect.influence ?? 0;
      save.kingdom.fame += effect.fame ?? 0;
      if (save.dynastySim) {
        const ruler = save.dynastySim.characters.find((c) => c.isRuler);
        if (ruler) {
          ruler.prestige += effect.prestige ?? 0;
          ruler.stress = Math.max(0, Math.min(100, ruler.stress + (effect.stress ?? 0)));
          if (effect.loyaltyAll) {
            for (const c of save.dynastySim.characters) {
              if (!c.isRuler) c.loyalty = Math.max(0, Math.min(100, (c.loyalty ?? 50) + effect.loyaltyAll));
            }
          }
        }
        save.dynastySim.meta.prestige += effect.prestige ?? 0;
      }
      save.chronicle!.push(
        makeChronicle(
          save.tickCount ?? 0,
          'event',
          effect.chronicleTitle ?? ev.title,
          effect.chronicleText ?? `Entscheidung: ${data.choiceId}`,
        ),
      );
      save.pendingEvents = save.pendingEvents!.filter((e) => e.id !== data.eventId);
      ensureDynastySim(save);
      return persist(userId, save);
    }

    // Dynamische Quests (Phase 5.2)
    if (ev.templateId.startsWith('quest:')) {
      ensureSocietySim(save);
      const { state, result } = societyAcceptQuest(
        save.societySim!,
        ev.id,
        data.choiceId,
        save.tickCount ?? 0,
      );
      save.societySim = state;
      save.kingdom.gold = Math.max(0, save.kingdom.gold + result.gold);
      save.kingdom.food = Math.max(0, save.kingdom.food + result.food);
      save.kingdom.fame += result.fame;
      save.kingdom.influence += result.influence;
      if (save.dynastySim && result.prestige) {
        const ruler = save.dynastySim.characters.find((c) => c.isRuler);
        if (ruler) ruler.prestige += result.prestige;
        save.dynastySim.meta.prestige += result.prestige;
      }
      save.chronicle!.push(result.entry);
      save.pendingEvents = save.pendingEvents!.filter((e) => e.id !== data.eventId);
      return persist(userId, save);
    }

    const effect = resolveEventChoice(ev.templateId, data.choiceId);
    if (!effect) throw new Error('Ungültige Wahl');

    save.kingdom.gold = Math.max(0, save.kingdom.gold + (effect.gold ?? 0));
    save.kingdom.food = Math.max(0, save.kingdom.food + (effect.food ?? 0));
    save.kingdom.wood = Math.max(0, save.kingdom.wood + (effect.wood ?? 0));
    save.kingdom.stone = Math.max(0, save.kingdom.stone + (effect.stone ?? 0));
    save.kingdom.iron = Math.max(0, save.kingdom.iron + (effect.iron ?? 0));
    save.kingdom.influence += effect.influence ?? 0;
    save.kingdom.fame += effect.fame ?? 0;

    if (ev.provinceId) {
      const p = save.provinces.find((x) => x.id === ev.provinceId);
      if (p) {
        if (effect.populationDelta) p.population = Math.max(50, p.population + effect.populationDelta);
        if (effect.prosperityDelta) p.prosperity = Math.max(0, Math.min(100, p.prosperity + effect.prosperityDelta));
        if (effect.satisfactionDelta && p.devStats) {
          p.devStats.satisfaction = Math.max(
            0,
            Math.min(100, p.devStats.satisfaction + effect.satisfactionDelta),
          );
        }
      }
    }

    if (effect.chronicleTitle) {
      save.chronicle!.push(
        makeChronicle(
          save.tickCount ?? 0,
          'event',
          effect.chronicleTitle,
          effect.chronicleText ?? ev.title,
        ),
      );
    } else {
      save.chronicle!.push(
        makeChronicle(save.tickCount ?? 0, 'event', ev.title, `Entscheidung: ${data.choiceId}`),
      );
    }

    if (ev.templateId === 'hero_appears' && data.choiceId === 'hire_general') {
      save.generals!.push({
        id: uid(),
        kingdomId: save.kingdom.id,
        name: 'Legendenfeldherr',
        age: 38,
        martial: 14,
        personality: 'legendär',
        experience: 40,
        traits: ['mutig', 'charismatisch'],
        alive: true,
        fame: 20,
      });
    }

    save.pendingEvents = save.pendingEvents!.filter((e) => e.id !== data.eventId);
    return persist(userId, save);
  },

  async sendSpy(data: { targetKingdomId: string; mission: 'intel' | 'sabotage' | 'steal' | 'revolt' }) {
    const { userId, save } = requireSave();
    ensureWorldFields(save);
    if ((save.playerSpies ?? 0) < 1) throw new Error('Keine Spione verfügbar');
    if (save.kingdom.gold < 40) throw new Error('Nicht genug Gold (40)');
    save.kingdom.gold -= 40;
    save.playerSpies = (save.playerSpies ?? 1) - 1;
    const target = save.aiKingdoms!.find((k) => k.id === data.targetKingdomId);
    if (!target) throw new Error('Zielreich nicht gefunden');

    const success = Math.random() < 0.55 + (save.dynasty.ruler?.intrigue ?? 5) * 0.03;
    const discovered = !success && Math.random() < 0.4;
    let text = '';
    if (success) {
      save.playerSpies = (save.playerSpies ?? 0) + 1;
      if (data.mission === 'intel') {
        text = `${target.name}: ${personalityLabel(target.personality)}, Gold ~${target.gold}, ${save.provinces.filter((p) => p.ownerId === target.id).length} Provinzen.`;
        save.kingdom.influence += 3;
      } else if (data.mission === 'steal') {
        const steal = Math.min(80, Math.floor(target.gold * 0.15));
        target.gold -= steal;
        save.kingdom.gold += steal;
        text = `Spion stahl ${steal} Gold aus ${target.name}.`;
      } else if (data.mission === 'sabotage') {
        const p = save.provinces.find((x) => x.ownerId === target.id);
        if (p) {
          p.prosperity = Math.max(0, p.prosperity - 8);
          p.defense = Math.max(5, p.defense - 5);
        }
        text = `Sabotage in ${target.name} – Verteidigung und Wohlstand geschwächt.`;
        adjustOpinion(save.relations!, save.kingdom.id, target.id, -10, 'Spionage');
      } else {
        const p = save.provinces.find((x) => x.ownerId === target.id);
        if (p) p.population = Math.max(50, p.population - 100);
        text = `Unruhen in ${target.name} geschürt.`;
        adjustOpinion(save.relations!, save.kingdom.id, target.id, -15, 'Spionage');
      }
    } else {
      save.playerSpies = (save.playerSpies ?? 0) + 1;
      text = discovered
        ? `Spion in ${target.name} enttarnt! Beziehungen verschlechtern sich.`
        : `Mission in ${target.name} gescheitert.`;
      if (discovered) adjustOpinion(save.relations!, save.kingdom.id, target.id, -20, 'Spion enttarnt');
    }
    save.chronicle!.push(makeChronicle(save.tickCount ?? 0, 'spy', 'Spionage', text));
    save.lastWorldAlert = text;
    return persist(userId, save);
  },

  async assignGeneral(data: { armyId: string; generalId: string | null }) {
    const { userId, save } = requireSave();
    ensureWorldFields(save);
    const army = save.armies.find((a) => a.id === data.armyId);
    if (!army || army.isGarrison) throw new Error('Feldarmee nicht gefunden');
    if (data.generalId) {
      const g = save.generals!.find((x) => x.id === data.generalId && x.alive);
      if (!g || g.kingdomId !== save.kingdom.id) throw new Error('General nicht gefunden');
      for (const a of save.armies) {
        if (a.generalId === data.generalId) a.generalId = undefined;
      }
      army.generalId = data.generalId;
      g.armyId = army.id;
    } else {
      army.generalId = undefined;
    }
    return persist(userId, save);
  },

  async getChronicle() {
    const save = loadSave(getSessionUserId()!)!;
    ensureWorldFields(save);
    return {
      entries: [...(save.chronicle ?? [])].reverse(),
      year: 1042 + Math.floor((save.tickCount ?? 0) / 12),
      tickCount: save.tickCount ?? 0,
    };
  },

  async upgradeVillage(data: { provinceId: string }) {
    const { userId, save } = requireSave();
    const p = save.provinces.find((x) => x.id === data.provinceId);
    if (!p || p.ownerId !== save.kingdom.id) throw new Error('Provinz gehört dir nicht');
    if (!p.village) throw new Error('Kein Dorf');
    const next = p.village.level + 1;
    if (next > 5) throw new Error('Maximales Dorflevel');
    const cost = { gold: 80 * next, food: 40 * next, wood: 60 * next, stone: 40 * next, iron: 10 * next };
    if (!canAfford(save.kingdom, cost)) throw new Error('Nicht genügend Ressourcen');
    Object.assign(save.kingdom, subtractResources(save.kingdom, cost));
    p.village.level = next;
    p.population += 200;
    p.prosperity += 5;
    ensureProvinceDev(p);
    return persist(userId, save);
  },

  async placeCityTile(data: { provinceId: string; x: number; y: number; kind: string }) {
    const { userId, save } = requireSave();
    const p = save.provinces.find((x) => x.id === data.provinceId);
    if (!p || p.ownerId !== save.kingdom.id) throw new Error('Provinz gehört dir nicht');
    ensureProvinceDev(p);
    const kind = data.kind as CityTileKind;
    const def = CITY_TILE_DEFS[kind];
    if (!def || kind === CityTileKind.EMPTY) throw new Error('Ungültiges Gebäude');
    const cityLevel = p.city?.level ?? 0;
    if (cityLevel < def.minCityLevel) {
      throw new Error(`Benötigt Stadtstufe ${def.minCityLevel}`);
    }
    const tile = p.cityGrid!.find((t) => t.x === data.x && t.y === data.y);
    if (!tile) throw new Error('Feld außerhalb der Stadt');
    if (tile.kind !== CityTileKind.EMPTY && kind !== CityTileKind.ROAD) {
      throw new Error('Feld ist belegt – erst abreißen');
    }
    // Straßenanschluss für Gebäude (außer Straßen/Felder/Mauer)
    if (
      def.category === 'building' &&
      kind !== CityTileKind.CASTLE_KEEP &&
      !hasRoadOrIsRoad(p.cityGrid!, data.x, data.y, kind)
    ) {
      throw new Error('Gebäude braucht Straßenanschluss');
    }
    const cost = {
      gold: def.cost.gold,
      food: def.cost.food ?? 0,
      wood: def.cost.wood,
      stone: def.cost.stone,
      iron: def.cost.iron,
    };
    if (!canAfford(save.kingdom, cost)) throw new Error('Nicht genügend Ressourcen');
    Object.assign(save.kingdom, subtractResources(save.kingdom, cost));
    tile.kind = kind;
    tile.level = 1;
    const ticks = constructionTicks(kind);
    tile.buildRemaining = ticks > 0 ? ticks : 0;
    if (def.district === 'verteidigung') {
      p.defense += kind === CityTileKind.TOWER ? 5 : kind === CityTileKind.WALL ? 2 : 3;
    }
    return persist(userId, save);
  },

  async upgradeCityTile(data: { provinceId: string; x: number; y: number }) {
    const { userId, save } = requireSave();
    const p = save.provinces.find((x) => x.id === data.provinceId);
    if (!p || p.ownerId !== save.kingdom.id) throw new Error('Provinz gehört dir nicht');
    ensureProvinceDev(p);
    const tile = p.cityGrid!.find((t) => t.x === data.x && t.y === data.y);
    if (!tile || tile.kind === CityTileKind.EMPTY || tile.kind === CityTileKind.ROAD) {
      throw new Error('Kein Gebäude zum Ausbauen');
    }
    if (tile.buildRemaining && tile.buildRemaining > 0) {
      throw new Error('Gebäude wird noch gebaut');
    }
    const def = CITY_TILE_DEFS[tile.kind];
    const maxLevel = tile.kind === CityTileKind.CASTLE_KEEP ? 5 : 4;
    if (tile.level >= maxLevel) throw new Error('Maximale Ausbaustufe erreicht');
    const mult = upgradeCostMultiplier(tile.level);
    const cost = {
      gold: def.cost.gold * mult,
      food: (def.cost.food ?? 0) * mult,
      wood: def.cost.wood * mult,
      stone: def.cost.stone * mult,
      iron: def.cost.iron * mult,
    };
    if (!canAfford(save.kingdom, cost)) throw new Error('Nicht genügend Ressourcen');
    Object.assign(save.kingdom, subtractResources(save.kingdom, cost));
    tile.level += 1;
    tile.buildRemaining = Math.max(1, constructionTicks(tile.kind) - 1);
    return persist(userId, save);
  },

  async setProvinceTax(data: { provinceId: string; taxRate: number }) {
    const { userId, save } = requireSave();
    const p = save.provinces.find((x) => x.id === data.provinceId);
    if (!p || p.ownerId !== save.kingdom.id) throw new Error('Provinz gehört dir nicht');
    ensureProvinceDev(p);
    p.devStats!.taxRate = Math.max(0, Math.min(80, Math.round(data.taxRate)));
    return persist(userId, save);
  },

  async setCapital(data: { provinceId: string }) {
    const { userId, save } = requireSave();
    const p = save.provinces.find((x) => x.id === data.provinceId);
    if (!p || p.ownerId !== save.kingdom.id) throw new Error('Provinz gehört dir nicht');
    save.capitalProvinceId = p.id;
    return persist(userId, save);
  },

  async demolishCityTile(data: { provinceId: string; x: number; y: number }) {
    const { userId, save } = requireSave();
    const p = save.provinces.find((x) => x.id === data.provinceId);
    if (!p || p.ownerId !== save.kingdom.id) throw new Error('Provinz gehört dir nicht');
    ensureProvinceDev(p);
    const tile = p.cityGrid!.find((t) => t.x === data.x && t.y === data.y);
    if (!tile || tile.kind === CityTileKind.EMPTY) throw new Error('Nichts zum Abreißen');
    if (tile.kind === CityTileKind.CASTLE_KEEP) throw new Error('Burgfried kann nicht abgerissen werden');
    tile.kind = CityTileKind.EMPTY;
    tile.level = 1;
    tile.buildRemaining = 0;
    return persist(userId, save);
  },

  async getDynasty(): Promise<DynastyInfo> {
    return loadSave(getSessionUserId()!)!.dynasty;
  },

  async march(data: { armyId: string; targetProvinceId: string }) {
    const { userId, save } = requireSave();
    const army = save.armies.find((a) => a.id === data.armyId);
    if (!army || army.isGarrison) throw new Error('Armee nicht gefunden');
    const target = save.provinces.find((p) => p.id === data.targetProvinceId)!;
    const source = save.provinces.find((p) => p.id === army.provinceId)!;
    if (!source.neighborSlugs.includes(target.slug)) throw new Error('Muss Nachbar sein');
    army.provinceId = target.id;
    return persist(userId, save);
  },

  async getDiplomacy(): Promise<DiplomacyState> {
    const save = loadSave(getSessionUserId()!)!;
    ensureWorldFields(save);
    const kid = save.kingdom.id;
    const kingdoms = save.aiKingdoms!.map((k) => ({
      id: k.id,
      name: k.name,
      personality: personalityLabel(k.personality),
      religion: k.religion,
      culture: k.culture,
      provinceCount: save.provinces.filter((p) => p.ownerId === k.id).length,
      rulerName: k.ruler.name,
    }));
    const relations = save.aiKingdoms!.map((k) => {
      const rel = ensureRelation(save.relations!, kid, k.id);
      const atWar = areAtWar(save.wars!, kid, k.id);
      return {
        id: `${kid}_${k.id}`,
        status: atWar ? 'AT_WAR' : rel.status,
        opinion: rel.opinion,
        label: relationLabel(rel.opinion, atWar),
        lastReason: rel.lastReason,
        partner: { id: k.id, name: k.name },
      };
    });
    return {
      relations,
      kingdoms,
      myAlliance: null,
      availableAlliances: [],
      wars: save.wars!.map((w) => ({
        ...w,
        attackerName:
          w.attackerId === kid
            ? save.kingdom.name
            : save.aiKingdoms!.find((a) => a.id === w.attackerId)?.name ?? '?',
        defenderName:
          w.defenderId === kid
            ? save.kingdom.name
            : save.aiKingdoms!.find((a) => a.id === w.defenderId)?.name ?? '?',
      })),
    };
  },

  async declareWar(targetKingdomId: string) {
    const { userId, save } = requireSave();
    ensureWorldFields(save);
    if (areAtWar(save.wars!, save.kingdom.id, targetKingdomId)) throw new Error('Bereits im Krieg');
    if (save.kingdom.influence < 10) throw new Error('Nicht genug Einfluss (10)');
    save.kingdom.influence -= 10;
    const target = save.aiKingdoms!.find((k) => k.id === targetKingdomId);
    if (!target) throw new Error('Reich nicht gefunden');
    const reasonId: WarReasonId = 'ambition';
    const text = `${save.kingdom.name} erklärt ${target.name} den Krieg wegen: ${WAR_REASONS[reasonId]}`;
    save.wars!.push({
      id: uid(),
      attackerId: save.kingdom.id,
      defenderId: targetKingdomId,
      reasonId,
      reasonText: text,
      startedTick: save.tickCount ?? 0,
      startedAt: Date.now(),
    });
    const rel = ensureRelation(save.relations!, save.kingdom.id, targetKingdomId);
    rel.status = 'AT_WAR';
    rel.opinion = Math.min(rel.opinion, -50);
    save.chronicle!.push(makeChronicle(save.tickCount ?? 0, 'war', 'Kriegserklärung', text));
    storeSave(userId, save);
    return localApi.getDiplomacy();
  },

  async makePeace(targetKingdomId: string) {
    const { userId, save } = requireSave();
    ensureWorldFields(save);
    save.wars = save.wars!.filter(
      (w) =>
        !(
          (w.attackerId === save.kingdom.id && w.defenderId === targetKingdomId) ||
          (w.defenderId === save.kingdom.id && w.attackerId === targetKingdomId)
        ),
    );
    const rel = ensureRelation(save.relations!, save.kingdom.id, targetKingdomId);
    rel.status = 'NEUTRAL';
    rel.opinion = Math.min(0, rel.opinion + 20);
    adjustOpinion(save.relations!, save.kingdom.id, targetKingdomId, 10, 'Frieden');
    const name = save.aiKingdoms!.find((k) => k.id === targetKingdomId)?.name ?? 'Gegner';
    save.chronicle!.push(
      makeChronicle(save.tickCount ?? 0, 'peace', 'Frieden', `Frieden mit ${name} geschlossen.`),
    );
    // Belagerungen gegen dieses Reich beenden
    save.sieges = save.sieges!.filter(
      (s) => s.attackerKingdomId !== targetKingdomId && s.defenderKingdomId !== targetKingdomId,
    );
    storeSave(userId, save);
    return localApi.getDiplomacy();
  },

  async proposeAlliance(targetKingdomId: string, allianceName: string) {
    const { userId, save } = requireSave();
    ensureWorldFields(save);
    const rel = ensureRelation(save.relations!, save.kingdom.id, targetKingdomId);
    if (rel.status === 'AT_WAR') throw new Error('Im Krieg kein Bündnis');
    if (rel.opinion < 20) throw new Error('Beziehungen zu schlecht (mind. +20)');
    if (save.kingdom.influence < 15) throw new Error('Nicht genug Einfluss (15)');
    save.kingdom.influence -= 15;
    rel.status = 'ALLIED';
    adjustOpinion(save.relations!, save.kingdom.id, targetKingdomId, 20, allianceName || 'Bündnis');
    storeSave(userId, save);
    return { diplomacy: await localApi.getDiplomacy() };
  },

  async joinAlliance(allianceId: string) {
    void allianceId;
    return localApi.getDiplomacy();
  },

  async proposeTrade(targetKingdomId: string) {
    const { userId, save } = requireSave();
    ensureWorldFields(save);
    const rel = ensureRelation(save.relations!, save.kingdom.id, targetKingdomId);
    if (rel.status === 'AT_WAR') throw new Error('Im Krieg kein Handel');
    if (save.kingdom.influence < 5) throw new Error('Nicht genug Einfluss (5)');
    save.kingdom.influence -= 5;
    rel.status = 'TRADE_PACT';
    adjustOpinion(save.relations!, save.kingdom.id, targetKingdomId, 8, 'Handelsvertrag');
    save.kingdom.gold += 15;
    storeSave(userId, save);
    return localApi.getDiplomacy();
  },

  async marry(data: { candidateId: string }) {
    const { userId, save } = requireSave();
    ensureWorldFields(save);
    const ruler = save.dynastySim!.characters.find((c) => c.isRuler);
    if (!ruler) throw new Error('Kein Herrscher');
    const result = arrangeMarriage(save.dynastySim!, ruler.id, data.candidateId, save.tickCount ?? 0);
    if ('error' in result) throw new Error(result.error);
    save.dynastySim = result.state;
    save.chronicle!.push(result.entry);
    save.kingdom.fame += 5;
    save.kingdom.influence += 5;
    ensureDynastySim(save);
    return persist(userId, save);
  },

  async seekMarriage() {
    const { userId, save } = requireSave();
    ensureWorldFields(save);
    const capital =
      save.provinces.find((p) => p.id === save.capitalProvinceId)?.name ?? 'Hof';
    save.dynastySim = refreshSpouseCandidates(save.dynastySim!, save.tickCount ?? 0, capital);
    ensureDynastySim(save);
    return persist(userId, save);
  },

  async setEducation(data: { characterId: string; focus: string }) {
    const { userId, save } = requireSave();
    ensureWorldFields(save);
    save.dynastySim = setEducation(
      save.dynastySim!,
      data.characterId,
      data.focus as 'diplomacy' | 'war' | 'stewardship' | 'learning' | 'faith' | 'intrigue',
    );
    ensureDynastySim(save);
    return persist(userId, save);
  },

  async assignCouncil(data: { role: string; characterId: string | null }) {
    const { userId, save } = requireSave();
    ensureWorldFields(save);
    save.dynastySim = assignCouncil(
      save.dynastySim!,
      data.role as 'chancellor' | 'marshal' | 'steward' | 'spymaster' | 'chaplain' | 'builder',
      data.characterId,
    );
    ensureDynastySim(save);
    return persist(userId, save);
  },

  async hostTournament() {
    const { userId, save } = requireSave();
    ensureWorldFields(save);
    if (save.kingdom.gold < 120) throw new Error('Nicht genug Gold (120)');
    save.kingdom.gold -= 120;
    save.kingdom.fame += 8;
    if (save.dynastySim) {
      const ruler = save.dynastySim.characters.find((c) => c.isRuler);
      if (ruler) {
        ruler.prestige += 12;
        ruler.stress = Math.max(0, ruler.stress - 8);
      }
      save.dynastySim.meta.prestige += 12;
    }
    save.chronicle!.push(
      makeChronicle(
        save.tickCount ?? 0,
        'event',
        'Turnier',
        'Ein großes Ritterturnier wurde ausgerichtet. Banner wehten über dem Hof.',
      ),
    );
    ensureDynastySim(save);
    return persist(userId, save);
  },

  async setSuccessionLaw(data: { law: string }) {
    const { userId, save } = requireSave();
    ensureRealmSim(save);
    save.realmSim = setSuccession(
      save.realmSim!,
      data.law as 'primogeniture' | 'elective' | 'partition' | 'ultimogeniture' | 'house_elective',
    );
    save.chronicle!.push(
      makeChronicle(save.tickCount ?? 0, 'event', 'Erbfolgegesetz', `Neues Erbrecht: ${data.law}`),
    );
    return persist(userId, save);
  },

  async toggleRealmLaw(data: { lawId: string }) {
    const { userId, save } = requireSave();
    ensureRealmSim(save);
    save.realmSim = setRealmLaw(
      save.realmSim!,
      data.lawId as
        | 'tax_low'
        | 'tax_normal'
        | 'tax_high'
        | 'military_duty'
        | 'religious_freedom'
        | 'noble_privileges'
        | 'peasant_rights'
        | 'trade_open'
        | 'serfdom'
        | 'conscription',
    );
    return persist(userId, save);
  },

  async startTechResearch(data: { techId: string }) {
    const { userId, save } = requireSave();
    ensureRealmSim(save);
    const r = startResearch(save.realmSim!, data.techId);
    if (r.error) throw new Error(r.error);
    save.realmSim = r.state;
    return persist(userId, save);
  },

  async setTechBudget(data: { gold: number }) {
    const { userId, save } = requireSave();
    ensureRealmSim(save);
    save.realmSim = setResearchBudget(save.realmSim!, data.gold);
    return persist(userId, save);
  },

  async grantVassal(data: {
    name: string;
    characterId: string;
    rank: string;
    provinceIds: string[];
  }) {
    const { userId, save } = requireSave();
    ensureRealmSim(save);
    const owned = new Set(
      save.provinces.filter((p) => p.ownerId === save.kingdom.id).map((p) => p.id),
    );
    if (data.provinceIds.some((id) => !owned.has(id))) {
      throw new Error('Nur eigene Provinzen können Vasallen zugewiesen werden');
    }
    // Hauptstadt nicht vergeben
    if (save.capitalProvinceId && data.provinceIds.includes(save.capitalProvinceId)) {
      throw new Error('Die Hauptstadt bleibt unter direkter Kontrolle');
    }
    const r = grantVassal(save.realmSim!, {
      name: data.name,
      characterId: data.characterId,
      rank: data.rank as 'graf' | 'markgraf' | 'herzog' | 'fuerst' | 'koenigsvassal',
      provinceIds: data.provinceIds,
    });
    if (r.error) throw new Error(r.error);
    save.realmSim = r.state;
    save.chronicle!.push(
      makeChronicle(
        save.tickCount ?? 0,
        'event',
        'Vasall ernannt',
        `${data.name} wird als Vasall eingesetzt.`,
      ),
    );
    return persist(userId, save);
  },

  async startWonder(data: { wonderId: string; provinceId: string }) {
    const { userId, save } = requireSave();
    ensureRealmSim(save);
    const r = beginWonder(
      save.realmSim!,
      data.wonderId as
        | 'great_cathedral'
        | 'imperial_palace'
        | 'great_library'
        | 'grand_harbor'
        | 'imperial_fortress'
        | 'royal_garden',
      data.provinceId,
    );
    if (r.error || !r.cost) throw new Error(r.error ?? 'Wunder fehlgeschlagen');
    const cost = r.cost;
    if (
      save.kingdom.gold < cost.gold ||
      save.kingdom.wood < cost.wood ||
      save.kingdom.stone < cost.stone ||
      save.kingdom.iron < cost.iron
    ) {
      throw new Error('Nicht genug Ressourcen für das Wunder');
    }
    save.kingdom.gold -= cost.gold;
    save.kingdom.wood -= cost.wood;
    save.kingdom.stone -= cost.stone;
    save.kingdom.iron -= cost.iron;
    save.realmSim = r.state;
    const def = WONDERS.find((w) => w.id === data.wonderId);
    save.chronicle!.push(
      makeChronicle(
        save.tickCount ?? 0,
        'city',
        `Wunder begonnen: ${def?.name ?? data.wonderId}`,
        'Die Bauarbeiten am Weltwunder beginnen.',
      ),
    );
    return persist(userId, save);
  },

  async doPilgrimage() {
    const { userId, save } = requireSave();
    ensureRealmSim(save);
    if (save.kingdom.gold < 40) throw new Error('Nicht genug Gold (40)');
    save.kingdom.gold -= 40;
    save.realmSim = doPilgrimage(save.realmSim!);
    save.kingdom.fame += 2;
    save.chronicle!.push(
      makeChronicle(
        save.tickCount ?? 0,
        'event',
        'Pilgerreise',
        'Der Herrscher pilgert und stärkt seinen Glauben.',
      ),
    );
    return persist(userId, save);
  },

  async foundKnightOrder(data: { orderId: string }) {
    const { userId, save } = requireSave();
    ensureRealmSim(save);
    if (save.kingdom.gold < 100) throw new Error('Nicht genug Gold (100)');
    const r = foundKnightOrder(
      save.realmSim!,
      data.orderId as 'crown' | 'lion' | 'north',
    );
    if (r.error) throw new Error(r.error);
    save.kingdom.gold -= 100;
    save.realmSim = r.state;
    return persist(userId, save);
  },

  async buildFleet(data: {
    name: string;
    provinceId: string;
    type: string;
    count: number;
  }) {
    const { userId, save } = requireSave();
    ensureRealmSim(save);
    const prov = save.provinces.find((p) => p.id === data.provinceId);
    if (!prov || prov.ownerId !== save.kingdom.id) throw new Error('Provinz nicht im Besitz');
    if (prov.terrain !== Terrain.COAST && prov.terrain !== 'COAST') {
      throw new Error('Flotten nur an der Küste');
    }
    if (!save.realmSim!.tech.researched.includes('nav_1') && data.type !== 'trade') {
      // Handelsschiffe ab nav_1; ohne Tech nur 1 Handelsschiff erlauben wenn nav fehlt
    }
    if (!save.realmSim!.tech.researched.includes('nav_1')) {
      throw new Error('Benötigt Technologie: Küstenschifffahrt');
    }
    if (data.type === 'war' && !save.realmSim!.tech.researched.includes('nav_2')) {
      throw new Error('Benötigt Technologie: Hochseeschiffe');
    }
    const r = buildFleet(save.realmSim!, {
      name: data.name || 'Flotte',
      provinceId: data.provinceId,
      type: data.type as 'trade' | 'war' | 'transport',
      count: data.count || 1,
    });
    if (r.error) throw new Error(r.error);
    if (
      save.kingdom.gold < r.cost.gold ||
      save.kingdom.wood < r.cost.wood ||
      save.kingdom.iron < r.cost.iron
    ) {
      throw new Error('Nicht genug Ressourcen für die Flotte');
    }
    save.kingdom.gold -= r.cost.gold;
    save.kingdom.wood -= r.cost.wood;
    save.kingdom.iron -= r.cost.iron;
    save.realmSim = r.state;
    return persist(userId, save);
  },

  async huntPirates() {
    const { userId, save } = requireSave();
    ensureRealmSim(save);
    const r = huntPirates(save.realmSim!);
    save.realmSim = r.state;
    save.chronicle!.push(
      makeChronicle(save.tickCount ?? 0, 'battle', 'Piratenjagd', r.message),
    );
    if (r.victory) save.kingdom.fame += 3;
    return persist(userId, save);
  },

  async startSocietySpy(data: { type: string; targetName: string }) {
    const { userId, save } = requireSave();
    ensureSocietySim(save);
    const r = societyStartSpy(
      save.societySim!,
      data.type as
        | 'intel'
        | 'scout_city'
        | 'watch_army'
        | 'inspect_castle'
        | 'steal_gold'
        | 'burn_supplies'
        | 'arson'
        | 'bribe_general'
        | 'influence_vassal'
        | 'prepare_assassination',
      data.targetName || 'Nachbarreich',
      save.tickCount ?? 0,
    );
    if (r.error) throw new Error(r.error);
    if (save.kingdom.gold < r.cost) throw new Error(`Nicht genug Gold (${r.cost})`);
    save.kingdom.gold -= r.cost;
    save.societySim = { ...save.societySim!, spies: r.agents, spyOps: r.ops };
    return persist(userId, save);
  },

  async hireMercenary(data: { defId: string; provinceId: string }) {
    const { userId, save } = requireSave();
    ensureSocietySim(save);
    const r = societyHireMerc(
      save.societySim!,
      data.defId as 'free_company' | 'crossbow_band' | 'heavy_riders' | 'sellsword_mob',
      data.provinceId,
    );
    if (r.error || !r.company) throw new Error(r.error ?? 'Fehler');
    if (save.kingdom.gold < r.cost) throw new Error(`Nicht genug Gold (${r.cost})`);
    save.kingdom.gold -= r.cost;
    save.societySim = {
      ...save.societySim!,
      mercenaries: [...save.societySim!.mercenaries, r.company],
    };
    return persist(userId, save);
  },

  async hireHero(data: { kind: string }) {
    const { userId, save } = requireSave();
    ensureSocietySim(save);
    if (save.societySim!.heroes.some((h) => h.kind === data.kind)) {
      throw new Error('Dieser Heldentyp ist bereits am Hof');
    }
    const r = societyHireHero(
      save.societySim!,
      data.kind as
        | 'field_marshal'
        | 'master_builder'
        | 'great_merchant'
        | 'famed_physician'
        | 'master_smith'
        | 'legend_knight',
    );
    if (r.error || !r.hero) throw new Error(r.error ?? 'Fehler');
    if (save.kingdom.gold < r.cost) throw new Error(`Nicht genug Gold (${r.cost})`);
    save.kingdom.gold -= r.cost;
    save.societySim = {
      ...save.societySim!,
      heroes: [...save.societySim!.heroes, r.hero],
    };
    save.chronicle!.push(
      makeChronicle(
        save.tickCount ?? 0,
        'hero',
        r.hero.title,
        `${r.hero.name} tritt in euren Dienst: ${r.hero.ability}`,
      ),
    );
    return persist(userId, save);
  },

  async startRealmTournament(data: { discipline: string; participate: boolean }) {
    const { userId, save } = requireSave();
    ensureSocietySim(save);
    if (save.societySim!.tournament?.active) throw new Error('Ein Turnier läuft bereits');
    const costs: Record<string, number> = {
      joust: 100,
      archery: 80,
      sword: 90,
      riding: 85,
    };
    const cost = costs[data.discipline] ?? 100;
    if (save.kingdom.gold < cost) throw new Error(`Nicht genug Gold (${cost})`);
    save.kingdom.gold -= cost;
    save.societySim = societyStartTournament(
      save.societySim!,
      data.discipline as 'joust' | 'archery' | 'sword' | 'riding',
      data.participate,
    );
    return persist(userId, save);
  },

  async appeaseFaction(data: { factionId: string; gold: number }) {
    const { userId, save } = requireSave();
    ensureSocietySim(save);
    const gold = Math.max(20, Math.min(100, data.gold || 40));
    if (save.kingdom.gold < gold) throw new Error(`Nicht genug Gold (${gold})`);
    save.kingdom.gold -= gold;
    save.societySim = societyAppeaseFaction(
      save.societySim!,
      data.factionId as 'hochadel' | 'klerus' | 'haendler' | 'ritter' | 'bauern' | 'militaer',
      gold,
    );
    return persist(userId, save);
  },

  async marketTrade(data: { good: string; amount: number; buy: boolean }) {
    const { userId, save } = requireSave();
    ensureSocietySim(save);
    const r = societyTrade(
      save.societySim!,
      data.good as 'grain' | 'iron' | 'wood' | 'wine' | 'luxury' | 'weapons',
      data.amount || 1,
      data.buy,
    );
    if (r.error) throw new Error(r.error);
    if (r.gold < 0 && save.kingdom.gold < -r.gold) throw new Error('Nicht genug Gold');
    save.kingdom.gold = Math.max(0, save.kingdom.gold + r.gold);
    if (data.good === 'grain' && data.buy) save.kingdom.food += data.amount * 5;
    if (data.good === 'wood' && data.buy) save.kingdom.wood += data.amount;
    if (data.good === 'iron' && data.buy) save.kingdom.iron += data.amount;
    return persist(userId, save);
  },

  async fightBandits() {
    const { userId, save } = requireSave();
    ensureSocietySim(save);
    const troops = save.armies
      .filter((a) => a.kingdomId === save.kingdom.id)
      .reduce((s, a) => s + a.units.reduce((u, x) => u + x.count, 0), 0);
    const r = societyFightBandits(save.societySim!, Math.floor(troops / 3), save.tickCount ?? 0);
    save.societySim = r.state;
    save.kingdom.gold = Math.max(0, save.kingdom.gold + r.gold);
    save.kingdom.fame += r.fame;
    save.chronicle!.push(r.entry);
    return persist(userId, save);
  },

  async increaseRulerGuard() {
    const { userId, save } = requireSave();
    ensureSocietySim(save);
    if (save.kingdom.gold < 50) throw new Error('Nicht genug Gold (50)');
    save.kingdom.gold -= 50;
    save.societySim = societyIncreaseProtection(save.societySim!, 12);
    return persist(userId, save);
  },

  async setGameSpeed(data: { speed: string }) {
    const { userId, save } = requireSave();
    ensureEndgameSim(save);
    save.endgameSim = setGameSpeed(
      save.endgameSim!,
      data.speed as 'pause' | 'normal' | 'fast' | 'very_fast',
    );
    return persist(userId, save);
  },

  async resistInvasion() {
    const { userId, save } = requireSave();
    ensureEndgameSim(save);
    const troops = save.armies
      .filter((a) => a.kingdomId === save.kingdom.id)
      .reduce((s, a) => s + a.units.reduce((u, x) => u + x.count, 0), 0);
    const r = endgameResistInvasion(save.endgameSim!, Math.floor(troops / 2), save.tickCount ?? 0);
    if (save.kingdom.gold < r.goldCost) throw new Error(`Nicht genug Gold (${r.goldCost})`);
    save.kingdom.gold -= r.goldCost;
    save.endgameSim = r.state;
    save.kingdom.fame += r.fame;
    save.chronicle!.push(r.entry);
    return persist(userId, save);
  },

  async listSaveSlots() {
    const userId = getSessionUserId();
    if (!userId) throw new Error('Nicht eingeloggt');
    return { slots: listSaveSlots(userId) };
  },

  async saveToSlot(data: { name: string }) {
    const { userId, save } = requireSave();
    const meta = saveToNamedSlot(userId, data.name, save, {
      kingdomName: save.kingdom.name,
      tickCount: save.tickCount ?? 0,
      year: 1042 + Math.floor((save.tickCount ?? 0) / 12),
    });
    return { slot: meta, gameState: toGameState(save) };
  },

  async loadFromSlot(data: { slotId: string }) {
    const userId = getSessionUserId();
    if (!userId) throw new Error('Nicht eingeloggt');
    const loaded = loadNamedSlot<GameSave>(userId, data.slotId);
    if (!loaded) throw new Error('Spielstand nicht gefunden');
    ensureWorldFields(loaded);
    storeSave(userId, loaded);
    return toGameState(loaded);
  },

  async deleteSaveSlot(data: { slotId: string }) {
    const userId = getSessionUserId();
    if (!userId) throw new Error('Nicht eingeloggt');
    deleteNamedSlot(userId, data.slotId);
    return { slots: listSaveSlots(userId) };
  },

  async quickSaveGame() {
    const { userId, save } = requireSave();
    quickSave(userId, saveKey(userId), save);
    return toGameState(save);
  },

  async quickLoadGame() {
    const userId = getSessionUserId();
    if (!userId) throw new Error('Nicht eingeloggt');
    const loaded = quickLoad<GameSave>(userId, saveKey(userId));
    if (!loaded) throw new Error('Kein Schnellspeicher gefunden');
    ensureWorldFields(loaded);
    storeSave(userId, loaded);
    return toGameState(loaded);
  },
};

export function getGameSpeedFromSession(): 'pause' | 'normal' | 'fast' | 'very_fast' {
  try {
    const userId = getSessionUserId();
    if (!userId) return 'normal';
    const save = readSaveBlob<GameSave>(saveKey(userId));
    return save?.endgameSim?.settings.speed ?? 'normal';
  } catch {
    return 'normal';
  }
}

export function localLogout() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('token');
}
