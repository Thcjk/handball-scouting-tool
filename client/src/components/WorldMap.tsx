import { useRef, useState, useMemo, useCallback } from 'react';
import type { Province, Army } from '../api/client';
import {
  provincePolygon,
  provinceCenter,
  mapBounds,
  TERRAIN_FILL,
  REALM_COLORS,
  RIVER_PATHS,
} from '../map/geometry';

interface WorldMapProps {
  provinces: Province[];
  armies: Army[];
  selectedId: string | null;
  onSelect: (province: Province) => void;
  mapMode?: 'terrain' | 'political';
}

export default function WorldMap({
  provinces,
  armies,
  selectedId,
  onSelect,
  mapMode = 'political',
}: WorldMapProps) {
  const [transform, setTransform] = useState({ x: 10, y: 10, scale: 0.85 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const moved = useRef(false);

  const maxX = Math.max(...provinces.map((p) => p.x), 0);
  const maxY = Math.max(...provinces.map((p) => p.y), 0);
  const { width, height } = mapBounds(maxX, maxY);

  const ownerIds = useMemo(
    () => [...new Set(provinces.map((p) => p.ownerId).filter(Boolean))] as string[],
    [provinces],
  );

  const ownerColor = useCallback(
    (ownerId: string | null) => {
      if (!ownerId) return '#4a5560';
      const idx = ownerIds.indexOf(ownerId);
      return REALM_COLORS[idx % REALM_COLORS.length];
    },
    [ownerIds],
  );

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((t) => ({
      ...t,
      scale: Math.min(2.8, Math.max(0.35, t.scale * delta)),
    }));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    moved.current = false;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }));
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  const marchingArmies = armies.filter((a) => a.status === 'MARCHING');

  return (
    <div className="world-map-shell relative w-full h-full overflow-hidden">
      {/* Steuerungsleiste */}
      <div className="absolute top-2 right-2 z-20 flex gap-1">
        <button
          type="button"
          className="map-ctrl"
          onClick={() => setTransform((t) => ({ ...t, scale: Math.min(2.8, t.scale * 1.2) }))}
        >
          +
        </button>
        <button
          type="button"
          className="map-ctrl"
          onClick={() => setTransform((t) => ({ ...t, scale: Math.max(0.35, t.scale * 0.8) }))}
        >
          −
        </button>
        <button
          type="button"
          className="map-ctrl"
          onClick={() => setTransform({ x: 10, y: 10, scale: 0.85 })}
        >
          ⌂
        </button>
      </div>

      <div
        className="w-full h-full touch-none cursor-grab active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="mapBg" cx="50%" cy="40%" r="70%">
              <stop offset="0%" stopColor="#1a2a1f" />
              <stop offset="100%" stopColor="#0c1210" />
            </radialGradient>
            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.45" />
            </filter>
            <pattern id="forestDots" width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="#0f2a18" opacity="0.5" />
              <circle cx="6" cy="5" r="1" fill="#0f2a18" opacity="0.35" />
            </pattern>
            <pattern id="mountainHatch" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M0 6 L6 0" stroke="#3a3a3a" strokeWidth="0.8" opacity="0.4" />
            </pattern>
          </defs>

          <rect width={width} height={height} fill="url(#mapBg)" />

          <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
            {/* Flüsse */}
            {RIVER_PATHS.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="#3a7a9a"
                strokeWidth={4}
                strokeOpacity={0.55}
                strokeLinecap="round"
              />
            ))}

            {/* Provinzen */}
            {provinces.map((p) => {
              const poly = provincePolygon(p.x, p.y, p.name);
              const { cx, cy } = provinceCenter(p.x, p.y);
              const isSelected = selectedId === p.id;
              const fill =
                mapMode === 'political' && p.ownerId
                  ? ownerColor(p.ownerId)
                  : TERRAIN_FILL[p.terrain] ?? '#445';
              const border = p.isOwned
                ? '#f0d060'
                : p.ownerId
                  ? ownerColor(p.ownerId)
                  : '#2a3035';

              const fieldTroops = (p.armies ?? [])
                .filter((a) => !a.isGarrison)
                .reduce((s, a) => s + (a.units?.reduce((u, unit) => u + unit.count, 0) ?? 0), 0);

              return (
                <g
                  key={p.id}
                  className="province-poly"
                  onClick={() => {
                    if (!moved.current) onSelect(p);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <polygon
                    points={poly}
                    fill={fill}
                    fillOpacity={mapMode === 'political' && p.ownerId ? 0.72 : 0.88}
                    stroke={isSelected ? '#f5e6a3' : border}
                    strokeWidth={isSelected ? 3.5 : p.isOwned ? 2.5 : 1.2}
                    filter={isSelected ? 'url(#softShadow)' : undefined}
                  />
                  {p.terrain === 'FOREST' && (
                    <polygon points={poly} fill="url(#forestDots)" opacity={0.6} pointerEvents="none" />
                  )}
                  {p.terrain === 'MOUNTAINS' && (
                    <polygon points={poly} fill="url(#mountainHatch)" opacity={0.5} pointerEvents="none" />
                  )}

                  {/* Siedlungs-Icon */}
                  {p.castle && (
                    <text x={cx} y={cy - 14} textAnchor="middle" fontSize={14} className="map-icon">
                      🏰
                    </text>
                  )}
                  {p.city && p.city.level > 0 && !p.castle && (
                    <text x={cx} y={cy - 14} textAnchor="middle" fontSize={12} className="map-icon">
                      🏙️
                    </text>
                  )}

                  {/* Name */}
                  <text
                    x={cx}
                    y={cy + (p.castle || (p.city && p.city.level > 0) ? 6 : 0)}
                    textAnchor="middle"
                    className="map-label"
                    fontSize={p.isOwned || isSelected ? 11 : 9}
                    fontWeight={p.isOwned ? 700 : 500}
                    fill={isSelected ? '#fff8d0' : '#f0ead8'}
                    style={{ paintOrder: 'stroke', stroke: '#1a1208', strokeWidth: 2.5 }}
                  >
                    {p.name.length > 12 ? p.name.slice(0, 11) + '…' : p.name}
                  </text>

                  {p.ownerName && (
                    <text
                      x={cx}
                      y={cy + 16}
                      textAnchor="middle"
                      fontSize={7}
                      fill="#d4c4a0"
                      style={{ paintOrder: 'stroke', stroke: '#1a1208', strokeWidth: 1.5 }}
                    >
                      {p.ownerName.length > 14 ? p.ownerName.slice(0, 13) + '…' : p.ownerName}
                    </text>
                  )}

                  {/* Armee-Marker */}
                  {fieldTroops > 0 && (
                    <g>
                      <circle cx={cx + 38} cy={cy - 22} r={11} fill="#6b1515" stroke="#d4af37" strokeWidth={1.5} />
                      <text x={cx + 38} y={cy - 18} textAnchor="middle" fontSize={8} fill="#fff" fontWeight="bold">
                        {fieldTroops}
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
              const a = provinceCenter(from.x, from.y);
              const b = provinceCenter(to.x, to.y);
              const mx = (a.cx + b.cx) / 2;
              const my = (a.cy + b.cy) / 2;
              return (
                <g key={army.id}>
                  <line
                    x1={a.cx}
                    y1={a.cy}
                    x2={b.cx}
                    y2={b.cy}
                    stroke="#d4af37"
                    strokeWidth={2.5}
                    strokeDasharray="8 5"
                    opacity={0.9}
                  />
                  <circle cx={mx} cy={my} r={12} fill="#d4af37" stroke="#1a1208" strokeWidth={1} />
                  <text x={mx} y={my + 4} textAnchor="middle" fontSize={11} fill="#1a1208" fontWeight="bold">
                    →
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Legende */}
      <div className="absolute bottom-2 left-2 z-20 flex flex-wrap gap-2 max-w-[70%] pointer-events-none">
        {ownerIds.map((id, i) => {
          const name = provinces.find((p) => p.ownerId === id)?.ownerName ?? 'Reich';
          return (
            <span
              key={id}
              className="text-[10px] px-2 py-0.5 rounded bg-black/55 text-parchment border border-gold/30 flex items-center gap-1"
            >
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: REALM_COLORS[i % REALM_COLORS.length] }} />
              {name}
            </span>
          );
        })}
      </div>
    </div>
  );
}
