/** Jahreszeiten, Wetter, Katastrophen, Krankheiten */

import { cryptoRandomId, makeChronicle, type ChronicleEntry } from './worldState';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Weather = 'sunny' | 'rain' | 'snow' | 'storm' | 'fog' | 'thunder';

export interface ClimateState {
  season: Season;
  weather: Weather;
  monthInYear: number;
}

export type DisasterKind = 'flood' | 'earthquake' | 'volcano' | 'wildfire' | 'drought' | 'harsh_winter';
export type DiseaseKind = 'plague' | 'fever' | 'pox' | 'typhus';

export interface ActiveDisaster {
  id: string;
  kind: DisasterKind;
  provinceName: string;
  ticksLeft: number;
}

export interface ActiveDisease {
  id: string;
  kind: DiseaseKind;
  provinceName: string;
  severity: number;
  ticksLeft: number;
}

export const SEASON_LABEL: Record<Season, string> = {
  spring: 'Frühling',
  summer: 'Sommer',
  autumn: 'Herbst',
  winter: 'Winter',
};

export const WEATHER_LABEL: Record<Weather, string> = {
  sunny: 'Sonnig',
  rain: 'Regen',
  snow: 'Schnee',
  storm: 'Sturm',
  fog: 'Nebel',
  thunder: 'Gewitter',
};

export function seasonFromTick(tick: number): ClimateState {
  const monthInYear = tick % 12;
  let season: Season = 'spring';
  if (monthInYear >= 3 && monthInYear < 6) season = 'summer';
  else if (monthInYear >= 6 && monthInYear < 9) season = 'autumn';
  else if (monthInYear >= 9) season = 'winter';
  return { season, weather: weatherForSeason(season), monthInYear };
}

export function weatherForSeason(season: Season): Weather {
  const roll = Math.random();
  if (season === 'winter') {
    if (roll < 0.45) return 'snow';
    if (roll < 0.7) return 'fog';
    if (roll < 0.85) return 'storm';
    return 'sunny';
  }
  if (season === 'autumn') {
    if (roll < 0.35) return 'rain';
    if (roll < 0.5) return 'fog';
    if (roll < 0.65) return 'storm';
    return 'sunny';
  }
  if (season === 'spring') {
    if (roll < 0.3) return 'rain';
    if (roll < 0.4) return 'thunder';
    return 'sunny';
  }
  // summer
  if (roll < 0.15) return 'thunder';
  if (roll < 0.25) return 'storm';
  if (roll < 0.35) return 'rain';
  return 'sunny';
}

export function climateModifiers(c: ClimateState): {
  food: number;
  move: number;
  war: number;
  trade: number;
  mood: number;
} {
  let food = 1;
  let move = 1;
  let war = 1;
  let trade = 1;
  let mood = 0;
  switch (c.season) {
    case 'spring':
      food = 1.1;
      break;
    case 'summer':
      food = 1.15;
      war = 1.1;
      break;
    case 'autumn':
      food = 1.2;
      break;
    case 'winter':
      food = 0.7;
      move = 0.75;
      war = 0.8;
      trade = 0.85;
      mood = -5;
      break;
  }
  switch (c.weather) {
    case 'rain':
      food *= 1.05;
      move *= 0.9;
      break;
    case 'snow':
      food *= 0.9;
      move *= 0.7;
      trade *= 0.8;
      break;
    case 'storm':
      move *= 0.75;
      trade *= 0.7;
      mood -= 3;
      break;
    case 'fog':
      war *= 0.9;
      mood -= 1;
      break;
    case 'thunder':
      mood -= 2;
      break;
    default:
      mood += 2;
  }
  return { food, move, war, trade, mood };
}

export function rollDisaster(tick: number, provinceNames: string[]): {
  disaster: ActiveDisaster | null;
  entry?: ChronicleEntry;
} {
  if (provinceNames.length === 0 || Math.random() > 0.04) return { disaster: null };
  const kinds: DisasterKind[] = ['flood', 'earthquake', 'volcano', 'wildfire', 'drought', 'harsh_winter'];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  const provinceName = provinceNames[Math.floor(Math.random() * provinceNames.length)];
  const labels: Record<DisasterKind, string> = {
    flood: 'Überschwemmung',
    earthquake: 'Erdbeben',
    volcano: 'Vulkanausbruch',
    wildfire: 'Waldbrand',
    drought: 'Dürre',
    harsh_winter: 'Extremer Winter',
  };
  return {
    disaster: {
      id: cryptoRandomId(),
      kind,
      provinceName,
      ticksLeft: 3 + Math.floor(Math.random() * 3),
    },
    entry: makeChronicle(
      tick,
      'disaster',
      labels[kind],
      `${labels[kind]} trifft ${provinceName}. Die Landschaft verändert sich.`,
    ),
  };
}

export function rollDisease(tick: number, provinceNames: string[], hasPhysician: boolean): {
  disease: ActiveDisease | null;
  entry?: ChronicleEntry;
} {
  const chance = hasPhysician ? 0.05 : 0.09;
  if (provinceNames.length === 0 || Math.random() > chance) return { disease: null };
  const kinds: DiseaseKind[] = ['plague', 'fever', 'pox', 'typhus'];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  const provinceName = provinceNames[Math.floor(Math.random() * provinceNames.length)];
  const labels: Record<DiseaseKind, string> = {
    plague: 'Pest',
    fever: 'Fieber',
    pox: 'Pocken',
    typhus: 'Typhus',
  };
  return {
    disease: {
      id: cryptoRandomId(),
      kind,
      provinceName,
      severity: 3 + Math.floor(Math.random() * 5),
      ticksLeft: 4 + Math.floor(Math.random() * 4),
    },
    entry: makeChronicle(
      tick,
      'disaster',
      `Seuche: ${labels[kind]}`,
      `${labels[kind]} bricht in ${provinceName} aus.`,
    ),
  };
}

export function tickDisasters(list: ActiveDisaster[]): ActiveDisaster[] {
  return list
    .map((d) => ({ ...d, ticksLeft: d.ticksLeft - 1 }))
    .filter((d) => d.ticksLeft > 0);
}

export function tickDiseases(
  list: ActiveDisease[],
  hasPhysician: boolean,
): { diseases: ActiveDisease[]; popLoss: number } {
  let popLoss = 0;
  const diseases = list
    .map((d) => {
      const severity = Math.max(1, d.severity - (hasPhysician ? 1 : 0));
      popLoss += severity * 8;
      return { ...d, severity, ticksLeft: d.ticksLeft - 1 };
    })
    .filter((d) => d.ticksLeft > 0);
  return { diseases, popLoss };
}

/** Musik-/Sound-Stimmung für die UI (kein Asset nötig – Label + CSS) */
export type AtmosphereMood =
  | 'peace'
  | 'war'
  | 'siege'
  | 'winter'
  | 'capital'
  | 'church'
  | 'tournament'
  | 'harbor'
  | 'rain'
  | 'market';

export function pickAtmosphereMood(input: {
  season: Season;
  weather: Weather;
  atWar: boolean;
  siege: boolean;
  tournament: boolean;
  fair: boolean;
  coastalFocus: boolean;
}): AtmosphereMood {
  if (input.siege) return 'siege';
  if (input.tournament) return 'tournament';
  if (input.atWar) return 'war';
  if (input.fair) return 'market';
  if (input.season === 'winter') return 'winter';
  if (input.weather === 'rain' || input.weather === 'storm') return 'rain';
  if (input.coastalFocus) return 'harbor';
  return 'peace';
}

export const ATMOSPHERE_LABEL: Record<AtmosphereMood, string> = {
  peace: 'Ruhige Weisen',
  war: 'Kriegstrommeln',
  siege: 'Belagerungsklänge',
  winter: 'Winterchoral',
  capital: 'Hofmusik',
  church: 'Kirchenglocken',
  tournament: 'Turnierfanfaren',
  harbor: 'Hafenklänge',
  rain: 'Regen & Wind',
  market: 'Marktgetriebe',
};
