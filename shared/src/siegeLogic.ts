/** Belagerungslogik – Burgen fallen nicht sofort */

import type { ActiveSiege } from './worldState';

export function createSiege(input: {
  id: string;
  provinceId: string;
  attackerKingdomId: string;
  defenderKingdomId: string;
  armyId: string;
  castleLevel: number;
  tick: number;
}): ActiveSiege {
  const walls = 40 + input.castleLevel * 20;
  return {
    id: input.id,
    provinceId: input.provinceId,
    attackerKingdomId: input.attackerKingdomId,
    defenderKingdomId: input.defenderKingdomId,
    armyId: input.armyId,
    progress: 0,
    morale: 70,
    foodLeft: 50 + input.castleLevel * 15,
    wallIntegrity: walls,
    startedTick: input.tick,
  };
}

/** Ein Tick Belagerung – Progress steigt, Nahrung/Moral sinken */
export function tickSiege(siege: ActiveSiege, attackerPower: number, defenderPower: number): ActiveSiege {
  const pressure = Math.max(1, attackerPower / Math.max(1, defenderPower + 10));
  const progressGain = 4 + pressure * 3 + Math.random() * 4;
  const foodLoss = 3 + Math.floor(Math.random() * 3);
  const moraleLoss = siege.foodLeft < 20 ? 6 : 2;
  const wallDamage = 1 + pressure * 1.5;

  return {
    ...siege,
    progress: Math.min(100, siege.progress + progressGain),
    foodLeft: Math.max(0, siege.foodLeft - foodLoss),
    morale: Math.max(5, siege.morale - moraleLoss),
    wallIntegrity: Math.max(0, siege.wallIntegrity - wallDamage),
  };
}

export type SiegeOutcome = 'continue' | 'surrender' | 'storm_ready' | 'collapsed';

export function evaluateSiege(siege: ActiveSiege): SiegeOutcome {
  if (siege.foodLeft <= 0 && siege.morale < 25) return 'surrender';
  if (siege.progress >= 100 || siege.wallIntegrity <= 0) return 'storm_ready';
  if (siege.morale <= 8 && siege.progress > 40) return 'surrender';
  return 'continue';
}

/** Sturm-Bonus: je höher Progress, desto leichter der Sturmangriff */
export function stormAttackerBonus(siege: ActiveSiege): number {
  return Math.floor(siege.progress / 10) + (siege.wallIntegrity < 20 ? 3 : 0);
}
