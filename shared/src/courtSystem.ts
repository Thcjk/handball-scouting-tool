/** Hof: Berater, Besucher, Vorschläge */

import { cryptoRandomId } from './worldState';
import type { CharacterProfile, CouncilRole, CouncilSlot, CourtVisitor } from './dynastyTypes';

export const COUNCIL_ROLES: Array<{ role: CouncilRole; label: string; skill: keyof CharacterProfile }> = [
  { role: 'chancellor', label: 'Kanzler', skill: 'diplomacy' },
  { role: 'marshal', label: 'Marschall', skill: 'martial' },
  { role: 'steward', label: 'Schatzmeister', skill: 'stewardship' },
  { role: 'spymaster', label: 'Spionmeister', skill: 'intrigue' },
  { role: 'chaplain', label: 'Hofkaplan', skill: 'learning' },
  { role: 'builder', label: 'Baumeister', skill: 'stewardship' },
];

export function emptyCouncil(): CouncilSlot[] {
  return COUNCIL_ROLES.map((r) => ({ role: r.role, characterId: null, label: r.label }));
}

export function councilAdvice(role: CouncilRole, loyalty: number): string {
  const loyal = loyalty >= 50;
  switch (role) {
    case 'chancellor':
      return loyal
        ? 'Ein Handelsvertrag mit dem Nachbarn würde uns stärken.'
        : 'Die Diplomatie ist vernachlässigt – oder absichtlich?';
    case 'marshal':
      return loyal
        ? 'Die Grenzburgen brauchen Verstärkung.'
        : 'Die Truppen murren über den Sold.';
    case 'steward':
      return loyal
        ? 'Die Märkte blühen – eine Steuersenkung würde das Volk erfreuen.'
        : 'Die Kassen sind dünn. Mehr Abgaben!';
    case 'spymaster':
      return loyal
        ? 'Gerüchte über Unruhe bei einem Vasallen.'
        : 'Ich höre … nichts. Oder sage nichts.';
    case 'chaplain':
      return loyal
        ? 'Eine Kapelle würde die Gläubigen beruhigen.'
        : 'Der Glaube wankt am Hof.';
    case 'builder':
      return loyal
        ? 'Ein Wunderbau würde unseren Ruhm mehren.'
        : 'Die Baustellen stocken ohne Gold.';
  }
}

const VISITOR_KINDS: CourtVisitor['kind'][] = [
  'ambassador',
  'merchant',
  'knight',
  'bard',
  'pilgrim',
  'artist',
  'scholar',
  'craftsman',
  'adventurer',
];

const VISITOR_TEXT: Record<CourtVisitor['kind'], string[]> = {
  ambassador: ['Ein Botschafter aus dem Osten wartet auf Audienz.', 'Ein Gesandter bringt Briefe und Drohungen.'],
  merchant: ['Ein reicher Händler bietet seltene Waren an.', 'Karawanenführer suchen Schutz und Zölle.'],
  knight: ['Ein fahrender Ritter sucht Dienst und Ruhm.', 'Ein Turnierkämpfer will sich beweisen.'],
  bard: ['Ein Barde will eure Taten besingen.', 'Spielleute bitten um ein Fest.'],
  pilgrim: ['Pilger bitten um Obdach und Segen.', 'Eine Prozession zieht durchs Land.'],
  artist: ['Ein Bildhauer will eine Statue errichten.', 'Ein Maler sucht einen Auftrag für den Saal.'],
  scholar: ['Ein Gelehrter bringt alte Schriften.', 'Ein Chronist will eure Geschichte aufzeichnen.'],
  craftsman: ['Ein Meisterhandwerker sucht einen Auftrag.', 'Ein Zimmermann bietet seine Dienste an.'],
  adventurer: ['Ein Abenteurer erzählt von fernen Ländernen.', 'Ein Entdecker bringt seltsame Karten.'],
};

const NAMES = [
  'Aldric',
  'Brunhild',
  'Cedric',
  'Dietrich',
  'Elsa',
  'Farald',
  'Greta',
  'Helmut',
  'Isolde',
  'Joris',
  'Karla',
  'Lukas',
];

export function rollCourtVisitor(tick: number): CourtVisitor | null {
  if (Math.random() > 0.28) return null;
  const kind = VISITOR_KINDS[Math.floor(Math.random() * VISITOR_KINDS.length)];
  const texts = VISITOR_TEXT[kind];
  return {
    id: cryptoRandomId(),
    name: NAMES[Math.floor(Math.random() * NAMES.length)],
    kind,
    description: texts[Math.floor(Math.random() * texts.length)],
    arrivedTick: tick,
    expiresTick: tick + 8 + Math.floor(Math.random() * 6),
    offersQuest: Math.random() < 0.35,
  };
}

export function visitorKindLabel(kind: CourtVisitor['kind']): string {
  const map: Record<CourtVisitor['kind'], string> = {
    ambassador: 'Botschafter',
    merchant: 'Händler',
    knight: 'Ritter',
    bard: 'Barde',
    pilgrim: 'Pilger',
    artist: 'Künstler',
    scholar: 'Gelehrter',
    craftsman: 'Handwerker',
    adventurer: 'Abenteurer',
  };
  return map[kind];
}
