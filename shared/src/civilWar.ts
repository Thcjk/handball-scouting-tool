/** Bürgerkriege & Reichszerfall */

import { cryptoRandomId, makeChronicle, type ChronicleEntry } from './worldState';
import type { VassalState } from './realmVassals';

export interface CivilWarFaction {
  id: string;
  name: string;
  leaderName: string;
  provinceIds: string[];
  strength: number;
}

export interface CivilWarState {
  active: boolean;
  reason: string;
  startedTick: number;
  factions: CivilWarFaction[];
}

export function evaluateCivilWarRisk(input: {
  vassals: VassalState[];
  taxRate: number;
  atWar: number;
  prosperityAvg: number;
  successionRisk: number;
  lawLoyalty: number;
}): { risk: number; reason: string } {
  let risk = input.successionRisk;
  const lowLoyalty = input.vassals.filter((v) => v.loyalty < 35);
  risk += lowLoyalty.length * 12;
  if (input.taxRate > 45) risk += 15;
  if (input.atWar > 1) risk += 10;
  if (input.prosperityAvg < 35) risk += 12;
  risk += Math.max(0, -input.lawLoyalty);
  let reason = 'Unzufriedenheit im Reich';
  if (lowLoyalty.length) reason = 'Unzufriedene Vasallen';
  else if (input.taxRate > 45) reason = 'Hohe Steuern';
  else if (input.prosperityAvg < 35) reason = 'Schlechte Wirtschaft';
  else if (input.atWar > 1) reason = 'Zu viele Kriege';
  return { risk: Math.min(100, risk), reason };
}

export function maybeStartCivilWar(
  input: {
    risk: number;
    reason: string;
    tick: number;
    vassals: VassalState[];
    playerName: string;
  },
  existing: CivilWarState | null,
): { war: CivilWarState | null; entry?: ChronicleEntry } {
  if (existing?.active) return { war: existing };
  if (input.risk < 55 || Math.random() > input.risk / 200) return { war: existing };
  const rebels = input.vassals.filter((v) => v.loyalty < 45).slice(0, 2);
  if (rebels.length === 0) return { war: existing };
  const factions: CivilWarFaction[] = [
    {
      id: cryptoRandomId(),
      name: `Treue zu ${input.playerName}`,
      leaderName: input.playerName,
      provinceIds: [],
      strength: 50,
    },
    ...rebels.map((v) => ({
      id: cryptoRandomId(),
      name: `Partei ${v.name}`,
      leaderName: v.name,
      provinceIds: [...v.provinceIds],
      strength: 20 + v.troops,
    })),
  ];
  const war: CivilWarState = {
    active: true,
    reason: input.reason,
    startedTick: input.tick,
    factions,
  };
  return {
    war,
    entry: makeChronicle(
      input.tick,
      'war',
      'Bürgerkrieg!',
      `Das Reich zerfällt in Fraktionen. Ursache: ${input.reason}.`,
    ),
  };
}

export function tickCivilWar(war: CivilWarState, tick: number): {
  war: CivilWarState;
  entry?: ChronicleEntry;
} {
  if (!war.active) return { war };
  const factions = war.factions.map((f) => ({
    ...f,
    strength: Math.max(0, f.strength + Math.floor(Math.random() * 7) - 3),
  }));
  const loyal = factions[0];
  const rebels = factions.slice(1);
  const rebelPower = rebels.reduce((s, f) => s + f.strength, 0);
  if (loyal.strength > rebelPower + 25 || tick - war.startedTick > 20) {
    return {
      war: { ...war, active: false, factions },
      entry: makeChronicle(tick, 'peace', 'Bürgerkrieg beendet', 'Die königliche Autorität siegt – vorerst.'),
    };
  }
  if (rebelPower > loyal.strength + 40) {
    return {
      war: { ...war, active: false, factions },
      entry: makeChronicle(
        tick,
        'war',
        'Reich geschwächt',
        'Die Rebellen erzwingen Zugeständnisse. Das Reich ist geschwächt.',
      ),
    };
  }
  return { war: { ...war, factions } };
}
