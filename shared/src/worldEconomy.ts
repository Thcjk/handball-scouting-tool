/** Weltwirtschaft, Preise, Messen */

export type MarketGood = 'grain' | 'iron' | 'wood' | 'wine' | 'luxury' | 'weapons';

export interface MarketPrices {
  grain: number;
  iron: number;
  wood: number;
  wine: number;
  luxury: number;
  weapons: number;
}

export interface FairEvent {
  active: boolean;
  cityName: string;
  ticksLeft: number;
  kind: 'jahrmarkt' | 'handelsmesse' | 'fest';
}

export function defaultPrices(): MarketPrices {
  return { grain: 10, iron: 18, wood: 8, wine: 14, luxury: 30, weapons: 22 };
}

export function tickMarketPrices(
  prices: MarketPrices,
  opts: { war: boolean; famine: boolean; pirateDisruption: boolean; surplusGrain: boolean },
): MarketPrices {
  const drift = (v: number, dir: number) => Math.max(4, Math.min(60, Math.round(v + dir + (Math.random() * 2 - 1))));
  let { grain, iron, wood, wine, luxury, weapons } = prices;
  if (opts.famine) grain = drift(grain, 4);
  else if (opts.surplusGrain) grain = drift(grain, -3);
  else grain = drift(grain, 0);
  if (opts.war) {
    iron = drift(iron, 3);
    weapons = drift(weapons, 4);
    wine = drift(wine, 1);
  } else {
    iron = drift(iron, -1);
    weapons = drift(weapons, -1);
  }
  if (opts.pirateDisruption) {
    luxury = drift(luxury, 3);
    wine = drift(wine, 2);
  }
  wood = drift(wood, Math.random() < 0.5 ? 1 : -1);
  luxury = drift(luxury, 0);
  return { grain, iron, wood, wine, luxury, weapons };
}

export function tradeAtMarket(
  prices: MarketPrices,
  good: MarketGood,
  amount: number,
  buy: boolean,
): { gold: number; error?: string } {
  if (amount <= 0) return { gold: 0, error: 'Menge ungültig' };
  const unit = prices[good];
  const gold = buy ? -(unit * amount) : Math.floor(unit * amount * 0.85);
  return { gold };
}

export function maybeStartFair(cityNames: string[], tickChance = 0.12): FairEvent | null {
  if (cityNames.length === 0 || Math.random() > tickChance) return null;
  const kinds: FairEvent['kind'][] = ['jahrmarkt', 'handelsmesse', 'fest'];
  return {
    active: true,
    cityName: cityNames[Math.floor(Math.random() * cityNames.length)],
    ticksLeft: 3,
    kind: kinds[Math.floor(Math.random() * kinds.length)],
  };
}

export function tickFair(fair: FairEvent | null): {
  fair: FairEvent | null;
  gold: number;
  satisfaction: number;
} {
  if (!fair?.active) return { fair: null, gold: 0, satisfaction: 0 };
  const left = fair.ticksLeft - 1;
  const gold = fair.kind === 'handelsmesse' ? 12 : fair.kind === 'jahrmarkt' ? 8 : 6;
  if (left <= 0) return { fair: null, gold, satisfaction: 4 };
  return { fair: { ...fair, ticksLeft: left }, gold, satisfaction: 2 };
}

export const MARKET_GOOD_LABEL: Record<MarketGood, string> = {
  grain: 'Getreide',
  iron: 'Eisen',
  wood: 'Holz',
  wine: 'Wein',
  luxury: 'Luxusgüter',
  weapons: 'Waffen',
};
