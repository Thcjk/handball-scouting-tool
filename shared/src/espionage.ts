/** Erweiterte Spionage & Attentate */

import { cryptoRandomId, makeChronicle, type ChronicleEntry } from './worldState';

export type EspionageMissionType =
  | 'intel'
  | 'scout_city'
  | 'watch_army'
  | 'inspect_castle'
  | 'steal_gold'
  | 'burn_supplies'
  | 'arson'
  | 'bribe_general'
  | 'influence_vassal'
  | 'prepare_assassination';

export interface SpyAgent {
  id: string;
  name: string;
  skill: number;
  experience: number;
  busyUntilTick: number;
  alive: boolean;
}

export interface ActiveSpyOp {
  id: string;
  agentId: string;
  type: EspionageMissionType;
  targetName: string;
  progress: number;
  targetTicks: number;
  risk: number;
}

export type AssassinationMethod =
  | 'poison'
  | 'dagger'
  | 'archer'
  | 'arson'
  | 'mercenary'
  | 'bribery';

export const SPY_MISSION_DEFS: Array<{
  id: EspionageMissionType;
  name: string;
  cost: number;
  ticks: number;
  risk: number;
  description: string;
}> = [
  { id: 'intel', name: 'Informationen', cost: 25, ticks: 2, risk: 15, description: 'Gerüchte und Pläne sammeln' },
  { id: 'scout_city', name: 'Stadt auskundschaften', cost: 35, ticks: 3, risk: 20, description: 'Befestigung und Vorräte' },
  { id: 'watch_army', name: 'Armee beobachten', cost: 30, ticks: 2, risk: 25, description: 'Truppenstärke schätzen' },
  { id: 'inspect_castle', name: 'Burg untersuchen', cost: 40, ticks: 3, risk: 30, description: 'Schwachstellen finden' },
  { id: 'steal_gold', name: 'Gold stehlen', cost: 50, ticks: 4, risk: 40, description: 'Schatzkammer plündern' },
  { id: 'burn_supplies', name: 'Vorräte vernichten', cost: 45, ticks: 3, risk: 45, description: 'Lager in Brand setzen' },
  { id: 'arson', name: 'Feuer legen', cost: 55, ticks: 3, risk: 50, description: 'Sabotage in der Stadt' },
  { id: 'bribe_general', name: 'General bestechen', cost: 80, ticks: 4, risk: 35, description: 'Loyalität kaufen' },
  { id: 'influence_vassal', name: 'Vasall beeinflussen', cost: 60, ticks: 4, risk: 30, description: 'Meinung drehen' },
  { id: 'prepare_assassination', name: 'Attentat vorbereiten', cost: 100, ticks: 5, risk: 55, description: 'Plan für einen Anschlag' },
];

export const ASSASSINATION_METHODS: Array<{
  id: AssassinationMethod;
  name: string;
  cost: number;
  successChance: number;
}> = [
  { id: 'poison', name: 'Vergiftung', cost: 120, successChance: 0.35 },
  { id: 'dagger', name: 'Dolchmord', cost: 90, successChance: 0.28 },
  { id: 'archer', name: 'Bogenschütze', cost: 100, successChance: 0.3 },
  { id: 'arson', name: 'Brandanschlag', cost: 110, successChance: 0.25 },
  { id: 'mercenary', name: 'Söldner', cost: 150, successChance: 0.4 },
  { id: 'bribery', name: 'Bestechung', cost: 130, successChance: 0.32 },
];

const SPY_NAMES = ['Schatten', 'Nachtvogel', 'Fuchs', 'Rabe', 'Nebel', 'Dorn'];

export function createSpyAgent(name?: string): SpyAgent {
  return {
    id: cryptoRandomId(),
    name: name ?? SPY_NAMES[Math.floor(Math.random() * SPY_NAMES.length)],
    skill: 4 + Math.floor(Math.random() * 5),
    experience: 0,
    busyUntilTick: 0,
    alive: true,
  };
}

export function startSpyOp(
  agents: SpyAgent[],
  ops: ActiveSpyOp[],
  type: EspionageMissionType,
  targetName: string,
  tick: number,
): { agents: SpyAgent[]; ops: ActiveSpyOp[]; cost: number; error?: string } {
  const def = SPY_MISSION_DEFS.find((d) => d.id === type);
  if (!def) return { agents, ops, cost: 0, error: 'Unbekannte Mission' };
  const agent = agents.find((a) => a.alive && a.busyUntilTick <= tick);
  if (!agent) return { agents, ops, cost: 0, error: 'Kein freier Spion' };
  const op: ActiveSpyOp = {
    id: cryptoRandomId(),
    agentId: agent.id,
    type,
    targetName,
    progress: 0,
    targetTicks: def.ticks,
    risk: Math.max(5, def.risk - agent.skill * 2),
  };
  return {
    agents: agents.map((a) =>
      a.id === agent.id ? { ...a, busyUntilTick: tick + def.ticks } : a,
    ),
    ops: [...ops, op],
    cost: def.cost,
  };
}

export function tickSpyOps(
  agents: SpyAgent[],
  ops: ActiveSpyOp[],
  tick: number,
): {
  agents: SpyAgent[];
  ops: ActiveSpyOp[];
  chronicle: ChronicleEntry[];
  goldStolen: number;
  alert?: string;
} {
  const chronicle: ChronicleEntry[] = [];
  let goldStolen = 0;
  let alert: string | undefined;
  const remaining: ActiveSpyOp[] = [];
  let nextAgents = [...agents];

  for (const op of ops) {
    const progress = op.progress + 1;
    if (progress < op.targetTicks) {
      remaining.push({ ...op, progress });
      continue;
    }
    const agent = nextAgents.find((a) => a.id === op.agentId);
    const success = Math.random() * 100 > op.risk - (agent?.skill ?? 0) * 3;
    const def = SPY_MISSION_DEFS.find((d) => d.id === op.type);
    if (!success || Math.random() * 100 < op.risk * 0.3) {
      chronicle.push(
        makeChronicle(
          tick,
          'spy',
          'Spion entdeckt',
          `${agent?.name ?? 'Ein Spion'} scheitert bei „${def?.name ?? op.type}“ gegen ${op.targetName}.`,
        ),
      );
      if (Math.random() < 0.25 && agent) {
        nextAgents = nextAgents.map((a) =>
          a.id === agent.id ? { ...a, alive: false, busyUntilTick: tick } : a,
        );
        alert = `Spion ${agent.name} wurde gefasst.`;
      }
      continue;
    }
    if (agent) {
      nextAgents = nextAgents.map((a) =>
        a.id === agent.id
          ? { ...a, experience: a.experience + 1, skill: Math.min(12, a.skill + (a.experience % 3 === 2 ? 1 : 0)) }
          : a,
      );
    }
    if (op.type === 'steal_gold') goldStolen += 20 + Math.floor(Math.random() * 40);
    chronicle.push(
      makeChronicle(
        tick,
        'spy',
        `Mission: ${def?.name ?? op.type}`,
        `Erfolg gegen ${op.targetName}. ${def?.description ?? ''}`,
      ),
    );
  }

  return { agents: nextAgents, ops: remaining, chronicle, goldStolen, alert };
}

export function attemptAssassination(
  method: AssassinationMethod,
  protection: number,
  tick: number,
): { success: boolean; entry: ChronicleEntry; rulerHurt: boolean } {
  const def = ASSASSINATION_METHODS.find((m) => m.id === method)!;
  const chance = Math.max(0.05, def.successChance - protection / 200);
  const success = Math.random() < chance;
  if (success) {
    return {
      success: true,
      rulerHurt: true,
      entry: makeChronicle(
        tick,
        'death',
        'Attentat!',
        `Ein Attentat (${def.name}) trifft den Herrscher schwer.`,
      ),
    };
  }
  return {
    success: false,
    rulerHurt: Math.random() < 0.2,
    entry: makeChronicle(
      tick,
      'spy',
      'Attentat vereitelt',
      `Ein Anschlag (${def.name}) wurde vereitelt. Die Wachen bleiben wachsam.`,
    ),
  };
}

/** Zufälliges Attentat gegen den Spieler (wenn Feinde/Fraktionen unzufrieden) */
export function rollIncomingAssassination(
  risk: number,
  tick: number,
): { method: AssassinationMethod; entry: ChronicleEntry } | null {
  if (risk < 40 || Math.random() > risk / 250) return null;
  const method = ASSASSINATION_METHODS[Math.floor(Math.random() * ASSASSINATION_METHODS.length)];
  return {
    method: method.id,
    entry: makeChronicle(
      tick,
      'spy',
      'Mordkomplott',
      `Gerüchte über ein Attentat (${method.name}) erreichen den Hof.`,
    ),
  };
}
