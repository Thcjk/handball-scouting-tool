import type { Province } from '../api/client';

const TERRAIN_COLORS: Record<string, string> = {
  PLAINS: 'bg-green-800/60',
  FOREST: 'bg-emerald-900/70',
  HILLS: 'bg-amber-900/50',
  MOUNTAINS: 'bg-stone-700/70',
  COAST: 'bg-blue-900/50',
};

const TERRAIN_LABELS: Record<string, string> = {
  PLAINS: 'Ebene',
  FOREST: 'Wald',
  HILLS: 'Hügel',
  MOUNTAINS: 'Berge',
  COAST: 'Küste',
};

interface WorldMapProps {
  provinces: Province[];
  selectedId: string | null;
  onSelect: (province: Province) => void;
}

export default function WorldMap({ provinces, selectedId, onSelect }: WorldMapProps) {
  const maxX = Math.max(...provinces.map((p) => p.x));
  const maxY = Math.max(...provinces.map((p) => p.y));

  return (
    <div className="card overflow-x-auto">
      <h2 className="text-lg font-bold text-medieval-gold mb-4">Weltkarte</h2>
      <div
        className="grid gap-2 min-w-fit mx-auto"
        style={{
          gridTemplateColumns: `repeat(${maxX + 1}, minmax(100px, 1fr))`,
          gridTemplateRows: `repeat(${maxY + 1}, minmax(80px, 1fr))`,
        }}
      >
        {provinces.map((province) => (
          <button
            key={province.id}
            onClick={() => onSelect(province)}
            className={`
              relative p-2 rounded border-2 text-left transition-all hover:scale-105
              ${TERRAIN_COLORS[province.terrain] ?? 'bg-gray-700'}
              ${province.isOwned ? 'border-medieval-gold' : province.ownerId ? 'border-medieval-red/60' : 'border-gray-600'}
              ${selectedId === province.id ? 'ring-2 ring-medieval-gold scale-105' : ''}
            `}
            style={{ gridColumn: province.x + 1, gridRow: province.y + 1 }}
          >
            <div className="text-xs font-bold truncate">{province.name}</div>
            <div className="text-[10px] text-gray-400">{TERRAIN_LABELS[province.terrain]}</div>
            {province.castle && (
              <div className="text-[10px] text-medieval-gold">🏰 St.{province.castle.level}</div>
            )}
            {province.ownerName && (
              <div className="text-[10px] truncate text-medieval-light">{province.ownerName}</div>
            )}
            {!province.ownerId && <div className="text-[10px] text-gray-500">Neutral</div>}
          </button>
        ))}
      </div>
    </div>
  );
}
