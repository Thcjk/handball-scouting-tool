/** Weltzustand: Reiche, Beziehungen, Kriege, Belagerungen, Chronik */

import type { PersonalityId, WarReasonId } from './aiPersonality';

export interface WorldCharacter {
  id: string;
  name: string;
  age: number;
  gender: string;
  traits: string[];
  martial: number;
  diplomacy: number;
  stewardship: number;
  intrigue: number;
  health: number;
  experience: number;
  prestige: number;
  isAlive: boolean;
  isRuler: boolean;
  isHeir: boolean;
}

export interface WorldGeneral {
  id: string;
  kingdomId: string;
  name: string;
  age: number;
  martial: number;
  personality: string;
  experience: number;
  traits: string[];
  armyId?: string;
  alive: boolean;
  fame: number;
}

export interface AiKingdomState {
  id: string;
  name: string;
  gold: number;
  food: number;
  wood: number;
  stone: number;
  iron: number;
  influence: number;
  fame: number;
  personality: PersonalityId;
  culture: string;
  religion: string;
  capitalProvinceId: string;
  ruler: WorldCharacter;
  heir: WorldCharacter | null;
  characters: WorldCharacter[];
  spies: number;
  /** Tick-Zähler für Altersinkrement */
  ageTick: number;
}

export interface KingdomRelation {
  aId: string;
  bId: string;
  opinion: number;
  status: 'NEUTRAL' | 'ALLIED' | 'AT_WAR' | 'TRADE_PACT';
  lastReason?: string;
}

export interface ActiveWar {
  id: string;
  attackerId: string;
  defenderId: string;
  reasonId: WarReasonId;
  reasonText: string;
  startedTick: number;
  startedAt: number;
}

export interface ActiveSiege {
  id: string;
  provinceId: string;
  attackerKingdomId: string;
  defenderKingdomId: string;
  armyId: string;
  /** 0–100 */
  progress: number;
  morale: number;
  foodLeft: number;
  wallIntegrity: number;
  startedTick: number;
}

export type ChronicleCategory =
  | 'battle'
  | 'war'
  | 'peace'
  | 'alliance'
  | 'birth'
  | 'death'
  | 'succession'
  | 'disaster'
  | 'city'
  | 'siege'
  | 'spy'
  | 'event'
  | 'hero'
  | 'coronation';

export interface ChronicleEntry {
  id: string;
  tick: number;
  year: number;
  category: ChronicleCategory;
  title: string;
  text: string;
  at: number;
}

export interface PendingWorldEvent {
  id: string;
  templateId: string;
  title: string;
  description: string;
  choices: Array<{ id: string; label: string }>;
  provinceId?: string;
  createdTick: number;
}

export interface SpyMission {
  id: string;
  targetKingdomId: string;
  type: 'intel' | 'sabotage' | 'steal' | 'revolt';
  progress: number;
  discovered: boolean;
}

export interface LongTermGoal {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
}

export function yearFromTick(tick: number): number {
  return 1042 + Math.floor(tick / 12);
}

export function makeChronicle(
  tick: number,
  category: ChronicleCategory,
  title: string,
  text: string,
): ChronicleEntry {
  return {
    id: cryptoRandomId(),
    tick,
    year: yearFromTick(tick),
    category,
    title,
    text,
    at: Date.now(),
  };
}

export function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export function getRelation(
  relations: KingdomRelation[],
  aId: string,
  bId: string,
): KingdomRelation | undefined {
  return relations.find(
    (r) => (r.aId === aId && r.bId === bId) || (r.aId === bId && r.bId === aId),
  );
}

export function ensureRelation(
  relations: KingdomRelation[],
  aId: string,
  bId: string,
): KingdomRelation {
  let r = getRelation(relations, aId, bId);
  if (!r) {
    r = { aId, bId, opinion: 0, status: 'NEUTRAL' };
    relations.push(r);
  }
  return r;
}

export function adjustOpinion(
  relations: KingdomRelation[],
  aId: string,
  bId: string,
  delta: number,
  reason?: string,
): KingdomRelation {
  const r = ensureRelation(relations, aId, bId);
  r.opinion = Math.max(-100, Math.min(100, r.opinion + delta));
  if (reason) r.lastReason = reason;
  if (r.status !== 'AT_WAR' && r.status !== 'ALLIED' && r.status !== 'TRADE_PACT') {
    r.status = 'NEUTRAL';
  }
  return r;
}

export function areAtWar(wars: ActiveWar[], aId: string, bId: string): boolean {
  return wars.some(
    (w) =>
      (w.attackerId === aId && w.defenderId === bId) ||
      (w.attackerId === bId && w.defenderId === aId),
  );
}
