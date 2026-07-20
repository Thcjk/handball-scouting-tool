import { useRef, useState, useMemo, useCallback } from 'react';
import type { Province, Army } from '../api/client';
import {
  provincePolygon,
  provinceCenter,
  mapBounds,
  TERRAIN_FILL,
  TERRAIN_FILL_ALT,
  REALM_COLORS,
  RIVER_PATHS,
  LAKE_ELLIPSES,
  zoomLod,
  castleVisual,
  settlementVisual,
  buildAmbientActors,
  buildRoadSegments,
  nearDecor,
  hash,
  nameSeed,
} from '../map/geometry';

interface WorldMapProps {
  provinces: Province[];
  armies: Army[];
  selectedId: string | null;
  onSelect: (province: Province) => void;
  mapMode?: 'terrain' | 'political';
  season?: string;
  weather?: string;
}

const AMBIENT_GLYPH: Record<string, string> = {
  peasant: '🧑‍🌾',
  merchant: '🛒',
  soldier: '🗡️',
  sheep: '🐑',
  smoke: '💨',
  flag: '🚩',
  boat: '⛵',
  hunter: '🏹',
  child: '🧒',
  cart: '🛒',
  knight: '⚔️',
  wolf: '🐺',
  deer: '🦌',
  bear: '🐻',
  cow: '🐄',
  horse: '🐴',
  bell: '🔔',
};

const SEASON_TINT: Record<string, string> = {
  spring: 'rgba(80, 140, 60, 0.08)',
  summer: 'rgba(220, 180, 40, 0.07)',
  autumn: 'rgba(180, 90, 30, 0.12)',
  winter: 'rgba(200, 220, 240, 0.18)',
};

const WEATHER_TINT: Record<string, string> = {
  rain: 'rgba(60, 80, 110, 0.12)',
  snow: 'rgba(255, 255, 255, 0.15)',
  storm: 'rgba(40, 40, 60, 0.2)',
  fog: 'rgba(180, 180, 190, 0.14)',
  thunder: 'rgba(50, 40, 80, 0.16)',
  sunny: 'transparent',
};

export default function WorldMap({
  provinces,
  armies,
  selectedId,
  onSelect,
  mapMode = 'political',
  season,
  weather,
}: WorldMapProps) {
  const [transform, setTransform] = useState({ x: 24, y: 16, scale: 0.9 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const moved = useRef(false);

  const maxX = Math.max(...provinces.map((p) => p.x), 0);
  const maxY = Math.max(...provinces.map((p) => p.y), 0);
  const { width, height } = mapBounds(maxX, maxY);
  const lod = zoomLod(transform.scale);
  const detail = lod === 'near' || lod === 'ultra';
  const ultra = lod === 'ultra';

  const ownerIds = useMemo(
    () => [...new Set(provinces.map((p) => p.ownerId).filter(Boolean))] as string[],
    [provinces],
  );

  const ownerColor = useCallback(
    (ownerId: string | null) => {
      if (!ownerId) return '#4a5560';
      return REALM_COLORS[ownerIds.indexOf(ownerId) % REALM_COLORS.length];
    },
    [ownerIds],
  );

  const roads = useMemo(() => buildRoadSegments(provinces), [provinces]);
  const ambient = useMemo(
    () =>
      buildAmbientActors(
        provinces.map((p) => ({
          id: p.id,
          name: p.name,
          x: p.x,
          y: p.y,
          terrain: p.terrain,
          isOwned: p.isOwned,
          hasCity: !!(p.city && p.city.level > 0),
        })),
        season,
      ),
    [provinces, season],
  );

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((t) => ({
      ...t,
      scale: Math.min(4.2, Math.max(0.35, t.scale * delta)),
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
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: `linear-gradient(180deg, ${SEASON_TINT[season ?? ''] ?? 'transparent'}, ${WEATHER_TINT[weather ?? 'sunny'] ?? 'transparent'})`,
        }}
      />
      <div className="absolute top-2 left-2 z-20 panel px-2 py-1 text-[10px] text-parchment/70 pointer-events-none">
        {lod === 'far' && 'Kontinente & Reiche'}
        {lod === 'mid' && 'Provinzen, Städte & Flüsse'}
        {lod === 'near' && 'Nahsicht – Felder & Leben'}
        {lod === 'ultra' && 'Maximal – Häuser, Bürger, Details'}
        {season ? ` · ${season}` : ''}
        {weather ? ` · ${weather}` : ''}
      </div>

      <div className="absolute top-2 right-2 z-20 flex gap-1">
        <button type="button" className="map-ctrl" onClick={() => setTransform((t) => ({ ...t, scale: Math.min(4.2, t.scale * 1.2) }))}>+</button>
        <button type="button" className="map-ctrl" onClick={() => setTransform((t) => ({ ...t, scale: Math.max(0.35, t.scale * 0.8) }))}>−</button>
        <button type="button" className="map-ctrl" onClick={() => setTransform({ x: 24, y: 16, scale: 0.9 })}>⌂</button>
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
            <radialGradient id="mapBg" cx="45%" cy="35%" r="75%">
              <stop offset="0%" stopColor="#243528" />
              <stop offset="55%" stopColor="#121a14" />
              <stop offset="100%" stopColor="#0a0e0c" />
            </radialGradient>
            <filter id="softShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.5" />
            </filter>
            <pattern id="forestDots" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="3" r="1.4" fill="#0c2414" opacity="0.55" />
              <circle cx="7" cy="7" r="1.1" fill="#0c2414" opacity="0.4" />
            </pattern>
            <pattern id="mountainHatch" width="7" height="7" patternUnits="userSpaceOnUse">
              <path d="M0 7 L7 0" stroke="#3a3a42" strokeWidth="0.9" opacity="0.45" />
            </pattern>
            <pattern id="swampRipple" width="12" height="8" patternUnits="userSpaceOnUse">
              <path d="M0 4 Q3 2 6 4 T12 4" fill="none" stroke="#2a4a3a" strokeWidth="0.6" opacity="0.35" />
            </pattern>
            <linearGradient id="roadGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8a7040" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#c4a882" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#8a7040" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          <rect width={width} height={height} fill="url(#mapBg)" />

          <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
            {/* Seen */}
            {lod !== 'far' &&
              LAKE_ELLIPSES.map((l, i) => (
                <ellipse
                  key={i}
                  cx={l.cx}
                  cy={l.cy}
                  rx={l.rx}
                  ry={l.ry}
                  fill="#2a5a72"
                  opacity={0.65}
                  stroke="#4a8aaa"
                  strokeWidth={1}
                />
              ))}

            {/* Flüsse */}
            {RIVER_PATHS.map((d, i) => (
              <g key={i}>
                <path d={d} fill="none" stroke="#1a4058" strokeWidth={lod === 'far' ? 5 : 7} strokeLinecap="round" opacity={0.35} />
                <path d={d} fill="none" stroke="#3a8aaa" strokeWidth={lod === 'far' ? 2.5 : 3.5} strokeLinecap="round" opacity={0.7} />
              </g>
            ))}

            {/* Straßen (mid+) */}
            {lod !== 'far' &&
              roads.map((r) => (
                <line
                  key={r.key}
                  x1={r.x1}
                  y1={r.y1}
                  x2={r.x2}
                  y2={r.y2}
                  stroke="url(#roadGrad)"
                  strokeWidth={detail ? (ultra ? 4.2 : 3.5) : 2.2}
                  strokeLinecap="round"
                  strokeDasharray={detail ? undefined : '6 4'}
                  opacity={0.85}
                />
              ))}

            {/* Brücken-Marken an Fluss-Kreuzungen (dekorativ) */}
            {detail &&
              [
                [160, 210],
                [350, 220],
                [280, 370],
              ].map(([bx, by], i) => (
                <rect key={i} x={bx - 6} y={by - 3} width={12} height={6} rx={1} fill="#6a5438" stroke="#c4a882" strokeWidth={0.5} />
              ))}

            {/* Provinzen */}
            {provinces.map((p) => {
              const poly = provincePolygon(p.x, p.y, p.name);
              const { cx, cy } = provinceCenter(p.x, p.y);
              const isSelected = selectedId === p.id;
              const seed = nameSeed(p.name);
              const baseFill =
                mapMode === 'political' && p.ownerId
                  ? ownerColor(p.ownerId)
                  : hash(seed) > 0.5
                    ? TERRAIN_FILL[p.terrain]
                    : TERRAIN_FILL_ALT[p.terrain];
              const border = p.isOwned ? '#f0d060' : p.ownerId ? ownerColor(p.ownerId) : '#2a3035';

              const cityLv = p.city?.level ?? 0;
              const villLv = p.village?.level ?? 0;
              const castLv = p.castle?.level ?? 0;
              const bCount = p.cityGrid?.filter((t) => t.kind !== 'EMPTY' && t.kind !== 'ROAD').length ?? p.buildings?.length ?? 0;
              const settle = settlementVisual(cityLv, villLv, bCount);
              const castle = castLv > 0 ? castleVisual(castLv) : null;

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
                    fill={baseFill}
                    fillOpacity={mapMode === 'political' && p.ownerId ? 0.68 : 0.9}
                    stroke={isSelected ? '#f5e6a3' : border}
                    strokeWidth={isSelected ? 3.5 : p.isOwned ? 2.4 : 1.1}
                    filter={isSelected ? 'url(#softShadow)' : undefined}
                  />
                  {p.terrain === 'FOREST' && (
                    <polygon points={poly} fill="url(#forestDots)" opacity={0.55} pointerEvents="none" />
                  )}
                  {p.terrain === 'MOUNTAINS' && (
                    <polygon points={poly} fill="url(#mountainHatch)" opacity={0.5} pointerEvents="none" />
                  )}
                  {/* Sumpf-Optik für manche Wälder (Variation) */}
                  {p.terrain === 'FOREST' && hash(seed + 2) > 0.7 && lod !== 'far' && (
                    <polygon points={poly} fill="url(#swampRipple)" opacity={0.4} pointerEvents="none" />
                  )}

                  {/* Nah: Dekor */}
                  {detail &&
                    nearDecor(p.name, p.x, p.y, p.terrain).map((d, i) => (
                      <text
                        key={i}
                        x={d.px}
                        y={d.py}
                        fontSize={ultra ? 11 : 9}
                        opacity={0.75}
                        pointerEvents="none"
                        className={ultra ? 'map-sway' : undefined}
                      >
                        {d.glyph}
                      </text>
                    ))}

                  {/* Ultra: Gärten, Brunnen, Marktstände, Baustellen */}
                  {ultra && cityLv > 0 && (
                    <g pointerEvents="none" opacity={0.85}>
                      <text x={cx - 22} y={cy + 18} fontSize={10} className="ambient-wander">
                        🏡
                      </text>
                      <text x={cx + 20} y={cy + 16} fontSize={9} className="ambient-wander" style={{ animationDelay: '1s' }}>
                        ⛲
                      </text>
                      <text x={cx - 8} y={cy + 26} fontSize={9}>
                        🧺
                      </text>
                      <text x={cx + 10} y={cy - 32} fontSize={9} className="map-smoke">
                        🔥
                      </text>
                      <text x={cx - 28} y={cy - 6} fontSize={8} className="ambient-flag">
                        🏳️
                      </text>
                    </g>
                  )}

                  {/* Siedlung / Burg */}
                  {lod !== 'far' && castle && (
                    <text
                      x={cx - (cityLv > 0 ? 12 : 0)}
                      y={cy - 12}
                      textAnchor="middle"
                      fontSize={castle.size}
                      className="map-icon"
                    >
                      {castle.icon}
                    </text>
                  )}
                  {lod !== 'far' && (cityLv > 0 || villLv > 0) && (
                    <text
                      x={cx + (castle ? 14 : 0)}
                      y={cy - 10}
                      textAnchor="middle"
                      fontSize={settle.size}
                      className="map-icon"
                    >
                      {settle.icon}
                    </text>
                  )}

                  {/* Rauch bei Städten */}
                  {detail && cityLv > 0 && (
                    <text x={cx + 8} y={cy - 28} fontSize={10} className="map-smoke" opacity={0.7}>
                      💨
                    </text>
                  )}

                  {/* Name */}
                  {(lod === 'far' || lod === 'mid' || isSelected || p.isOwned || ultra) && (
                    <text
                      x={cx}
                      y={cy + (lod === 'far' ? 4 : 14)}
                      textAnchor="middle"
                      className="map-label"
                      fontSize={lod === 'far' ? (p.isOwned || isSelected ? 12 : 9) : p.isOwned || isSelected ? 11 : 9}
                      fontWeight={p.isOwned ? 700 : 500}
                      fill={isSelected ? '#fff8d0' : '#f0ead8'}
                      style={{ paintOrder: 'stroke', stroke: '#1a1208', strokeWidth: 2.5 }}
                    >
                      {lod === 'far' && p.name.length > 10 ? p.name.slice(0, 9) + '…' : p.name}
                    </text>
                  )}

                  {lod === 'mid' && p.ownerName && (
                    <text
                      x={cx}
                      y={cy + 26}
                      textAnchor="middle"
                      fontSize={7}
                      fill="#d4c4a0"
                      style={{ paintOrder: 'stroke', stroke: '#1a1208', strokeWidth: 1.5 }}
                    >
                      {p.ownerName.length > 14 ? p.ownerName.slice(0, 13) + '…' : p.ownerName}
                    </text>
                  )}

                  {fieldTroops > 0 && lod !== 'far' && (
                    <g>
                      <circle cx={cx + 36} cy={cy - 20} r={11} fill="#6b1515" stroke="#d4af37" strokeWidth={1.5} />
                      <text x={cx + 36} y={cy - 16} textAnchor="middle" fontSize={8} fill="#fff" fontWeight="bold">
                        {fieldTroops}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Ambient Leben (mid/near) */}
            {lod !== 'far' &&
              ambient.map((a) => (
                <text
                  key={a.id}
                  x={a.x}
                  y={a.y}
                  fontSize={a.kind === 'smoke' || a.kind === 'flag' ? 11 : 10}
                  className={a.kind === 'flag' ? 'ambient-flag' : a.kind === 'smoke' ? 'map-smoke' : 'ambient-wander'}
                  style={{
                    animationDelay: `${a.delay}s`,
                    animationDuration: `${a.duration}s`,
                  }}
                  opacity={detail ? (ultra ? 1 : 0.9) : 0.65}
                  pointerEvents="none"
                >
                  {AMBIENT_GLYPH[a.kind]}
                </text>
              ))}

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
                    className="march-line"
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

      <div className="absolute bottom-2 left-2 z-20 flex flex-wrap gap-2 max-w-[75%] pointer-events-none">
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
