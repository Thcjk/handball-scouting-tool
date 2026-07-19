import type { ResourceCost } from './types';

export const CITY_FOUND_COST: ResourceCost = {
  gold: 300,
  food: 100,
  wood: 150,
  stone: 200,
  iron: 50,
};

export const CITY_FOUND_REQUIREMENTS = {
  minVillageLevel: 2,
  minPopulation: 1500,
  minProsperity: 40,
};

export const CITY_UPGRADE_COST_PER_LEVEL: ResourceCost = {
  gold: 200,
  food: 50,
  wood: 100,
  stone: 150,
  iron: 30,
};

export const MAX_CITY_LEVEL = 5;

export function getCityBuildingMinLevel(buildingCategory: string): number {
  return buildingCategory === 'city' ? 1 : 0;
}
