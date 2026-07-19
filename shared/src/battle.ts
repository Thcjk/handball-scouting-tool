import type { BattleInput, BattleResult, BattleRound, BattleUnitInput } from './types';
import { Terrain } from './types';
import { TERRAIN_DEFENSE_BONUS, CASTLE_DEFENSE_PER_LEVEL } from './constants';
import { getUnitPower, UNIT_DEFINITIONS } from './units';

function totalArmyPower(units: BattleUnitInput[]): {
  attack: number;
  defense: number;
  count: number;
} {
  return units.reduce(
    (acc, u) => {
      const power = getUnitPower(u.type, u.count);
      return {
        attack: acc.attack + power.attack,
        defense: acc.defense + power.defense,
        count: acc.count + u.count,
      };
    },
    { attack: 0, defense: 0, count: 0 },
  );
}

function applyCasualties(
  units: BattleUnitInput[],
  damage: number,
): { survivors: BattleUnitInput[]; casualties: BattleUnitInput[] } {
  const casualties: BattleUnitInput[] = [];
  const survivors: BattleUnitInput[] = [];
  let remainingDamage = damage;

  const sorted = [...units].sort(
    (a, b) => UNIT_DEFINITIONS[a.type].defense - UNIT_DEFINITIONS[b.type].defense,
  );

  for (const unit of sorted) {
    const unitHp = unit.count * UNIT_DEFINITIONS[unit.type].defense;
    if (remainingDamage <= 0) {
      survivors.push({ ...unit });
      continue;
    }

    const damageToUnit = Math.min(remainingDamage, unitHp);
    const killed = Math.ceil(damageToUnit / UNIT_DEFINITIONS[unit.type].defense);
    const survived = Math.max(0, unit.count - killed);
    remainingDamage -= damageToUnit;

    if (killed > 0) {
      casualties.push({ type: unit.type, count: killed });
    }
    if (survived > 0) {
      survivors.push({ type: unit.type, count: survived });
    }
  }

  return { survivors, casualties };
}

function terrainModifier(terrain: Terrain): number {
  return 1 + TERRAIN_DEFENSE_BONUS[terrain] / 100;
}

export function resolveBattle(input: BattleInput): BattleResult {
  let attackerUnits = input.attackerUnits.map((u) => ({ ...u }));
  let defenderUnits = input.defenderUnits.map((u) => ({ ...u }));
  let attackerMorale = input.attackerMorale;
  let defenderMorale = input.defenderMorale;
  const rounds: BattleRound[] = [];
  const allAttackerCasualties: BattleUnitInput[] = [];
  const allDefenderCasualties: BattleUnitInput[] = [];

  const defenderBonus =
    terrainModifier(input.terrain) +
    (input.castleLevel * CASTLE_DEFENSE_PER_LEVEL) / 100 +
    input.defenderCommanderMartial * 0.02;

  const attackerBonus = 1 + input.attackerCommanderMartial * 0.02;

  for (let round = 1; round <= 5; round++) {
    const atk = totalArmyPower(attackerUnits);
    const def = totalArmyPower(defenderUnits);

    if (atk.count === 0 || def.count === 0) break;

    const randomFactor = 0.85 + Math.random() * 0.3;
    const attackerDamage = Math.floor(
      (atk.attack * attackerBonus * (attackerMorale / 100) * randomFactor) /
        Math.max(1, def.defense * defenderBonus),
    );
    const defenderDamage = Math.floor(
      (def.attack * defenderBonus * (defenderMorale / 100) * randomFactor) /
        Math.max(1, atk.defense * attackerBonus),
    );

    const atkResult = applyCasualties(attackerUnits, defenderDamage);
    const defResult = applyCasualties(defenderUnits, attackerDamage);

    attackerUnits = atkResult.survivors;
    defenderUnits = defResult.survivors;
    allAttackerCasualties.push(...atkResult.casualties);
    allDefenderCasualties.push(...defResult.casualties);

    attackerMorale = Math.max(0, attackerMorale - Math.floor(defenderDamage / 10));
    defenderMorale = Math.max(0, defenderMorale - Math.floor(attackerDamage / 8));

    rounds.push({
      round,
      attackerDamage,
      defenderDamage,
      attackerMorale,
      defenderMorale,
      description: `Runde ${round}: Angreifer verursachen ${attackerDamage} Schaden, Verteidiger ${defenderDamage} Schaden.`,
    });

    if (attackerMorale <= 10 || defenderMorale <= 10) break;
  }

  const atkRemaining = totalArmyPower(attackerUnits).count;
  const defRemaining = totalArmyPower(defenderUnits).count;

  let attackerWon = false;
  if (defRemaining === 0) {
    attackerWon = true;
  } else if (atkRemaining === 0) {
    attackerWon = false;
  } else {
    const atkScore = atkRemaining * (attackerMorale / 100);
    const defScore = defRemaining * (defenderMorale / 100) * defenderBonus;
    attackerWon = atkScore > defScore;
  }

  const summary = attackerWon
    ? 'Der Angriff war erfolgreich! Die Provinz wurde erobert.'
    : 'Die Verteidigung hielt stand. Der Angriff wurde abgewehrt.';

  return {
    attackerWon,
    attackerCasualties: mergeCasualties(allAttackerCasualties),
    defenderCasualties: mergeCasualties(allDefenderCasualties),
    rounds,
    summary,
  };
}

function mergeCasualties(casualties: BattleUnitInput[]): BattleUnitInput[] {
  const map = new Map<string, number>();
  for (const c of casualties) {
    map.set(c.type, (map.get(c.type) ?? 0) + c.count);
  }
  return Array.from(map.entries()).map(([type, count]) => ({
    type: type as BattleUnitInput['type'],
    count,
  }));
}
