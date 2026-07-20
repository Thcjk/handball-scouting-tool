/** Phase 4 – Charakter-, Dynastie- und Hof-Typen */

export type LifeStage = 'baby' | 'child' | 'youth' | 'adult' | 'elder';

export type EducationFocus =
  | 'diplomacy'
  | 'war'
  | 'stewardship'
  | 'learning'
  | 'faith'
  | 'intrigue';

export type TitleRank =
  | 'graf'
  | 'markgraf'
  | 'herzog'
  | 'grossherzog'
  | 'koenig'
  | 'kaiser';

export type CouncilRole =
  | 'chancellor'
  | 'marshal'
  | 'steward'
  | 'spymaster'
  | 'chaplain'
  | 'builder';

export type Appearance = {
  portrait: string;
  hair: string;
  beard: string;
  clothing: string;
  armor?: string;
  crown?: string;
};

/** Erweiterter Charakter – abwärtskompatibel zu einfachen Character-Objekten */
export interface CharacterProfile {
  id: string;
  firstName: string;
  lastName: string;
  /** Anzeigename (Vorname Nachname) */
  name: string;
  dynastyName: string;
  title?: string;
  nickname?: string;
  age: number;
  birthYear: number;
  birthPlace: string;
  culture: string;
  religion: string;
  language: string;
  gender: 'MALE' | 'FEMALE';
  appearance: Appearance;
  traits: string[];
  personality?: string;
  experience: number;
  prestige: number;
  renown: number;
  influence: number;
  health: number;
  energy: number;
  stress: number;
  martial: number;
  diplomacy: number;
  stewardship: number;
  intrigue: number;
  learning?: number;
  isAlive: boolean;
  isRuler: boolean;
  isHeir: boolean;
  lifeStage: LifeStage;
  education?: EducationFocus | null;
  educationProgress?: number;
  /** Verwandtschaft */
  spouseId?: string | null;
  fatherId?: string | null;
  motherId?: string | null;
  childrenIds?: string[];
  /** Hofrolle */
  councilRole?: CouncilRole | null;
  loyalty?: number;
  opinionOfRuler?: number;
}

export interface DynastyMeta {
  id: string;
  name: string;
  motto: string | null;
  coatSeed: string;
  prestige: number;
  renown: number;
  foundedYear: number;
  famousMembers: string[];
}

export interface MarriageRecord {
  id: string;
  spouseAId: string;
  spouseBId: string;
  year: number;
  allianceKingdomId?: string;
  prestigeGain: number;
}

export interface CourtVisitor {
  id: string;
  name: string;
  kind:
    | 'ambassador'
    | 'merchant'
    | 'knight'
    | 'bard'
    | 'pilgrim'
    | 'artist'
    | 'scholar'
    | 'craftsman'
    | 'adventurer';
  description: string;
  arrivedTick: number;
  expiresTick: number;
  /** Optional: Quest-Hinweis vom Besucher */
  offersQuest?: boolean;
}

export interface CouncilSlot {
  role: CouncilRole;
  characterId: string | null;
  label: string;
}

export interface TitleState {
  rank: TitleRank;
  formalTitle: string;
  provinceThreshold: number;
}

export const EXTRA_TRAITS = [
  'feige',
  'grosszuegig',
  'luegner',
  'schuechtern',
  'unglaeubig',
  'faul',
  'temperamentvoll',
  'geduldig',
  'naiv',
] as const;

export function lifeStageFromAge(age: number): LifeStage {
  if (age < 3) return 'baby';
  if (age < 12) return 'child';
  if (age < 16) return 'youth';
  if (age < 60) return 'adult';
  return 'elder';
}

export function defaultAppearance(gender: 'MALE' | 'FEMALE', isRuler: boolean): Appearance {
  return {
    portrait: gender === 'FEMALE' ? '👩' : isRuler ? '🤴' : '🧔',
    hair: gender === 'FEMALE' ? 'lang' : 'kurz',
    beard: gender === 'MALE' ? 'vollbart' : 'keiner',
    clothing: isRuler ? 'purpurmantel' : 'leinenrock',
    armor: isRuler ? 'zeremoniell' : undefined,
    crown: isRuler ? 'grafenkrone' : undefined,
  };
}
