import { useState, useEffect, useCallback } from 'react';
import { api, type GameState, type Province, type BattleResult, isOfflineMode } from '../api/client';
import { applyResourceTick } from '../local/localApi';
import { useGameSocket } from '../hooks/useGameSocket';
import ResourceBar from '../components/ResourceBar';
import WorldMap from '../components/WorldMap';
import ProvincePanel from '../components/ProvincePanel';
import CharacterPanel from '../components/CharacterPanel';
import CityView from '../components/CityView';
import IntroOverlay from '../components/IntroOverlay';
import EventModal from '../components/EventModal';
import { buildIntroStory, INTRO_SEEN_KEY } from '../lore/intro';

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [successionMsg, setSuccessionMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapMode, setMapMode] = useState<'terrain' | 'political'>('political');
  const [showChar, setShowChar] = useState(true);
  const [showPanel, setShowPanel] = useState(true);
  const [cityViewId, setCityViewId] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(false);

  const loadGame = useCallback(async () => {
    try {
      const state = await api.getGameState();
      setGameState(state);
      setSelectedProvince((prev) => {
        if (prev) return state.provinces.find((p) => p.id === prev.id) ?? prev;
        return state.provinces.find((p) => p.isOwned) ?? null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Spielstand konnte nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  useEffect(() => {
    if (!gameState) return;
    const key = `${INTRO_SEEN_KEY}_${gameState.kingdom.id}`;
    if (!localStorage.getItem(key)) {
      setShowIntro(true);
    }
  }, [gameState]);

  const dismissIntro = () => {
    if (gameState) {
      localStorage.setItem(`${INTRO_SEEN_KEY}_${gameState.kingdom.id}`, '1');
    }
    setShowIntro(false);
  };

  useEffect(() => {
    if (!isOfflineMode) return;
    const id = setInterval(() => {
      const session = localStorage.getItem('kronenchronik_session');
      if (!session) return;
      const state = applyResourceTick(session);
      if (state) setGameState(state);
    }, 30000);
    return () => clearInterval(id);
  }, []);

  useGameSocket({
    onGameStateUpdate: (state) => setGameState(state),
    onBattleResult: (data) => {
      setBattleResult(data.result);
      if (data.successionResult) {
        const s = data.successionResult as { newRulerName: string };
        setSuccessionMsg(`Thronfolge: ${s.newRulerName} ist neuer Herrscher!`);
      }
    },
    onResourceTick: (data) => {
      setGameState((prev) =>
        prev ? { ...prev, kingdom: { ...prev.kingdom, resources: data.resources } } : prev,
      );
    },
    onSuccession: (data) => {
      const s = data as { newRulerName: string };
      setSuccessionMsg(`Thronfolge: ${s.newRulerName} ist neuer Herrscher!`);
      loadGame();
    },
    onDiplomacyEvent: (data) => {
      const e = data as { type: string; from: string };
      if (e.type === 'war_declared') {
        setSuccessionMsg(`${e.from} hat dir den Krieg erklärt!`);
      }
    },
  });

  const handleSelect = (province: Province) => {
    setSelectedProvince(province);
    setBattleResult(null);
    setShowPanel(true);
  };

  const handleUpdate = (state: GameState) => {
    setGameState(state);
    if (selectedProvince) {
      const updated = state.provinces.find((p) => p.id === selectedProvince.id);
      if (updated) setSelectedProvince(updated);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gold font-display animate-pulse">
        Die Welt erwacht…
      </div>
    );
  }

  if (error || !gameState) {
    return <div className="h-full flex items-center justify-center text-red-400">{error || 'Kein Spielstand'}</div>;
  }

  const cityProvince = cityViewId
    ? gameState.provinces.find((p) => p.id === cityViewId)
    : null;

  if (cityProvince && cityProvince.isOwned) {
    return (
      <div className="h-full flex flex-col">
        <div className="shrink-0 px-3 py-1.5 bg-black/40 border-b border-gold/20 flex flex-wrap items-center justify-between gap-2">
          <div className="font-display text-sm text-gold truncate">{gameState.kingdom.name}</div>
          <ResourceBar resources={gameState.kingdom.resources} />
        </div>
        <div className="flex-1 min-h-0">
          <CityView
            province={cityProvince}
            gameState={gameState}
            onUpdate={handleUpdate}
            onBack={() => setCityViewId(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      {showIntro && gameState && (
        <IntroOverlay
          rulerName={gameState.dynasty.ruler?.name ?? 'Herrscher'}
          kingdomName={gameState.kingdom.name}
          dynastyName={gameState.dynasty.dynasty?.name ?? 'Haus'}
          startProvince={gameState.provinces.find((p) => p.isOwned)?.name ?? 'Grenzgrafschaft'}
          story={buildIntroStory({
            rulerName: gameState.dynasty.ruler?.name ?? 'Herrscher',
            kingdomName: gameState.kingdom.name,
            dynastyName: gameState.dynasty.dynasty?.name ?? 'Haus',
            startProvince: gameState.provinces.find((p) => p.isOwned)?.name ?? 'Grenzgrafschaft',
          })}
          onContinue={dismissIntro}
        />
      )}

      {/* Ressourcen-HUD oben */}
      <div className="shrink-0 px-3 py-1.5 bg-black/40 border-b border-gold/20 flex flex-wrap items-center justify-between gap-2">
        <div className="font-display text-sm text-gold truncate">
          {gameState.kingdom.name}
          {gameState.worldYear ? (
            <span className="text-parchment/50 font-sans text-[10px] ml-2">Anno {gameState.worldYear}</span>
          ) : null}
        </div>
        <ResourceBar resources={gameState.kingdom.resources} />
        <div className="flex gap-1">
          <button
            type="button"
            className={`btn-secondary text-[10px] py-1 ${mapMode === 'political' ? 'border-gold text-gold' : ''}`}
            onClick={() => setMapMode('political')}
          >
            Reiche
          </button>
          <button
            type="button"
            className={`btn-secondary text-[10px] py-1 ${mapMode === 'terrain' ? 'border-gold text-gold' : ''}`}
            onClick={() => setMapMode('terrain')}
          >
            Gelände
          </button>
          <button type="button" className="btn-secondary text-[10px] py-1" onClick={() => setShowChar((v) => !v)}>
            Herrscher
          </button>
        </div>
      </div>

      {gameState.worldAlert && (
        <div className="shrink-0 px-3 py-1.5 bg-amber-950/50 border-b border-amber-600/40 text-amber-100 text-xs">
          {gameState.worldAlert}
        </div>
      )}

      {gameState.pendingEvents && gameState.pendingEvents.length > 0 && (
        <EventModal gameState={gameState} onUpdate={handleUpdate} />
      )}

      {/* Vollbild-Karte + Overlays */}
      <div className="flex-1 min-h-0 relative">
        <WorldMap
          provinces={gameState.provinces}
          armies={gameState.armies}
          selectedId={selectedProvince?.id ?? null}
          onSelect={handleSelect}
          mapMode={mapMode}
        />

        {/* Charakter links (CK3-Stil) */}
        {showChar && gameState.dynasty && (
          <div className="absolute top-2 left-2 z-30 w-[min(100%-1rem,280px)] max-h-[calc(100%-1rem)] overflow-y-auto side-drawer">
            <CharacterPanel
              dynasty={gameState.dynasty}
              compact
              kingdomName={gameState.kingdom.name}
              onClose={() => setShowChar(false)}
            />
          </div>
        )}

        {/* Provinz rechts */}
        {showPanel && selectedProvince && (
          <div className="absolute top-2 right-2 z-30 w-[min(100%-1rem,320px)] max-h-[calc(100%-1rem)] overflow-y-auto side-drawer">
            <ProvincePanel
              province={selectedProvince}
              gameState={gameState}
              onUpdate={handleUpdate}
              onBattleResult={setBattleResult}
              onClose={() => setShowPanel(false)}
              onEnterCity={() => setCityViewId(selectedProvince.id)}
            />
          </div>
        )}

        {/* Events */}
        {successionMsg && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 panel p-3 max-w-sm text-center">
            <p className="text-gold font-display text-sm">{successionMsg}</p>
            <button onClick={() => setSuccessionMsg('')} className="btn-secondary text-xs mt-2">
              Schließen
            </button>
          </div>
        )}

        {battleResult && (
          <div
            className={`absolute bottom-16 left-1/2 -translate-x-1/2 z-40 panel p-3 max-w-md w-[90%] border-2 ${battleResult.attackerWon ? 'border-gold' : 'border-blood'}`}
            style={{ borderColor: battleResult.attackerWon ? 'var(--color-gold)' : 'var(--color-blood)' }}
          >
            <h3 className="font-display text-gold text-base mb-1">
              {battleResult.attackerWon ? 'Sieg!' : 'Niederlage'}
            </h3>
            <p className="text-sm mb-2 text-parchment/90">{battleResult.summary}</p>
            <div className="text-xs space-y-0.5 text-parchment/60 max-h-24 overflow-y-auto">
              {battleResult.rounds.map((r) => (
                <div key={r.round}>{r.description}</div>
              ))}
            </div>
            <button onClick={() => setBattleResult(null)} className="btn-secondary text-xs mt-2">
              Schließen
            </button>
          </div>
        )}
      </div>

      {/* Untere Schlachten-Leiste */}
      {gameState.recentBattles.length > 0 && (
        <div className="shrink-0 border-t border-gold/20 bg-black/50 px-3 py-1.5 overflow-x-auto">
          <div className="flex gap-3 text-[11px] whitespace-nowrap">
            <span className="text-gold font-display">Schlachten:</span>
            {gameState.recentBattles.slice(0, 5).map((b) => (
              <span key={b.id} className="text-parchment/70">
                {b.attacker.name} vs {b.defender?.name ?? 'Neutral'} ·{' '}
                <span className={b.attackerWon ? 'text-gold' : 'text-red-400'}>
                  {b.attackerWon ? 'Sieg' : 'Niederlage'}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
