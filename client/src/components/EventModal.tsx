import { useState } from 'react';
import { api, type GameState } from '../api/client';

interface Props {
  gameState: GameState;
  onUpdate: (state: GameState) => void;
}

export default function EventModal({ gameState, onUpdate }: Props) {
  const ev = gameState.pendingEvents?.[0];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!ev) return null;

  const choose = async (choiceId: string) => {
    setLoading(true);
    setError('');
    try {
      const state = await api.resolveWorldEvent({ eventId: ev.id, choiceId });
      onUpdate(state);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="panel max-w-md w-full p-4 border border-gold/40 shadow-2xl">
        <div className="text-[10px] text-parchment/50 mb-1">Ereignis · Anno {gameState.worldYear}</div>
        <h2 className="font-display text-gold text-lg mb-2">{ev.title}</h2>
        <p className="text-sm text-parchment/80 mb-4">{ev.description}</p>
        {error && <p className="text-red-300 text-xs mb-2">{error}</p>}
        <div className="space-y-2">
          {ev.choices.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={loading}
              className="btn-secondary w-full text-left text-sm"
              onClick={() => choose(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
