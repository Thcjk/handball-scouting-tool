export enum Terrain {
  PLAINS = 'PLAINS',
  FOREST = 'FOREST',
  HILLS = 'HILLS',
  MOUNTAINS = 'MOUNTAINS',
  COAST = 'COAST',
}

export enum BuildingType {
  PALISADE = 'PALISADE',
  STONE_WALL = 'STONE_WALL',
  KEEP = 'KEEP',
  GATEHOUSE = 'GATEHOUSE',
  WATCHTOWER = 'WATCHTOWER',
  BARRACKS = 'BARRACKS',
  STABLES = 'STABLES',
  GRANARY = 'GRANARY',
  MARKET = 'MARKET',
  SMITHY = 'SMITHY',
  WORKSHOP = 'WORKSHOP',
  TOWN_HALL = 'TOWN_HALL',
  TEMPLE = 'TEMPLE',
  UNIVERSITY = 'UNIVERSITY',
  HARBOR = 'HARBOR',
  CITY_WALL = 'CITY_WALL',
  FARM = 'FARM',
  MINE = 'MINE',
  LUMBER_MILL = 'LUMBER_MILL',
}

export enum UnitType {
  MILITIA = 'MILITIA',
  SPEARMAN = 'SPEARMAN',
  ARCHER = 'ARCHER',
  SWORDSMAN = 'SWORDSMAN',
  CROSSBOWMAN = 'CROSSBOWMAN',
  LIGHT_CAVALRY = 'LIGHT_CAVALRY',
  HEAVY_CAVALRY = 'HEAVY_CAVALRY',
  KNIGHT = 'KNIGHT',
}

export interface UnitStats {
  attack: number;
  defense: number;
  speed: number;
  morale: number;
  upkeep: number;
}

export interface ResourceCost {
  gold: number;
  food: number;
  wood: number;
  stone: number;
  iron: number;
}

export interface UnitDefinition extends UnitStats, ResourceCost {
  type: UnitType;
  recruitTime: number;
}

export interface BuildingDefinition {
  type: BuildingType;
  name: string;
  category: 'castle' | 'city' | 'village' | 'military';
  maxLevel: number;
  costPerLevel: ResourceCost;
  effects: Record<string, number>;
}

export interface BattleUnitInput {
  type: UnitType;
  count: number;
}

export interface BattleInput {
  attackerUnits: BattleUnitInput[];
  defenderUnits: BattleUnitInput[];
  terrain: Terrain;
  attackerMorale: number;
  defenderMorale: number;
  castleLevel: number;
  attackerCommanderMartial: number;
  defenderCommanderMartial: number;
}

export interface BattleRound {
  round: number;
  attackerDamage: number;
  defenderDamage: number;
  attackerMorale: number;
  defenderMorale: number;
  description: string;
}

export interface BattleResult {
  attackerWon: boolean;
  attackerCasualties: BattleUnitInput[];
  defenderCasualties: BattleUnitInput[];
  rounds: BattleRound[];
  summary: string;
}

export interface ProvinceSeed {
  name: string;
  x: number;
  y: number;
  terrain: Terrain;
  population: number;
  neighbors: string[];
}

export interface Resources {
  gold: number;
  food: number;
  wood: number;
  stone: number;
  iron: number;
  influence: number;
  fame: number;
}
