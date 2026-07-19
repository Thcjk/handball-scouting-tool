import { useState, useEffect, useCallback } from 'react';
import { api, type GameState, type Province, type BattleResult, isOfflineMode } from '../api/client';
import { applyResourceTick } from '../local/localApi';
import { useGameSocket } from '../hooks/useGameSocket';
import ResourceBar from '../components/ResourceBar';
import WorldMap from '../components/WorldMap';
import ProvincePanel from '../components/ProvincePanel';
import CharacterPanel from '../components/CharacterPanel';

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [successionMsg, setSuccessionMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  // Offline: Ressourcen-Ticks alle 30 Sekunden
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
        setSuccessionMsg(`⚠️ ${e.from} hat dir den Krieg erklärt!`);
      }
    },
  });

  const handleSelect = (province: Province) => {
    setSelectedProvince(province);
    setBattleResult(null);
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
      <div className="text-center text-medieval-gold animate-pulse py-20">Welt wird geladen...</div>
    );
  }

  if (error || !gameState) {
    return <div className="text-center text-red-400 py-20">{error || 'Kein Spielstand'}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-medieval-gold">{gameState.kingdom.name}</h2>
          <ResourceBar resources={gameState.kingdom.resources} />
        </div>
      </div>

      {successionMsg && (
        <div className="card border-2 border-medieval-gold">
          <p className="text-medieval-gold">{successionMsg}</p>
          <button onClick={() => setSuccessionMsg('')} className="btn-secondary text-xs mt-2">
            Schließen
          </button>
        </div>
      )}

      {battleResult && (
        <div
          className={`card border-2 ${battleResult.attackerWon ? 'border-medieval-gold' : 'border-medieval-red'}`}
        >
          <h3 className="font-bold text-lg mb-2">
            {battleResult.attackerWon ? '⚔️ Sieg!' : '🛡️ Niederlage'}
          </h3>
          <p className="text-sm mb-2">{battleResult.summary}</p>
          <div className="text-xs space-y-1 text-gray-400">
            {battleResult.rounds.map((r) => (
              <div key={r.round}>{r.description}</div>
            ))}
          </div>
          <button onClick={() => setBattleResult(null)} className="btn-secondary text-xs mt-2">
            Schließen
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <WorldMap
            provinces={gameState.provinces}
            armies={gameState.armies}
            selectedId={selectedProvince?.id ?? null}
            onSelect={handleSelect}
          />
          {gameState.dynasty && <CharacterPanel dynasty={gameState.dynasty} />}
        </div>
        <div>
          {selectedProvince ? (
            <ProvincePanel
              province={selectedProvince}
              gameState={gameState}
              onUpdate={handleUpdate}
              onBattleResult={setBattleResult}
            />
          ) : (
            <div className="card text-center text-gray-400 py-10">
              Wähle eine Provinz auf der Karte
            </div>
          )}
        </div>
      </div>

      {gameState.recentBattles.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-medieval-gold mb-3">Letzte Schlachten</h3>
          <div className="space-y-2">
            {gameState.recentBattles.map((b) => (
              <div key={b.id} className="text-sm bg-medieval-dark p-2 rounded flex justify-between">
                <span>
                  {b.attacker.name} vs {b.defender?.name ?? 'Neutral'} in {b.province.name}
                </span>
                <span className={b.attackerWon ? 'text-medieval-gold' : 'text-medieval-red'}>
                  {b.attackerWon ? 'Sieg' : 'Niederlage'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
