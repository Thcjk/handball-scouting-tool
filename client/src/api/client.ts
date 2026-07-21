const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';

const API_URL = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Unbekannter Fehler' }));
    throw new ApiError(res.status, body.message ?? `HTTP ${res.status}`);
  }

  return res.json();
}

const remoteApi = {
  register: (data: {
    email: string;
    username: string;
    password: string;
    kingdomName: string;
    rulerName: string;
  }) =>
    request<{ accessToken: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => request<User>('/auth/me'),
  getProfile: () => request<Profile>('/users/profile'),
  updateProfile: (data: { username: string }) =>
    request<Profile>('/users/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/users/password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getGameState: () => request<GameState>('/game/state'),
  build: (data: { provinceId: string; buildingType: string }) =>
    request<GameState>('/game/build', { method: 'POST', body: JSON.stringify(data) }),
  recruit: (data: { provinceId: string; unitType: string; count: number }) =>
    request<GameState>('/game/recruit', { method: 'POST', body: JSON.stringify(data) }),
  createArmy: (data: { name: string; provinceId: string }) =>
    request<{ gameState: GameState }>('/game/army', { method: 'POST', body: JSON.stringify(data) }),
  upgradeCastle: (data: { provinceId: string }) =>
    request<GameState>('/game/castle/upgrade', { method: 'POST', body: JSON.stringify(data) }),
  foundCity: (data: { provinceId: string }) =>
    request<GameState>('/game/city/found', { method: 'POST', body: JSON.stringify(data) }),
  upgradeCity: (data: { provinceId: string }) =>
    request<GameState>('/game/city/upgrade', { method: 'POST', body: JSON.stringify(data) }),
  upgradeVillage: (data: { provinceId: string }) =>
    request<GameState>('/game/village/upgrade', { method: 'POST', body: JSON.stringify(data) }),
  placeCityTile: (data: { provinceId: string; x: number; y: number; kind: string }) =>
    request<GameState>('/game/city/place', { method: 'POST', body: JSON.stringify(data) }),
  demolishCityTile: (data: { provinceId: string; x: number; y: number }) =>
    request<GameState>('/game/city/demolish', { method: 'POST', body: JSON.stringify(data) }),
  upgradeCityTile: (data: { provinceId: string; x: number; y: number }) =>
    request<GameState>('/game/city/upgrade-tile', { method: 'POST', body: JSON.stringify(data) }),
  setProvinceTax: (data: { provinceId: string; taxRate: number }) =>
    request<GameState>('/game/province/tax', { method: 'POST', body: JSON.stringify(data) }),
  setCapital: (data: { provinceId: string }) =>
    request<GameState>('/game/capital', { method: 'POST', body: JSON.stringify(data) }),
  attack: (data: { armyId: string; targetProvinceId: string; storm?: boolean }) =>
    request<{ battle: Battle; result: BattleResult; gameState: GameState }>('/game/attack', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  march: (data: { armyId: string; targetProvinceId: string }) =>
    request<GameState>('/game/march', { method: 'POST', body: JSON.stringify(data) }),

  getDynasty: () => request<DynastyInfo>('/dynasty'),
  getDiplomacy: () => request<DiplomacyState>('/diplomacy'),
  declareWar: (targetKingdomId: string) =>
    request<DiplomacyState>('/diplomacy/war', {
      method: 'POST',
      body: JSON.stringify({ targetKingdomId }),
    }),
  makePeace: (targetKingdomId: string) =>
    request<DiplomacyState>('/diplomacy/peace', {
      method: 'POST',
      body: JSON.stringify({ targetKingdomId }),
    }),
  proposeAlliance: (targetKingdomId: string, allianceName: string) =>
    request<{ diplomacy: DiplomacyState }>('/diplomacy/alliance', {
      method: 'POST',
      body: JSON.stringify({ targetKingdomId, allianceName }),
    }),
  joinAlliance: (allianceId: string) =>
    request<DiplomacyState>('/diplomacy/alliance/join', {
      method: 'POST',
      body: JSON.stringify({ allianceId }),
    }),
  proposeTrade: (targetKingdomId: string) =>
    request<DiplomacyState>('/diplomacy/trade', {
      method: 'POST',
      body: JSON.stringify({ targetKingdomId }),
    }),
  resolveWorldEvent: (data: { eventId: string; choiceId: string }) =>
    request<GameState>('/game/event/resolve', { method: 'POST', body: JSON.stringify(data) }),
  abandonSiege: (data: { siegeId: string }) =>
    request<GameState>('/game/siege/abandon', { method: 'POST', body: JSON.stringify(data) }),
  sendSpy: (data: { targetKingdomId: string; mission: 'intel' | 'sabotage' | 'steal' | 'revolt' }) =>
    request<GameState>('/game/spy', { method: 'POST', body: JSON.stringify(data) }),
  assignGeneral: (data: { armyId: string; generalId: string | null }) =>
    request<GameState>('/game/general/assign', { method: 'POST', body: JSON.stringify(data) }),
  getChronicle: () =>
    request<{ entries: GameState['chronicle']; year: number; tickCount: number }>('/game/chronicle'),
  marry: (data: { candidateId: string }) =>
    request<GameState>('/game/dynasty/marry', { method: 'POST', body: JSON.stringify(data) }),
  seekMarriage: () => request<GameState>('/game/dynasty/seek-marriage', { method: 'POST', body: '{}' }),
  setEducation: (data: { characterId: string; focus: string }) =>
    request<GameState>('/game/dynasty/education', { method: 'POST', body: JSON.stringify(data) }),
  assignCouncil: (data: { role: string; characterId: string | null }) =>
    request<GameState>('/game/dynasty/council', { method: 'POST', body: JSON.stringify(data) }),
  hostTournament: () => request<GameState>('/game/dynasty/tournament', { method: 'POST', body: '{}' }),
  setSuccessionLaw: (data: { law: string }) =>
    request<GameState>('/game/realm/succession', { method: 'POST', body: JSON.stringify(data) }),
  toggleRealmLaw: (data: { lawId: string }) =>
    request<GameState>('/game/realm/law', { method: 'POST', body: JSON.stringify(data) }),
  startTechResearch: (data: { techId: string }) =>
    request<GameState>('/game/realm/research', { method: 'POST', body: JSON.stringify(data) }),
  setTechBudget: (data: { gold: number }) =>
    request<GameState>('/game/realm/research-budget', { method: 'POST', body: JSON.stringify(data) }),
  grantVassal: (data: {
    name: string;
    characterId: string;
    rank: string;
    provinceIds: string[];
  }) => request<GameState>('/game/realm/vassal', { method: 'POST', body: JSON.stringify(data) }),
  startWonder: (data: { wonderId: string; provinceId: string }) =>
    request<GameState>('/game/realm/wonder', { method: 'POST', body: JSON.stringify(data) }),
  doPilgrimage: () => request<GameState>('/game/realm/pilgrimage', { method: 'POST', body: '{}' }),
  foundKnightOrder: (data: { orderId: string }) =>
    request<GameState>('/game/realm/order', { method: 'POST', body: JSON.stringify(data) }),
  buildFleet: (data: { name: string; provinceId: string; type: string; count: number }) =>
    request<GameState>('/game/realm/fleet', { method: 'POST', body: JSON.stringify(data) }),
  huntPirates: () => request<GameState>('/game/realm/pirates', { method: 'POST', body: '{}' }),
  startSocietySpy: (data: { type: string; targetName: string }) =>
    request<GameState>('/game/society/spy', { method: 'POST', body: JSON.stringify(data) }),
  hireMercenary: (data: { defId: string; provinceId: string }) =>
    request<GameState>('/game/society/mercenary', { method: 'POST', body: JSON.stringify(data) }),
  hireHero: (data: { kind: string }) =>
    request<GameState>('/game/society/hero', { method: 'POST', body: JSON.stringify(data) }),
  startRealmTournament: (data: { discipline: string; participate: boolean }) =>
    request<GameState>('/game/society/tournament', { method: 'POST', body: JSON.stringify(data) }),
  appeaseFaction: (data: { factionId: string; gold: number }) =>
    request<GameState>('/game/society/faction', { method: 'POST', body: JSON.stringify(data) }),
  marketTrade: (data: { good: string; amount: number; buy: boolean }) =>
    request<GameState>('/game/society/trade', { method: 'POST', body: JSON.stringify(data) }),
  fightBandits: () => request<GameState>('/game/society/bandits', { method: 'POST', body: '{}' }),
  increaseRulerGuard: () =>
    request<GameState>('/game/society/guard', { method: 'POST', body: '{}' }),
  setGameSpeed: (data: { speed: string }) =>
    request<GameState>('/game/endgame/speed', { method: 'POST', body: JSON.stringify(data) }),
  resistInvasion: () => request<GameState>('/game/endgame/resist', { method: 'POST', body: '{}' }),
  listSaveSlots: () => request<{ slots: Array<{ id: string; name: string; updatedAt: number }> }>('/game/saves'),
  saveToSlot: (data: { name: string }) =>
    request<{ slot: { id: string; name: string }; gameState: GameState }>('/game/saves', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  loadFromSlot: (data: { slotId: string }) =>
    request<GameState>('/game/saves/load', { method: 'POST', body: JSON.stringify(data) }),
  deleteSaveSlot: (data: { slotId: string }) =>
    request<{ slots: Array<{ id: string; name: string }> }>('/game/saves/delete', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  quickSaveGame: () => request<GameState>('/game/saves/quick', { method: 'POST', body: '{}' }),
  quickLoadGame: () => request<GameState>('/game/saves/quick-load', { method: 'POST', body: '{}' }),
};

import { localApi } from '../local/localApi';

export const api = OFFLINE_MODE ? localApi : remoteApi;

export const isOfflineMode = OFFLINE_MODE;

export interface User {
  id: string;
  email: string;
  username: string;
  hasKingdom?: boolean;
}

export interface Profile {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  kingdom: {
    id: string;
    name: string;
    resources: Resources;
    dynasty: { id: string; name: string; motto: string | null } | null;
    ruler: { id: string; name: string; age: number; martial: number } | null;
    provinceCount: number;
    provinces: Array<{
      id: string;
      name: string;
      castle: { level: number } | null;
      village: { level: number } | null;
      city: { level: number } | null;
    }>;
  } | null;
}

export interface Resources {
  gold: number;
  food: number;
  wood: number;
  stone: number;
  iron: number;
  coal?: number;
  influence: number;
  fame: number;
}

export interface Character {
  id: string;
  name: string;
  age: number;
  gender?: string;
  traits?: string[];
  experience?: number;
  health?: number;
  prestige?: number;
  isAlive: boolean;
  isRuler: boolean;
  isHeir: boolean;
  martial: number;
  diplomacy: number;
  stewardship: number;
  intrigue?: number;
  firstName?: string;
  lastName?: string;
  title?: string;
  nickname?: string;
  birthYear?: number;
  birthPlace?: string;
  culture?: string;
  religion?: string;
  language?: string;
  appearance?: {
    portrait: string;
    hair: string;
    beard: string;
    clothing: string;
    armor?: string;
    crown?: string;
  };
  renown?: number;
  influence?: number;
  energy?: number;
  stress?: number;
  learning?: number;
  lifeStage?: string;
  education?: string | null;
  spouseId?: string | null;
  fatherId?: string | null;
  motherId?: string | null;
  childrenIds?: string[];
  councilRole?: string | null;
  loyalty?: number;
}

export interface DynastyInfo {
  dynasty: { id: string; name: string; motto: string | null } | null;
  characters: Character[];
  ruler: Character | null;
  heir: Character | null;
}

export interface DiplomacyState {
  relations: Array<{
    id: string;
    status: string;
    partner: { id: string; name: string };
    partnerId?: string;
    opinion?: number;
    label?: string;
    lastReason?: string;
  }>;
  kingdoms: Array<{
    id: string;
    name: string;
    fame?: number;
    user?: { username: string };
    personality?: string;
    religion?: string;
    culture?: string;
    provinceCount?: number;
    rulerName?: string;
  }>;
  myAlliance: { id: string; name: string; members: Array<{ id: string; name: string }> } | null;
  availableAlliances: Array<{ id: string; name: string; memberCount: number }>;
  wars?: Array<{
    id: string;
    attackerId: string;
    defenderId: string;
    reasonText: string;
    attackerName?: string;
    defenderName?: string;
  }>;
}

export interface Province {
  id: string;
  slug: string;
  name: string;
  x: number;
  y: number;
  terrain: string;
  culture?: string | null;
  religion?: string | null;
  population: number;
  prosperity: number;
  defense: number;
  ownerId: string | null;
  ownerName: string | null;
  isOwned: boolean;
  isCapital?: boolean;
  castle: { level: number } | null;
  village: { level: number } | null;
  city: { level: number } | null;
  buildings: Array<{ id: string; type: string; level: number }>;
  armies: Army[];
  neighbors: Array<{ id: string; slug: string; name: string }>;
  cityGrid?: Array<{ x: number; y: number; kind: string; level: number; buildRemaining?: number }>;
  devStats?: {
    satisfaction: number;
    loyalty: number;
    security: number;
    crime: number;
    health: number;
    education: number;
    taxRate?: number;
    stock: {
      grain: number;
      flour: number;
      bread: number;
      planks: number;
      tools: number;
      weapons: number;
      horses: number;
      wool?: number;
      cloth?: number;
      clothes?: number;
      charcoal?: number;
      steel?: number;
      beer?: number;
      wine?: number;
      fish?: number;
      meat?: number;
      salt?: number;
      clay?: number;
      armor?: number;
      luxury?: number;
    };
  };
  visualLevel?: number;
  cityTier?: { id: number; name: string; description: string };
  professions?: {
    farmers: number;
    lumberjacks: number;
    miners: number;
    smiths: number;
    merchants: number;
    priests: number;
    teachers: number;
    soldiers: number;
    nobles: number;
    workers: number;
  };
  forestStock?: number;
  mineStock?: number;
}

export interface Army {
  id: string;
  name: string;
  morale: number;
  isGarrison: boolean;
  status?: string;
  targetProvinceId?: string | null;
  marchArrivesAt?: string | null;
  provinceId?: string;
  generalId?: string;
  kingdomId?: string;
  units: Array<{ id: string; type: string; count: number }>;
  province?: { id: string; name: string };
}

export interface Battle {
  id: string;
  attackerWon: boolean;
  createdAt: string;
  province: { name: string };
  attacker: { name: string };
  defender: { name: string } | null;
}

export interface BattleResult {
  attackerWon: boolean;
  summary: string;
  rounds: Array<{ round: number; description: string }>;
  attackerCasualties: Array<{ type: string; count: number }>;
  defenderCasualties: Array<{ type: string; count: number }>;
}

export interface GameState {
  kingdom: { id: string; name: string; resources: Resources };
  dynasty: DynastyInfo;
  capitalProvinceId?: string;
  provinces: Province[];
  armies: Army[];
  recentBattles: Battle[];
  tickCount?: number;
  worldYear?: number;
  aiKingdoms?: Array<{
    id: string;
    name: string;
    personality: string;
    personalityLabel: string;
    culture: string;
    religion: string;
    gold: number;
    provinceCount: number;
    rulerName: string;
    rulerAge: number;
  }>;
  /** Kurzinfo Diplomatie zu KI-Reichen (Anzeige auf der Karte) */
  diplomacyBrief?: Array<{
    kingdomId: string;
    kingdomName: string;
    rulerName: string;
    opinion: number;
    status: string;
    label: string;
    atWar: boolean;
    lastReason?: string;
  }>;
  wars?: Array<{
    id: string;
    attackerId: string;
    defenderId: string;
    reasonText: string;
    reasonId?: string;
  }>;
  sieges?: Array<{
    id: string;
    provinceId: string;
    progress: number;
    morale: number;
    foodLeft: number;
    wallIntegrity: number;
    provinceName?: string;
    attackerKingdomId: string;
  }>;
  chronicle?: Array<{
    id: string;
    tick: number;
    year: number;
    category: string;
    title: string;
    text: string;
    at: number;
  }>;
  pendingEvents?: Array<{
    id: string;
    templateId: string;
    title: string;
    description: string;
    choices: Array<{ id: string; label: string }>;
    provinceId?: string;
  }>;
  generals?: Array<{
    id: string;
    name: string;
    age: number;
    martial: number;
    personality: string;
    experience: number;
    fame: number;
    armyId?: string;
  }>;
  goals?: Array<{
    id: string;
    title: string;
    description: string;
    progress: number;
    target: number;
    completed: boolean;
  }>;
  playerSpies?: number;
  worldAlert?: string;
  title?: { rank: string; formalTitle: string; provinceThreshold: number };
  titleHint?: string | null;
  court?: {
    visitors: Array<{ id: string; name: string; kind: string; description: string }>;
    council: Array<{ role: string; characterId: string | null; label: string }>;
    councilAdvice: Array<{ role: string; label: string; advice: string }>;
    marriages: Array<{ id: string; year: number; spouseAId: string; spouseBId: string }>;
    spouseCandidates: Array<{
      id: string;
      name: string;
      age: number;
      traits?: string[];
      diplomacy: number;
    }>;
    meta: {
      id: string;
      name: string;
      motto: string | null;
      prestige: number;
      renown: number;
      foundedYear: number;
      famousMembers: string[];
    };
  };
  realm?: {
    laws: { succession: string; active: string[] };
    tech: { researched: string[]; progress: Record<string, number>; researching: string | null };
    faith: {
      piety: number;
      religionId: string;
      relics: number;
      orders: Array<{
        id: string;
        name: string;
        founded: boolean;
        strength: number;
        loyalty: number;
      }>;
    };
    vassals: Array<{
      id: string;
      name: string;
      rank: string;
      provinceIds: string[];
      loyalty: number;
      power: number;
      opinion: number;
      gold: number;
      troops: number;
      goals: string;
      lastAction?: string;
    }>;
    wonders: Array<{
      id: string;
      wonderId: string;
      provinceId: string;
      remainingTicks: number;
      completed: boolean;
    }>;
    fleets: Array<{
      id: string;
      name: string;
      provinceId: string;
      ships: Array<{ type: string; count: number }>;
      morale: number;
    }>;
    seaRoutes: Array<{
      id: string;
      fromProvinceId: string;
      toProvinceId: string;
      goods: string;
      goldPerTick: number;
      disrupted: boolean;
    }>;
    pirates: Array<{ id: string; region: string; strength: number; active: boolean }>;
    civilWar: {
      active: boolean;
      reason: string;
      startedTick: number;
      factions: Array<{ id: string; name: string; leaderName: string; strength: number }>;
    } | null;
    researchBudget: number;
    civilWarRisk: number;
    civilWarReason: string;
    catalog: {
      regions: Array<{
        id: string;
        name: string;
        culture: string;
        religion: string;
        architecture: string;
        resources: string[];
        description: string;
      }>;
      successionLaws: Array<{
        id: string;
        name: string;
        description: string;
        stability: number;
        civilWarRisk: number;
      }>;
      realmLaws: Array<{ id: string; name: string; description: string }>;
      techTree: Array<{
        id: string;
        name: string;
        branch: string;
        cost: number;
        requires?: string[];
        unlocks: string;
      }>;
      techBranchLabel: Record<string, string>;
      wonders: Array<{
        id: string;
        name: string;
        description: string;
        cost: { gold: number; wood: number; stone: number; iron: number };
        buildTicks: number;
        requiresTech?: string;
      }>;
      religions: Array<{ id: string; name: string; bonus: string; feast: string }>;
      vassalRanks: Record<string, string>;
      shipCosts: Record<string, { gold: number; wood: number; iron: number }>;
    };
  };
  society?: {
    houses: Array<{
      id: string;
      name: string;
      rank: string;
      motto: string;
      coat: string;
      wealth: number;
      land: number;
      prestige: number;
      loyalty: number;
      goal: string;
      members: number;
    }>;
    factions: Array<{
      id: string;
      name: string;
      influence: number;
      loyalty: number;
      demand: string;
      goal: string;
    }>;
    spies: Array<{
      id: string;
      name: string;
      skill: number;
      experience: number;
      busyUntilTick: number;
      alive: boolean;
    }>;
    spyOps: Array<{
      id: string;
      type: string;
      targetName: string;
      progress: number;
      targetTicks: number;
    }>;
    quests: Array<{
      id: string;
      kind: string;
      title: string;
      description: string;
      costGold: number;
      expiresTick: number;
    }>;
    tournament: {
      active: boolean;
      discipline: string;
      participants: string[];
      winner?: string;
      ticksLeft: number;
      playerParticipates: boolean;
    } | null;
    mercenaries: Array<{
      id: string;
      name: string;
      troops: number;
      morale: number;
      wage: number;
      provinceId: string;
    }>;
    heroes: Array<{
      id: string;
      kind: string;
      name: string;
      title: string;
      ability: string;
      loyalty: number;
    }>;
    prices: Record<string, number>;
    fair: { active: boolean; cityName: string; ticksLeft: number; kind: string } | null;
    climate: { season: string; weather: string; monthInYear: number };
    disasters: Array<{ id: string; kind: string; provinceName: string; ticksLeft: number }>;
    diseases: Array<{
      id: string;
      kind: string;
      provinceName: string;
      severity: number;
      ticksLeft: number;
    }>;
    bandits: Array<{ id: string; regionName: string; strength: number; active: boolean }>;
    wildlife: Array<{ id: string; kind: string; provinceId: string; count: number }>;
    atmosphere: string;
    rulerProtection: number;
    pendingAssassination: string | null;
    catalog: {
      seasons: Record<string, string>;
      weather: Record<string, string>;
      atmosphere: Record<string, string>;
      spyMissions: Array<{ id: string; name: string; cost: number; description: string }>;
      tournaments: Array<{ id: string; name: string; cost: number }>;
      mercenaries: Array<{ id: string; name: string; hireCost: number; wage: number }>;
      heroes: Array<{ kind: string; title: string; ability: string; hireCost: number }>;
      marketGoods: Record<string, string>;
      nobleRanks: Record<string, string>;
      wildlife: Record<string, string>;
    };
  };
  endgame?: {
    crises: Array<{
      id: string;
      kind: string;
      title: string;
      description: string;
      severity: number;
      ticksLeft: number;
      active: boolean;
    }>;
    invasions: Array<{
      id: string;
      kind: string;
      name: string;
      strength: number;
      coastalTargets: string[];
      ticksLeft: number;
      active: boolean;
    }>;
    history: {
      records: Array<{ id: string; label: string; value: number; detail: string; year: number }>;
      milestones: Array<{ tick: number; year: number; text: string }>;
    };
    achievements: Array<{ id: string; unlocked: boolean; unlockedTick?: number }>;
    settings: { speed: string; showTooltips: boolean; tutorialHints: boolean };
    stats: {
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
    };
    peaceTicks: number;
    catalog: {
      achievements: Array<{ id: string; name: string; description: string }>;
      speeds: Record<string, string>;
      historyLabels: Record<string, string>;
    };
  };
}

export { ApiError };
