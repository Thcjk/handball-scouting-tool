# Architektur – Kronenchronik

## Übersicht

```
┌─────────────────┐
│  Client (React) │  Offline-First (GitHub Pages)
│  localApi + Sims│  Fortschritt in localStorage
└────────┬────────┘
         │ nutzt
┌────────▼────────┐
│  Shared Logic   │  Wirtschaft, KI, Dynastie, Reich, Gesellschaft, Endgame
└─────────────────┘

Optional (Online-Stack, nicht nötig zum Spielen):
┌─────────────┐  REST + WebSocket  ┌─────────────┐     Prisma     ┌────────────┐
│   Client    │ ◄────────────────► │   Server    │ ◄────────────► │ PostgreSQL │
└─────────────┘                    └─────────────┘                └────────────┘
```

## Offline-Module (client/src/local)

| Modul | Aufgabe |
|-------|---------|
| `localApi.ts` | Dünne API: Persistenz, Tick-Orchestrierung, Spieleraktionen |
| `worldSim.ts` | KI-Reiche, Kriege, Belagerungen, Welt-Ereignisse |
| `dynastySim.ts` | Familie, Hof, Titel, Immersion |
| `realmSim.ts` | Vasallen, Gesetze, Tech, Wunder, Flotten, Religion |
| `societySim.ts` | Adel, Fraktionen, Spione, Quests, Markt, Klima |
| `endgameSim.ts` | Krisen, Invasionen, Weltgeschichte, Erfolge, Stats |
| `saveManager.ts` | Multi-Slots, Autosave, Quicksave, Backup |

Shared-Pakete liefern reine Logik ohne DOM/Storage – austauschbar für Server/Multiplayer.

## Tick-Reihenfolge

1. Spielerwirtschaft (Produktion, Steuern, Handel)
2. `simulateWorldTick` (KI)
3. `runDynastyTick`
4. `runRealmTick`
5. `runSocietyTick`
6. `runEndgameTick`
7. Persistenz (+ Autosave)

Geschwindigkeit steuert Tick-Abstand (`pause` / `normal` / `fast` / `very_fast`).

## Modularität

Systeme **nutzen** einander über klaren State, hängen aber nicht zyklisch:

- Wirtschaft ↔ Handel ↔ Klima (Modifikatoren)
- Diplomatie / KI ↔ Kriege ↔ Invasionen
- Dynastie ↔ Erfolge / Weltgeschichte
- Städte / Karte = Darstellung, keine Spiellogik-Besitzer

Neue Inhalte: neues Shared-Modul + optional `*Sim.ts` + dünne `localApi`-Hooks + UI-Seite.

## Fehlerbehandlung & Saves

- `saveManager.readSaveBlob` fällt auf Backup zurück
- Tick/API fangen ungültige Zustände mit Defaults (`ensure*` / `migrate*`)
- Fehler in der UI als verständliche Meldungen

## Performance-Hinweise

- Karten-LOD (far→ultra): Details nur bei Zoom
- Ambient-Akteure begrenzt (~36)
- Chronik gekappt; Statistik-History max. 60 Punkte
- Lazy: Stadtansicht nur bei geöffneter Provinz

## Zukunftssicher

Vorbereitet / erweiterbar:

| Thema | Ansatz |
|-------|--------|
| Multiplayer / Dedicated Server | Shared-Logik bereits getrennt; `localApi` ↔ Server-Adapter |
| Cloud-Saves | `saveManager` API abstrahieren (gleiche Slot-Metadaten) |
| Mods / DLC | Daten-Tabellen in Shared (Tech, Quests, Achievements) |
| Steam / Desktop | Vite-Build + Offline-Modus |
| Lokalisierung | UI-Strings zentralisieren (Hilfe bereits in `helpContent.ts`) |

## Server-Module (optional Online)

| Modul | Aufgabe |
|-------|---------|
| `auth/` | JWT, Registrierung |
| `game/` | Spielzustand |
| `dynasty/` | Thronfolge |
| `diplomacy/` | Krieg, Frieden |
| `tick/` | Ressourcen-Ticks |

## Ressourcen-Ticks (Online)

Nur Spieler mit `lastSeen` < 2 Min erhalten Ticks (Server-Cron).
