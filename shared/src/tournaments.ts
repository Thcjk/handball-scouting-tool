/** Turniere & Disziplinen */

import { cryptoRandomId, makeChronicle, type ChronicleEntry } from './worldState';

export type TournamentDiscipline = 'joust' | 'archery' | 'sword' | 'riding';

export interface TournamentState {
  id: string;
  active: boolean;
  discipline: TournamentDiscipline;
  participants: string[];
  winner?: string;
  playerParticipates: boolean;
  ticksLeft: number;
}

export const TOURNAMENT_DISCIPLINES: Array<{
  id: TournamentDiscipline;
  name: string;
  cost: number;
}> = [
  { id: 'joust', name: 'Lanzenstechen', cost: 100 },
  { id: 'archery', name: 'Bogenschießen', cost: 80 },
  { id: 'sword', name: 'Schwertkampf', cost: 90 },
  { id: 'riding', name: 'Reiten', cost: 85 },
];

const KNIGHT_NAMES = [
  'Sir Roland',
  'Dame Isolde',
  'Sir Gawain',
  'Herr Ulrich',
  'Sir Tristan',
  'Dame Mechthild',
  'Sir Parsifal',
];

export function startTournament(
  discipline: TournamentDiscipline,
  playerParticipates: boolean,
): TournamentState {
  const guests = [...KNIGHT_NAMES].sort(() => Math.random() - 0.5).slice(0, 4);
  if (playerParticipates) guests.push('Ihr Herrscher');
  return {
    id: cryptoRandomId(),
    active: true,
    discipline,
    participants: guests,
    playerParticipates,
    ticksLeft: 2,
  };
}

export function tickTournament(t: TournamentState, tick: number): {
  tournament: TournamentState;
  entry?: ChronicleEntry;
  fame: number;
  prestige: number;
} {
  if (!t.active) return { tournament: t, fame: 0, prestige: 0 };
  const left = t.ticksLeft - 1;
  if (left > 0) return { tournament: { ...t, ticksLeft: left }, fame: 0, prestige: 0 };

  const winner = t.participants[Math.floor(Math.random() * t.participants.length)];
  const playerWon = winner === 'Ihr Herrscher';
  const disc = TOURNAMENT_DISCIPLINES.find((d) => d.id === t.discipline)?.name ?? t.discipline;
  return {
    tournament: { ...t, active: false, ticksLeft: 0, winner },
    fame: playerWon ? 12 : 5,
    prestige: playerWon ? 15 : 4,
    entry: makeChronicle(
      tick,
      'hero',
      `Turnier: ${disc}`,
      `${winner} siegt im ${disc}. Berühmte Ritter reisten an.`,
    ),
  };
}
