import { useCallback, useEffect, useState } from 'react';
import { api, type GameState, isOfflineMode } from '../api/client';
import CodexView from '../components/CodexView';

export default function CodexPage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setGameState(await api.getGameState());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <div className="text-red-300 text-center py-10">{error}</div>;
  if (!gameState) {
    return <div className="text-gold text-center py-10 animate-pulse">Codex öffnet sich…</div>;
  }
  if (!isOfflineMode) {
    return (
      <div className="text-parchment/70 text-sm max-w-lg mx-auto py-10">
        Codex (Statistik, Hilfe, Speicher) ist im Offline-Modus vollständig nutzbar.
      </div>
    );
  }

  return <CodexView gameState={gameState} onUpdate={setGameState} />;
}
