import type { Resources } from './types';

export function canAfford(resources: Resources, cost: Partial<Resources>): boolean {
  return (
    resources.gold >= (cost.gold ?? 0) &&
    resources.food >= (cost.food ?? 0) &&
    resources.wood >= (cost.wood ?? 0) &&
    resources.stone >= (cost.stone ?? 0) &&
    resources.iron >= (cost.iron ?? 0)
  );
}

export function subtractResources(resources: Resources, cost: Partial<Resources>): Resources {
  return {
    ...resources,
    gold: resources.gold - (cost.gold ?? 0),
    food: resources.food - (cost.food ?? 0),
    wood: resources.wood - (cost.wood ?? 0),
    stone: resources.stone - (cost.stone ?? 0),
    iron: resources.iron - (cost.iron ?? 0),
  };
}

export function addResources(resources: Resources, income: Partial<Resources>): Resources {
  return {
    ...resources,
    gold: resources.gold + (income.gold ?? 0),
    food: resources.food + (income.food ?? 0),
    wood: resources.wood + (income.wood ?? 0),
    stone: resources.stone + (income.stone ?? 0),
    iron: resources.iron + (income.iron ?? 0),
    influence: resources.influence + (income.influence ?? 0),
    fame: resources.fame + (income.fame ?? 0),
  };
}

export const BASE_INCOME = {
  gold: 5,
  food: 10,
  wood: 3,
  stone: 2,
  iron: 1,
};
