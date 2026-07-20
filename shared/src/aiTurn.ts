/** KI-Zug: wirtschaftliche und militärische Entscheidungen ohne Cheats */

import { PERSONALITIES, WAR_REASONS, type PersonalityId, type WarReasonId } from './aiPersonality';
import type { AiKingdomState, ActiveWar, KingdomRelation } from './worldState';
import { areAtWar, getRelation } from './worldState';

export type AiAction =
  | { type: 'recruit'; provinceId: string; unitType: string; count: number; costGold: number; costFood: number }
  | { type: 'build_castle'; provinceId: string; costGold: number; costStone: number }
  | { type: 'upgrade_village'; provinceId: string; costGold: number }
  | { type: 'found_city'; provinceId: string }
  | { type: 'place_market'; provinceId: string }
  | { type: 'expand_neutral'; fromProvinceId: string; targetProvinceId: string }
  | { type: 'declare_war'; targetId: string; reasonId: WarReasonId }
  | { type: 'offer_trade'; targetId: string }
  | { type: 'offer_alliance'; targetId: string }
  | { type: 'start_siege'; fromProvinceId: string; targetProvinceId: string; armyId: string }
  | { type: 'attack_field'; fromProvinceId: string; targetProvinceId: string; armyId: string }
  | { type: 'idle' };

export interface AiProvinceView {
  id: string;
  slug: string;
  ownerId: string | null;
  population: number;
  defense: number;
  castleLevel: number;
  villageLevel: number;
  cityLevel: number;
  neighborIds: string[];
  prosperity: number;
}

export interface AiArmyView {
  id: string;
  kingdomId: string;
  provinceId: string;
  troopCount: number;
  isGarrison: boolean;
}

export interface AiWorldView {
  kingdom: AiKingdomState;
  provinces: AiProvinceView[];
  armies: AiArmyView[];
  relations: KingdomRelation[];
  wars: ActiveWar[];
  /** Andere Reiche (Spieler + KI) */
  otherKingdoms: Array<{
    id: string;
    name: string;
    religion: string;
    provinceCount: number;
  }>;
  tick: number;
}

function owned(view: AiWorldView): AiProvinceView[] {
  return view.provinces.filter((p) => p.ownerId === view.kingdom.id);
}

function pickWeakNeutral(view: AiWorldView): { from: AiProvinceView; target: AiProvinceView } | null {
  const mine = owned(view);
  for (const from of mine) {
    for (const nid of from.neighborIds) {
      const t = view.provinces.find((p) => p.id === nid);
      if (t && !t.ownerId) {
        return { from, target: t };
      }
    }
  }
  return null;
}

function pickWarTarget(view: AiWorldView): { targetId: string; reasonId: WarReasonId } | null {
  const p = PERSONALITIES[view.kingdom.personality];
  if (p.war < 0.35 && Math.random() > p.war + 0.1) return null;

  let best: { targetId: string; reasonId: WarReasonId; score: number } | null = null;
  for (const other of view.otherKingdoms) {
    if (areAtWar(view.wars, view.kingdom.id, other.id)) continue;
    const rel = getRelation(view.relations, view.kingdom.id, other.id);
    const opinion = rel?.opinion ?? 0;
    if (rel?.status === 'ALLIED') continue;

    // Border contact?
    const mine = owned(view);
    const their = view.provinces.filter((x) => x.ownerId === other.id);
    let borders = false;
    let theirWeak = false;
    for (const m of mine) {
      for (const nid of m.neighborIds) {
        const n = their.find((t) => t.id === nid);
        if (n) {
          borders = true;
          if (n.defense < 25 || n.castleLevel < 2) theirWeak = true;
        }
      }
    }
    if (!borders && p.expansion < 0.7) continue;

    let reasonId: WarReasonId = 'ambition';
    let score = p.war * 40 - opinion * 0.4;

    if (view.kingdom.religion !== other.religion && p.faith > 0.6) {
      reasonId = 'religion';
      score += 25;
    } else if (theirWeak) {
      reasonId = 'weak_neighbor';
      score += 20;
    } else if (opinion < -40) {
      reasonId = 'feud';
      score += 15;
    } else if (borders) {
      reasonId = 'border';
      score += 10;
    } else if (p.expansion > 0.8) {
      reasonId = 'ambition';
      score += 12;
    }

    if (rel?.lastReason === 'defeat') {
      reasonId = 'revenge';
      score += 30;
    }

    if (!best || score > best.score) best = { targetId: other.id, reasonId, score };
  }
  if (best && best.score > 35 && Math.random() < p.war * 0.45) return best;
  return null;
}

/**
 * Wählt genau eine Aktion pro Tick – günstig und regelkonform.
 * Die ausführende Schicht prüft Ressourcen und zieht sie ab.
 */
export function decideAiAction(view: AiWorldView): AiAction {
  const k = view.kingdom;
  const p = PERSONALITIES[k.personality];
  const mine = owned(view);
  if (mine.length === 0) return { type: 'idle' };

  const fieldArmies = view.armies.filter((a) => a.kingdomId === k.id && !a.isGarrison);
  const garrisons = view.armies.filter((a) => a.kingdomId === k.id && a.isGarrison);

  // 1) Krieg führen / belagern wenn im Krieg
  const enemyIds = new Set<string>();
  for (const w of view.wars) {
    if (w.attackerId === k.id) enemyIds.add(w.defenderId);
    if (w.defenderId === k.id) enemyIds.add(w.attackerId);
  }

  if (enemyIds.size > 0 && fieldArmies.length > 0 && Math.random() < 0.55 + p.war * 0.3) {
    const army = fieldArmies.sort((a, b) => b.troopCount - a.troopCount)[0];
    const from = view.provinces.find((x) => x.id === army.provinceId);
    if (from) {
      for (const nid of from.neighborIds) {
        const t = view.provinces.find((x) => x.id === nid);
        if (t?.ownerId && enemyIds.has(t.ownerId)) {
          if (t.castleLevel >= 1) {
            return {
              type: 'start_siege',
              fromProvinceId: from.id,
              targetProvinceId: t.id,
              armyId: army.id,
            };
          }
          return {
            type: 'attack_field',
            fromProvinceId: from.id,
            targetProvinceId: t.id,
            armyId: army.id,
          };
        }
      }
    }
  }

  // 2) Diplomatie
  if (p.diplomacy > 0.5 && Math.random() < p.diplomacy * 0.35) {
    const candidates = view.otherKingdoms.filter((o) => !areAtWar(view.wars, k.id, o.id));
    if (candidates.length) {
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      const rel = getRelation(view.relations, k.id, target.id);
      if ((rel?.opinion ?? 0) > 20 && rel?.status !== 'ALLIED' && Math.random() < 0.5) {
        return { type: 'offer_alliance', targetId: target.id };
      }
      if (rel?.status !== 'TRADE_PACT') {
        return { type: 'offer_trade', targetId: target.id };
      }
    }
  }

  // 3) Krieg erklären
  const warTarget = pickWarTarget(view);
  if (warTarget && k.influence >= 10) {
    return { type: 'declare_war', targetId: warTarget.targetId, reasonId: warTarget.reasonId };
  }

  // 4) Neutral expandieren
  if (p.expansion > 0.3 && Math.random() < p.expansion * 0.5) {
    const exp = pickWeakNeutral(view);
    if (exp && (fieldArmies.some((a) => a.troopCount >= 8) || garrisons.some((g) => g.troopCount >= 12))) {
      return { type: 'expand_neutral', fromProvinceId: exp.from.id, targetProvinceId: exp.target.id };
    }
  }

  // 5) Rekrutieren
  if ((p.war > 0.4 || p.defense > 0.6 || p.expansion > 0.5) && k.gold >= 40 && k.food >= 30) {
    const prov = mine[Math.floor(Math.random() * mine.length)];
    const count = p.war > 0.7 ? 8 : 5;
    return {
      type: 'recruit',
      provinceId: prov.id,
      unitType: 'SPEARMAN',
      count,
      costGold: count * 8,
      costFood: count * 4,
    };
  }

  // 6) Verteidigung / Wirtschaft
  if (p.defense > 0.55 && Math.random() < 0.4) {
    const border = mine.find((m) =>
      m.neighborIds.some((nid) => {
        const n = view.provinces.find((x) => x.id === nid);
        return n && n.ownerId && n.ownerId !== k.id;
      }),
    );
    const target = border ?? mine[0];
    if (target.castleLevel < 3 && k.gold >= 100 && k.stone >= 60) {
      return {
        type: 'build_castle',
        provinceId: target.id,
        costGold: 80 + target.castleLevel * 40,
        costStone: 50 + target.castleLevel * 30,
      };
    }
  }

  if (p.economy > 0.5 && k.gold >= 60) {
    const weak = [...mine].sort((a, b) => a.prosperity - b.prosperity)[0];
    if (weak.villageLevel < 3) {
      return { type: 'upgrade_village', provinceId: weak.id, costGold: 80 * (weak.villageLevel + 1) };
    }
    if (weak.cityLevel < 1 && weak.population > 800) {
      return { type: 'found_city', provinceId: weak.id };
    }
    return { type: 'place_market', provinceId: weak.id };
  }

  if (p.faith > 0.7 && k.gold >= 50) {
    // Tempel über Gebäude-Markt annähern
    return { type: 'place_market', provinceId: mine[0].id };
  }

  // Fallback: expandieren oder rekrutieren
  const exp2 = pickWeakNeutral(view);
  if (exp2) return { type: 'expand_neutral', fromProvinceId: exp2.from.id, targetProvinceId: exp2.target.id };

  if (k.gold >= 40) {
    return {
      type: 'recruit',
      provinceId: mine[0].id,
      unitType: 'MILITIA',
      count: 5,
      costGold: 25,
      costFood: 15,
    };
  }

  return { type: 'idle' };
}

export function warReasonText(reasonId: WarReasonId, attacker: string, defender: string): string {
  return `${attacker} erklärt ${defender} den Krieg wegen: ${WAR_REASONS[reasonId]}`;
}

export function personalityLabel(id: PersonalityId): string {
  return PERSONALITIES[id].name;
}
