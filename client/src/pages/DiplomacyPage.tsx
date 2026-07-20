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
  const [spyTarget, setSpyTarget] = useState('');
  const [msg, setMsg] = useState('');

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
    setMsg('');
    try {
      const result = await action();
      if (result && typeof result === 'object' && 'diplomacy' in result) {
        setState((result as { diplomacy: DiplomacyState }).diplomacy);
      } else if (result && typeof result === 'object' && 'kingdom' in result) {
        setMsg('Aktion ausgeführt');
        await load();
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

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-medieval-gold">Diplomatie</h2>
      <p className="text-sm text-parchment/60">
        {isOfflineMode
          ? 'Lebendige KI-Reiche mit Persönlichkeiten, Kriegen und Verträgen.'
          : 'Beziehungen zu anderen Herrschern.'}
      </p>

      {error && (
        <div className="bg-medieval-red/20 border border-medieval-red text-red-300 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}
      {msg && <div className="text-green-300 text-sm">{msg}</div>}

      {state.wars && state.wars.length > 0 && (
        <div className="card border border-red-700/40">
          <h3 className="font-bold text-red-300 mb-2">Aktive Kriege</h3>
          {state.wars.map((w) => (
            <div key={w.id} className="text-sm text-parchment/80 mb-2">
              {w.reasonText}
              <div className="mt-1">
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() =>
                    handleAction(() =>
                      api.makePeace(
                        w.attackerName === undefined
                          ? w.defenderId
                          : /* find other */ (() => {
                              // peace with the AI side
                              const ids = [w.attackerId, w.defenderId];
                              return ids.find((id) => state.kingdoms.some((k) => k.id === id))!;
                            })(),
                      ),
                    )
                  }
                >
                  Frieden anbieten
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3 className="font-bold text-medieval-gold mb-3">Reiche & Beziehungen</h3>
        {state.relations.length === 0 && (
          <p className="text-sm text-parchment/50">Noch keine anderen Reiche bekannt.</p>
        )}
        <div className="space-y-3">
          {state.relations.map((r) => {
            const st = STATUS_LABELS[r.status] ?? STATUS_LABELS.NEUTRAL;
            const k = state.kingdoms.find((x) => x.id === r.partner.id);
            return (
              <div key={r.id} className="border border-gold/15 rounded p-3 bg-black/30">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <div className="font-display text-gold">{r.partner.name}</div>
                    <div className="text-[11px] text-parchment/60">
                      {k?.personality && `${k.personality} · `}
                      {k?.rulerName && `${k.rulerName} · `}
                      {k?.provinceCount ?? '?'} Provinzen
                    </div>
                    <div className={`text-xs ${st.color}`}>
                      {r.label ?? st.label}
                      {typeof r.opinion === 'number' ? ` (${r.opinion > 0 ? '+' : ''}${Math.round(r.opinion)})` : ''}
                    </div>
                    {r.lastReason && (
                      <div className="text-[10px] text-parchment/40 mt-0.5">{r.lastReason}</div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {r.status !== 'AT_WAR' && (
                      <>
                        <button
                          type="button"
                          className="btn-secondary text-[10px]"
                          onClick={() => handleAction(() => api.proposeTrade(r.partner.id))}
                        >
                          Handel
                        </button>
                        <button
                          type="button"
                          className="btn-secondary text-[10px]"
                          onClick={() =>
                            handleAction(() => api.proposeAlliance(r.partner.id, 'Bündnis'))
                          }
                        >
                          Bündnis
                        </button>
                        <button
                          type="button"
                          className="btn-secondary text-[10px] text-red-300"
                          onClick={() => handleAction(() => api.declareWar(r.partner.id))}
                        >
                          Krieg
                        </button>
                      </>
                    )}
                    {r.status === 'AT_WAR' && (
                      <button
                        type="button"
                        className="btn-secondary text-[10px]"
                        onClick={() => handleAction(() => api.makePeace(r.partner.id))}
                      >
                        Frieden
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isOfflineMode && (
        <div className="card">
          <h3 className="font-bold text-medieval-gold mb-2">Spionage</h3>
          <p className="text-xs text-parchment/60 mb-2">Kosten: 40 Gold. Missionen: Informationen, Diebstahl, Sabotage, Unruhen.</p>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              className="bg-black/40 border border-gold/30 rounded text-sm px-2 py-1"
              value={spyTarget}
              onChange={(e) => setSpyTarget(e.target.value)}
            >
              <option value="">Zielreich…</option>
              {state.kingdoms.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
            {(['intel', 'steal', 'sabotage', 'revolt'] as const).map((m) => (
              <button
                key={m}
                type="button"
                disabled={!spyTarget}
                className="btn-secondary text-[10px]"
                onClick={() =>
                  handleAction(() => api.sendSpy({ targetKingdomId: spyTarget, mission: m }))
                }
              >
                {m === 'intel' ? 'Aufklären' : m === 'steal' ? 'Stehlen' : m === 'sabotage' ? 'Sabotieren' : 'Unruhen'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
