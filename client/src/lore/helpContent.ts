/** Hilfe, Tutorial, Glossar, Tipps – einsteigerfreundlich */

export type TutorialStepId =
  | 'welcome'
  | 'map'
  | 'province'
  | 'city'
  | 'resources'
  | 'speed'
  | 'court'
  | 'realm'
  | 'world'
  | 'codex'
  | 'goals';

export type TutorialStep = {
  id: TutorialStepId;
  title: string;
  body: string;
  /** Kurzer Handlungsaufruf */
  doNext: string;
  /** Optionaler UI-Hinweis */
  highlight?: 'map' | 'resources' | 'speed' | 'nav';
};

/** Interaktives Start-Tutorial (nach der Intro-Geschichte) */
export const START_TUTORIAL: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Willkommen, Herrscher',
    body:
      'Dies ist dein Tutorial. In wenigen Schritten lernst du, wie Kronenchronik funktioniert. Du kannst es später unter Codex → Hilfe erneut starten.',
    doNext: 'Tippe „Weiter“, um die Grundlagen zu lernen.',
    highlight: 'nav',
  },
  {
    id: 'map',
    title: 'Die Weltkarte',
    body:
      'Die große Karte ist dein Reich. Ziehe mit der Maus oder dem Finger, um dich zu bewegen. Zoome mit dem Mausrad oder Pinch – von Kontinenten bis zu einzelnen Häusern.',
    doNext: 'Merke: Karte ziehen = umsehen, Zoom = Details.',
    highlight: 'map',
  },
  {
    id: 'province',
    title: 'Provinzen wählen',
    body:
      'Tippe auf eine Provinz (am besten deine Hauptstadt). Rechts öffnet sich das Provinzmenü: Truppen, Steuern, Stadt öffnen.',
    doNext: 'Nach dem Tutorial: eigene Provinz antippen.',
    highlight: 'map',
  },
  {
    id: 'city',
    title: 'Stadt bauen',
    body:
      'In der Stadtansicht legst du Straßen und Gebäude. Starte mit Feldern und Häusern, dann Werkstätten. Straßen verbinden Gebäude – ohne Straße kein gutes Wachstum.',
    doNext: 'Erste Schritte: Straße → Haus → Feld.',
    highlight: 'map',
  },
  {
    id: 'resources',
    title: 'Ressourcen',
    body:
      'Oben siehst du Gold, Nahrung, Holz, Stein und Eisen. Sie wachsen mit jedem Tick. Ohne Nahrung hungert das Volk – ohne Gold stockt das Heer.',
    doNext: 'Halte Nahrung und Gold im Blick.',
    highlight: 'resources',
  },
  {
    id: 'speed',
    title: 'Zeit steuern',
    body:
      'Mit ⏸ ▶ ⏩ ⏭ steuerst du die Spielgeschwindigkeit. Als Anfänger: Pause nutzen, wenn du in Ruhe baust – dann Normal weiterlaufen lassen.',
    doNext: 'Pause = nachdenken, Normal = Welt lebt.',
    highlight: 'speed',
  },
  {
    id: 'court',
    title: 'Hof & Familie',
    body:
      'Unter „Hof“ findest du Ehe, Kinder, Berater und Turniere. Deine Dynastie ist das Herz des Spiels – ohne Erben endet die Chronik.',
    doNext: 'Später: am Hof heiraten und den Rat besetzen.',
    highlight: 'nav',
  },
  {
    id: 'realm',
    title: 'Reich verwalten',
    body:
      'Unter „Reich“ erlässt du Gesetze, setzt Vasallen ein, forschst und baust Flotten oder Wunder. Vasallen helfen bei großen Reichen – halten sie loyal.',
    doNext: 'Gesetze und Forschung stärken dich langfristig.',
    highlight: 'nav',
  },
  {
    id: 'world',
    title: 'Lebende Welt',
    body:
      'Unter „Welt“ warten Adel, Fraktionen, Spione, Quests und der Markt. Quests erscheinen auch als Dialoge auf der Karte – belohnen Gold und Ruhm.',
    doNext: 'Quests annehmen, wenn du Gold übrig hast.',
    highlight: 'nav',
  },
  {
    id: 'codex',
    title: 'Codex & Hilfe',
    body:
      'Im Codex findest du Statistik, Erfolge, Krisen, Glossar und Speicherstände. Wenn du etwas nicht verstehst: Codex → Hilfe.',
    doNext: 'Hilfe und Speichern findest du immer im Codex.',
    highlight: 'nav',
  },
  {
    id: 'goals',
    title: 'Dein erstes Ziel',
    body:
      'Baue deine Hauptstadt aus, halte Nahrung stabil und erweitere eine Nachbarprovinz, wenn du stark genug bist. Die Welt lebt weiter – KI, Quests und Krisen warten.',
    doNext: 'Viel Glück – die Chronik schreibt sich mit dir.',
    highlight: 'map',
  },
];

/** Kurze Schritte für Codex-Hilfe (Übersicht) */
export const TUTORIAL_STEPS = START_TUTORIAL.map((s) => ({
  id: s.id,
  title: s.title,
  text: s.body,
}));

export const GAME_TIPS = [
  'Niedrige Steuern halten Vasallen und Bauern ruhig.',
  'Küsten brauchen Flotten gegen Piraten und Invasionen.',
  'Forsche Schifffahrt, bevor du Kriegsschiffe baust.',
  'Fraktionen kannst du unter Welt mit Gold besänftigen.',
  'Pause die Zeit, wenn du in Ruhe bauen willst.',
  'Schnellspeichern schützt vor Fehlern – nutze Codex → Speicher.',
  'Wunder sind einzigartig und brauchen Technologien.',
  'Helden und Söldner helfen in Krisen, kosten aber Sold.',
  'Zoome nah an die Karte – dort siehst du Bauern, Tiere und Rauch.',
  'Eine Straße neben jedem Gebäude hält die Stadt produktiv.',
  'Heirat am Hof bringt Prestige und oft einen Erben.',
  'Diplomatie: Handel zuerst, Krieg nur mit gutem Grund.',
];

export type ContextualTip = {
  id: string;
  title: string;
  text: string;
  /** Priorität: höher = wichtiger */
  priority: number;
};

export type TipContext = {
  tick: number;
  gold: number;
  food: number;
  ownedCount: number;
  hasCityBuildings: boolean;
  taxHigh: boolean;
  atWar: boolean;
  pendingEvent: boolean;
  hasQuest: boolean;
  crisisActive: boolean;
  invasionActive: boolean;
  tutorialDone: boolean;
};

/** Kontext-Tipps während des Spiels (einsteigerfreundlich) */
export function pickContextualTips(ctx: TipContext): ContextualTip[] {
  const tips: ContextualTip[] = [];

  if (!ctx.tutorialDone) return tips;

  if (ctx.tick < 3) {
    tips.push({
      id: 'early_build',
      title: 'Erste Schritte',
      text: 'Öffne deine Hauptstadt und baue Straße, Haus und Feld. So wächst Bevölkerung und Nahrung.',
      priority: 90,
    });
  }
  if (ctx.tick >= 3 && ctx.tick < 8 && !ctx.hasCityBuildings) {
    tips.push({
      id: 'open_city',
      title: 'Stadt ausbauen',
      text: 'Tippe deine Provinz an → „Stadt öffnen“. Ohne Gebäude bleibt das Reich schwach.',
      priority: 85,
    });
  }
  if (ctx.food < 80) {
    tips.push({
      id: 'low_food',
      title: 'Nahrung knapp',
      text: 'Baue Felder und Mühlen oder senke die Steuern. Hungersnöte schwächen Bevölkerung und Moral.',
      priority: 95,
    });
  }
  if (ctx.gold < 50 && ctx.tick > 5) {
    tips.push({
      id: 'low_gold',
      title: 'Gold wird knapp',
      text: 'Märkte, Handel und moderate Steuern füllen die Kasse. Vermeide teure Söldner ohne Not.',
      priority: 80,
    });
  }
  if (ctx.taxHigh) {
    tips.push({
      id: 'high_tax',
      title: 'Hohe Steuern',
      text: 'Sehr hohe Abgaben machen Vasallen und Bauern unzufrieden – Bürgerkriegsrisiko steigt.',
      priority: 70,
    });
  }
  if (ctx.pendingEvent) {
    tips.push({
      id: 'event',
      title: 'Entscheidung wartet',
      text: 'Ein Ereignis-Dialog ist offen. Lies die Optionen – jede Wahl hat Folgen.',
      priority: 88,
    });
  }
  if (ctx.hasQuest) {
    tips.push({
      id: 'quest',
      title: 'Quest verfügbar',
      text: 'Unter Welt oder als Dialog findest du Aufgaben. Sie bringen Gold, Ruhm und Prestige.',
      priority: 60,
    });
  }
  if (ctx.atWar) {
    tips.push({
      id: 'war',
      title: 'Im Krieg',
      text: 'Rekrutiere Truppen, sichere Grenzburgen und prüfe Belagerungen unter Diplomatie/Chronik.',
      priority: 75,
    });
  }
  if (ctx.invasionActive) {
    tips.push({
      id: 'invasion',
      title: 'Invasion!',
      text: 'Unter Codex → Krisen kannst du die Invasion abwehren. Sammle Truppen und Gold.',
      priority: 100,
    });
  }
  if (ctx.crisisActive && !ctx.invasionActive) {
    tips.push({
      id: 'crisis',
      title: 'Reichskrise',
      text: 'Eine Endgame-Krise läuft. Stabilisiere Nahrung, besänftige Fraktionen und halte Vasallen loyal.',
      priority: 92,
    });
  }
  if (ctx.ownedCount >= 1 && ctx.ownedCount < 3 && ctx.tick > 15) {
    tips.push({
      id: 'expand',
      title: 'Erweitern?',
      text: 'Neutrale Nachbarprovinzen kannst du besetzen, wenn deine Armee stark genug ist.',
      priority: 40,
    });
  }
  if (ctx.tick > 0 && ctx.tick % 12 === 0) {
    tips.push({
      id: `seasonal_${ctx.tick}`,
      title: 'Tipp',
      text: GAME_TIPS[ctx.tick % GAME_TIPS.length],
      priority: 30,
    });
  }

  return tips.sort((a, b) => b.priority - a.priority);
}

export const GLOSSARY: Array<{ term: string; definition: string }> = [
  { term: 'Vasall', definition: 'Adliger, dem du Provinzen überträgst. Er handelt autonom und zahlt Tribut.' },
  { term: 'Casus Belli', definition: 'Kriegsgrund – ohne ihn riskierst du diplomatische Strafen.' },
  { term: 'Tick', definition: 'Ein Simulationsschritt (Jahresbruchteil). Ressourcen, KI und Ereignisse laufen darüber.' },
  { term: 'Fraktion', definition: 'Politische Gruppe im Reich (Adel, Klerus, Händler, …) mit eigener Loyalität.' },
  { term: 'Weltwunder', definition: 'Einzigartiges Großbauwerk mit starken Boni und langer Bauzeit.' },
  { term: 'Invasion', definition: 'Seltene Weltkrise: fremde Mächte landen an Küsten.' },
  { term: 'Erbfolgegesetz', definition: 'Regelt, wer nach dem Tod des Herrschers folgt – beeinflusst Bürgerkriegsrisiko.' },
  { term: 'Prestige', definition: 'Persönlicher Ruhm des Herrschers und der Dynastie.' },
  { term: 'Hauptstadt', definition: 'Zentrum deines Reiches. Hier solltest du zuerst bauen und verteidigen.' },
  { term: 'Produktion', definition: 'Gebäudeketten in der Stadt erzeugen Rohstoffe und Waren für Gold und Wachstum.' },
];

export const SHORTCUTS: Array<{ keys: string; action: string }> = [
  { keys: 'Karte ziehen', action: 'Maus / Finger ziehen' },
  { keys: 'Zoom', action: 'Mausrad / Pinch' },
  { keys: 'Provinz', action: 'Tippen / Klicken' },
  { keys: 'Pause', action: 'Schaltflächen ⏸ oben oder Codex' },
  { keys: 'Speichern', action: 'Codex → Speicherstände' },
  { keys: 'Tutorial', action: 'Codex → Hilfe → Tutorial starten' },
];

export function nextTip(index: number): { tip: string; nextIndex: number } {
  const nextIndex = (index + 1) % GAME_TIPS.length;
  return { tip: GAME_TIPS[index % GAME_TIPS.length], nextIndex };
}

export const TUTORIAL_DONE_KEY = 'kronenchronik_tutorial_done';
export const TIP_DISMISS_KEY = 'kronenchronik_tips_dismissed';
export const TIP_COOLDOWN_KEY = 'kronenchronik_tip_cooldown';
