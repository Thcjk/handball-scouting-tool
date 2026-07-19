import { useRef, useState, useCallback, useMemo } from 'react';
import type { Province, Army } from '../api/client';

const TILE_W = 120;
const TILE_H = 90;
const GAP = 8;

const TERRAIN_FILL: Record<string, string> = {
  PLAINS: '#2d5a27',
  FOREST: '#1a3d1a',
  HILLS: '#5c4a2a',
  MOUNTAINS: '#4a4a4a',
  COAST: '#1a3a5c',
};

const TERRAIN_LABELS: Record<string, string> = {
  PLAINS: 'Ebene',
  FOREST: 'Wald',
  HILLS: 'Hügel',
  MOUNTAINS: 'Berge',
  COAST: 'Küste',
};

const OWNER_COLORS = [
  '#d4af37',
  '#c0392b',
  '#2980b9',
  '#8e44ad',
  '#27ae60',
  '#e67e22',
  '#16a085',
  '#e74c3c',
];

function ownerColor(ownerId: string | null, ownerIds: string[]): string {
  if (!ownerId) return '#555';
  const idx = ownerIds.indexOf(ownerId);
  return OWNER_COLORS[idx % OWNER_COLORS.length];
}

interface WorldMapProps {
  provinces: Province[];
  armies: Army[];
  selectedId: string | null;
  onSelect: (province: Province) => void;
}

export default function WorldMap({ provinces, armies, selectedId, onSelect }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 20, y: 20, scale: 1 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const ownerIds = useMemo(
    () => [...new Set(provinces.map((p) => p.ownerId).filter(Boolean))] as string[],
    [provinces],
  );

  const provincePos = useCallback((p: Province) => ({
    x: p.x * (TILE_W + GAP),
    y: p.y * (TILE_H + GAP),
  }), []);

  const marchingArmies = armies.filter((a) => a.status === 'MARCHING');

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((t) => ({
      ...t,
      scale: Math.min(3, Math.max(0.4, t.scale * delta)),
    }));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as Element).closest('.province-tile')) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }));
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  const resetView = () => setTransform({ x: 20, y: 20, scale: 1 });

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-medieval-gold">Weltkarte</h2>
        <div className="flex gap-2">
          <button onClick={() => setTransform((t) => ({ ...t, scale: Math.min(3, t.scale * 1.2) }))} className="btn-secondary text-xs px-2 py-1">+</button>
          <button onClick={() => setTransform((t) => ({ ...t, scale: Math.max(0.4, t.scale * 0.8) }))} className="btn-secondary text-xs px-2 py-1">−</button>
          <button onClick={resetView} className="btn-secondary text-xs px-2 py-1">Zentrieren</button>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-2">Ziehen zum Verschieben · Mausrad zum Zoomen · Tippen zum Auswählen</p>

      <div
        className="relative bg-medieval-dark rounded-lg overflow-hidden touch-none"
        style={{ height: 'min(60vh, 500px)' }}
        onWheel={onWheel}
      >
        <svg
          ref={svgRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
            {/* Nachbarlinien */}
            {provinces.map((p) =>
              p.neighbors.map((n) => {
                const a = provincePos(p);
                const bProv = provinces.find((x) => x.id === n.id);
                if (!bProv || p.id > n.id) return null;
                const b = provincePos(bProv);
                return (
                  <line
                    key={`${p.id}-${n.id}`}
                    x1={a.x + TILE_W / 2}
                    y1={a.y + TILE_H / 2}
                    x2={b.x + TILE_W / 2}
                    y2={b.y + TILE_H / 2}
                    stroke="#444"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    opacity={0.4}
                  />
                );
              }),
            )}

            {provinces.map((province) => {
              const { x, y } = provincePos(province);
              const borderColor = province.isOwned
                ? '#d4af37'
                : ownerColor(province.ownerId, ownerIds);
              const isSelected = selectedId === province.id;
              const fieldArmies = province.armies?.filter((a) => !a.isGarrison) ?? [];
              const totalTroops = fieldArmies.reduce(
                (s, a) => s + (a.units?.reduce((u, unit) => u + unit.count, 0) ?? 0),
                0,
              );

              return (
                <g
                  key={province.id}
                  className="province-tile cursor-pointer"
                  onClick={() => onSelect(province)}
                >
                  <rect
                    x={x}
                    y={y}
                    width={TILE_W}
                    height={TILE_H}
                    rx={6}
                    fill={TERRAIN_FILL[province.terrain] ?? '#333'}
                    stroke={isSelected ? '#d4af37' : borderColor}
                    strokeWidth={isSelected ? 3 : 2}
                    opacity={0.9}
                  />
                  <text x={x + 8} y={y + 18} fill="#fff" fontSize={11} fontWeight="bold">
                    {province.name.length > 14 ? province.name.slice(0, 12) + '…' : province.name}
                  </text>
                  <text x={x + 8} y={y + 32} fill="#aaa" fontSize={9}>
                    {TERRAIN_LABELS[province.terrain]}
                  </text>
                  {province.castle && (
                    <text x={x + 8} y={y + 46} fill="#d4af37" fontSize={9}>
                      🏰 Burg St.{province.castle.level}
                    </text>
                  )}
                  {province.city && province.city.level > 0 && (
                    <text x={x + 8} y={y + 58} fill="#87ceeb" fontSize={9}>
                      🏙️ Stadt St.{province.city.level}
                    </text>
                  )}
                  {province.ownerName && (
                    <text x={x + 8} y={y + TILE_H - 10} fill="#ccc" fontSize={8}>
                      {province.ownerName}
                    </text>
                  )}
                  {!province.ownerId && (
                    <text x={x + 8} y={y + TILE_H - 10} fill="#888" fontSize={8}>
                      Neutral
                    </text>
                  )}
                  {totalTroops > 0 && (
                    <g>
                      <circle cx={x + TILE_W - 16} cy={y + 16} r={12} fill="#8b0000" opacity={0.9} />
                      <text x={x + TILE_W - 16} y={y + 20} fill="#fff" fontSize={9} textAnchor="middle">
                        ⚔{totalTroops}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Marschierende Armeen */}
            {marchingArmies.map((army) => {
              const from = provinces.find((p) => p.id === army.provinceId);
              const to = provinces.find((p) => p.id === army.targetProvinceId);
              if (!from || !to) return null;
              const a = provincePos(from);
              const b = provincePos(to);
              const mx = (a.x + b.x) / 2 + TILE_W / 2;
              const my = (a.y + b.y) / 2 + TILE_H / 2;
              return (
                <g key={army.id}>
                  <line
                    x1={a.x + TILE_W / 2}
                    y1={a.y + TILE_H / 2}
                    x2={b.x + TILE_W / 2}
                    y2={b.y + TILE_H / 2}
                    stroke="#d4af37"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                  />
                  <circle cx={mx} cy={my} r={10} fill="#d4af37" />
                  <text x={mx} y={my + 4} fill="#1a1a1a" fontSize={10} textAnchor="middle">
                    →
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
        {ownerIds.map((id, i) => {
          const name = provinces.find((p) => p.ownerId === id)?.ownerName ?? 'Reich';
          return (
            <span key={id} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded inline-block" style={{ background: OWNER_COLORS[i % OWNER_COLORS.length] }} />
              {name}
            </span>
          );
        })}
      </div>
    </div>
  );
}
