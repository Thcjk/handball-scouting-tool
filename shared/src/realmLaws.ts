/** Reichsgesetze & Erbfolge */

export type SuccessionLaw =
  | 'primogeniture'
  | 'elective'
  | 'partition'
  | 'ultimogeniture'
  | 'house_elective';

export type RealmLawId =
  | 'tax_low'
  | 'tax_normal'
  | 'tax_high'
  | 'military_duty'
  | 'religious_freedom'
  | 'noble_privileges'
  | 'peasant_rights'
  | 'trade_open'
  | 'serfdom'
  | 'conscription';

export interface SuccessionLawDef {
  id: SuccessionLaw;
  name: string;
  description: string;
  stability: number;
  civilWarRisk: number;
}

export interface RealmLawDef {
  id: RealmLawId;
  name: string;
  description: string;
  goldMod: number;
  loyaltyMod: number;
  foodMod: number;
  militaryMod: number;
  faithMod: number;
}

export const SUCCESSION_LAWS: SuccessionLawDef[] = [
  {
    id: 'primogeniture',
    name: 'Erstgeborenenrecht',
    description: 'Der älteste Erbe erbt alles. Stabil, aber Geschwisterneid.',
    stability: 10,
    civilWarRisk: 5,
  },
  {
    id: 'elective',
    name: 'Wahlmonarchie',
    description: 'Der Adel wählt den Nachfolger. Flexibel, riskant.',
    stability: -5,
    civilWarRisk: 15,
  },
  {
    id: 'partition',
    name: 'Teilung',
    description: 'Das Reich wird unter Erben geteilt. Schwächt große Reiche.',
    stability: -15,
    civilWarRisk: 25,
  },
  {
    id: 'ultimogeniture',
    name: 'Ultimogenitur',
    description: 'Der jüngste Erbe folgt. Ungewöhnlich, oft umstritten.',
    stability: 0,
    civilWarRisk: 12,
  },
  {
    id: 'house_elective',
    name: 'Hauswahl',
    description: 'Die Dynastie wählt intern. Stärkt das Haus.',
    stability: 5,
    civilWarRisk: 8,
  },
];

export const REALM_LAWS: RealmLawDef[] = [
  {
    id: 'tax_low',
    name: 'Niedrige Steuern',
    description: 'Volk zufrieden, weniger Gold.',
    goldMod: -0.2,
    loyaltyMod: 8,
    foodMod: 0,
    militaryMod: 0,
    faithMod: 0,
  },
  {
    id: 'tax_normal',
    name: 'Normale Steuern',
    description: 'Ausgewogene Abgaben.',
    goldMod: 0,
    loyaltyMod: 0,
    foodMod: 0,
    militaryMod: 0,
    faithMod: 0,
  },
  {
    id: 'tax_high',
    name: 'Hohe Steuern',
    description: 'Mehr Gold, Unzufriedenheit.',
    goldMod: 0.25,
    loyaltyMod: -12,
    foodMod: 0,
    militaryMod: 0,
    faithMod: 0,
  },
  {
    id: 'military_duty',
    name: 'Militärpflicht',
    description: 'Mehr Rekruten, höhere Kosten.',
    goldMod: -0.05,
    loyaltyMod: -3,
    foodMod: -0.1,
    militaryMod: 0.2,
    faithMod: 0,
  },
  {
    id: 'religious_freedom',
    name: 'Religionsfreiheit',
    description: 'Weniger Glaubenskonflikte, weniger Kirchenmacht.',
    goldMod: 0.05,
    loyaltyMod: 5,
    foodMod: 0,
    militaryMod: 0,
    faithMod: -5,
  },
  {
    id: 'noble_privileges',
    name: 'Adelsrechte',
    description: 'Vasallen loyaler, weniger direkte Kontrolle.',
    goldMod: -0.1,
    loyaltyMod: 10,
    foodMod: 0,
    militaryMod: -0.05,
    faithMod: 0,
  },
  {
    id: 'peasant_rights',
    name: 'Bauernrechte',
    description: 'Mehr Nahrung, weniger Adelstreue.',
    goldMod: 0,
    loyaltyMod: -4,
    foodMod: 0.15,
    militaryMod: 0,
    faithMod: 0,
  },
  {
    id: 'trade_open',
    name: 'Freier Handel',
    description: 'Mehr Gold durch Märkte und Seehandel.',
    goldMod: 0.15,
    loyaltyMod: 2,
    foodMod: 0.05,
    militaryMod: 0,
    faithMod: 0,
  },
  {
    id: 'serfdom',
    name: 'Leibeigenschaft',
    description: 'Mehr Produktion, Gefahr von Aufständen.',
    goldMod: 0.1,
    loyaltyMod: -10,
    foodMod: 0.1,
    militaryMod: 0,
    faithMod: -2,
  },
  {
    id: 'conscription',
    name: 'Wehrpflicht',
    description: 'Große Heere, erschöpftes Land.',
    goldMod: -0.08,
    loyaltyMod: -6,
    foodMod: -0.15,
    militaryMod: 0.35,
    faithMod: 0,
  },
];

export interface RealmLawState {
  succession: SuccessionLaw;
  active: RealmLawId[];
}

export function defaultRealmLaws(): RealmLawState {
  return { succession: 'primogeniture', active: ['tax_normal', 'trade_open'] };
}

export function lawModifiers(state: RealmLawState): {
  gold: number;
  loyalty: number;
  food: number;
  military: number;
  faith: number;
  civilWarRisk: number;
} {
  let gold = 1;
  let loyalty = 0;
  let food = 1;
  let military = 1;
  let faith = 0;
  for (const id of state.active) {
    const d = REALM_LAWS.find((l) => l.id === id);
    if (!d) continue;
    gold += d.goldMod;
    loyalty += d.loyaltyMod;
    food += d.foodMod;
    military += d.militaryMod;
    faith += d.faithMod;
  }
  const succ = SUCCESSION_LAWS.find((s) => s.id === state.succession)!;
  return {
    gold,
    loyalty,
    food,
    military,
    faith,
    civilWarRisk: succ.civilWarRisk - succ.stability / 2,
  };
}

export function toggleLaw(state: RealmLawState, id: RealmLawId): RealmLawState {
  const taxIds: RealmLawId[] = ['tax_low', 'tax_normal', 'tax_high'];
  let active = [...state.active];
  if (taxIds.includes(id)) {
    active = active.filter((a) => !taxIds.includes(a));
    active.push(id);
  } else if (active.includes(id)) {
    active = active.filter((a) => a !== id);
  } else {
    active.push(id);
  }
  return { ...state, active };
}
