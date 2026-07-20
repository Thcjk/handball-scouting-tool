/** Weltregionen & erweiterte Provinzen (Kontinente-Vorbereitung) */

import { WORLD_PROVINCES } from './constants';
import { Terrain } from './types';
import type { ProvinceSeed } from './types';

export type RegionId = 'herzlande' | 'nordmeer' | 'ostmark' | 'suedinseln' | 'westwildnis';

export interface WorldRegion {
  id: RegionId;
  name: string;
  culture: string;
  religion: string;
  architecture: string;
  resources: string[];
  description: string;
}

export const WORLD_REGIONS: WorldRegion[] = [
  {
    id: 'herzlande',
    name: 'Herzlande',
    culture: 'germanisch',
    religion: 'lichtglaube',
    architecture: 'steinerne Burgen & Fachwerk',
    resources: ['Getreide', 'Eisen', 'Holz'],
    description: 'Das Kernland der Kronenchronik.',
  },
  {
    id: 'nordmeer',
    name: 'Nordmeer',
    culture: 'nordisch',
    religion: 'alte_goetter',
    architecture: 'Holzhallen & Küstenforts',
    resources: ['Fisch', 'Pelze', 'Eisen'],
    description: 'Kalte Küsten und raue Inseln.',
  },
  {
    id: 'ostmark',
    name: 'Ostmark',
    culture: 'slawisch',
    religion: 'naturkult',
    architecture: 'Holzburg & Erdwälle',
    resources: ['Holz', 'Honig', 'Pelze'],
    description: 'Wälder und Grenzmarken im Osten.',
  },
  {
    id: 'suedinseln',
    name: 'Südinseln',
    culture: 'romanisch',
    religion: 'lichtglaube',
    architecture: 'Steinbögen & Hafenstädte',
    resources: ['Wein', 'Salz', 'Luxusgüter'],
    description: 'Warme Inseln und Seehandel.',
  },
  {
    id: 'westwildnis',
    name: 'Westwildnis',
    culture: 'frankisch',
    religion: 'lichtglaube',
    architecture: 'Palissaden & Klöster',
    resources: ['Holz', 'Stein', 'Wild'],
    description: 'Unerschlossene Westlande.',
  },
];

/** Zusätzliche Provinzen (Phase 5) – erweitern die Karte nach Süden/Westen */
export const EXTRA_PROVINCES: Array<ProvinceSeed & { region: RegionId }> = [
  {
    name: 'Nebelinsel',
    x: 0,
    y: 4,
    terrain: Terrain.COAST,
    population: 500,
    neighbors: ['Westufer', 'Dünenriff', 'Westmark'],
    region: 'nordmeer',
  },
  {
    name: 'Dünenriff',
    x: 1,
    y: 4,
    terrain: Terrain.COAST,
    population: 550,
    neighbors: ['Nebelinsel', 'Westufer', 'Südbucht', 'Salzmarsch', 'Grenzwald'],
    region: 'suedinseln',
  },
  {
    name: 'Salzmarsch',
    x: 2,
    y: 4,
    terrain: Terrain.COAST,
    population: 480,
    neighbors: ['Dünenriff', 'Südbucht', 'Weinberge', 'Korallenbucht'],
    region: 'suedinseln',
  },
  {
    name: 'Korallenbucht',
    x: 3,
    y: 4,
    terrain: Terrain.COAST,
    population: 700,
    neighbors: ['Salzmarsch', 'Weinberge', 'Hafenstadt', 'Leuchtturm'],
    region: 'suedinseln',
  },
  {
    name: 'Westmark',
    x: 0,
    y: 5,
    terrain: Terrain.FOREST,
    population: 600,
    neighbors: ['Nebelinsel', 'Moorrand', 'Grenzwald'],
    region: 'westwildnis',
  },
  {
    name: 'Grenzwald',
    x: 1,
    y: 5,
    terrain: Terrain.FOREST,
    population: 520,
    neighbors: ['Westmark', 'Dünenriff', 'Ostwald'],
    region: 'westwildnis',
  },
];

export function regionForProvince(name: string): RegionId {
  const extra = EXTRA_PROVINCES.find((p) => p.name === name);
  if (extra) return extra.region;
  if (['Nordmark', 'Eiskante', 'Hochgrat', 'Silberpass'].includes(name)) return 'nordmeer';
  if (['Ostfeld', 'Ostwald', 'Moorrand'].includes(name)) return 'ostmark';
  if (['Hafenstadt', 'Leuchtturm', 'Küsteneck', 'Südbucht', 'Westufer'].includes(name)) return 'suedinseln';
  return 'herzlande';
}

export function regionDef(id: RegionId): WorldRegion {
  return WORLD_REGIONS.find((r) => r.id === id) ?? WORLD_REGIONS[0];
}

/**
 * Vollständige Provinzliste inkl. Phase-5-Erweiterung mit reziproken Nachbarn.
 * Ersetzt die reine WORLD_PROVINCES-Liste für neue und migrierte Spielstände.
 */
export function allWorldProvinceSeeds(): ProvinceSeed[] {
  const byName = new Map<string, ProvinceSeed>();
  for (const p of WORLD_PROVINCES) {
    byName.set(p.name, { ...p, neighbors: [...p.neighbors] });
  }
  for (const p of EXTRA_PROVINCES) {
    byName.set(p.name, {
      name: p.name,
      x: p.x,
      y: p.y,
      terrain: p.terrain,
      population: p.population,
      neighbors: [...p.neighbors],
    });
  }
  // Reziproke Nachbarschaft sicherstellen
  for (const p of byName.values()) {
    for (const n of [...p.neighbors]) {
      const other = byName.get(n);
      if (!other) continue;
      if (!other.neighbors.includes(p.name)) {
        other.neighbors.push(p.name);
      }
    }
  }
  return Array.from(byName.values());
}

export function cultureReligionForRegion(region: RegionId): { culture: string; religion: string } {
  const r = regionDef(region);
  return { culture: r.culture, religion: r.religion };
}
