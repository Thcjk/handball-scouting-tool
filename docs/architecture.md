# Architektur – Kronenchronik

## Übersicht

```
┌─────────────┐  REST + WebSocket  ┌─────────────┐     Prisma     ┌────────────┐
│   Client    │ ◄────────────────► │   Server    │ ◄────────────► │ PostgreSQL │
│  (React)    │     JWT Auth       │  (NestJS)   │                │            │
└─────────────┘                    └──────┬──────┘                └────────────┘
                                          │
                                   ┌──────▼──────┐
                                   │   Shared    │
                                   │ Spiellogik  │
                                   └─────────────┘
```

## Server-Module

| Modul | Aufgabe |
|-------|---------|
| `auth/` | JWT, Registrierung mit Königreich + Dynastie + Erbe |
| `users/` | Profilverwaltung |
| `game/` | Spielzustand, Bau, Rekrutierung, Schlachten, Städte |
| `dynasty/` | Thronfolge, Charakterverwaltung |
| `diplomacy/` | Krieg, Frieden, Bündnisse, Handel |
| `tick/` | Ressourcen-Ticks für aktive Spieler (30s Cron) |
| `game/game.gateway` | WebSocket-Events |

## WebSocket-Events

- `gameStateUpdate` – nach jeder Spielaktion
- `resourceTick` – alle 30s für aktive Spieler
- `battleResult` – nach Schlachten
- `succession` – bei Herrscher-Tod
- `diplomacyEvent` – Kriegserklärungen etc.

## Dynastie-System

- Jeder Spieler startet mit Herrscher + Erbe
- Herrscher altern (alle 10 Ticks) und können ab Alter 70 sterben
- 5% Todeschance in verlorenen Schlachten
- Erbe übernimmt automatisch das Reich

## Diplomatie

- Angriffe nur bei Kriegserklärung (neutrale Provinzen ausgenommen)
- Allianzen schützen vor Angriffen
- Handelsabkommen für Bonus-Einkommen (geplant)

## Ressourcen-Ticks

Nur Spieler mit `lastSeen` < 2 Min erhalten Ticks:
- Basiseinkommen + Gebäude-Boni pro Provinz
- Truppenunterhalt wird abgezogen
- Stadt-Level gibt Gold- und Einfluss-Bonus
