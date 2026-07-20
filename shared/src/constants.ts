import type { ProvinceSeed } from './types';
import { Terrain } from './types';

export const STARTING_RESOURCES = {
  gold: 500,
  food: 300,
  wood: 200,
  stone: 150,
  iron: 75,
  influence: 20,
  fame: 0,
};

/** Erweiterte Weltkarte (6×5) – CK3/OpenFront-inspirierte Provinzen */
export const WORLD_PROVINCES: ProvinceSeed[] = [
  // y=0 Norden
  { name: 'Nordmark', x: 0, y: 0, terrain: Terrain.PLAINS, population: 1200, neighbors: ['Westhain', 'Ostfeld', 'Eiskante'] },
  { name: 'Ostfeld', x: 1, y: 0, terrain: Terrain.FOREST, population: 900, neighbors: ['Nordmark', 'Mittelland', 'Südhang', 'Eiskante'] },
  { name: 'Eiskante', x: 2, y: 0, terrain: Terrain.MOUNTAINS, population: 500, neighbors: ['Nordmark', 'Ostfeld', 'Hochgrat', 'Mittelland'] },
  { name: 'Hochgrat', x: 3, y: 0, terrain: Terrain.MOUNTAINS, population: 450, neighbors: ['Eiskante', 'Goldtal', 'Bergheim'] },
  { name: 'Goldtal', x: 4, y: 0, terrain: Terrain.HILLS, population: 800, neighbors: ['Hochgrat', 'Mittelland', 'Steinburg', 'Silberpass'] },
  { name: 'Silberpass', x: 5, y: 0, terrain: Terrain.MOUNTAINS, population: 400, neighbors: ['Goldtal', 'Ostklippe', 'Steinburg'] },

  // y=1
  { name: 'Westhain', x: 0, y: 1, terrain: Terrain.FOREST, population: 1000, neighbors: ['Nordmark', 'Flachland', 'Südhang', 'Moorrand'] },
  { name: 'Flachland', x: 1, y: 1, terrain: Terrain.PLAINS, population: 1800, neighbors: ['Westhain', 'Südhang', 'Mittelburg', 'Kornfeld'] },
  { name: 'Südhang', x: 2, y: 1, terrain: Terrain.HILLS, population: 1100, neighbors: ['Ostfeld', 'Westhain', 'Flachland', 'Bergheim', 'Südtor', 'Mittelland'] },
  { name: 'Mittelland', x: 3, y: 1, terrain: Terrain.PLAINS, population: 1500, neighbors: ['Ostfeld', 'Eiskante', 'Goldtal', 'Südhang', 'Bergheim', 'Mittelburg'] },
  { name: 'Bergheim', x: 4, y: 1, terrain: Terrain.MOUNTAINS, population: 700, neighbors: ['Hochgrat', 'Südhang', 'Mittelburg', 'Steinburg', 'Mittelland'] },
  { name: 'Steinburg', x: 5, y: 1, terrain: Terrain.MOUNTAINS, population: 600, neighbors: ['Goldtal', 'Mittelburg', 'Bergheim', 'Ostklippe', 'Silberpass', 'Küsteneck'] },

  // y=2
  { name: 'Moorrand', x: 0, y: 2, terrain: Terrain.FOREST, population: 700, neighbors: ['Westhain', 'Ostwald', 'Westufer', 'Kornfeld'] },
  { name: 'Kornfeld', x: 1, y: 2, terrain: Terrain.PLAINS, population: 1600, neighbors: ['Flachland', 'Ostwald', 'Südtor', 'Südbucht', 'Moorrand'] },
  { name: 'Südtor', x: 2, y: 2, terrain: Terrain.PLAINS, population: 1300, neighbors: ['Südhang', 'Mittelburg', 'Südblick', 'Kornfeld', 'Weinberge'] },
  { name: 'Mittelburg', x: 3, y: 2, terrain: Terrain.PLAINS, population: 2000, neighbors: ['Flachland', 'Bergheim', 'Steinburg', 'Küsteneck', 'Südtor', 'Mittelland', 'Südblick'] },
  { name: 'Südblick', x: 4, y: 2, terrain: Terrain.HILLS, population: 850, neighbors: ['Südtor', 'Küsteneck', 'Hafenstadt', 'Mittelburg', 'Weinberge'] },
  { name: 'Küsteneck', x: 5, y: 2, terrain: Terrain.COAST, population: 1600, neighbors: ['Mittelburg', 'Südblick', 'Hafenstadt', 'Ostklippe', 'Steinburg'] },

  // y=3
  { name: 'Ostwald', x: 0, y: 3, terrain: Terrain.FOREST, population: 950, neighbors: ['Moorrand', 'Kornfeld', 'Westufer', 'Südbucht'] },
  { name: 'Westufer', x: 1, y: 3, terrain: Terrain.COAST, population: 1400, neighbors: ['Ostwald', 'Moorrand', 'Südbucht'] },
  { name: 'Südbucht', x: 2, y: 3, terrain: Terrain.COAST, population: 1100, neighbors: ['Westufer', 'Kornfeld', 'Weinberge', 'Hafenstadt', 'Ostwald'] },
  { name: 'Weinberge', x: 3, y: 3, terrain: Terrain.HILLS, population: 900, neighbors: ['Südblick', 'Südbucht', 'Hafenstadt', 'Südtor'] },
  { name: 'Hafenstadt', x: 4, y: 3, terrain: Terrain.COAST, population: 2200, neighbors: ['Südblick', 'Küsteneck', 'Ostklippe', 'Weinberge', 'Südbucht', 'Leuchtturm'] },
  { name: 'Ostklippe', x: 5, y: 3, terrain: Terrain.COAST, population: 750, neighbors: ['Steinburg', 'Küsteneck', 'Hafenstadt', 'Silberpass', 'Leuchtturm'] },

  // y=4 Südküste
  { name: 'Leuchtturm', x: 4, y: 4, terrain: Terrain.COAST, population: 650, neighbors: ['Hafenstadt', 'Ostklippe'] },
];

export const TERRAIN_DEFENSE_BONUS: Record<Terrain, number> = {
  [Terrain.PLAINS]: 0,
  [Terrain.FOREST]: 10,
  [Terrain.HILLS]: 15,
  [Terrain.MOUNTAINS]: 25,
  [Terrain.COAST]: 5,
};

export const CASTLE_DEFENSE_PER_LEVEL = 20;
