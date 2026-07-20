import { useState } from 'react';
import { api, type GameState } from '../api/client';

interface Props {
  gameState: GameState;
  onUpdate: (s: GameState) => void;
}

export default function RealmView({ gameState, onUpdate }: Props) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [vassalName, setVassalName] = useState('');
  const [vassalProvince, setVassalProvince] = useState('');
  const [fleetName, setFleetName] = useState('Königliche Flotte');
  const [fleetProvince, setFleetProvince] = useState('');
  const realm = gameState.realm;

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

  if (!realm) {
    return (
      <div className="text-parchment/60 text-sm py-10 text-center">
        Reichsdaten werden geladen… Öffne die Karte erneut.
      </div>
    );
  }

  const owned = gameState.provinces.filter((p) => p.isOwned);
  const coastal = owned.filter((p) => p.terrain === 'COAST');
  const capitalId = gameState.capitalProvinceId;
  const grantable = owned.filter((p) => p.id !== capitalId);
  const catalog = realm.catalog;
  const researched = new Set(realm.tech.researched);

  return (
    <div className="space-y-5 max-w-3xl mx-auto pb-8">
      <div>
        <h2 className="text-2xl font-display text-gold">Das Reich</h2>
        <p className="text-sm text-parchment/60">
          Gesetze, Vasallen, Forschung, Wunder, Flotten und Glauben – das große Königreich.
        </p>
        <p className="text-[11px] text-amber-200/80 mt-1">
          Bürgerkriegsrisiko: {realm.civilWarRisk}% ({realm.civilWarReason || 'stabil'})
          {realm.civilWar?.active ? ` · AKTIV: ${realm.civilWar.reason}` : ''}
        </p>
      </div>

      {error && (
        <div className="text-red-300 text-sm border border-red-700/40 bg-red-900/20 px-3 py-2 rounded">
          {error}
        </div>
      )}

      <div className="panel p-3">
        <div className="panel-header">Weltregionen</div>
        <div className="grid sm:grid-cols-2 gap-2 text-xs">
          {catalog.regions.map((r) => (
            <div key={r.id} className="bg-black/35 border border-gold/15 rounded p-2">
              <div className="font-display text-gold text-sm">{r.name}</div>
              <div className="text-parchment/55">
                {r.culture} · {r.religion}
              </div>
              <div className="text-parchment/40 mt-0.5">{r.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-3">
        <div className="panel-header">Erbfolge & Gesetze</div>
        <div className="flex flex-wrap gap-1 mb-3">
          {catalog.successionLaws.map((l) => (
            <button
              key={l.id}
              disabled={loading || realm.laws.succession === l.id}
              onClick={() => run(() => api.setSuccessionLaw({ law: l.id }))}
              className={`text-[11px] px-2 py-1 border rounded ${
                realm.laws.succession === l.id
                  ? 'border-gold text-gold bg-gold/10'
                  : 'border-gold/25 text-parchment/70 hover:border-gold/50'
              }`}
              title={l.description}
            >
              {l.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {catalog.realmLaws.map((l) => {
            const on = realm.laws.active.includes(l.id);
            return (
              <button
                key={l.id}
                disabled={loading}
                onClick={() => run(() => api.toggleRealmLaw({ lawId: l.id }))}
                className={`text-[11px] px-2 py-1 border rounded ${
                  on
                    ? 'border-emerald-500/50 text-emerald-200 bg-emerald-900/20'
                    : 'border-gold/20 text-parchment/55'
                }`}
                title={l.description}
              >
                {l.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="panel p-3">
        <div className="panel-header">Vasallen</div>
        {realm.vassals.length === 0 && (
          <p className="text-[11px] text-parchment/50 mb-2">
            Noch keine Vasallen – ernenne Grafen für entfernte Provinzen.
          </p>
        )}
        <div className="space-y-2 mb-3">
          {realm.vassals.map((v) => (
            <div key={v.id} className="bg-black/35 border border-gold/15 rounded p-2 text-xs">
              <div className="font-display text-gold">
                {catalog.vassalRanks[v.rank] ?? v.rank} {v.name}
              </div>
              <div className="text-parchment/55">
                Treue {v.loyalty} · Macht {v.power} · Meinung {v.opinion} · {v.troops} Mann ·{' '}
                {v.gold} Gold
              </div>
              {v.lastAction && <div className="text-parchment/40 mt-0.5">{v.lastAction}</div>}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-end text-xs">
          <label className="flex flex-col gap-0.5">
            <span className="text-parchment/50">Name</span>
            <input
              className="bg-black/40 border border-gold/25 rounded px-2 py-1 text-parchment"
              value={vassalName}
              onChange={(e) => setVassalName(e.target.value)}
              placeholder="Graf Aldric"
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-parchment/50">Provinz</span>
            <select
              className="bg-black/40 border border-gold/25 rounded px-2 py-1 text-parchment"
              value={vassalProvince}
              onChange={(e) => setVassalProvince(e.target.value)}
            >
              <option value="">—</option>
              {grantable.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={loading || !vassalName || !vassalProvince}
            className="btn-secondary text-[11px] py-1 px-2"
            onClick={() => {
              const name = vassalName;
              const provinceId = vassalProvince;
              void run(() =>
                api.grantVassal({
                  name,
                  characterId: gameState.dynasty.ruler?.id ?? 'none',
                  rank: 'graf',
                  provinceIds: [provinceId],
                }),
              ).then(() => {
                setVassalName('');
                setVassalProvince('');
              });
            }}
          >
            Graf ernennen
          </button>
        </div>
      </div>

      <div className="panel p-3">
        <div className="panel-header">Forschung</div>
        <p className="text-[11px] text-parchment/55 mb-2">
          Budget: {realm.researchBudget} Gold/Tick
          {realm.tech.researching
            ? ` · Forscht: ${catalog.techTree.find((t) => t.id === realm.tech.researching)?.name ?? realm.tech.researching} (${realm.tech.progress[realm.tech.researching] ?? 0})`
            : ' · Keine aktive Forschung'}
        </p>
        <div className="flex gap-1 mb-3">
          {[0, 5, 10, 20].map((n) => (
            <button
              key={n}
              disabled={loading}
              className={`text-[11px] px-2 py-1 border rounded ${
                realm.researchBudget === n
                  ? 'border-gold text-gold'
                  : 'border-gold/25 text-parchment/60'
              }`}
              onClick={() => run(() => api.setTechBudget({ gold: n }))}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-1 max-h-56 overflow-y-auto">
          {catalog.techTree.map((t) => {
            const done = researched.has(t.id);
            const locked = t.requires?.some((r) => !researched.has(r));
            return (
              <button
                key={t.id}
                disabled={loading || done || locked || realm.tech.researching === t.id}
                onClick={() => run(() => api.startTechResearch({ techId: t.id }))}
                className={`text-left text-[11px] px-2 py-1.5 border rounded ${
                  done
                    ? 'border-emerald-600/40 text-emerald-200/80'
                    : locked
                      ? 'border-white/10 text-parchment/30'
                      : 'border-gold/25 text-parchment/75 hover:border-gold/50'
                }`}
              >
                <span className="text-gold/80">{catalog.techBranchLabel[t.branch] ?? t.branch}</span>
                {' · '}
                {t.name} ({t.cost})
                <div className="text-parchment/40">{t.unlocks}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="panel p-3">
        <div className="panel-header">Weltwunder</div>
        <div className="space-y-2">
          {catalog.wonders.map((w) => {
            const project = realm.wonders.find((p) => p.wonderId === w.id);
            const techOk = !w.requiresTech || researched.has(w.requiresTech);
            return (
              <div
                key={w.id}
                className="flex flex-wrap items-center justify-between gap-2 bg-black/30 border border-gold/15 rounded p-2 text-xs"
              >
                <div>
                  <div className="font-display text-gold text-sm">{w.name}</div>
                  <div className="text-parchment/50">{w.description}</div>
                  <div className="text-parchment/40">
                    {w.cost.gold}G · {w.cost.wood}H · {w.cost.stone}S · {w.cost.iron}E · {w.buildTicks}{' '}
                    Ticks
                  </div>
                </div>
                {project?.completed ? (
                  <span className="text-emerald-300 text-[11px]">Vollendet</span>
                ) : project ? (
                  <span className="text-amber-200 text-[11px]">{project.remainingTicks} Ticks</span>
                ) : (
                  <button
                    disabled={loading || !techOk || !capitalId}
                    className="btn-secondary text-[11px] py-1 px-2"
                    onClick={() =>
                      run(() =>
                        api.startWonder({
                          wonderId: w.id,
                          provinceId: capitalId!,
                        }),
                      )
                    }
                  >
                    Bauen
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel p-3">
        <div className="panel-header">Religion & Orden</div>
        <p className="text-xs text-parchment/60 mb-2">
          Glauben {realm.faith.piety} · Reliquien {realm.faith.relics} ·{' '}
          {catalog.religions.find((r) => r.id === realm.faith.religionId)?.name ??
            realm.faith.religionId}
        </p>
        <button
          disabled={loading}
          className="btn-secondary text-[11px] py-1 px-2 mb-3"
          onClick={() => run(() => api.doPilgrimage())}
        >
          Pilgerreise (40 Gold)
        </button>
        <div className="flex flex-wrap gap-2">
          {realm.faith.orders.map((o) => (
            <div key={o.id} className="bg-black/35 border border-gold/15 rounded p-2 text-xs min-w-[8rem]">
              <div className="text-gold font-display">{o.name}</div>
              {o.founded ? (
                <div className="text-parchment/55">
                  Stärke {o.strength} · Treue {o.loyalty}
                </div>
              ) : (
                <button
                  disabled={loading || !researched.has('fth_2')}
                  className="btn-secondary text-[10px] py-0.5 px-1.5 mt-1"
                  onClick={() => run(() => api.foundKnightOrder({ orderId: o.id }))}
                >
                  Gründen (100G)
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-3">
        <div className="panel-header">Flotten & Seehandel</div>
        <p className="text-[11px] text-parchment/55 mb-2">
          Routen: {realm.seaRoutes.length} · gestört:{' '}
          {realm.seaRoutes.filter((r) => r.disrupted).length} · aktive Piraten:{' '}
          {realm.pirates.length}
        </p>
        {realm.fleets.map((f) => (
          <div key={f.id} className="text-xs text-parchment/70 mb-1">
            {f.name}: {f.ships.map((s) => `${s.count}× ${s.type}`).join(', ')} (Moral {f.morale})
          </div>
        ))}
        <div className="flex flex-wrap gap-2 items-end text-xs mt-2">
          <input
            className="bg-black/40 border border-gold/25 rounded px-2 py-1"
            value={fleetName}
            onChange={(e) => setFleetName(e.target.value)}
          />
          <select
            className="bg-black/40 border border-gold/25 rounded px-2 py-1"
            value={fleetProvince}
            onChange={(e) => setFleetProvince(e.target.value)}
          >
            <option value="">Küste…</option>
            {coastal.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            disabled={loading || !fleetProvince}
            className="btn-secondary text-[11px] py-1 px-2"
            onClick={() =>
              run(() =>
                api.buildFleet({
                  name: fleetName,
                  provinceId: fleetProvince,
                  type: 'trade',
                  count: 1,
                }),
              )
            }
          >
            Handelsschiff
          </button>
          <button
            disabled={loading || !fleetProvince}
            className="btn-secondary text-[11px] py-1 px-2"
            onClick={() =>
              run(() =>
                api.buildFleet({
                  name: fleetName,
                  provinceId: fleetProvince,
                  type: 'war',
                  count: 1,
                }),
              )
            }
          >
            Kriegsschiff
          </button>
          <button
            disabled={loading}
            className="btn-secondary text-[11px] py-1 px-2"
            onClick={() => run(() => api.huntPirates())}
          >
            Piraten jagen
          </button>
        </div>
      </div>
    </div>
  );
}
