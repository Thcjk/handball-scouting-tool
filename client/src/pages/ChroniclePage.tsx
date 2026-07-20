import { useEffect, useState } from 'react';
import { api, isOfflineMode } from '../api/client';

const CAT_LABELS: Record<string, string> = {
  battle: 'Schlacht',
  war: 'Krieg',
  peace: 'Frieden',
  alliance: 'Bündnis',
  birth: 'Geburt',
  death: 'Tod',
  succession: 'Thronfolge',
  disaster: 'Katastrophe',
  city: 'Stadt',
  siege: 'Belagerung',
  spy: 'Spionage',
  event: 'Ereignis',
  hero: 'Held',
  coronation: 'Krönung',
};

export default function ChroniclePage() {
  const [entries, setEntries] = useState<
    Array<{ id: string; year: number; category: string; title: string; text: string }>
  >([]);
  const [year, setYear] = useState(1042);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        if (!isOfflineMode) {
          setError('Chronik ist im Offline-Modus verfügbar.');
          return;
        }
        const data = await api.getChronicle();
        setEntries(data.entries ?? []);
        setYear(data.year);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Fehler');
      }
    })();
  }, []);

  const filtered =
    filter === 'all' ? entries : entries.filter((e) => e.category === filter);

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-display text-gold">Chronik</h2>
        <p className="text-sm text-parchment/60">Jahr {year} · Die Geschichte deines Reiches</p>
      </div>

      {error && (
        <div className="text-red-300 text-sm border border-red-700/40 bg-red-900/20 px-3 py-2 rounded">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {['all', 'war', 'battle', 'siege', 'event', 'succession', 'alliance', 'spy', 'city'].map((f) => (
          <button
            key={f}
            type="button"
            className={`text-[10px] px-2 py-1 rounded border ${
              filter === f ? 'border-gold text-gold' : 'border-gold/20 text-parchment/60'
            }`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Alles' : CAT_LABELS[f] ?? f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-parchment/50 text-sm">Noch keine Einträge – die Welt schreibt erst ihre Geschichte.</p>
        )}
        {filtered.map((e) => (
          <article key={e.id} className="panel p-3 border border-gold/15">
            <div className="flex justify-between gap-2 text-[10px] text-parchment/50 mb-1">
              <span>{CAT_LABELS[e.category] ?? e.category}</span>
              <span>Anno {e.year}</span>
            </div>
            <h3 className="font-display text-gold text-sm">{e.title}</h3>
            <p className="text-xs text-parchment/80 mt-1">{e.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
