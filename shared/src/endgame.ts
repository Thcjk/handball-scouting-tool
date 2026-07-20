/** Endgame-Krisen & große Invasionen */

import { cryptoRandomId, makeChronicle, type ChronicleEntry } from './worldState';

export type EndgameCrisisKind =
  | 'civil_war_mega'
  | 'economic_crash'
  | 'religious_schism'
  | 'famine'
  | 'great_invasion'
  | 'plague_wave'
  | 'dynasty_feud';

export type InvasionKind = 'foreign_power' | 'nomads' | 'holy_army' | 'pirate_kingdom' | 'unknown_realm';

export interface EndgameCrisis {
  id: string;
  kind: EndgameCrisisKind;
  title: string;
  description: string;
  severity: number;
  ticksLeft: number;
  active: boolean;
}

export interface GreatInvasion {
  id: string;
  kind: InvasionKind;
  name: string;
  strength: number;
  coastalTargets: string[];
  ticksLeft: number;
  active: boolean;
}

export const CRISIS_DEFS: Array<{
  kind: EndgameCrisisKind;
  title: string;
  description: string;
  minProvinces: number;
  baseSeverity: number;
  duration: number;
}> = [
  {
    kind: 'civil_war_mega',
    title: 'Großer Bürgerkrieg',
    description: 'Das Reich zerreißt sich von innen – Fraktionen und Vasallen erheben Waffen.',
    minProvinces: 6,
    baseSeverity: 7,
    duration: 12,
  },
  {
    kind: 'economic_crash',
    title: 'Wirtschaftskrise',
    description: 'Märkte brechen ein, Gold verliert an Wert, Handel stockt.',
    minProvinces: 4,
    baseSeverity: 5,
    duration: 8,
  },
  {
    kind: 'religious_schism',
    title: 'Religiöser Konflikt',
    description: 'Glaubensstreit spaltet Volk und Adel.',
    minProvinces: 5,
    baseSeverity: 6,
    duration: 10,
  },
  {
    kind: 'famine',
    title: 'Große Hungersnot',
    description: 'Missernten und leere Speicher bedrohen das Reich.',
    minProvinces: 3,
    baseSeverity: 6,
    duration: 9,
  },
  {
    kind: 'great_invasion',
    title: 'Weltkrise: Invasion',
    description: 'Eine fremde Macht bedroht die bekannten Küsten.',
    minProvinces: 8,
    baseSeverity: 9,
    duration: 14,
  },
  {
    kind: 'plague_wave',
    title: 'Seuchenwelle',
    description: 'Krankheit greift von Stadt zu Stadt um sich.',
    minProvinces: 4,
    baseSeverity: 7,
    duration: 10,
  },
  {
    kind: 'dynasty_feud',
    title: 'Dynastischer Machtkampf',
    description: 'Erben und Verwandte streiten um Einfluss und Thron.',
    minProvinces: 5,
    baseSeverity: 5,
    duration: 8,
  },
];

export const INVASION_DEFS: Array<{
  kind: InvasionKind;
  name: string;
  strength: number;
}> = [
  { kind: 'foreign_power', name: 'Überseeische Großmacht', strength: 40 },
  { kind: 'nomads', name: 'Nomadenhorde des Ostens', strength: 35 },
  { kind: 'holy_army', name: 'Heilige Großarmee', strength: 38 },
  { kind: 'pirate_kingdom', name: 'Piratenkönigreich', strength: 28 },
  { kind: 'unknown_realm', name: 'Unbekanntes Reich jenseits der Karte', strength: 45 },
];

export function shouldRollEndgame(provinceCount: number, tick: number, activeCrises: number): boolean {
  if (activeCrises > 0) return false;
  if (provinceCount < 3) return false;
  // Stärkere Reiche → häufiger Krisen (nie „gewonnen“)
  const power = Math.min(40, provinceCount * 2);
  const chance = 0.04 + power / 400 + (tick > 100 ? 0.02 : 0);
  return Math.random() < chance;
}

export function rollEndgameCrisis(
  provinceCount: number,
  tick: number,
): { crisis: EndgameCrisis; entry: ChronicleEntry } | null {
  const pool = CRISIS_DEFS.filter((c) => provinceCount >= c.minProvinces);
  if (pool.length === 0) return null;
  const def = pool[Math.floor(Math.random() * pool.length)];
  const crisis: EndgameCrisis = {
    id: cryptoRandomId(),
    kind: def.kind,
    title: def.title,
    description: def.description,
    severity: def.baseSeverity + Math.floor(Math.random() * 3),
    ticksLeft: def.duration,
    active: true,
  };
  return {
    crisis,
    entry: makeChronicle(tick, 'disaster', crisis.title, crisis.description),
  };
}

export function rollGreatInvasion(
  coastalNames: string[],
  tick: number,
): { invasion: GreatInvasion; entry: ChronicleEntry } | null {
  if (coastalNames.length === 0 || Math.random() > 0.35) return null;
  const def = INVASION_DEFS[Math.floor(Math.random() * INVASION_DEFS.length)];
  const targets = [...coastalNames].sort(() => Math.random() - 0.5).slice(0, Math.min(3, coastalNames.length));
  const invasion: GreatInvasion = {
    id: cryptoRandomId(),
    kind: def.kind,
    name: def.name,
    strength: def.strength + Math.floor(Math.random() * 15),
    coastalTargets: targets,
    ticksLeft: 10 + Math.floor(Math.random() * 6),
    active: true,
  };
  return {
    invasion,
    entry: makeChronicle(
      tick,
      'war',
      `Invasion: ${invasion.name}`,
      `${invasion.name} landet bei ${targets.join(', ')}. Alle Reiche müssen reagieren.`,
    ),
  };
}

export function tickCrises(crises: EndgameCrisis[]): {
  crises: EndgameCrisis[];
  goldMod: number;
  foodMod: number;
  fameMod: number;
  ended: string[];
} {
  let goldMod = 0;
  let foodMod = 0;
  let fameMod = 0;
  const ended: string[] = [];
  const next = crises
    .map((c) => {
      if (!c.active) return c;
      goldMod -= c.severity;
      foodMod -= Math.ceil(c.severity * 0.8);
      fameMod -= c.kind === 'dynasty_feud' ? 1 : 0;
      const left = c.ticksLeft - 1;
      if (left <= 0) {
        ended.push(c.title);
        return { ...c, active: false, ticksLeft: 0 };
      }
      return { ...c, ticksLeft: left };
    })
    .filter((c) => c.active || c.ticksLeft > 0);
  return { crises: next.filter((c) => c.active), goldMod, foodMod, fameMod, ended };
}

export function tickInvasions(invasions: GreatInvasion[]): {
  invasions: GreatInvasion[];
  pressure: number;
  ended: string[];
} {
  const ended: string[] = [];
  let pressure = 0;
  const next = invasions
    .map((inv) => {
      if (!inv.active) return inv;
      pressure += Math.floor(inv.strength / 5);
      const left = inv.ticksLeft - 1;
      if (left <= 0) {
        ended.push(inv.name);
        return { ...inv, active: false, ticksLeft: 0 };
      }
      return { ...inv, ticksLeft: left, strength: Math.max(10, inv.strength - 1) };
    })
    .filter((i) => i.active);
  return { invasions: next, pressure, ended };
}

export function resistInvasion(
  invasions: GreatInvasion[],
  militaryPower: number,
  tick: number,
): { invasions: GreatInvasion[]; entry: ChronicleEntry; fame: number; goldCost: number } {
  const active = invasions.find((i) => i.active);
  if (!active) {
    return {
      invasions,
      fame: 0,
      goldCost: 0,
      entry: makeChronicle(tick, 'event', 'Keine Invasion', 'Der Horizont ist ruhig.'),
    };
  }
  const cost = 80 + active.strength;
  if (militaryPower + 20 >= active.strength) {
    return {
      invasions: invasions.map((i) =>
        i.id === active.id ? { ...i, active: false, ticksLeft: 0, strength: 0 } : i,
      ),
      fame: 15,
      goldCost: cost,
      entry: makeChronicle(
        tick,
        'battle',
        'Invasion abgewehrt',
        `${active.name} wird zurückgeschlagen. Die Küsten atmen auf.`,
      ),
    };
  }
  return {
    invasions: invasions.map((i) =>
      i.id === active.id ? { ...i, strength: i.strength + 5, ticksLeft: i.ticksLeft + 1 } : i,
    ),
    fame: -2,
    goldCost: Math.floor(cost / 2),
    entry: makeChronicle(
      tick,
      'war',
      'Invasion hält stand',
      `${active.name} bleibt eine Bedrohung. Mehr Truppen oder Verbündete nötig.`,
    ),
  };
}
