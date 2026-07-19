# Kronenchronik

Browserbasiertes Mittelalter-Strategiespiel. Baue dein Königreich aus, führe Dynastien, betreibe Diplomatie und erobere die Welt.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new?repo=Thcjk/Kronenchronik)

**Startseite:** https://thcjk.github.io/Kronenchronik/ (dort auf „Jetzt spielen“ tippen)

## Spiel starten (über GitHub – empfohlen)

> **Wichtig:** Der GitHub-Link (`thcjk.github.io`) ist nur die **Startseite**.
> Das Spiel selbst startest du über **GitHub Codespaces** – ein Klick, dann 2–3 Min. warten.

**Schnellstart:** [Jetzt spielen (Codespace erstellen)](https://github.com/codespaces/new?repo=Thcjk/Kronenchronik)

Du brauchst **keinen lokalen PC-Setup**. Alles läuft im Browser über GitHub Codespaces:

1. Öffne das Repository auf GitHub
2. Klicke oben auf den grünen Button **„Code“**
3. Wähle den Tab **„Codespaces“**
4. Klicke **„Create codespace on main“**
5. Warte ca. 2–3 Minuten (Setup läuft automatisch)
6. Der Browser öffnet automatisch das Spiel unter Port **5173**
   - Falls nicht: unten in der Leiste auf **„Ports“** klicken → bei Port **5173** auf das Globus-Symbol klicken

Das war's – registriere dich und spiele!

> **Hinweis:** Codespaces ist kostenlos mit monatlichem Kontingent (ca. 60 Std./Monat im Free-Tier). Danach pausiert der Codespace automatisch.

## Roadmap

| Phase | Was | Wann |
|-------|-----|------|
| **1 – Jetzt** | Spielen über GitHub Codespaces | ✅ aktiv |
| **2** | Feste Web-URL (Vercel + Railway o.ä.) | Wenn MVP stabil ist |
| **3** | PWA – „Zum Startbildschirm hinzufügen“ auf dem Handy | Mit Phase 2 |
| **4** | Native App (App Store / Play Store via Capacitor) | Wenn das Spiel fertig ist |

Details: [docs/roadmap.md](docs/roadmap.md)

## Lokal starten (optional)


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

## Tech-Stack

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
