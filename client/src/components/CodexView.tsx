import { useEffect, useState } from 'react';
import { api, type GameState } from '../api/client';
import {
  GAME_TIPS,
  GLOSSARY,
  SHORTCUTS,
  TUTORIAL_STEPS,
} from '../lore/helpContent';

interface Props {
  gameState: GameState;
  onUpdate: (s: GameState) => void;
}

type Tab = 'stats' | 'history' | 'achievements' | 'crisis' | 'help' | 'saves';

export default function CodexView({ gameState, onUpdate }: Props) {
  const [tab, setTab] = useState<Tab>('stats');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slotName, setSlotName] = useState('');
  const [slots, setSlots] = useState<Array<{ id: string; name: string; updatedAt: number; kingdomName?: string }>>([]);
  const [filter, setFilter] = useState('');
  const eg = gameState.endgame;

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

  const refreshSlots = async () => {
    try {
      const r = await api.listSaveSlots();
      setSlots(r.slots);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (tab === 'saves') void refreshSlots();
  }, [tab]);

  if (!eg) {
    return <div className="text-parchment/60 text-sm py-10 text-center">Codex wird geladen…</div>;
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'stats', label: 'Statistik' },
    { id: 'history', label: 'Weltgeschichte' },
    { id: 'achievements', label: 'Erfolge' },
    { id: 'crisis', label: 'Krisen' },
    { id: 'help', label: 'Hilfe' },
    { id: 'saves', label: 'Speicher' },
  ];

  const hist = eg.stats.history;
  const maxGold = Math.max(1, ...hist.map((h) => h.gold));
  const maxPop = Math.max(1, ...hist.map((h) => h.population));

  const glossaryFiltered = GLOSSARY.filter(
    (g) =>
      !filter ||
      g.term.toLowerCase().includes(filter.toLowerCase()) ||
      g.definition.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-10">
      <div>
        <h2 className="text-2xl font-display text-gold">Codex</h2>
        <p className="text-sm text-parchment/60">
          Statistik, Weltgeschichte, Erfolge, Krisen, Hilfe und Speicherstände.
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`codex-tab ${tab === t.id ? 'codex-tab-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-red-300 text-sm border border-red-700/40 bg-red-900/20 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {tab === 'stats' && (
        <div className="panel parchment-frame p-3 space-y-3">
          <div className="panel-header">Reichsstatistik</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {[
              ['Bevölkerung', eg.stats.population],
              ['Gold', eg.stats.gold],
              ['Nahrung', eg.stats.food],
              ['Provinzen', eg.stats.provinces],
              ['Armeen', eg.stats.armies],
              ['Kriege', eg.stats.wars],
              ['Ruhm', eg.stats.fame],
              ['Forschung', eg.stats.tech],
              ['Glauben', eg.stats.piety],
              ['Seehandel', eg.stats.tradeRoutes],
              ['Helden', eg.stats.heroes],
              ['Frieden (Ticks)', eg.peaceTicks],
            ].map(([label, val]) => (
              <div key={String(label)} className="stat-chip">
                <div className="text-parchment/50">{label}</div>
                <div className="text-gold font-display text-lg">{val}</div>
              </div>
            ))}
          </div>
          <div className="panel-header !mb-1">Gold-Verlauf</div>
          <div className="flex items-end gap-0.5 h-16 bg-black/30 rounded px-1 py-1">
            {hist.slice(-40).map((h) => (
              <div
                key={`g-${h.tick}`}
                title={`Tick ${h.tick}: ${h.gold} Gold`}
                className="flex-1 bg-amber-600/70 min-w-[2px] rounded-t transition-all"
                style={{ height: `${Math.max(4, (h.gold / maxGold) * 100)}%` }}
              />
            ))}
            {hist.length === 0 && <span className="text-[10px] text-parchment/40">Noch keine Daten</span>}
          </div>
          <div className="panel-header !mb-1">Bevölkerungsverlauf</div>
          <div className="flex items-end gap-0.5 h-16 bg-black/30 rounded px-1 py-1">
            {hist.slice(-40).map((h) => (
              <div
                key={`p-${h.tick}`}
                title={`Tick ${h.tick}: ${h.population}`}
                className="flex-1 bg-emerald-700/70 min-w-[2px] rounded-t"
                style={{ height: `${Math.max(4, (h.population / maxPop) * 100)}%` }}
              />
            ))}
          </div>
          <div className="panel-header !mb-1">Geschwindigkeit</div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(eg.catalog.speeds).map(([id, label]) => (
              <button
                key={id}
                disabled={loading || eg.settings.speed === id}
                className={`btn-secondary text-[11px] py-1 px-2 ${eg.settings.speed === id ? 'ring-1 ring-gold' : ''}`}
                onClick={() => run(() => api.setGameSpeed({ speed: id }))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="panel parchment-frame p-3 space-y-3">
          <div className="panel-header">Weltgeschichte dieser Partie</div>
          {eg.history.records.length === 0 && (
            <p className="text-xs text-parchment/50">Rekorde entstehen beim Spielen.</p>
          )}
          {eg.history.records.map((r) => (
            <div key={r.id} className="text-xs border-b border-gold/10 pb-2">
              <div className="text-gold font-display">{r.label}</div>
              <div className="text-parchment/70">{r.detail}</div>
              <div className="text-parchment/40">Anno {r.year} · Wert {r.value}</div>
            </div>
          ))}
          <div className="panel-header">Meilensteine</div>
          <div className="max-h-48 overflow-y-auto space-y-1 text-[11px] text-parchment/60">
            {[...eg.history.milestones].reverse().map((m, i) => (
              <div key={`${m.tick}-${i}`}>
                Anno {m.year}: {m.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'achievements' && (
        <div className="panel parchment-frame p-3">
          <div className="panel-header">Erfolge</div>
          <div className="grid sm:grid-cols-2 gap-2">
            {eg.catalog.achievements.map((a) => {
              const prog = eg.achievements.find((x) => x.id === a.id);
              const unlocked = prog?.unlocked;
              return (
                <div
                  key={a.id}
                  className={`text-xs rounded p-2 border ${
                    unlocked ? 'border-emerald-500/40 bg-emerald-900/20' : 'border-gold/15 bg-black/30 opacity-70'
                  }`}
                >
                  <div className="font-display text-gold">{unlocked ? '✦ ' : '✧ '}{a.name}</div>
                  <div className="text-parchment/55">{a.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'crisis' && (
        <div className="panel parchment-frame p-3 space-y-3">
          <div className="panel-header">Endgame & Invasionen</div>
          <p className="text-[11px] text-parchment/55">
            Große Reiche ziehen Krisen an. Es gibt kein endgültiges Siegen – nur neue Prüfungen.
          </p>
          {eg.crises.map((c) => (
            <div key={c.id} className="text-xs bg-red-950/30 border border-red-800/40 rounded p-2">
              <div className="text-red-200 font-display">{c.title}</div>
              <div className="text-parchment/60">{c.description}</div>
              <div className="text-parchment/40">
                Schwere {c.severity} · noch {c.ticksLeft} Ticks
              </div>
            </div>
          ))}
          {eg.invasions.map((inv) => (
            <div key={inv.id} className="text-xs bg-amber-950/30 border border-amber-700/40 rounded p-2">
              <div className="text-amber-200 font-display">{inv.name}</div>
              <div className="text-parchment/60">
                Stärke {inv.strength} · Ziele: {inv.coastalTargets.join(', ')} · {inv.ticksLeft} Ticks
              </div>
            </div>
          ))}
          {eg.crises.length + eg.invasions.length === 0 && (
            <p className="text-xs text-parchment/50">Keine aktive Weltkrise.</p>
          )}
          <button
            disabled={loading || eg.invasions.length === 0}
            className="btn-primary text-[11px]"
            onClick={() => run(() => api.resistInvasion())}
          >
            Invasion abwehren
          </button>
        </div>
      )}

      {tab === 'help' && (
        <div className="panel parchment-frame p-3 space-y-4">
          <div className="panel-header">Tutorial</div>
          {TUTORIAL_STEPS.map((s) => (
            <div key={s.id} className="text-xs">
              <div className="text-gold font-display">{s.title}</div>
              <div className="text-parchment/65">{s.text}</div>
            </div>
          ))}
          <div className="panel-header">Tipp des Moments</div>
          <p className="text-xs text-parchment/70">{GAME_TIPS[eg.stats.tick % GAME_TIPS.length]}</p>
          <div className="panel-header">Glossar</div>
          <input
            className="input-field text-xs mb-2"
            placeholder="Suchen…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {glossaryFiltered.map((g) => (
              <div key={g.term} className="text-xs">
                <span className="text-gold font-display">{g.term}: </span>
                <span className="text-parchment/65">{g.definition}</span>
              </div>
            ))}
          </div>
          <div className="panel-header">Steuerung</div>
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="text-xs flex justify-between gap-2">
              <span className="text-gold">{s.keys}</span>
              <span className="text-parchment/55">{s.action}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'saves' && (
        <div className="panel parchment-frame p-3 space-y-3">
          <div className="panel-header">Spielstände</div>
          <p className="text-[11px] text-parchment/50">
            Autosave läuft im Hintergrund. Schnellspeichern legt eine Sicherung an.
          </p>
          <div className="flex flex-wrap gap-2">
            <button disabled={loading} className="btn-secondary text-[11px]" onClick={() => run(() => api.quickSaveGame())}>
              Schnell speichern
            </button>
            <button disabled={loading} className="btn-secondary text-[11px]" onClick={() => run(() => api.quickLoadGame())}>
              Schnell laden
            </button>
          </div>
          <div className="flex gap-2 items-end">
            <input
              className="input-field text-xs"
              placeholder="Name des Spielstands"
              value={slotName}
              onChange={(e) => setSlotName(e.target.value)}
            />
            <button
              disabled={loading || !slotName}
              className="btn-primary text-[11px] shrink-0"
              onClick={async () => {
                setLoading(true);
                try {
                  const r = await api.saveToSlot({ name: slotName });
                  onUpdate(r.gameState);
                  setSlotName('');
                  await refreshSlots();
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Fehler');
                } finally {
                  setLoading(false);
                }
              }}
            >
              Speichern
            </button>
          </div>
          <div className="space-y-2">
            {slots.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 text-xs bg-black/30 border border-gold/15 rounded p-2"
              >
                <div>
                  <div className="text-gold font-display">{s.name}</div>
                  <div className="text-parchment/45">
                    {s.kingdomName ?? ''} · {new Date(s.updatedAt).toLocaleString('de-DE')}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    disabled={loading}
                    className="btn-secondary text-[10px] py-0.5 px-1.5"
                    onClick={() => run(() => api.loadFromSlot({ slotId: s.id }))}
                  >
                    Laden
                  </button>
                  <button
                    disabled={loading}
                    className="btn-danger text-[10px] py-0.5 px-1.5"
                    onClick={async () => {
                      await api.deleteSaveSlot({ slotId: s.id });
                      await refreshSlots();
                    }}
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
            {slots.length === 0 && <p className="text-xs text-parchment/40">Noch keine benannten Speicherstände.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
