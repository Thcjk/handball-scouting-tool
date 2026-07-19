# Kronenchronik

Browserbasiertes Mittelalter-Strategiespiel. Baue dein Königreich aus, führe Dynastien, betreibe Diplomatie und erobere die Welt.

## Tech-Stack

| Bereich   | Technologie                                     |
| --------- | ----------------------------------------------- |
| Frontend  | React, TypeScript, Vite, TailwindCSS, Socket.IO |
| Backend   | Node.js, NestJS, JWT, WebSockets                |
| Datenbank | PostgreSQL, Prisma                              |
| Monorepo  | npm workspaces                                  |

## Projektstruktur

```
client/          React-Frontend mit Echtzeit-Updates
server/          NestJS-Backend (REST + WebSockets)
shared/          Gemeinsame Spiellogik
database/        Prisma-Schema
docs/            Dokumentation
.github/         CI/CD
```

## Schnellstart

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001/api
- WebSocket: ws://localhost:3001/game

## Features

### Kern (MVP)

- Registrierung, Login, Profil
- Weltkarte mit 17 Provinzen
- Ressourcen, Gebäude, Rekrutierung, Armeen, Schlachten

### Erweitert

- **Dynastien:** Herrscher, Erben, Thronfolge bei Tod (Alter/Schlacht)
- **Diplomatie:** Krieg erklären, Frieden, Bündnisse, Handelsabkommen
- **Ressourcen-Ticks:** Einkommen alle 30s für aktive Spieler (Gebäude, Unterhalt)
- **WebSockets:** Echtzeit-Updates für Ressourcen, Schlachten, Diplomatie
- **Städte:** Gründen, ausbauen, Stadtgebäude (Markt, Rathaus, Tempel …)

## API

| Modul     | Endpunkte                                                                                   |
| --------- | ------------------------------------------------------------------------------------------- |
| Auth      | `/api/auth/register`, `/login`, `/me`                                                       |
| Game      | `/api/game/state`, `/build`, `/recruit`, `/army`, `/attack`, `/city/found`, `/city/upgrade` |
| Dynasty   | `/api/dynasty`                                                                              |
| Diplomacy | `/api/diplomacy`, `/war`, `/peace`, `/alliance`, `/trade`                                   |

## WebSocket-Events

| Event             | Beschreibung              |
| ----------------- | ------------------------- |
| `gameStateUpdate` | Aktualisierter Spielstand |
| `resourceTick`    | Ressourcen-Einkommen      |
| `battleResult`    | Schlachtergebnis          |
| `succession`      | Thronfolge                |
| `diplomacyEvent`  | Kriegserklärung etc.      |

## Lizenz

MIT
