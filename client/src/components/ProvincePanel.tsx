import { useMemo, useState } from 'react';
import type { Province, Army, GameState, BattleResult } from '../api/client';
import { api } from '../api/client';
import { CityTileKind, countKind } from '@kronenchronik/shared';
import { toneClass, toneHighGood, toneHighBad, toneNet, toneHousing, toneJobs } from '../ui/statusTone';

const BUILDING_LABELS: Record<string, string> = {
  PALISADE: 'Palisade',
  STONE_WALL: 'Steinmauer',
  KEEP: 'Bergfried',
  GATEHOUSE: 'Torhaus',
  WATCHTOWER: 'Wachturm',
  BARRACKS: 'Kaserne',
  STABLES: 'Stallungen',
  GRANARY: 'Vorratslager',
  MARKET: 'Markt',
  SMITHY: 'Schmiede',
  WORKSHOP: 'Werkstatt',
  TOWN_HALL: 'Rathaus',
  TEMPLE: 'Tempel',
  UNIVERSITY: 'Universität',
  HARBOR: 'Hafen',
  CITY_WALL: 'Stadtmauer',
  FARM: 'Bauernhof',
  MINE: 'Mine',
  LUMBER_MILL: 'Sägewerk',
};

const UNIT_LABELS: Record<string, string> = {
  MILITIA: 'Miliz',
  SPEARMAN: 'Speerträger',
  ARCHER: 'Bogenschütze',
  SWORDSMAN: 'Schwertkämpfer',
  CROSSBOWMAN: 'Armbrustschütze',
  LIGHT_CAVALRY: 'Leichte Kavallerie',
  HEAVY_CAVALRY: 'Schwere Kavallerie',
  KNIGHT: 'Ritter',
};

interface ProvincePanelProps {
  province: Province;
  gameState: GameState;
  onUpdate: (state: GameState) => void;
  onBattleResult: (result: BattleResult) => void;
  onClose?: () => void;
  onEnterCity?: () => void;
}

export default function ProvincePanel({
  province,
  gameState,
  onUpdate,
  onBattleResult,
  onClose,
  onEnterCity,
}: ProvincePanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recruitType, setRecruitType] = useState('MILITIA');
  const [recruitCount, setRecruitCount] = useState(5);
  const [armyName, setArmyName] = useState('Feldarmee');

  const isOwned = Boolean(province.isOwned && province.ownerId === gameState.kingdom.id);
  const attackableArmies = gameState.armies.filter((a) => !a.isGarrison);
  const isNeighbor = gameState.provinces
    .filter((p) => p.isOwned)
    .some((owned) => owned.neighbors.some((n) => n.id === province.id));

  const foreignRealm = useMemo(() => {
    if (isOwned || !province.ownerId) return null;
    const ai = gameState.aiKingdoms?.find((k) => k.id === province.ownerId);
    const brief = gameState.diplomacyBrief?.find((d) => d.kingdomId === province.ownerId);
    const war = gameState.wars?.find(
      (w) =>
        (w.attackerId === gameState.kingdom.id && w.defenderId === province.ownerId) ||
        (w.defenderId === gameState.kingdom.id && w.attackerId === province.ownerId),
    );
    return {
      name: ai?.name ?? province.ownerName ?? 'Fremdes Reich',
      rulerName: ai?.rulerName ?? brief?.rulerName ?? 'Unbekannter Herrscher',
      rulerAge: ai?.rulerAge,
      personality: ai?.personalityLabel ?? ai?.personality,
      culture: ai?.culture ?? province.culture,
      religion: ai?.religion ?? province.religion,
      provinceCount: ai?.provinceCount,
      opinion: brief?.opinion ?? 0,
      status: brief?.status ?? (war ? 'AT_WAR' : 'NEUTRAL'),
      label: brief?.label ?? (war ? 'Im Krieg' : 'Neutral'),
      atWar: Boolean(brief?.atWar || war),
      warText: war?.reasonText,
      lastReason: brief?.lastReason,
    };
  }, [isOwned, province, gameState]);

  const relationTone =
    foreignRealm?.atWar || (foreignRealm?.opinion ?? 0) < -25
      ? 'bad'
      : (foreignRealm?.opinion ?? 0) >= 30
        ? 'good'
        : 'warn';

  const infoCards = useMemo(() => {
    const tiles = (province.cityGrid ?? []).map((t) => ({
      ...t,
      kind: t.kind as CityTileKind,
    }));
    const houses =
      countKind(tiles, CityTileKind.HOUSE) + countKind(tiles, CityTileKind.NOBLE_HOUSE) * 2;
    const housing = 40 + houses * 18;
    const jobs =
      countKind(tiles, CityTileKind.FARM) * 3 +
      countKind(tiles, CityTileKind.LUMBER_CAMP) * 2 +
      countKind(tiles, CityTileKind.MINE) * 2 +
      countKind(tiles, CityTileKind.SMITHY) * 2 +
      countKind(tiles, CityTileKind.MARKET) * 2 +
      countKind(tiles, CityTileKind.BAKERY) * 2 +
      countKind(tiles, CityTileKind.WEAVER) * 2 +
      countKind(tiles, CityTileKind.BARRACKS) * 4 +
      countKind(tiles, CityTileKind.CHURCH) +
      countKind(tiles, CityTileKind.SCHOOL) * 2;
    const housingPct = housing > 0 ? Math.round((province.population / housing) * 100) : 0;
    const jobsPct = province.population > 0 ? Math.round((jobs / province.population) * 100) : 0;
    const stock = province.devStats?.stock;
    const taxRate = province.devStats?.taxRate ?? 30;
    const taxGold = Math.floor(
      (province.population / 100) * (taxRate / 30) * (1 + (province.prosperity ?? 50) / 100),
    );
    const foodNet = (stock?.bread ?? 0) + (stock?.grain ?? 0) > 20 ? 1 : (stock?.bread ?? 0) < 8 ? -1 : 0;

    return [
      {
        label: 'Bevölkerung',
        value: `${province.population.toLocaleString('de-DE')} / ${housing.toLocaleString('de-DE')}`,
        tone: toneHousing(province.population, housing),
      },
      {
        label: 'Wohnraum',
        value: `${Math.min(999, housingPct)} %`,
        tone: toneHousing(province.population, housing),
      },
      {
        label: 'Arbeitsplätze',
        value: `${Math.min(999, jobsPct)} %`,
        tone: toneJobs(province.population, jobs),
      },
      {
        label: 'Nahrung',
        value: foodNet > 0 ? '+Vorrat' : foodNet < 0 ? 'knapp' : 'ok',
        tone: foodNet > 0 ? ('good' as const) : foodNet < 0 ? ('bad' as const) : ('warn' as const),
      },
      {
        label: 'Holz / Stein',
        value: `${stock?.planks ?? '–'} / ${province.forestStock ?? '–'}`,
        tone: toneNet((province.forestStock ?? 200) - 80),
      },
      {
        label: 'Werkzeuge',
        value: String(stock?.tools ?? '–'),
        tone: toneNet((stock?.tools ?? 5) - 3),
      },
      {
        label: 'Steuern',
        value: `+${taxGold} Gold`,
        tone: taxRate > 50 ? ('warn' as const) : ('good' as const),
      },
      {
        label: 'Zufriedenheit',
        value: `${province.devStats?.satisfaction ?? '–'} %`,
        tone: toneHighGood(province.devStats?.satisfaction),
      },
      {
        label: 'Verteidigung',
        value: `${province.defense} %`,
        tone: toneHighGood(province.defense, 50, 25),
      },
      {
        label: 'Loyalität',
        value: `${province.devStats?.loyalty ?? '–'} %`,
        tone: toneHighGood(province.devStats?.loyalty),
      },
      {
        label: 'Sicherheit',
        value: `${province.devStats?.security ?? '–'} %`,
        tone: toneHighGood(province.devStats?.security),
      },
      {
        label: 'Kriminalität',
        value: `${province.devStats?.crime ?? '–'} %`,
        tone: toneHighBad(province.devStats?.crime),
      },
    ];
  }, [province]);

  const handleAction = async (
    action: () => Promise<GameState | { gameState: GameState; result?: BattleResult }>,
  ) => {
    setLoading(true);
    setError('');
    try {
      const result = await action();
      if ('gameState' in result) {
        onUpdate(result.gameState);
        if (result.result) onBattleResult(result.result);
      } else {
        onUpdate(result);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-base text-gold">{province.name}</h2>
          <p className="text-[11px] text-parchment/60 mt-0.5">
            {isOwned
              ? `Dein Reich · ${gameState.kingdom.name}`
              : province.ownerName
                ? province.ownerName
                : 'Herrenlos / Neutral'}
            {province.culture ? ` · ${province.culture}` : ''}
            {province.religion ? ` · ${province.religion}` : ''}
          </p>
          <p className="text-[11px] text-parchment/50">
            {province.population} Einwohner · Verteidigung {province.defense} · Wohlstand{' '}
            {province.prosperity}
          </p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="btn-secondary text-[10px] py-0.5 px-1.5">
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-200 px-2 py-1.5 rounded text-xs">
          {error}
        </div>
      )}

      {/* Fremdes Reich: Herrscher & Diplomatie */}
      {!isOwned && (
        <div className="space-y-2 border border-gold/25 rounded p-2.5 bg-black/35">
          {foreignRealm ? (
            <>
              <div className="font-display text-sm text-gold">{foreignRealm.name}</div>
              <div className="text-[11px] text-parchment/80">
                Herrscher: <span className="text-parchment">{foreignRealm.rulerName}</span>
                {foreignRealm.rulerAge != null ? ` (${foreignRealm.rulerAge} Jahre)` : ''}
              </div>
              {foreignRealm.personality && (
                <div className="text-[10px] text-parchment/55">Charakter: {foreignRealm.personality}</div>
              )}
              <div className="text-[10px] text-parchment/55">
                {[foreignRealm.culture, foreignRealm.religion, foreignRealm.provinceCount != null ? `${foreignRealm.provinceCount} Provinzen` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
              <div className={toneClass(relationTone as 'good' | 'warn' | 'bad')}>
                <div className="info-card-label">Beziehung zu dir</div>
                <div className="info-card-value">
                  {foreignRealm.label}
                  <span className="text-[10px] ml-1 opacity-80">({foreignRealm.opinion})</span>
                </div>
              </div>
              {foreignRealm.atWar && (
                <div className="text-[11px] text-red-200 bg-red-950/40 border border-red-800/50 rounded px-2 py-1.5">
                  ⚔ Im Krieg
                  {foreignRealm.warText ? ` – ${foreignRealm.warText}` : ''}
                </div>
              )}
              {!foreignRealm.atWar && foreignRealm.lastReason && (
                <div className="text-[10px] text-parchment/50">Anlass: {foreignRealm.lastReason}</div>
              )}
              <div className="flex flex-wrap gap-1 pt-1">
                {!foreignRealm.atWar && province.ownerId && (
                  <button
                    type="button"
                    disabled={loading}
                    className="btn-danger text-[10px] py-1"
                    onClick={() =>
                      handleAction(async () => {
                        await api.declareWar(province.ownerId!);
                        return api.getGameState();
                      })
                    }
                  >
                    Krieg erklären
                  </button>
                )}
                {foreignRealm.atWar && province.ownerId && (
                  <button
                    type="button"
                    disabled={loading}
                    className="btn-secondary text-[10px] py-1"
                    onClick={() =>
                      handleAction(async () => {
                        await api.makePeace(province.ownerId!);
                        return api.getGameState();
                      })
                    }
                  >
                    Frieden anbieten
                  </button>
                )}
                {!foreignRealm.atWar && province.ownerId && (foreignRealm.opinion ?? 0) >= -10 && (
                  <button
                    type="button"
                    disabled={loading}
                    className="btn-secondary text-[10px] py-1"
                    onClick={() =>
                      handleAction(async () => {
                        await api.proposeTrade(province.ownerId!);
                        return api.getGameState();
                      })
                    }
                  >
                    Handel vorschlagen
                  </button>
                )}
              </div>
              <p className="text-[10px] text-amber-200/90 border-t border-gold/15 pt-2">
                🏰 Stadt betreten erst nach Eroberung – erobere die Provinz im Krieg.
              </p>
            </>
          ) : (
            <>
              <div className="font-display text-sm text-gold">Neutrales Land</div>
              <p className="text-[11px] text-parchment/70">
                Kein Herrscher. Mit einer Armee angreifbar, wenn du angrenzt.
              </p>
              <p className="text-[10px] text-amber-200/90">
                Stadtverwaltung erst nach Eroberung möglich.
              </p>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
        <div className="bg-black/40 rounded p-1.5 border border-gold/15">
          <div className="text-parchment/50 text-[10px]">Burg</div>
          <div className="text-gold font-display">{province.castle ? `St. ${province.castle.level}` : '–'}</div>
        </div>
        <div className="bg-black/40 rounded p-1.5 border border-gold/15">
          <div className="text-parchment/50 text-[10px]">Dorf</div>
          <div className="text-gold font-display">{province.village ? `St. ${province.village.level}` : '–'}</div>
        </div>
        <div className="bg-black/40 rounded p-1.5 border border-gold/15">
          <div className="text-parchment/50 text-[10px]">Stadt</div>
          <div className="text-gold font-display">
            {province.city && province.city.level > 0 ? `St. ${province.city.level}` : '–'}
          </div>
        </div>
      </div>

      {isOwned && (
        <div className="info-card-grid">
          {infoCards.map((c) => (
            <div key={c.label} className={toneClass(c.tone)}>
              <div className="info-card-label">{c.label}</div>
              <div className="info-card-value">{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Gebäude/Truppen: bei Fremden nur grob */}
      {isOwned && province.buildings.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-medieval-light mb-1">Gebäude</h3>
          <div className="flex flex-wrap gap-1">
            {province.buildings.map((b) => (
              <span key={b.id} className="text-xs bg-medieval-dark px-2 py-1 rounded">
                {BUILDING_LABELS[b.type] ?? b.type} Lv.{b.level}
              </span>
            ))}
          </div>
        </div>
      )}

      {!isOwned && (province.buildings.length > 0 || province.castle || province.city) && (
        <div className="text-[11px] text-parchment/55">
          Sichtbare Befestigung:{' '}
          {[
            province.castle ? `Burg St.${province.castle.level}` : null,
            province.city && province.city.level > 0 ? `Stadt St.${province.city.level}` : null,
            province.buildings.length ? `${province.buildings.length} Gebäude` : null,
          ]
            .filter(Boolean)
            .join(' · ') || 'unbekannt'}
        </div>
      )}

      {isOwned && province.armies.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-medieval-light mb-1">Truppen</h3>
          {province.armies.map((army) => (
            <div key={army.id} className="text-xs bg-medieval-dark p-2 rounded mb-1">
              <div className="font-semibold">
                {army.name} {army.isGarrison ? '(Garnison)' : ''}
              </div>
              {army.units.map((u) => (
                <span key={u.id} className="mr-2">
                  {UNIT_LABELS[u.type] ?? u.type}: {u.count}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      {isOwned && (
        <div className="space-y-3 border-t border-medieval-brown/30 pt-3">
          <h3 className="font-semibold text-medieval-gold">
            Verwaltung{province.isCapital ? ' · 👑 Hauptstadt' : ''}
          </h3>

          {onEnterCity && (
            <button type="button" onClick={onEnterCity} className="btn-primary w-full text-sm">
              🏙️ Stadt betreten – bauen & planen
            </button>
          )}

          {province.cityTier && (
            <div className="text-[11px] text-parchment/70">
              {province.cityTier.name}: {province.cityTier.description}
            </div>
          )}

          {province.devStats && (
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              <div className="bg-black/40 rounded p-1 text-center">
                😊 {province.devStats.satisfaction}
              </div>
              <div className="bg-black/40 rounded p-1 text-center">
                🛡️ {province.devStats.loyalty}
              </div>
              <div className="bg-black/40 rounded p-1 text-center">
                ❤️ {province.devStats.health}
              </div>
            </div>
          )}

          <button
            disabled={loading}
            onClick={() => handleAction(() => api.upgradeVillage({ provinceId: province.id }))}
            className="btn-secondary w-full text-sm"
          >
            Dorf ausbauen (St. {province.village?.level ?? 1})
          </button>

          <button
            disabled={loading}
            onClick={() => handleAction(() => api.upgradeCastle({ provinceId: province.id }))}
            className="btn-secondary w-full text-sm"
          >
            Burg ausbauen
          </button>

          {(province.city?.level ?? 0) === 0 ? (
            <button
              disabled={loading}
              onClick={() => handleAction(() => api.foundCity({ provinceId: province.id }))}
              className="btn-primary w-full text-sm"
            >
              🏙️ Stadt gründen
            </button>
          ) : (
            <button
              disabled={loading}
              onClick={() => handleAction(() => api.upgradeCity({ provinceId: province.id }))}
              className="btn-secondary w-full text-sm"
            >
              Stadt ausbauen (St. {province.city?.level})
            </button>
          )}

          <div className="flex gap-2">
            <select
              value={recruitType}
              onChange={(e) => setRecruitType(e.target.value)}
              className="input-field text-sm flex-1"
            >
              {Object.entries(UNIT_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={100}
              value={recruitCount}
              onChange={(e) => setRecruitCount(Number(e.target.value))}
              className="input-field text-sm w-16"
            />
            <button
              disabled={loading}
              onClick={() =>
                handleAction(() =>
                  api.recruit({
                    provinceId: province.id,
                    unitType: recruitType,
                    count: recruitCount,
                  }),
                )
              }
              className="btn-primary text-sm"
            >
              Rekrutieren
            </button>
          </div>

          <div className="flex gap-2">
            <input
              value={armyName}
              onChange={(e) => setArmyName(e.target.value)}
              className="input-field text-sm flex-1"
              placeholder="Armee-Name"
            />
            <button
              disabled={loading}
              onClick={() =>
                handleAction(
                  async () =>
                    (await api.createArmy({ name: armyName, provinceId: province.id })).gameState,
                )
              }
              className="btn-primary text-sm"
            >
              Armee bilden
            </button>
          </div>

          <div className="flex flex-wrap gap-1">
            {(
              [
                ['FARM', 'Bauernhof'],
                ['MINE', 'Mine'],
                ['LUMBER_MILL', 'Sägewerk'],
                ['BARRACKS', 'Kaserne'],
                ['PALISADE', 'Palisade'],
              ] as const
            ).map(([type, label]) => (
              <button
                key={type}
                disabled={loading}
                onClick={() =>
                  handleAction(() => api.build({ provinceId: province.id, buildingType: type }))
                }
                className="btn-secondary text-xs"
              >
                {label}
              </button>
            ))}
          </div>

          {(province.city?.level ?? 0) > 0 && (
            <div>
              <h4 className="text-xs text-medieval-light mb-1">Stadtgebäude</h4>
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    ['MARKET', 'Markt'],
                    ['SMITHY', 'Schmiede'],
                    ['TOWN_HALL', 'Rathaus'],
                    ['TEMPLE', 'Tempel'],
                    ['CITY_WALL', 'Stadtmauer'],
                  ] as const
                ).map(([type, label]) => (
                  <button
                    key={type}
                    disabled={loading}
                    onClick={() =>
                      handleAction(() => api.build({ provinceId: province.id, buildingType: type }))
                    }
                    className="btn-secondary text-xs"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!isOwned && isNeighbor && attackableArmies.length > 0 && (
        <div className="space-y-2 border-t border-medieval-brown/30 pt-3">
          <h3 className="font-semibold text-medieval-red">Militär</h3>
          {(() => {
            const siege = gameState.sieges?.find((s) => s.provinceId === province.id);
            if (!siege) return null;
            return (
              <div className="text-xs bg-black/40 border border-amber-700/40 rounded p-2 space-y-1">
                <div className="text-amber-200 font-display">Belagerung</div>
                <div>
                  Fortschritt {Math.floor(siege.progress)}% · Moral {Math.floor(siege.morale)} · Vorrat{' '}
                  {Math.floor(siege.foodLeft)}
                </div>
                {attackableArmies.map((army: Army) => (
                  <div key={army.id} className="space-y-1 pt-1">
                    <button
                      disabled={loading}
                      onClick={() =>
                        handleAction(async () => {
                          const res = await api.attack({
                            armyId: army.id,
                            targetProvinceId: province.id,
                            storm: true,
                          } as { armyId: string; targetProvinceId: string });
                          return { gameState: res.gameState, result: res.result };
                        })
                      }
                      className="btn-danger w-full text-sm"
                    >
                      ⚔️ Stürmen
                    </button>
                    <button
                      disabled={loading}
                      onClick={() => handleAction(() => api.abandonSiege({ siegeId: siege.id }))}
                      className="btn-secondary w-full text-xs"
                    >
                      Belagerung abbrechen
                    </button>
                  </div>
                ))}
              </div>
            );
          })()}
          {attackableArmies.map((army: Army) => (
            <div key={army.id} className="space-y-1">
              <div className="text-xs text-gray-400">
                {army.name} {army.status === 'MARCHING' ? '(marschiert)' : ''}
              </div>
              <button
                disabled={loading || army.status === 'MARCHING'}
                onClick={() =>
                  handleAction(() => api.march({ armyId: army.id, targetProvinceId: province.id }))
                }
                className="btn-secondary w-full text-sm"
              >
                🚶 Marschieren
              </button>
              {!gameState.sieges?.some((s) => s.provinceId === province.id) && (
                <button
                  disabled={loading || army.status === 'MARCHING'}
                  onClick={() =>
                    handleAction(async () => {
                      const res = await api.attack({ armyId: army.id, targetProvinceId: province.id });
                      return { gameState: res.gameState, result: res.result };
                    })
                  }
                  className="btn-danger w-full text-sm"
                >
                  {province.castle && province.castle.level >= 1
                    ? '🏰 Belagerung beginnen'
                    : '⚔️ Angreifen'}
                </button>
              )}
            </div>
          ))}
          {province.ownerId && !foreignRealm?.atWar && (
            <p className="text-[10px] text-parchment/50">
              Gegen fremde Reiche zuerst Krieg erklären (oben oder unter Diplomatie).
            </p>
          )}
          {foreignRealm?.atWar && (
            <p className="text-[10px] text-amber-200/80">
              Krieg aktiv – erobere die Provinz, dann kannst du die Stadt verwalten.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
