import { Resources, BuildingType, UnitType } from './types';
import { BASE_INCOME } from './resources';
import { BUILDING_DEFINITIONS } from './buildings';
import { UNIT_DEFINITIONS } from './units';

export const TICK_INTERVAL_MS = 30_000; // 30 seconds per tick for active players
export const ACTIVE_PLAYER_WINDOW_MS = 120_000; // 2 minutes

export interface ProvinceIncomeInput {
  buildings: Array<{ type: BuildingType; level: number }>;
  population: number;
  cityLevel: number;
  villageLevel: number;
}

export function calculateProvinceIncome(input: ProvinceIncomeInput): Partial<Resources> {
  const income: Partial<Resources> = {
    gold: BASE_INCOME.gold,
    food: BASE_INCOME.food + Math.floor(input.population / 500),
    wood: BASE_INCOME.wood,
    stone: BASE_INCOME.stone,
    iron: BASE_INCOME.iron,
  };

  for (const building of input.buildings) {
    const def = BUILDING_DEFINITIONS[building.type];
    if (!def) continue;
    const level = building.level;
    if (def.effects.goldIncome) income.gold = (income.gold ?? 0) + def.effects.goldIncome * level;
    if (def.effects.foodIncome) income.food = (income.food ?? 0) + def.effects.foodIncome * level;
    if (def.effects.woodIncome) income.wood = (income.wood ?? 0) + def.effects.woodIncome * level;
    if (def.effects.stoneIncome)
      income.stone = (income.stone ?? 0) + def.effects.stoneIncome * level;
    if (def.effects.ironIncome) income.iron = (income.iron ?? 0) + def.effects.ironIncome * level;
    if (def.effects.influence)
      income.influence = (income.influence ?? 0) + def.effects.influence * level;
  }

  if (input.cityLevel > 0) {
    income.gold = (income.gold ?? 0) + input.cityLevel * 5;
    income.influence = (income.influence ?? 0) + input.cityLevel * 2;
  }

  return income;
}

export function calculateUpkeep(
  units: Array<{ type: UnitType; count: number }>,
): Partial<Resources> {
  let food = 0;
  let gold = 0;
  for (const u of units) {
    const def = UNIT_DEFINITIONS[u.type];
    food += def.upkeep * u.count;
    gold += Math.floor(def.upkeep / 2) * u.count;
  }
  return { food, gold };
}
