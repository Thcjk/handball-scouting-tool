import { useState } from 'react';
import { api, type GameState } from '../api/client';

const EDU = [
  ['diplomacy', 'Diplomatie'],
  ['war', 'Krieg'],
  ['stewardship', 'Verwaltung'],
  ['learning', 'Bildung'],
  ['faith', 'Religion'],
  ['intrigue', 'Intrige'],
] as const;

const VISITOR_LABEL: Record<string, string> = {
  ambassador: 'Botschafter',
  merchant: 'Händler',
  knight: 'Ritter',
  bard: 'Barde',
  pilgrim: 'Pilger',
  artist: 'Künstler',
  scholar: 'Gelehrter',
  craftsman: 'Handwerker',
  adventurer: 'Abenteurer',
};

interface Props {
  gameState: GameState;
  onUpdate: (s: GameState) => void;
}

export default function CourtView({ gameState, onUpdate }: Props) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const court = gameState.court;
  const chars = gameState.dynasty.characters.filter((c) => c.isAlive);
  const children = chars.filter((c) => (c.age ?? 99) < 16);
  const adults = chars.filter((c) => (c.age ?? 0) >= 16 && !c.isRuler);

  const run = async (fn: () => Promise<GameState>) => {
    setLoading(true);
    setError('');
    try {
      onUpdate(await fn());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setLoading(false);
    }
  };

  if (!court) {
    return (
      <div className="text-parchment/60 text-sm py-10 text-center">
        Hofdaten werden geladen… Speichere und öffne die Karte erneut.
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-display text-gold">Hof & Dynastie</h2>
        <p className="text-sm text-parchment/60">
          {court.meta.name} · gegründet {court.meta.foundedYear} · Prestige {court.meta.prestige} ·
          Renommee {court.meta.renown}
        </p>
        {gameState.title && (
          <p className="text-sm text-gold mt-1">{gameState.title.formalTitle}</p>
        )}
        {gameState.titleHint && (
          <p className="text-[11px] text-amber-200/70">{gameState.titleHint}</p>
        )}
      </div>

      {error && (
        <div className="text-red-300 text-sm border border-red-700/40 bg-red-900/20 px-3 py-2 rounded">
          {error}
        </div>
      )}

      <div className="panel p-3">
        <div className="panel-header">Familie</div>
        <div className="grid sm:grid-cols-2 gap-2 text-xs">
          {chars.map((c) => (
            <div key={c.id} className="bg-black/35 border border-gold/15 rounded p-2">
              <div className="font-display text-gold text-sm">
                {c.appearance?.portrait ?? '👤'} {c.name}
              </div>
              <div className="text-parchment/55">
                {c.age} J. · {c.isRuler ? 'Herrscher' : c.isHeir ? 'Erbe' : 'Familie'}
                {c.spouseId ? ' · verheiratet' : ''}
              </div>
              <div className="text-parchment/40 mt-0.5">{(c.traits ?? []).slice(0, 3).join(', ')}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-3">
        <div className="panel-header">Heirat</div>
        <p className="text-[11px] text-parchment/60 mb-2">
          Politische Ehen bringen Prestige, Einfluss und Kinder.
        </p>
        <button
          type="button"
          disabled={loading}
          className="btn-secondary text-xs mb-2"
          onClick={() => run(() => api.seekMarriage())}
        >
          Freier suchen
        </button>
        <div className="space-y-2">
          {(court.spouseCandidates ?? []).map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 bg-black/30 border border-gold/15 rounded p-2 text-xs"
            >
              <div>
                <div className="text-gold font-display">{c.name}</div>
                <div className="text-parchment/50">
                  {c.age} J. · Diplomatie {c.diplomacy} · {(c.traits ?? []).join(', ')}
                </div>
              </div>
              <button
                type="button"
                disabled={loading}
                className="btn-primary text-xs"
                onClick={() => run(() => api.marry({ candidateId: c.id }))}
              >
                Heiraten
              </button>
            </div>
          ))}
          {court.spouseCandidates.length === 0 && (
            <p className="text-[11px] text-parchment/45">Keine Kandidaten – „Freier suchen“.</p>
          )}
        </div>
      </div>

      <div className="panel p-3">
        <div className="panel-header">Erziehung der Kinder</div>
        {children.length === 0 && (
          <p className="text-[11px] text-parchment/50">Keine minderjährigen Kinder am Hof.</p>
        )}
        {children.map((c) => (
          <div key={c.id} className="mb-3 text-xs">
            <div className="text-gold font-display mb-1">
              {c.name} ({c.age}) · Fokus: {c.education ?? '—'}
            </div>
            <div className="flex flex-wrap gap-1">
              {EDU.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  disabled={loading}
                  className={`btn-secondary text-[10px] ${c.education === id ? 'text-gold border-gold' : ''}`}
                  onClick={() => run(() => api.setEducation({ characterId: c.id, focus: id }))}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="panel p-3">
        <div className="panel-header">Berater-Rat</div>
        <div className="space-y-2 text-xs">
          {court.council.map((slot) => (
            <div key={slot.role} className="bg-black/30 border border-gold/15 rounded p-2">
              <div className="flex flex-wrap justify-between gap-2 items-center">
                <span className="text-gold font-display">{slot.label}</span>
                <select
                  className="bg-black/50 border border-gold/30 rounded text-[11px] px-1 py-0.5"
                  disabled={loading}
                  value={slot.characterId ?? ''}
                  onChange={(e) =>
                    run(() =>
                      api.assignCouncil({
                        role: slot.role,
                        characterId: e.target.value || null,
                      }),
                    )
                  }
                >
                  <option value="">— unbesetzt —</option>
                  {adults.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {court.councilAdvice
                .filter((a) => a.role === slot.role)
                .map((a) => (
                  <p key={a.role} className="text-parchment/55 mt-1 italic">
                    „{a.advice}"
                  </p>
                ))}
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-3">
        <div className="panel-header">Hofbesucher</div>
        {court.visitors.length === 0 && (
          <p className="text-[11px] text-parchment/50">Der Hof ist ruhig – bald kommen neue Gäste.</p>
        )}
        {court.visitors.map((v) => (
          <div key={v.id} className="text-xs border-b border-gold/10 py-2">
            <span className="text-gold">{VISITOR_LABEL[v.kind] ?? v.kind}</span> {v.name}
            <div className="text-parchment/60">{v.description}</div>
          </div>
        ))}
      </div>

      <div className="panel p-3 flex flex-wrap gap-2 items-center justify-between">
        <div>
          <div className="panel-header !mb-1">Ruhm</div>
          <p className="text-[11px] text-parchment/55">
            Berühmt: {(court.meta.famousMembers ?? []).join(', ') || '—'}
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          className="btn-primary text-xs"
          onClick={() => run(() => api.hostTournament())}
        >
          Turnier ausrichten (120 Gold)
        </button>
      </div>
    </div>
  );
}
