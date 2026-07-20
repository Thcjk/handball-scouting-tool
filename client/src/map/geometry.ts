/**
 * Weltkarten-Geometrie, Straßen, Flüsse, Seen, LOD-Helfer
 */

export const CELL_W = 140;
export const CELL_H = 110;
const PAD = 8;

export function hash(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function nameSeed(name: string) {
  return name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
}

/** Unregelmäßiges Polygon um Rasterzentrum */
export function provincePolygon(x: number, y: number, name: string): string {
  const seed = nameSeed(name);
  const cx = x * CELL_W + CELL_W / 2;
  const cy = y * CELL_H + CELL_H / 2;
  const sides = 6 + Math.floor(hash(seed) * 3);
  const points: string[] = [];

  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    const jitter = 0.7 + hash(seed + i * 7) * 0.32;
    const rx = (CELL_W / 2 - PAD) * jitter;
    const ry = (CELL_H / 2 - PAD) * jitter;
    points.push(`${(cx + Math.cos(angle) * rx).toFixed(1)},${(cy + Math.sin(angle) * ry).toFixed(1)}`);
  }
  return points.join(' ');
}

export function provinceCenter(x: number, y: number) {
  return {
    cx: x * CELL_W + CELL_W / 2,
    cy: y * CELL_H + CELL_H / 2,
  };
}

export function mapBounds(maxX: number, maxY: number) {
  return {
    width: (maxX + 1) * CELL_W + 80,
    height: (maxY + 1) * CELL_H + 80,
  };
}

/** Terrain-Farben – wärmer, mittelalterlich */
export const TERRAIN_FILL: Record<string, string> = {
  PLAINS: '#4a7a3c',
  FOREST: '#1f4a2a',
  HILLS: '#6e5c38',
  MOUNTAINS: '#5c5c62',
  COAST: '#2f6478',
};

export const TERRAIN_FILL_ALT: Record<string, string> = {
  PLAINS: '#3f6e34',
  FOREST: '#163820',
  HILLS: '#7a6840',
  MOUNTAINS: '#6a6a70',
  COAST: '#3a7088',
};

export const REALM_COLORS = [
  '#c9a227',
  '#b33a3a',
  '#2e6da4',
  '#6b3fa0',
  '#2d8a5e',
  '#c45c26',
  '#1a8a8a',
  '#a03a6b',
];

export const RIVER_PATHS = [
  'M 40 30 C 80 90, 110 150, 150 210 C 190 270, 240 310, 320 360 C 380 400, 450 420, 520 450',
  'M 500 20 C 470 80, 440 140, 400 200 C 360 260, 330 310, 280 370 C 240 410, 180 440, 120 470',
  'M 60 380 C 140 390, 220 400, 300 410 C 380 420, 460 430, 540 440',
  'M 200 60 C 230 120, 250 180, 270 240 C 290 300, 310 350, 340 400',
];

export const LAKE_ELLIPSES = [
  { cx: 180, cy: 280, rx: 28, ry: 18 },
  { cx: 420, cy: 160, rx: 22, ry: 14 },
  { cx: 300, cy: 420, rx: 32, ry: 16 },
];

export type ZoomLod = 'far' | 'mid' | 'near' | 'ultra';

export function zoomLod(scale: number): ZoomLod {
  if (scale < 0.55) return 'far';
  if (scale < 1.15) return 'mid';
  if (scale < 2.1) return 'near';
  return 'ultra';
}

/** Burg-Stufe → Darstellung */
export function castleVisual(level: number): { icon: string; label: string; size: number } {
  if (level >= 5) return { icon: '🏯', label: 'Königliche Zitadelle', size: 22 };
  if (level >= 4) return { icon: '🏰', label: 'Festung', size: 20 };
  if (level >= 3) return { icon: '🏰', label: 'Steinburg', size: 18 };
  if (level >= 2) return { icon: '🏯', label: 'Kleine Burg', size: 16 };
  return { icon: '🪵', label: 'Holzpalisade', size: 14 };
}

/** Siedlungsstufe auf der Karte */
export function settlementVisual(
  cityLevel: number,
  villageLevel: number,
  buildingCount: number,
): { icon: string; label: string; size: number } {
  const score = cityLevel * 3 + villageLevel + Math.floor(buildingCount / 8);
  if (score >= 15 || cityLevel >= 5) return { icon: '🏛️', label: 'Hauptstadt', size: 20 };
  if (score >= 10 || cityLevel >= 3) return { icon: '🏙️', label: 'Große Stadt', size: 17 };
  if (score >= 5 || cityLevel >= 1) return { icon: '🏘️', label: 'Kleinstadt', size: 15 };
  if (villageLevel >= 2) return { icon: '🏡', label: 'Dorf', size: 13 };
  return { icon: '🛖', label: 'Weiler', size: 11 };
}

export type AmbientKind =
  | 'peasant'
  | 'merchant'
  | 'soldier'
  | 'sheep'
  | 'smoke'
  | 'flag'
  | 'boat'
  | 'hunter'
  | 'child'
  | 'cart'
  | 'knight'
  | 'wolf'
  | 'deer'
  | 'bear'
  | 'cow'
  | 'horse'
  | 'bell';

export interface AmbientActor {
  id: string;
  kind: AmbientKind;
  x: number;
  y: number;
  delay: number;
  duration: number;
}

/** Deterministische Ambient-Akteure (max. ~36 für Performance) */
export function buildAmbientActors(
  provinces: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    terrain: string;
    isOwned?: boolean;
    hasCity?: boolean;
  }>,
  season?: string,
): AmbientActor[] {
  const actors: AmbientActor[] = [];
  let i = 0;
  for (const p of provinces) {
    const seed = nameSeed(p.name);
    const { cx, cy } = provinceCenter(p.x, p.y);
    if (hash(seed) > 0.4 && i < 30) {
      const kindPool: AmbientKind[] =
        p.terrain === 'FOREST'
          ? ['hunter', 'peasant', 'smoke', 'wolf', 'deer']
          : p.terrain === 'COAST'
            ? ['boat', 'merchant', 'smoke', 'cart']
            : p.terrain === 'PLAINS'
              ? ['sheep', 'peasant', 'merchant', 'cow', 'horse', 'child']
              : p.terrain === 'MOUNTAINS'
                ? ['soldier', 'flag', 'smoke', 'bear']
                : ['soldier', 'flag', 'smoke', 'deer'];
      const kind = kindPool[Math.floor(hash(seed + 3) * kindPool.length)];
      actors.push({
        id: `a-${p.id}`,
        kind,
        x: cx + (hash(seed + 1) - 0.5) * 50,
        y: cy + (hash(seed + 2) - 0.5) * 40,
        delay: hash(seed + 4) * 4,
        duration: 4 + hash(seed + 5) * 6,
      });
      i++;
    }
    if (p.isOwned && hash(seed + 9) > 0.3 && i < 34) {
      actors.push({
        id: `f-${p.id}`,
        kind: 'flag',
        x: cx + 18,
        y: cy - 28,
        delay: 0,
        duration: 2.5,
      });
      i++;
    }
    // Lebendige Städte
    if (p.hasCity && i < 36) {
      const cityKinds: AmbientKind[] = ['merchant', 'child', 'cart', 'knight', 'bell', 'smoke'];
      const ck = cityKinds[Math.floor(hash(seed + 11) * cityKinds.length)];
      actors.push({
        id: `c-${p.id}`,
        kind: ck,
        x: cx + (hash(seed + 12) - 0.5) * 30,
        y: cy + 10 + hash(seed + 13) * 16,
        delay: hash(seed + 14) * 2,
        duration: 5 + hash(seed + 15) * 4,
      });
      i++;
    }
    // Winter: weniger Tiere auf offenen Feldern
    if (season === 'winter' && (p.terrain === 'PLAINS' || p.terrain === 'HILLS') && hash(seed + 20) > 0.7 && i < 38) {
      actors.push({
        id: `w-${p.id}`,
        kind: 'smoke',
        x: cx - 12,
        y: cy - 8,
        delay: 1,
        duration: 4,
      });
      i++;
    }
  }
  return actors;
}

/** Straßen zwischen benachbarten Provinzen mit Siedlung */
export function buildRoadSegments(
  provinces: Array<{
    id: string;
    x: number;
    y: number;
    neighbors: Array<{ id: string }>;
    castle?: { level: number } | null;
    city?: { level: number } | null;
    village?: { level: number } | null;
  }>,
): Array<{ x1: number; y1: number; x2: number; y2: number; key: string }> {
  const byId = new Map(provinces.map((p) => [p.id, p]));
  const segs: Array<{ x1: number; y1: number; x2: number; y2: number; key: string }> = [];
  const seen = new Set<string>();

  for (const p of provinces) {
    const hasSettlement = !!(p.castle || (p.city && p.city.level > 0) || p.village);
    if (!hasSettlement) continue;
    const a = provinceCenter(p.x, p.y);
    for (const n of p.neighbors) {
      const q = byId.get(n.id);
      if (!q) continue;
      const key = p.id < q.id ? `${p.id}-${q.id}` : `${q.id}-${p.id}`;
      if (seen.has(key)) continue;
      const qSettle = !!(q.castle || (q.city && q.city.level > 0) || q.village);
      if (!qSettle && !p.castle) continue;
      seen.add(key);
      const b = provinceCenter(q.x, q.y);
      segs.push({ x1: a.cx, y1: a.cy, x2: b.cx, y2: b.cy, key });
    }
  }
  return segs;
}

/** Dekorative Bäume/Felsen für Nah-Zoom (pro Provinz begrenzt) */
export function nearDecor(
  name: string,
  x: number,
  y: number,
  terrain: string,
): Array<{ px: number; py: number; glyph: string }> {
  const seed = nameSeed(name);
  const { cx, cy } = provinceCenter(x, y);
  const count = terrain === 'FOREST' ? 5 : terrain === 'MOUNTAINS' ? 4 : terrain === 'PLAINS' ? 3 : 2;
  const out: Array<{ px: number; py: number; glyph: string }> = [];
  for (let i = 0; i < count; i++) {
    const glyph =
      terrain === 'FOREST'
        ? '🌲'
        : terrain === 'MOUNTAINS'
          ? '🪨'
          : terrain === 'HILLS'
            ? '🌳'
            : terrain === 'COAST'
              ? '🌾'
              : i % 2 === 0
                ? '🌾'
                : '🌳';
    out.push({
      px: cx + (hash(seed + i * 11) - 0.5) * 70,
      py: cy + (hash(seed + i * 13) - 0.5) * 55,
      glyph,
    });
  }
  return out;
}
