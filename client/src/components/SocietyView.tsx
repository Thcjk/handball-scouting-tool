import { useState } from 'react';
import { api, type GameState } from '../api/client';

interface Props {
  gameState: GameState;
  onUpdate: (s: GameState) => void;
}

export default function SocietyView({ gameState, onUpdate }: Props) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [spyTarget, setSpyTarget] = useState('Nachbarreich');
  const society = gameState.society;

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

  if (!society) {
    return (
      <div className="text-parchment/60 text-sm py-10 text-center">
        Gesellschaftsdaten werden geladen…
      </div>
    );
  }

  const cat = society.catalog;
  const owned = gameState.provinces.filter((p) => p.isOwned);
  const capitalId = gameState.capitalProvinceId ?? owned[0]?.id;

  return (
    <div className="space-y-5 max-w-3xl mx-auto pb-8">
      <div>
        <h2 className="text-2xl font-display text-gold">Gesellschaft & Welt</h2>
        <p className="text-sm text-parchment/60">
          {cat.seasons[society.climate.season] ?? society.climate.season} ·{' '}
          {cat.weather[society.climate.weather] ?? society.climate.weather} ·{' '}
          {cat.atmosphere[society.atmosphere] ?? society.atmosphere}
        </p>
        <p className="text-[11px] text-amber-200/80 mt-1">
          Herrscherschutz {society.rulerProtection}%
          {society.pendingAssassination ? ` · Komplott: ${society.pendingAssassination}` : ''}
          {society.fair?.active
            ? ` · ${society.fair.kind} in ${society.fair.cityName} (${society.fair.ticksLeft})`
            : ''}
        </p>
      </div>

      {error && (
        <div className="text-red-300 text-sm border border-red-700/40 bg-red-900/20 px-3 py-2 rounded">
          {error}
        </div>
      )}

      <div className="panel p-3">
        <div className="panel-header">Adelsfamilien</div>
        <div className="grid sm:grid-cols-2 gap-2 text-xs">
          {society.houses.map((h) => (
            <div key={h.id} className="bg-black/35 border border-gold/15 rounded p-2">
              <div className="font-display text-gold text-sm">
                {h.coat} {h.name}
              </div>
              <div className="text-parchment/55">
                {cat.nobleRanks[h.rank] ?? h.rank} · Treue {h.loyalty} · Prestige {h.prestige}
              </div>
              <div className="text-parchment/40">
                „{h.motto}“ · Ziel: {h.goal} · {h.members} Mitglieder
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-3">
        <div className="panel-header">Fraktionen</div>
        <div className="space-y-2">
          {society.factions.map((f) => (
            <div
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-2 bg-black/30 border border-gold/15 rounded p-2 text-xs"
            >
              <div>
                <div className="text-gold font-display">{f.name}</div>
                <div className="text-parchment/50">
                  Einfluss {f.influence} · Treue {f.loyalty} · {f.demand}
                </div>
              </div>
              <button
                disabled={loading}
                className="btn-secondary text-[10px] py-0.5 px-1.5"
                onClick={() => run(() => api.appeaseFaction({ factionId: f.id, gold: 40 }))}
              >
                Besänftigen (40G)
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-3">
        <div className="panel-header">Quests</div>
        {society.quests.length === 0 && (
          <p className="text-[11px] text-parchment/50">Keine offenen Quests – bald erscheinen neue.</p>
        )}
        {society.quests.map((q) => (
          <div key={q.id} className="text-xs mb-2 border-b border-gold/10 pb-2">
            <div className="text-gold font-display">{q.title}</div>
            <div className="text-parchment/55">{q.description}</div>
            <div className="text-parchment/40">Kosten {q.costGold} Gold · bis Tick {q.expiresTick}</div>
          </div>
        ))}
        <p className="text-[10px] text-parchment/40 mt-1">
          Quests erscheinen auch als Ereignis-Dialog auf der Karte.
        </p>
      </div>

      <div className="panel p-3">
        <div className="panel-header">Spionage</div>
        <div className="flex flex-wrap gap-2 text-xs mb-2">
          {society.spies.map((s) => (
            <span key={s.id} className="border border-gold/25 rounded px-2 py-0.5">
              {s.name} (Skill {s.skill}, XP {s.experience})
            </span>
          ))}
        </div>
        <input
          className="bg-black/40 border border-gold/25 rounded px-2 py-1 text-xs mb-2 w-full max-w-xs"
          value={spyTarget}
          onChange={(e) => setSpyTarget(e.target.value)}
          placeholder="Ziel"
        />
        <div className="flex flex-wrap gap-1">
          {cat.spyMissions.slice(0, 6).map((m) => (
            <button
              key={m.id}
              disabled={loading}
              title={m.description}
              className="btn-secondary text-[10px] py-0.5 px-1.5"
              onClick={() =>
                run(() => api.startSocietySpy({ type: m.id, targetName: spyTarget }))
              }
            >
              {m.name} ({m.cost}G)
            </button>
          ))}
        </div>
        {society.spyOps.map((op) => (
          <div key={op.id} className="text-[11px] text-parchment/50 mt-1">
            {op.type} → {op.targetName} ({op.progress}/{op.targetTicks})
          </div>
        ))}
        <button
          disabled={loading}
          className="btn-secondary text-[11px] py-1 px-2 mt-2"
          onClick={() => run(() => api.increaseRulerGuard())}
        >
          Wachen verstärken (50G)
        </button>
      </div>

      <div className="panel p-3">
        <div className="panel-header">Turniere</div>
        {society.tournament?.active ? (
          <p className="text-xs text-parchment/70">
            Läuft: {society.tournament.discipline} · noch {society.tournament.ticksLeft} Ticks ·{' '}
            {society.tournament.participants.join(', ')}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {cat.tournaments.map((t) => (
              <button
                key={t.id}
                disabled={loading}
                className="btn-secondary text-[10px] py-0.5 px-1.5"
                onClick={() =>
                  run(() =>
                    api.startRealmTournament({ discipline: t.id, participate: true }),
                  )
                }
              >
                {t.name} ({t.cost}G)
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="panel p-3">
        <div className="panel-header">Söldner & Helden</div>
        <div className="flex flex-wrap gap-1 mb-2">
          {cat.mercenaries.map((m) => (
            <button
              key={m.id}
              disabled={loading || !capitalId}
              className="btn-secondary text-[10px] py-0.5 px-1.5"
              onClick={() =>
                run(() => api.hireMercenary({ defId: m.id, provinceId: capitalId! }))
              }
            >
              {m.name} ({m.hireCost}G)
            </button>
          ))}
        </div>
        {society.mercenaries.map((m) => (
          <div key={m.id} className="text-[11px] text-parchment/60">
            {m.name}: {m.troops} Mann · Moral {m.morale} · Sold {m.wage}
          </div>
        ))}
        <div className="flex flex-wrap gap-1 mt-2">
          {cat.heroes.map((h) => (
            <button
              key={h.kind}
              disabled={loading || society.heroes.some((x) => x.kind === h.kind)}
              className="btn-secondary text-[10px] py-0.5 px-1.5"
              title={h.ability}
              onClick={() => run(() => api.hireHero({ kind: h.kind }))}
            >
              {h.title} ({h.hireCost}G)
            </button>
          ))}
        </div>
        {society.heroes.map((h) => (
          <div key={h.id} className="text-[11px] text-emerald-200/70 mt-1">
            {h.title}: {h.name} – {h.ability}
          </div>
        ))}
      </div>

      <div className="panel p-3">
        <div className="panel-header">Weltmarkt</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs mb-2">
          {Object.entries(society.prices).map(([k, v]) => (
            <div key={k} className="bg-black/30 border border-gold/10 rounded px-2 py-1">
              {cat.marketGoods[k] ?? k}: {v}
              <div className="flex gap-1 mt-0.5">
                <button
                  disabled={loading}
                  className="text-[10px] text-gold/80"
                  onClick={() => run(() => api.marketTrade({ good: k, amount: 1, buy: true }))}
                >
                  Kauf
                </button>
                <button
                  disabled={loading}
                  className="text-[10px] text-parchment/50"
                  onClick={() => run(() => api.marketTrade({ good: k, amount: 1, buy: false }))}
                >
                  Verkauf
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-3">
        <div className="panel-header">Gefahren</div>
        <div className="text-xs text-parchment/65 space-y-1">
          {society.disasters.map((d) => (
            <div key={d.id}>
              Katastrophe {d.kind} in {d.provinceName} ({d.ticksLeft})
            </div>
          ))}
          {society.diseases.map((d) => (
            <div key={d.id}>
              Seuche {d.kind} in {d.provinceName} · Stärke {d.severity}
            </div>
          ))}
          {society.bandits.map((b) => (
            <div key={b.id}>
              Banditen bei {b.regionName} (Stärke {b.strength})
            </div>
          ))}
          {society.disasters.length + society.diseases.length + society.bandits.length === 0 && (
            <div className="text-parchment/40">Keine akuten Gefahren.</div>
          )}
        </div>
        <button
          disabled={loading}
          className="btn-secondary text-[11px] py-1 px-2 mt-2"
          onClick={() => run(() => api.fightBandits())}
        >
          Banditen bekämpfen
        </button>
      </div>
    </div>
  );
}
