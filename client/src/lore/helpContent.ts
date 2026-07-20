/** Hilfe, Tutorial, Glossar, Tipps, Tastenkürzel – Phase 5.3 */

export const TUTORIAL_STEPS = [
  {
    id: 'map',
    title: 'Die Karte',
    text: 'Zoome und ziehe die Weltkarte. Klicke eine Provinz, um sie zu verwalten. Weit heraus siehst du Reiche, nah siehst du Leben und Details.',
  },
  {
    id: 'build',
    title: 'Bauen',
    text: 'In der Stadtansicht platzierst du Straßen und Gebäude. Produktionsketten brauchen Rohstoffe und Zufriedenheit.',
  },
  {
    id: 'court',
    title: 'Hof & Dynastie',
    text: 'Unter Hof heiratest du, erziehst Kinder und besetzt den Rat. Titel steigen mit Provinzen und Ruhm.',
  },
  {
    id: 'realm',
    title: 'Reich',
    text: 'Gesetze, Vasallen, Forschung, Wunder und Flotten findest du unter Reich.',
  },
  {
    id: 'society',
    title: 'Welt',
    text: 'Adel, Fraktionen, Spione, Quests, Markt und Klima leben unter Welt.',
  },
  {
    id: 'endgame',
    title: 'Endgame',
    text: 'Große Reiche ziehen Krisen und Invasionen an. Es gibt kein endgültiges „Gewonnen“ – nur neue Herausforderungen.',
  },
];

export const GAME_TIPS = [
  'Niedrige Steuern halten Vasallen und Bauern ruhig.',
  'Küsten brauchen Flotten gegen Piraten und Invasionen.',
  'Forsche Schifffahrt, bevor du Kriegsschiffe baust.',
  'Fraktionen kannst du unter Welt mit Gold besänftigen.',
  'Pause die Zeit, wenn du in Ruhe bauen willst.',
  'Schnellspeichern schützt vor Fehlern – nutze Codex → Speicher.',
  'Wunder sind einzigartig und brauchen Technologien.',
  'Helden und Söldner helfen in Krisen, kosten aber Sold.',
];

export const GLOSSARY: Array<{ term: string; definition: string }> = [
  { term: 'Vasall', definition: 'Adliger, dem du Provinzen überträgst. Er handelt autonom und zahlt Tribut.' },
  { term: 'Casus Belli', definition: 'Kriegsgrund – ohne ihn riskierst du diplomatische Strafen.' },
  { term: 'Tick', definition: 'Ein Simulationsschritt (Jahresbruchteil). Ressourcen, KI und Ereignisse laufen darüber.' },
  { term: 'Fraktion', definition: 'Politische Gruppe im Reich (Adel, Klerus, Händler, …) mit eigener Loyalität.' },
  { term: 'Weltwunder', definition: 'Einzigartiges Großbauwerk mit starken Boni und langer Bauzeit.' },
  { term: 'Invasion', definition: 'Seltene Weltkrise: fremde Mächte landen an Küsten.' },
  { term: 'Erbfolgegesetz', definition: 'Regelt, wer nach dem Tod des Herrschers folgt – beeinflusst Bürgerkriegsrisiko.' },
  { term: 'Prestige', definition: 'Persönlicher Ruhm des Herrschers und der Dynastie.' },
];

export const SHORTCUTS: Array<{ keys: string; action: string }> = [
  { keys: 'Karte ziehen', action: 'Maus / Finger ziehen' },
  { keys: 'Zoom', action: 'Mausrad / Pinch' },
  { keys: 'Provinz', action: 'Tippen / Klicken' },
  { keys: 'Pause', action: 'Codex → Geschwindigkeit Pause' },
  { keys: 'Speichern', action: 'Codex → Speicherstände' },
];

export function nextTip(index: number): { tip: string; nextIndex: number } {
  const nextIndex = (index + 1) % GAME_TIPS.length;
  return { tip: GAME_TIPS[index % GAME_TIPS.length], nextIndex };
}
