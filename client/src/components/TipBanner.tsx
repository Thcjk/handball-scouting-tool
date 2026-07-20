import { useEffect, useMemo, useState } from 'react';
import type { GameState } from '../api/client';
import {
  TIP_COOLDOWN_KEY,
  TIP_DISMISS_KEY,
  TUTORIAL_DONE_KEY,
  pickContextualTips,
  type ContextualTip,
} from '../lore/helpContent';

interface Props {
  gameState: GameState;
}

function readDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(TIP_DISMISS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeDismissed(ids: Set<string>) {
  localStorage.setItem(TIP_DISMISS_KEY, JSON.stringify([...ids]));
}

export default function TipBanner({ gameState }: Props) {
  const [tip, setTip] = useState<ContextualTip | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(() => readDismissed());

  const owned = useMemo(
    () => gameState.provinces.filter((p) => p.isOwned),
    [gameState.provinces],
  );
  const capital = owned.find((p) => p.isCapital) ?? owned[0];
  const hasBuildings = (capital?.cityGrid?.length ?? 0) > 2;
  const taxHigh = owned.some((p) => (p.devStats?.taxRate ?? 30) > 45);
  const tutorialDone = localStorage.getItem(TUTORIAL_DONE_KEY) === '1';

  const candidates = useMemo(() => {
    if (!tutorialDone) return [];
    return pickContextualTips({
      tick: gameState.tickCount ?? 0,
      gold: gameState.kingdom.resources.gold,
      food: gameState.kingdom.resources.food,
      ownedCount: owned.length,
      hasCityBuildings: hasBuildings,
      taxHigh,
      atWar: (gameState.wars?.length ?? 0) > 0,
      pendingEvent: (gameState.pendingEvents?.length ?? 0) > 0,
      hasQuest: (gameState.society?.quests.length ?? 0) > 0,
      crisisActive: (gameState.endgame?.crises.length ?? 0) > 0,
      invasionActive: (gameState.endgame?.invasions.length ?? 0) > 0,
      tutorialDone,
    }).filter((t) => !dismissed.has(t.id) && !t.id.startsWith('seasonal_'));
  }, [
    gameState.tickCount,
    gameState.kingdom.resources.gold,
    gameState.kingdom.resources.food,
    gameState.wars,
    gameState.pendingEvents,
    gameState.society?.quests,
    gameState.endgame?.crises,
    gameState.endgame?.invasions,
    owned.length,
    hasBuildings,
    taxHigh,
    dismissed,
    tutorialDone,
  ]);

  useEffect(() => {
    if (candidates.length === 0) {
      setTip(null);
      return;
    }
    const now = Date.now();
    const cooldownUntil = Number(localStorage.getItem(TIP_COOLDOWN_KEY) ?? 0);
    if (now < cooldownUntil && tip) return;
    if (now < cooldownUntil && !tip) return;

    const next = candidates[0];
    if (tip?.id === next.id) return;
    setTip(next);
  }, [candidates, tip]);

  // Periodischer allgemeiner Tipp (alle ~2 Min), wenn kein Kontext-Tipp
  useEffect(() => {
    if (!tutorialDone || tip) return;
    const id = window.setInterval(() => {
      const cooldownUntil = Number(localStorage.getItem(TIP_COOLDOWN_KEY) ?? 0);
      if (Date.now() < cooldownUntil) return;
      const seasonal = pickContextualTips({
        tick: (gameState.tickCount ?? 0) + 12,
        gold: 999,
        food: 999,
        ownedCount: owned.length,
        hasCityBuildings: true,
        taxHigh: false,
        atWar: false,
        pendingEvent: false,
        hasQuest: false,
        crisisActive: false,
        invasionActive: false,
        tutorialDone: true,
      }).find((t) => t.id.startsWith('seasonal_') || t.priority <= 40);
      if (seasonal && !dismissed.has(seasonal.id)) {
        setTip({
          id: `rotating_${gameState.tickCount ?? 0}`,
          title: 'Tipp',
          text: seasonal.text,
          priority: 25,
        });
      }
    }, 120000);
    return () => clearInterval(id);
  }, [tutorialDone, tip, gameState.tickCount, owned.length, dismissed]);

  if (!tip) return null;

  const dismiss = (remember: boolean) => {
    if (remember) {
      const next = new Set(dismissed);
      next.add(tip.id);
      // rotating tips: don't permanently block by unique id forever beyond session pattern
      if (!tip.id.startsWith('rotating_')) {
        setDismissed(next);
        writeDismissed(next);
      }
    }
    localStorage.setItem(TIP_COOLDOWN_KEY, String(Date.now() + 90_000));
    setTip(null);
  };

  return (
    <div className="tip-banner" role="status">
      <div className="tip-banner-inner">
        <div className="min-w-0 flex-1">
          <div className="font-display text-gold text-sm">{tip.title}</div>
          <p className="text-xs text-parchment/85 leading-snug mt-0.5">{tip.text}</p>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <button type="button" className="btn-secondary text-[10px] py-1 px-2" onClick={() => dismiss(false)}>
            OK
          </button>
          <button
            type="button"
            className="text-[10px] text-parchment/45 hover:text-parchment/70"
            onClick={() => dismiss(true)}
          >
            Nicht mehr
          </button>
        </div>
      </div>
    </div>
  );
}
