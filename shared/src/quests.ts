/** Dynamische Quests */

import { cryptoRandomId, makeChronicle, type ChronicleEntry, type PendingWorldEvent } from './worldState';

export type QuestKind =
  | 'village_help'
  | 'merchant_escort'
  | 'knight_tournament'
  | 'general_reinforce'
  | 'city_food'
  | 'neighbor_aid'
  | 'church_donate'
  | 'bandit_clear';

export interface QuestDef {
  kind: QuestKind;
  title: string;
  description: string;
  costGold: number;
  reward: { gold?: number; fame?: number; prestige?: number; food?: number; influence?: number };
}

export const QUEST_DEFS: QuestDef[] = [
  {
    kind: 'village_help',
    title: 'Dorf in Not',
    description: 'Ein Dorf benötigt Hilfe nach einem Überfall.',
    costGold: 30,
    reward: { gold: 10, fame: 3, prestige: 5 },
  },
  {
    kind: 'merchant_escort',
    title: 'Händlerschutz',
    description: 'Ein Händler sucht Geleitschutz für seine Karawane.',
    costGold: 25,
    reward: { gold: 45, fame: 2 },
  },
  {
    kind: 'knight_tournament',
    title: 'Turnierforderung',
    description: 'Ein Ritter fordert ein Turnier zu Ehren der Krone.',
    costGold: 80,
    reward: { fame: 8, prestige: 12 },
  },
  {
    kind: 'general_reinforce',
    title: 'Verstärkung erbeten',
    description: 'Ein General bittet um Nachschub und Soldaten.',
    costGold: 50,
    reward: { fame: 4, influence: 5 },
  },
  {
    kind: 'city_food',
    title: 'Hungrige Stadt',
    description: 'Eine Stadt benötigt dringend Getreide und Brot.',
    costGold: 20,
    reward: { fame: 3, prestige: 4 },
  },
  {
    kind: 'neighbor_aid',
    title: 'Nachbarschaftshilfe',
    description: 'Ein Nachbarreich bittet um Unterstützung.',
    costGold: 40,
    reward: { influence: 10, fame: 3 },
  },
  {
    kind: 'church_donate',
    title: 'Kirchenspende',
    description: 'Die Kirche verlangt eine großzügige Spende.',
    costGold: 60,
    reward: { prestige: 8, fame: 2 },
  },
  {
    kind: 'bandit_clear',
    title: 'Straßen säubern',
    description: 'Banditen terrorisieren die Handelswege.',
    costGold: 45,
    reward: { gold: 30, fame: 5, prestige: 6 },
  },
];

export interface ActiveQuest {
  id: string;
  kind: QuestKind;
  title: string;
  description: string;
  costGold: number;
  reward: QuestDef['reward'];
  provinceHint?: string;
  expiresTick: number;
}

export function rollQuest(tick: number, provinceNames: string[]): ActiveQuest | null {
  if (Math.random() > 0.28) return null;
  const def = QUEST_DEFS[Math.floor(Math.random() * QUEST_DEFS.length)];
  const hint =
    provinceNames.length > 0
      ? provinceNames[Math.floor(Math.random() * provinceNames.length)]
      : undefined;
  return {
    id: cryptoRandomId(),
    kind: def.kind,
    title: def.title,
    description: hint ? `${def.description} (${hint})` : def.description,
    costGold: def.costGold,
    reward: { ...def.reward },
    provinceHint: hint,
    expiresTick: tick + 10 + Math.floor(Math.random() * 6),
  };
}

export function questToPendingEvent(q: ActiveQuest): PendingWorldEvent {
  return {
    id: q.id,
    templateId: `quest:${q.kind}`,
    title: q.title,
    description: q.description,
    choices: [
      { id: 'accept', label: `Annehmen (−${q.costGold} Gold)` },
      { id: 'decline', label: 'Ablehnen' },
    ],
    provinceId: undefined,
    createdTick: 0,
  };
}

export function resolveQuestChoice(
  q: ActiveQuest,
  choiceId: string,
  tick: number,
): {
  gold: number;
  food: number;
  fame: number;
  prestige: number;
  influence: number;
  entry: ChronicleEntry;
} {
  if (choiceId === 'decline') {
    return {
      gold: 0,
      food: 0,
      fame: -1,
      prestige: 0,
      influence: 0,
      entry: makeChronicle(tick, 'event', 'Quest abgelehnt', `${q.title} wurde abgelehnt.`),
    };
  }
  return {
    gold: -q.costGold + (q.reward.gold ?? 0),
    food: q.kind === 'city_food' ? -15 : 0,
    fame: q.reward.fame ?? 0,
    prestige: q.reward.prestige ?? 0,
    influence: q.reward.influence ?? 0,
    entry: makeChronicle(
      tick,
      'hero',
      `Quest: ${q.title}`,
      `Die Aufgabe wurde erfüllt. Ruhm und Belohnung folgen.`,
    ),
  };
}
