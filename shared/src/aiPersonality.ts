/** KI-Persönlichkeiten – steuern Entscheidungen ohne Cheats */

export type PersonalityId =
  | 'aggressive'
  | 'diplomatic'
  | 'economic'
  | 'religious'
  | 'conqueror'
  | 'defender';

export interface PersonalityDef {
  id: PersonalityId;
  name: string;
  description: string;
  /** Gewichte 0–1 für AI-Scoring */
  war: number;
  diplomacy: number;
  economy: number;
  faith: number;
  expansion: number;
  defense: number;
}

export const PERSONALITIES: Record<PersonalityId, PersonalityDef> = {
  aggressive: {
    id: 'aggressive',
    name: 'Aggressiv',
    description: 'Führt oft Krieg, baut Armeen, expandiert schnell',
    war: 0.9,
    diplomacy: 0.2,
    economy: 0.35,
    faith: 0.2,
    expansion: 0.85,
    defense: 0.4,
  },
  diplomatic: {
    id: 'diplomatic',
    name: 'Diplomatisch',
    description: 'Bevorzugt Bündnisse und Handel, meidet Kriege',
    war: 0.15,
    diplomacy: 0.95,
    economy: 0.55,
    faith: 0.35,
    expansion: 0.3,
    defense: 0.5,
  },
  economic: {
    id: 'economic',
    name: 'Wirtschaftlich',
    description: 'Entwickelt Städte und Märkte, wird reich',
    war: 0.25,
    diplomacy: 0.5,
    economy: 0.95,
    faith: 0.25,
    expansion: 0.4,
    defense: 0.45,
  },
  religious: {
    id: 'religious',
    name: 'Religiös',
    description: 'Errichtet Tempel, reagiert empfindlich auf Andersgläubige',
    war: 0.4,
    diplomacy: 0.45,
    economy: 0.4,
    faith: 0.95,
    expansion: 0.35,
    defense: 0.55,
  },
  conqueror: {
    id: 'conqueror',
    name: 'Eroberer',
    description: 'Will das größte Reich werden',
    war: 0.85,
    diplomacy: 0.25,
    economy: 0.45,
    faith: 0.2,
    expansion: 0.95,
    defense: 0.35,
  },
  defender: {
    id: 'defender',
    name: 'Verteidiger',
    description: 'Baut starke Burgen und Grenzfestungen',
    war: 0.2,
    diplomacy: 0.4,
    economy: 0.5,
    faith: 0.3,
    expansion: 0.25,
    defense: 0.95,
  },
};

const PERSONALITY_LIST = Object.keys(PERSONALITIES) as PersonalityId[];

export function pickPersonality(seed?: number): PersonalityId {
  const i =
    seed !== undefined
      ? Math.abs(seed) % PERSONALITY_LIST.length
      : Math.floor(Math.random() * PERSONALITY_LIST.length);
  return PERSONALITY_LIST[i];
}

export function personalityFromTraits(traits: string[]): PersonalityId {
  if (traits.includes('grausam') || traits.includes('ehrgeizig')) return 'aggressive';
  if (traits.includes('gerecht') || traits.includes('charismatisch')) return 'diplomatic';
  if (traits.includes('gierig') || traits.includes('intelligent')) return 'economic';
  if (traits.includes('fromm')) return 'religious';
  if (traits.includes('mutig') || traits.includes('tapfer')) return 'conqueror';
  if (traits.includes('loyal')) return 'defender';
  return pickPersonality();
}

/** Casus-Belli-Gründe */
export type WarReasonId =
  | 'border'
  | 'religion'
  | 'resources'
  | 'revenge'
  | 'claim'
  | 'insult'
  | 'ambition'
  | 'feud'
  | 'weak_neighbor';

export const WAR_REASONS: Record<WarReasonId, string> = {
  border: 'Grenzkonflikt',
  religion: 'Religionsstreit',
  resources: 'Rohstoffhunger',
  revenge: 'Rache für eine Niederlage',
  claim: 'Erbanspruch',
  insult: 'Beleidigung am Hof',
  ambition: 'Machtstreben',
  feud: 'Alte Feindschaft',
  weak_neighbor: 'Schwacher Nachbar',
};

export function relationLabel(opinion: number, atWar: boolean): string {
  if (atWar) return 'Im Krieg';
  if (opinion >= 60) return 'Freund';
  if (opinion >= 30) return 'Verbündeter';
  if (opinion >= 5) return 'Neutral';
  if (opinion >= -25) return 'Misstrauisch';
  if (opinion >= -60) return 'Feind';
  return 'Erzfeind';
}
