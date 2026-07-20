/** Flotten, Seehandel, Piraten */

import { cryptoRandomId } from './worldState';

export type ShipType = 'trade' | 'war' | 'transport';

export interface Fleet {
  id: string;
  name: string;
  provinceId: string;
  ships: Array<{ type: ShipType; count: number }>;
  morale: number;
}

export interface PirateThreat {
  id: string;
  region: string;
  strength: number;
  active: boolean;
}

export interface SeaRoute {
  id: string;
  fromProvinceId: string;
  toProvinceId: string;
  goods: string;
  goldPerTick: number;
  disrupted: boolean;
}

export const SHIP_COSTS: Record<ShipType, { gold: number; wood: number; iron: number }> = {
  trade: { gold: 40, wood: 50, iron: 5 },
  war: { gold: 70, wood: 60, iron: 25 },
  transport: { gold: 50, wood: 55, iron: 10 },
};

export function createFleet(name: string, provinceId: string, type: ShipType, count: number): Fleet {
  return {
    id: cryptoRandomId(),
    name,
    provinceId,
    ships: [{ type, count }],
    morale: 80,
  };
}

export function fleetPower(f: Fleet): number {
  return f.ships.reduce((s, sh) => {
    const w = sh.type === 'war' ? 3 : sh.type === 'transport' ? 1.5 : 1;
    return s + sh.count * w;
  }, 0);
}

export function rollPirateThreat(_tick: number, navalTech: number): PirateThreat | null {
  if (Math.random() > 0.12 - navalTech * 0.02) return null;
  return {
    id: cryptoRandomId(),
    region: ['Südküste', 'Westmeer', 'Ostklippen', 'Inselpass'][Math.floor(Math.random() * 4)],
    strength: 5 + Math.floor(Math.random() * 12),
    active: true,
  };
}

export function seaTradeIncome(
  routes: SeaRoute[],
  fleets: Fleet[],
  pirates: PirateThreat[],
  tradeOpen: boolean,
): { gold: number; disrupted: number } {
  let gold = 0;
  let disrupted = 0;
  const warPower = fleets.reduce((s, f) => s + fleetPower(f), 0);
  const pirateStr = pirates.filter((p) => p.active).reduce((s, p) => s + p.strength, 0);
  for (const r of routes) {
    if (r.disrupted || (pirateStr > warPower && Math.random() < 0.4)) {
      disrupted += 1;
      continue;
    }
    gold += r.goldPerTick * (tradeOpen ? 1.2 : 1);
  }
  return { gold: Math.floor(gold), disrupted };
}

export function defaultSeaRoutes(coastalProvinceIds: string[]): SeaRoute[] {
  if (coastalProvinceIds.length < 2) return [];
  const routes: SeaRoute[] = [];
  for (let i = 0; i < coastalProvinceIds.length - 1; i++) {
    routes.push({
      id: cryptoRandomId(),
      fromProvinceId: coastalProvinceIds[i],
      toProvinceId: coastalProvinceIds[i + 1],
      goods: ['Getreide', 'Wein', 'Holz', 'Luxusgüter', 'Waffen'][i % 5],
      goldPerTick: 3 + (i % 3),
      disrupted: false,
    });
  }
  return routes;
}

export function fightPirates(fleets: Fleet[], pirates: PirateThreat[]): {
  fleets: Fleet[];
  pirates: PirateThreat[];
  victory: boolean;
  message: string;
} {
  const active = pirates.filter((p) => p.active);
  if (active.length === 0) {
    return { fleets, pirates, victory: true, message: 'Keine Piraten aktiv.' };
  }
  const power = fleets.reduce((s, f) => s + fleetPower(f), 0);
  const threat = active.reduce((s, p) => s + p.strength, 0);
  if (power >= threat) {
    return {
      fleets,
      pirates: pirates.map((p) => ({ ...p, active: false })),
      victory: true,
      message: `Flotte schlägt Piraten (Stärke ${threat}). Seewege sicher.`,
    };
  }
  const damaged = fleets.map((f) => ({
    ...f,
    ships: f.ships.map((s) => ({ ...s, count: Math.max(0, s.count - 1) })),
    morale: Math.max(20, f.morale - 15),
  }));
  return {
    fleets: damaged.filter((f) => f.ships.some((s) => s.count > 0)),
    pirates,
    victory: false,
    message: 'Piraten überwältigen die Flotte. Handel gestört.',
  };
}
