import { useState } from 'react';
import type { Province, Army, GameState, BattleResult } from '../api/client';
import { api } from '../api/client';

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
}

export default function ProvincePanel({
  province,
  gameState,
  onUpdate,
  onBattleResult,
  onClose,
}: ProvincePanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recruitType, setRecruitType] = useState('MILITIA');
  const [recruitCount, setRecruitCount] = useState(5);
  const [armyName, setArmyName] = useState('Feldarmee');

  const isOwned = province.isOwned;
  const attackableArmies = gameState.armies.filter((a) => !a.isGarrison);
  const isNeighbor = gameState.provinces
    .filter((p) => p.isOwned)
    .some((owned) => owned.neighbors.some((n) => n.id === province.id));

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
            {province.ownerName ? province.ownerName : 'Neutral'}
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

      {province.buildings.length > 0 && (
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

      {province.armies.length > 0 && (
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
          <h3 className="font-semibold text-medieval-gold">Verwaltung</h3>

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
          {attackableArmies.map((army: Army) => (
            <div key={army.id} className="space-y-1">
              <div className="text-xs text-gray-400">{army.name} {army.status === 'MARCHING' ? '(marschiert)' : ''}</div>
              <button
                disabled={loading || army.status === 'MARCHING'}
                onClick={() =>
                  handleAction(() => api.march({ armyId: army.id, targetProvinceId: province.id }))
                }
                className="btn-secondary w-full text-sm"
              >
                🚶 Marschieren (60s)
              </button>
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
                ⚔️ Sofort angreifen
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
