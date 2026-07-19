import { useState, useEffect } from 'react';
import { api, type DiplomacyState, isOfflineMode } from '../api/client';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  NEUTRAL: { label: 'Neutral', color: 'text-gray-400' },
  ALLIED: { label: 'Verbündet', color: 'text-green-400' },
  AT_WAR: { label: 'Krieg', color: 'text-red-400' },
  TRADE_PACT: { label: 'Handel', color: 'text-yellow-400' },
};

export default function DiplomacyPage() {
  const [state, setState] = useState<DiplomacyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allianceName, setAllianceName] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await api.getDiplomacy();
      setState(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: () => Promise<unknown>) => {
    setError('');
    try {
      const result = await action();
      if (result && typeof result === 'object' && 'diplomacy' in result) {
        setState((result as { diplomacy: DiplomacyState }).diplomacy);
      } else {
        setState(result as DiplomacyState);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    }
  };

  if (loading)
    return <div className="text-center text-medieval-gold animate-pulse py-20">Laden...</div>;
  if (!state) return <div className="text-center text-red-400">{error}</div>;

  if (isOfflineMode) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-medieval-gold">Diplomatie</h2>
        <div className="card border border-medieval-gold/40">
          <p className="text-medieval-gold font-semibold mb-2">Einzelspieler-Modus</p>
          <p className="text-gray-300 text-sm">
            Diplomatie mit anderen Spielern ist im Browser-Spiel ohne Server nicht verfügbar.
            Erobere Provinzen auf der Weltkarte und erweitere dein Königreich.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-medieval-gold">Diplomatie</h2>

      {error && (
        <div className="bg-medieval-red/20 border border-medieval-red text-red-300 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {state.myAlliance && (
        <div className="card">
          <h3 className="font-bold text-medieval-gold mb-2">
            Mein Bündnis: {state.myAlliance.name}
          </h3>
          <div className="flex flex-wrap gap-2">
            {state.myAlliance.members.map((m) => (
              <span key={m.id} className="text-sm bg-medieval-dark px-2 py-1 rounded">
                {m.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card space-y-3">
        <h3 className="font-bold text-medieval-gold">Beziehungen</h3>
        {state.relations.length === 0 && (
          <p className="text-gray-400 text-sm">Noch keine diplomatischen Beziehungen.</p>
        )}
        {state.relations.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between bg-medieval-dark p-3 rounded"
          >
            <div>
              <span className="font-semibold">{r.partner.name}</span>
              <span className={`ml-2 text-sm ${STATUS_LABELS[r.status]?.color ?? ''}`}>
                {STATUS_LABELS[r.status]?.label ?? r.status}
              </span>
            </div>
            <div className="flex gap-2">
              {r.status === 'AT_WAR' && (
                <button
                  onClick={() => handleAction(() => api.makePeace(r.partnerId))}
                  className="btn-secondary text-xs"
                >
                  Frieden
                </button>
              )}
              {r.status === 'NEUTRAL' && (
                <>
                  <button
                    onClick={() => handleAction(() => api.declareWar(r.partnerId))}
                    className="btn-danger text-xs"
                  >
                    Krieg
                  </button>
                  <button
                    onClick={() => handleAction(() => api.proposeTrade(r.partnerId))}
                    className="btn-secondary text-xs"
                  >
                    Handel
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card space-y-3">
        <h3 className="font-bold text-medieval-gold">Andere Königreiche</h3>
        {state.kingdoms.map((k) => {
          const relation = state.relations.find((r) => r.partnerId === k.id);
          return (
            <div
              key={k.id}
              className="flex items-center justify-between bg-medieval-dark p-3 rounded text-sm"
            >
              <div>
                <span className="font-semibold">{k.name}</span>
                <span className="text-gray-400 ml-2">({k.user.username})</span>
                <span className="text-medieval-light ml-2">⭐ {k.fame}</span>
              </div>
              {!relation && (
                <button
                  onClick={() => handleAction(() => api.declareWar(k.id))}
                  className="btn-danger text-xs"
                >
                  Krieg erklären
                </button>
              )}
            </div>
          );
        })}
        {state.kingdoms.length === 0 && (
          <p className="text-gray-400 text-sm">Keine anderen Spieler online.</p>
        )}
      </div>

      {!state.myAlliance && (
        <div className="card space-y-3">
          <h3 className="font-bold text-medieval-gold">Bündnis gründen</h3>
          <div className="flex gap-2">
            <input
              value={allianceName}
              onChange={(e) => setAllianceName(e.target.value)}
              className="input-field flex-1"
              placeholder="Name des Bündnisses"
            />
            <button
              onClick={() => {
                const target = state.kingdoms[0];
                if (target && allianceName) {
                  handleAction(() => api.proposeAlliance(target.id, allianceName));
                }
              }}
              className="btn-primary text-sm"
              disabled={!allianceName || state.kingdoms.length === 0}
            >
              Gründen
            </button>
          </div>
        </div>
      )}

      {state.availableAlliances.length > 0 && !state.myAlliance && (
        <div className="card space-y-3">
          <h3 className="font-bold text-medieval-gold">Bündnissen beitreten</h3>
          {state.availableAlliances.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between bg-medieval-dark p-3 rounded text-sm"
            >
              <span>
                {a.name} ({a.memberCount} Mitglieder)
              </span>
              <button
                onClick={() => handleAction(() => api.joinAlliance(a.id))}
                className="btn-primary text-xs"
              >
                Beitreten
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
