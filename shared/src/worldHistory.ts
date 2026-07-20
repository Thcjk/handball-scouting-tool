/** Weltgeschichte – Rekorde jeder Partie */

export type HistoryRecordId =
  | 'greatest_battle'
  | 'longest_war'
  | 'richest_ruler'
  | 'greatest_capital'
  | 'mightiest_dynasty'
  | 'famed_general'
  | 'greatest_famine'
  | 'worst_plague'
  | 'greatest_rebellion'
  | 'largest_realm';

export interface HistoryRecord {
  id: HistoryRecordId;
  label: string;
  value: number;
  detail: string;
  tick: number;
  year: number;
}

export interface WorldHistoryState {
  records: HistoryRecord[];
  milestones: Array<{ tick: number; year: number; text: string }>;
}

export const HISTORY_LABELS: Record<HistoryRecordId, string> = {
  greatest_battle: 'Größte Schlacht',
  longest_war: 'Längster Krieg',
  richest_ruler: 'Reichster Herrscher',
  greatest_capital: 'Größte Hauptstadt',
  mightiest_dynasty: 'Mächtigste Dynastie',
  famed_general: 'Berühmtester General',
  greatest_famine: 'Größte Hungersnot',
  worst_plague: 'Schwerste Pest',
  greatest_rebellion: 'Größte Rebellion',
  largest_realm: 'Größtes Reich',
};

export function defaultWorldHistory(): WorldHistoryState {
  return { records: [], milestones: [] };
}

function upsert(
  records: HistoryRecord[],
  id: HistoryRecordId,
  value: number,
  detail: string,
  tick: number,
  year: number,
): HistoryRecord[] {
  const existing = records.find((r) => r.id === id);
  if (existing && existing.value >= value) return records;
  const next: HistoryRecord = {
    id,
    label: HISTORY_LABELS[id],
    value,
    detail,
    tick,
    year,
  };
  if (!existing) return [...records, next];
  return records.map((r) => (r.id === id ? next : r));
}

export function updateWorldHistory(
  state: WorldHistoryState,
  input: {
    tick: number;
    year: number;
    gold: number;
    rulerName: string;
    provinceCount: number;
    capitalPop: number;
    capitalName: string;
    dynastyPrestige: number;
    dynastyName: string;
    warCount: number;
    longestWarTicks: number;
    battleTroops?: number;
    battleName?: string;
    generalFame?: number;
    generalName?: string;
    famineSeverity?: number;
    plagueSeverity?: number;
    rebellionStrength?: number;
  },
): WorldHistoryState {
  let records = [...state.records];
  const year = input.year;
  const tick = input.tick;

  records = upsert(records, 'richest_ruler', input.gold, `${input.rulerName} mit ${input.gold} Gold`, tick, year);
  records = upsert(
    records,
    'largest_realm',
    input.provinceCount,
    `${input.provinceCount} Provinzen unter der Krone`,
    tick,
    year,
  );
  records = upsert(
    records,
    'greatest_capital',
    input.capitalPop,
    `${input.capitalName} – ${input.capitalPop} Einwohner`,
    tick,
    year,
  );
  records = upsert(
    records,
    'mightiest_dynasty',
    input.dynastyPrestige,
    `${input.dynastyName} – Prestige ${input.dynastyPrestige}`,
    tick,
    year,
  );
  if (input.longestWarTicks > 0) {
    records = upsert(
      records,
      'longest_war',
      input.longestWarTicks,
      `Krieg dauerte ${input.longestWarTicks} Ticks (${input.warCount} aktiv)`,
      tick,
      year,
    );
  }
  if (input.battleTroops && input.battleName) {
    records = upsert(
      records,
      'greatest_battle',
      input.battleTroops,
      input.battleName,
      tick,
      year,
    );
  }
  if (input.generalFame && input.generalName) {
    records = upsert(
      records,
      'famed_general',
      input.generalFame,
      input.generalName,
      tick,
      year,
    );
  }
  if (input.famineSeverity) {
    records = upsert(records, 'greatest_famine', input.famineSeverity, 'Hungersnot im Reich', tick, year);
  }
  if (input.plagueSeverity) {
    records = upsert(records, 'worst_plague', input.plagueSeverity, 'Seuche im Reich', tick, year);
  }
  if (input.rebellionStrength) {
    records = upsert(
      records,
      'greatest_rebellion',
      input.rebellionStrength,
      'Rebellion / Bürgerkrieg',
      tick,
      year,
    );
  }

  return { ...state, records };
}

export function addHistoryMilestone(
  state: WorldHistoryState,
  tick: number,
  year: number,
  text: string,
): WorldHistoryState {
  return {
    ...state,
    milestones: [...state.milestones, { tick, year, text }].slice(-80),
  };
}
