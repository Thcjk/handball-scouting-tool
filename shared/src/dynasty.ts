export const RULER_DEATH_AGE = 70;
export const RULER_DEATH_CHANCE_PER_BATTLE = 0.05;
export const HEIR_MIN_AGE = 16;
export const TICK_AGE_INTERVAL = 10; // game ticks between age increments

export interface SuccessionResult {
  deceasedRulerId: string;
  newRulerId: string;
  newRulerName: string;
  reason: 'age' | 'battle' | 'natural';
}

export function shouldRulerDieFromAge(age: number): boolean {
  if (age < RULER_DEATH_AGE) return false;
  const chance = (age - RULER_DEATH_AGE + 1) * 0.1;
  return Math.random() < chance;
}

export function shouldRulerDieInBattle(): boolean {
  return Math.random() < RULER_DEATH_CHANCE_PER_BATTLE;
}
