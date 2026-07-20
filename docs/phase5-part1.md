# Phase 5 – Das große Königreich (Teil 1)

Schwerpunkt: lebendige Welt, Vasallen, Gesetze, Forschung, Wunder, Seehandel, Religion.

## Umgesetzt

### Lebende Welt
- KI-Reiche können **zerfallen** (Schwäche/Überdehnung) oder **neu entstehen**
- Chronik-Einträge zu Aufstieg und Untergang
- Weltkarte um Süd-/Westprovinzen erweitert (Inseln, Küsten, Wildnis)
- Regionen mit eigener Kultur, Religion und Architektur (`WORLD_REGIONS`)

### Vasallen
- Grafen (und Ränge Markgraf–Königsvassal) mit Loyalität, Macht, Armee, Zielen
- Handeln autonom: Steuern, Bauen, Rekrutieren, Beschwerden, Rechte fordern
- UI: Ernennung unter **Reich**

### Bürgerkriege
- Risiko aus Steuern, Vasallentreue, Kriegen, Wirtschaft, Erbfolgegesetz
- Fraktionen kämpfen über mehrere Ticks; Ausgang schwächt oder stabilisiert

### Erbfolge & Gesetze
- Erstgeborenenrecht, Wahlmonarchie, Teilung, Ultimogenitur, Hauswahl
- Reichsgesetze: Steuern, Militärpflicht, Religionsfreiheit, Adels-/Bauernrechte, Handel, Leibeigenschaft, Wehrpflicht

### Forschung
- Technologiebaum (Militär, Wirtschaft, Architektur, Landwirtschaft, Handel, Schifffahrt, Bildung, Verwaltung, Religion)
- Budget pro Tick, Voraussetzungen, Freischaltungen

### Weltwunder
- Kathedrale, Kaiserpalast, Bibliothek, Hafen, Festung, Königsgarten
- Einzigartig, teuer, lange Bauzeit, starke Boni

### Seehandel & Flotten
- Seehandelsrouten zwischen Küsten
- Handelsschiffe, Kriegsschiffe, Transport (Tech-Voraussetzungen)
- Piraten bedrohen Routen; Flotten können jagen

### Religion & Orden
- Glaubenswert, Pilgerreisen, Reliquien
- Ritterorden der Krone / des Löwen / des Nordens (nach Tech „Heilige Orden“)

### UI
- Nav: **Reich**
- Übersicht Gesetze, Vasallen, Tech, Wunder, Glauben, Flotten

## Dateien

- `shared/src/realmVassals.ts`, `realmLaws.ts`, `techTree.ts`, `wonders.ts`
- `shared/src/naval.ts`, `religionSystem.ts`, `civilWar.ts`, `worldExpansion.ts`
- `client/src/local/realmSim.ts`
- `client/src/components/RealmView.tsx`, `pages/RealmPage.tsx`
- Hooks in `localApi.ts` / `worldSim.ts` (Realm-Dynamik)

## Hinweis

Teil 1 von 3 der Phase 5. Teil 2/3 folgen separat.
