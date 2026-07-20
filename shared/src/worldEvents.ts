/** Ereignisvorlagen für die lebendige Welt */

import { cryptoRandomId, type PendingWorldEvent } from './worldState';

export interface EventChoiceEffect {
  gold?: number;
  food?: number;
  wood?: number;
  stone?: number;
  iron?: number;
  influence?: number;
  fame?: number;
  populationDelta?: number;
  satisfactionDelta?: number;
  prosperityDelta?: number;
  chronicleTitle?: string;
  chronicleText?: string;
}

export interface EventTemplate {
  id: string;
  title: string;
  description: string;
  weight: number;
  /** Benötigt eigene Provinz */
  needsProvince?: boolean;
  choices: Array<{
    id: string;
    label: string;
    effect: EventChoiceEffect;
  }>;
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: 'famine',
    title: 'Hungersnot',
    description: 'Die Ernte fällt aus. Das Volk hungert und blickt zum Herrscher.',
    weight: 8,
    needsProvince: true,
    choices: [
      { id: 'aid', label: 'Getreide verteilen (−80 Gold, +Nahrung)', effect: { gold: -80, food: 60, satisfactionDelta: 8, chronicleTitle: 'Hilfe in der Not', chronicleText: 'Der Herrscher speiste das Volk aus der Schatzkammer.' } },
      { id: 'ignore', label: 'Abwarten', effect: { populationDelta: -120, satisfactionDelta: -15, chronicleTitle: 'Hungersnot', chronicleText: 'Viele starben, der Zorn wuchs.' } },
      { id: 'tax', label: 'Steuern eintreiben', effect: { gold: 40, satisfactionDelta: -25, populationDelta: -40 } },
    ],
  },
  {
    id: 'plague',
    title: 'Pest',
    description: 'Eine Seuche greift um sich. Ärzte und Priester streiten um den Weg.',
    weight: 5,
    needsProvince: true,
    choices: [
      { id: 'quarantine', label: 'Quarantäne (−50 Gold)', effect: { gold: -50, populationDelta: -40, satisfactionDelta: -5, chronicleTitle: 'Quarantäne', chronicleText: 'Die Pest wurde eingedämmt, doch der Handel litt.' } },
      { id: 'prayer', label: 'Bittprozession', effect: { influence: 5, populationDelta: -90, satisfactionDelta: 5 } },
      { id: 'flee', label: 'Hof verlassen', effect: { populationDelta: -150, fame: -5, satisfactionDelta: -20 } },
    ],
  },
  {
    id: 'fire',
    title: 'Großbrand',
    description: 'Feuer wütet in den Gassen. Häuser und Lager stehen in Flammen.',
    weight: 6,
    needsProvince: true,
    choices: [
      { id: 'rebuild', label: 'Sofort wiederaufbauen (−100 Gold, −40 Holz)', effect: { gold: -100, wood: -40, satisfactionDelta: 10, chronicleTitle: 'Wiederaufbau', chronicleText: 'Neue Häuser stiegen aus der Asche.' } },
      { id: 'partial', label: 'Notunterkünfte', effect: { gold: -30, wood: -15, satisfactionDelta: -5, populationDelta: -30 } },
    ],
  },
  {
    id: 'bandits',
    title: 'Banditen',
    description: 'Räuber bedrohen die Handelsstraße. Kaufleute fordern Schutz.',
    weight: 10,
    needsProvince: true,
    choices: [
      { id: 'hunt', label: 'Jagd auf Banditen (−40 Gold)', effect: { gold: -40, fame: 3, satisfactionDelta: 6, prosperityDelta: 3 } },
      { id: 'pay', label: 'Lösegeld anbieten', effect: { gold: -70, satisfactionDelta: -8 } },
      { id: 'ignore', label: 'Ignorieren', effect: { gold: -20, prosperityDelta: -5, satisfactionDelta: -10 } },
    ],
  },
  {
    id: 'tournament',
    title: 'Ritterturnier',
    description: 'Adelige fordern ein Turnier. Ruhm und Kosten winken.',
    weight: 7,
    choices: [
      { id: 'host', label: 'Turnier ausrichten (−120 Gold)', effect: { gold: -120, fame: 8, influence: 5, satisfactionDelta: 12, chronicleTitle: 'Turnier', chronicleText: 'Banner wehten, Lanzen brachen – der Hof feierte.' } },
      { id: 'refuse', label: 'Ablehnen', effect: { satisfactionDelta: -5, fame: -2 } },
    ],
  },
  {
    id: 'great_market',
    title: 'Großer Markt',
    description: 'Händler aus fremden Ländern bieten Waren und Gerüchte an.',
    weight: 9,
    choices: [
      { id: 'open', label: 'Markt öffnen', effect: { gold: 50, food: 20, wood: 10, prosperityDelta: 4, satisfactionDelta: 5 } },
      { id: 'tax_heavy', label: 'Zölle erhöhen', effect: { gold: 90, satisfactionDelta: -8, prosperityDelta: -2 } },
    ],
  },
  {
    id: 'witch_trial',
    title: 'Hexenprozess',
    description: 'Das Volk verlangt ein Urteil. Die Kirche beobachtet genau.',
    weight: 4,
    choices: [
      { id: 'acquit', label: 'Freispruch', effect: { influence: -3, satisfactionDelta: -10, fame: 2 } },
      { id: 'convict', label: 'Verurteilen', effect: { influence: 4, satisfactionDelta: 5, fame: -3 } },
      { id: 'investigate', label: 'Untersuchen (−30 Gold)', effect: { gold: -30, influence: 2, satisfactionDelta: 3 } },
    ],
  },
  {
    id: 'revolt',
    title: 'Aufstand',
    description: 'Unzufriedene erheben sich gegen hohe Lasten.',
    weight: 5,
    needsProvince: true,
    choices: [
      { id: 'crush', label: 'Niederschlagen', effect: { populationDelta: -80, satisfactionDelta: -12, fame: -2, chronicleTitle: 'Aufstand niedergeschlagen', chronicleText: 'Blut floss auf den Straßen.' } },
      { id: 'negotiate', label: 'Verhandeln (−60 Gold)', effect: { gold: -60, satisfactionDelta: 10 } },
      { id: 'reform', label: 'Steuern senken', effect: { gold: -40, satisfactionDelta: 18, prosperityDelta: 2 } },
    ],
  },
  {
    id: 'earthquake',
    title: 'Erdbeben',
    description: 'Der Boden bebt. Mauern reißen, Brunnen versiegen.',
    weight: 3,
    needsProvince: true,
    choices: [
      { id: 'repair', label: 'Mauern reparieren (−80 Stein, −50 Gold)', effect: { gold: -50, stone: -80, satisfactionDelta: 5 } },
      { id: 'pray', label: 'Beten und abwarten', effect: { populationDelta: -60, satisfactionDelta: -8 } },
    ],
  },
  {
    id: 'flood',
    title: 'Überschwemmung',
    description: 'Flüsse treten über die Ufer und verschlingen Felder.',
    weight: 4,
    needsProvince: true,
    choices: [
      { id: 'dikes', label: 'Deiche bauen (−70 Gold, −30 Holz)', effect: { gold: -70, wood: -30, food: 20 } },
      { id: 'relocate', label: 'Bauern umsiedeln', effect: { populationDelta: -50, food: -30, satisfactionDelta: -5 } },
    ],
  },
  {
    id: 'drought',
    title: 'Dürre',
    description: 'Die Sonne brennt, Brunnen trocknen aus.',
    weight: 5,
    needsProvince: true,
    choices: [
      { id: 'wells', label: 'Neue Brunnen (−40 Stein)', effect: { stone: -40, gold: -20, satisfactionDelta: 6 } },
      { id: 'import', label: 'Nahrung kaufen (−90 Gold)', effect: { gold: -90, food: 80 } },
    ],
  },
  {
    id: 'cold_winter',
    title: 'Kältewinter',
    description: 'Ein harter Winter fordert Brennstoff und Mut.',
    weight: 6,
    choices: [
      { id: 'firewood', label: 'Holz verteilen (−50 Holz)', effect: { wood: -50, satisfactionDelta: 8, food: -10 } },
      { id: 'endure', label: 'Durchhalten', effect: { populationDelta: -40, satisfactionDelta: -10, food: -25 } },
    ],
  },
  {
    id: 'gold_find',
    title: 'Goldfund',
    description: 'Bergleute melden eine ergiebige Ader.',
    weight: 4,
    needsProvince: true,
    choices: [
      { id: 'mine', label: 'Sofort abbauen', effect: { gold: 120, iron: 20, fame: 2, chronicleTitle: 'Goldfund', chronicleText: 'Reichtum strömte in die Schatzkammer.' } },
      { id: 'careful', label: 'Sorgsam erschließen (−30 Gold)', effect: { gold: 40, iron: 40, prosperityDelta: 5 } },
    ],
  },
  {
    id: 'relic',
    title: 'Heilige Reliquie',
    description: 'Pilger bringen eine Reliquie. Die Kirche will einen Schrein.',
    weight: 3,
    choices: [
      { id: 'shrine', label: 'Schrein errichten (−100 Gold, −60 Stein)', effect: { gold: -100, stone: -60, influence: 10, fame: 5, satisfactionDelta: 10, chronicleTitle: 'Reliquie', chronicleText: 'Ein Schrein zog Gläubige aus allen Ländern an.' } },
      { id: 'sell', label: 'An Händler verkaufen', effect: { gold: 80, influence: -8, fame: -3 } },
    ],
  },
  {
    id: 'pilgrimage',
    title: 'Pilgerreise',
    description: 'Eine große Prozession zieht durchs Land.',
    weight: 5,
    choices: [
      { id: 'host', label: 'Beherbergen (−40 Nahrung)', effect: { food: -40, influence: 6, gold: 25, satisfactionDelta: 5 } },
      { id: 'toll', label: 'Wegezoll', effect: { gold: 55, influence: -4 } },
    ],
  },
  {
    id: 'pirates',
    title: 'Piraten',
    description: 'Küstenräuber bedrohen Schiffe und Häfen.',
    weight: 5,
    choices: [
      { id: 'fleet', label: 'Flotte aussenden (−90 Gold)', effect: { gold: -90, fame: 4, prosperityDelta: 4 } },
      { id: 'bribe', label: 'Bestechen', effect: { gold: -60 } },
      { id: 'ignore', label: 'Ignorieren', effect: { gold: -35, food: -20, prosperityDelta: -6 } },
    ],
  },
  {
    id: 'hero_appears',
    title: 'Held erscheint',
    description: 'Ein berühmter Fremder bietet dem Hof seine Dienste an.',
    weight: 3,
    choices: [
      { id: 'hire_general', label: 'Als General aufnehmen (−50 Gold)', effect: { gold: -50, fame: 3, chronicleTitle: 'Held am Hof', chronicleText: 'Ein legendärer Feldherr schwor dem Herrscher Treue.' } },
      { id: 'hire_builder', label: 'Als Baumeister (−40 Gold)', effect: { gold: -40, stone: 30, wood: 20, prosperityDelta: 5 } },
      { id: 'refuse', label: 'Ablehnen', effect: { fame: -1 } },
    ],
  },
  {
    id: 'good_harvest',
    title: 'Segensreiche Ernte',
    description: 'Die Scheunen platzen. Das Volk feiert.',
    weight: 8,
    needsProvince: true,
    choices: [
      { id: 'feast', label: 'Fest geben (−30 Gold)', effect: { gold: -30, food: 80, satisfactionDelta: 12, fame: 2 } },
      { id: 'store', label: 'Einlagern', effect: { food: 100, prosperityDelta: 3 } },
      { id: 'export', label: 'Verkaufen', effect: { gold: 70, food: 20 } },
    ],
  },
];

export function rollWorldEvent(
  ownedProvinceIds: string[],
  tick: number,
): PendingWorldEvent | null {
  // ~18% chance per tick
  if (Math.random() > 0.18) return null;
  const total = EVENT_TEMPLATES.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  let picked = EVENT_TEMPLATES[0];
  for (const t of EVENT_TEMPLATES) {
    r -= t.weight;
    if (r <= 0) {
      picked = t;
      break;
    }
  }
  let provinceId: string | undefined;
  if (picked.needsProvince && ownedProvinceIds.length > 0) {
    provinceId = ownedProvinceIds[Math.floor(Math.random() * ownedProvinceIds.length)];
  }
  return {
    id: cryptoRandomId(),
    templateId: picked.id,
    title: picked.title,
    description: provinceId
      ? `${picked.description} (Provinz betroffen)`
      : picked.description,
    choices: picked.choices.map((c) => ({ id: c.id, label: c.label })),
    provinceId,
    createdTick: tick,
  };
}

export function resolveEventChoice(
  templateId: string,
  choiceId: string,
): EventChoiceEffect | null {
  const t = EVENT_TEMPLATES.find((e) => e.id === templateId);
  const c = t?.choices.find((x) => x.id === choiceId);
  return c?.effect ?? null;
}
