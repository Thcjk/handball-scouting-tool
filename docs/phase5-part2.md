# Phase 5 – Das große Königreich (Teil 2)

Schwerpunkt: lebendige Gesellschaft, Quests, Weltwirtschaft, Klima & Atmosphäre.

## Umgesetzt

### Adel & Fraktionen
- Adelsfamilien mit Wappen, Motto, Reichtum, Prestige, Zielen, Allianzen/Rivalen
- Politische Fraktionen (Hochadel, Klerus, Händler, Ritter, Bauern, Militär)
- Fraktionen können protestieren; Besänftigung möglich

### Spionage & Attentate
- Erfahrene Spione mit Missionen (Intel, Stadt, Armee, Burg, Diebstahl, Brand, Bestechung, …)
- Mehr-Tick-Operationen mit Risiko und Erfahrungsgewinn
- Attentate (Gift, Dolch, Bogen, Brand, Söldner, Bestechung) und Herrscherschutz

### Hof & Quests
- Erweiterte Hofbesucher (Gelehrte, Handwerker, Abenteurer)
- Dynamische Quests (Dorfhilfe, Geleitschutz, Turnier, Nahrung, Kirche, Banditen, …)
- Belohnungen: Gold, Ruhm, Prestige, Einfluss

### Turniere, Söldner, Helden
- Disziplinen: Lanzenstechen, Bogen, Schwert, Reiten
- Anheuerbare Söldnerkompanien (Sold, Desertionsrisiko)
- Helden mit einzigartigen Boni (Feldherr, Baumeister, Händler, Arzt, Schmied, Ritter)

### Weltwirtschaft
- Dynamische Marktpreise (Krieg, Hungersnot, Piraten, Ernte)
- Kauf/Verkauf am Markt
- Jahrmärkte, Handelsmessen, Feste in Städten

### Klima & Katastrophen
- Jahreszeiten & Wetter mit Ertrags-/Bewegungsmodifikatoren
- Naturkatastrophen und Seuchen
- Banditen in unsicheren Regionen

### Atmosphäre
- Wildtiere und lebendigere Städte auf der Karte
- Saison-/Wetter-Tönung der Weltkarte
- Prozedurale Stimmungsmusik (Web Audio) je Region/Lage
- Nav: **Welt**

## Dateien

- `shared/src/nobility.ts`, `factions.ts`, `espionage.ts`, `quests.ts`
- `shared/src/tournaments.ts`, `mercenaries.ts`, `worldEconomy.ts`
- `shared/src/climate.ts`, `banditsWildlife.ts`
- `client/src/local/societySim.ts`
- `client/src/components/SocietyView.tsx`, `AtmosphereAudio.tsx`
- `client/src/pages/SocietyPage.tsx`

## Hinweis

Teil 2 von 3 der Phase 5. Teil 3 folgt separat. Nicht mergen, bis Phase 5 komplett ist.
