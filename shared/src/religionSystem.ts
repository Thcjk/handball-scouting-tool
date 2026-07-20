/** Religion, Glauben, Ritterorden */

export interface ReligionDef {
  id: string;
  name: string;
  bonus: string;
  feast: string;
  relationPenaltyOther: number;
}

export const RELIGIONS_FULL: ReligionDef[] = [
  {
    id: 'lichtglaube',
    name: 'Lichtglaube',
    bonus: '+Glauben, stärkere Kirchen',
    feast: 'Lichtfest',
    relationPenaltyOther: 10,
  },
  {
    id: 'alte_goetter',
    name: 'Alte Götter',
    bonus: '+Krieg in Bergen',
    feast: 'Sonnwend',
    relationPenaltyOther: 12,
  },
  {
    id: 'naturkult',
    name: 'Naturkult',
    bonus: '+Nahrung in Wäldern',
    feast: 'Erntefeuer',
    relationPenaltyOther: 8,
  },
];

export type KnightOrderId = 'crown' | 'lion' | 'north';

export interface KnightOrder {
  id: KnightOrderId;
  name: string;
  founded: boolean;
  strength: number;
  loyalty: number;
}

export const KNIGHT_ORDERS: Array<{ id: KnightOrderId; name: string; requiresTech: string }> = [
  { id: 'crown', name: 'Orden der Krone', requiresTech: 'fth_2' },
  { id: 'lion', name: 'Orden des Löwen', requiresTech: 'fth_2' },
  { id: 'north', name: 'Orden des Nordens', requiresTech: 'fth_2' },
];

export interface FaithState {
  piety: number;
  religionId: string;
  relics: number;
  orders: KnightOrder[];
}

export function defaultFaithState(religionId = 'lichtglaube'): FaithState {
  return {
    piety: 20,
    religionId,
    relics: 0,
    orders: KNIGHT_ORDERS.map((o) => ({
      id: o.id,
      name: o.name,
      founded: false,
      strength: 0,
      loyalty: 50,
    })),
  };
}

export function pilgrimage(state: FaithState): FaithState {
  return {
    ...state,
    piety: Math.min(100, state.piety + 12),
    relics: state.relics + (Math.random() < 0.15 ? 1 : 0),
  };
}

export function foundOrder(state: FaithState, orderId: KnightOrderId, researched: string[]): {
  state: FaithState;
  error?: string;
} {
  if (!researched.includes('fth_2')) {
    return { state, error: 'Benötigt Technologie: Heilige Orden' };
  }
  const orders = state.orders.map((o) =>
    o.id === orderId ? { ...o, founded: true, strength: 10, loyalty: 70 } : o,
  );
  return { state: { ...state, orders, piety: Math.max(0, state.piety - 15) } };
}

export function orderMilitaryBonus(state: FaithState): number {
  return state.orders.filter((o) => o.founded).reduce((s, o) => s + o.strength * 0.01, 0);
}
