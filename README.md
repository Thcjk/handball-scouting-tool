# Kronenchronik

Browserbasiertes Mittelalter-Strategiespiel – **nur online**, mit Server-Speicherung.

## Jetzt spielen

**https://kronenchronik.onrender.com**

1. Link öffnen → registrieren → einloggen
2. Dein Fortschritt wird **serverseitig in der Datenbank** gespeichert
3. Von jedem Gerät mit Login weiterspielen

> Beim ersten Aufruf nach Inaktivität kann der Server ~30 Sek. brauchen (Render Free Tier).

GitHub-Seite: **https://thcjk.github.io/Kronenchronik/** (leitet zum Spiel weiter)

---

## Features (MVP)

| Bereich | Status |
|---------|--------|
| Login & Registrierung (JWT) | ✅ |
| Interaktive Weltkarte (Zoom, Pan, Grenzen) | ✅ |
| 17 Provinzen mit Kultur & Religion | ✅ |
| Charaktere mit Eigenschaften & Fähigkeiten | ✅ |
| Dynastien & Thronfolge | ✅ |
| Burgen, Dörfer, Städte | ✅ |
| Gebäude & Wirtschaft | ✅ |
| Armeen, Rekrutierung, Marsch | ✅ |
| Schlachten & Eroberung | ✅ |
| Diplomatie (Krieg, Frieden, Bündnisse) | ✅ |
| KI-Gegner (4 Königreiche) | ✅ |
| Server-Speicherung (PostgreSQL) | ✅ |
| WebSockets (Live-Updates) | ✅ |

---

## Ersteinrichtung (einmalig, kostenlos)

👉 **[docs/EINRICHTUNG.md](docs/EINRICHTUNG.md)**

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Thcjk/Kronenchronik)

---

## Entwicklung

```bash
npm install && cp .env.example .env
npm run db:generate && npm run db:push && npm run db:seed
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Tech-Stack

| Bereich | Technologie |
|---------|-------------|
| Frontend | React, Vite, TailwindCSS |
| Backend | NestJS, JWT, WebSockets |
| Datenbank | PostgreSQL (Prisma) |
| Hosting | Render + Neon (kostenlos) |

## Vision & Roadmap

Details: [docs/vision.md](docs/vision.md) · [docs/roadmap.md](docs/roadmap.md)

## Lizenz

MIT
