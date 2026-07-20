# Phase 5 – Das große Königreich (Teil 3)

Schwerpunkt: Endgame, Weltgeschichte, Codex, Geschwindigkeit, Speicher, Polishing.

## Umgesetzt

### Endgame
- Ständige Herausforderungen für große Reiche (Bürgerkrieg, Wirtschaftskrise, Glaubenskonflikt, Hungersnot, Seuche, Dynastiefehde)
- **Große Invasionen** (Überseemacht, Nomaden, Heilige Armee, Piratenkönigreich, unbekanntes Reich)
- Invasion abwehren über Codex

### Weltgeschichte
- Rekorde jeder Partie (reichster Herrscher, größte Hauptstadt, längster Krieg, …)
- Meilensteine in der Chronik der Partie

### Karte & Animation
- LOD: far / mid / near / **ultra** (maximale Details: Häuser, Brunnen, Banner, Feuer)
- Dezentere Bewegung: Fahnen, Rauch, Bäume (Sway), Ambient-Akteure

### Codex (UI)
- Nav: **Codex**
- Tabs: Statistik (Diagramme), Weltgeschichte, Erfolge, Krisen, Hilfe (Tutorial/Glossar/Tipps), Speicher
- Einheitliche Pergament-Panels, Tabs, Hover

### Spielgeschwindigkeit
- Pause / Normal / Schnell / Sehr schnell (HUD + Codex)
- Tick-Intervalle passen sich an

### Speichersystem
- Mehrere benannte Slots
- Autosave (Backup)
- Schnell speichern / laden
- Beschädigte Saves → Backup-Fallback

### Erfolge
- 17 Achievements (Burg, Königreich, Gold, Wunder, Invasion, …)

### Architektur & Docs
- Modulare Sims: `endgameSim`, `saveManager`, shared Endgame/History/Achievements/Settings
- `docs/architecture.md` um Offline-Module und Zukunft (Multiplayer, Mods, i18n) ergänzt
- Mobile: größere Touch-Ziele

## Dateien

- `shared/src/endgame.ts`, `worldHistory.ts`, `achievements.ts`, `gameSettings.ts`
- `client/src/local/endgameSim.ts`, `saveManager.ts`
- `client/src/lore/helpContent.ts`
- `client/src/components/CodexView.tsx`, `pages/CodexPage.tsx`

## Hinweis

Phase 5 (Teile 1–3) ist damit abgeschlossen. Merge nach Freigabe möglich.
