/**
 * Organische Provinz-Polygone für die Weltkarte (CK3-Stil).
 * Jede Provinz bekommt ein unregelmäßiges Polygon um ihr Rasterzentrum.
 */

const CELL_W = 140;
const CELL_H = 110;
const PAD = 8;

function hash(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Unregelmäßiges 6–8-Eck um (cx, cy) */
export function provincePolygon(x: number, y: number, name: string): string {
  const seed = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const cx = x * CELL_W + CELL_W / 2;
  const cy = y * CELL_H + CELL_H / 2;
  const sides = 6 + Math.floor(hash(seed) * 3);
  const points: string[] = [];

  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    const jitter = 0.72 + hash(seed + i * 7) * 0.28;
    const rx = (CELL_W / 2 - PAD) * jitter;
    const ry = (CELL_H / 2 - PAD) * jitter;
    const px = cx + Math.cos(angle) * rx;
    const py = cy + Math.sin(angle) * ry;
    points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
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
    width: (maxX + 1) * CELL_W + 40,
    height: (maxY + 1) * CELL_H + 40,
  };
}

export const TERRAIN_FILL: Record<string, string> = {
  PLAINS: '#3d6b35',
  FOREST: '#1e4a28',
  HILLS: '#6b5a32',
  MOUNTAINS: '#5a5a5a',
  COAST: '#2a5a6e',
};

export const TERRAIN_PATTERN: Record<string, string> = {
  PLAINS: '#4a7c3f',
  FOREST: '#163820',
  HILLS: '#7a6a40',
  MOUNTAINS: '#6e6e6e',
  COAST: '#3a6a80',
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

/** Fluss-Pfade (dekorativ) */
export const RIVER_PATHS = [
  'M 70 20 C 90 80, 120 140, 160 200 C 200 260, 280 300, 360 340',
  'M 420 40 C 400 100, 380 160, 350 220 C 320 280, 300 320, 280 380',
  'M 100 350 C 180 360, 260 370, 400 390',
];
