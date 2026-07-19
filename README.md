# Kronenchronik

Browserbasiertes Mittelalter-Strategiespiel.

## Jetzt spielen (ein Link, kostenlos)

### Spiel-URL
**https://kronenchronik.onrender.com**

### GitHub-Link (leitet weiter)
**https://thcjk.github.io/Kronenchronik/**

Einfach Link öffnen → registrieren → spielen. Keine Installation, nichts lokal speichern.

> Beim ersten Aufruf nach Inaktivität kann der Server ~30 Sek. brauchen (Render Free Tier).

---

## Noch nicht online?

Falls der Link noch nicht funktioniert, muss das Spiel **einmalig** kostenlos in der Cloud eingerichtet werden (ca. 10 Min., nur für den Repository-Besitzer):

👉 **[Anleitung: docs/EINRICHTUNG.md](docs/EINRICHTUNG.md)**

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Thcjk/Kronenchronik)

---

## Entwicklung (optional, nur für Programmierer)

```bash
npm install && cp .env.example .env
npm run db:generate && npm run db:push && npm run db:seed
npm run dev
```

Oder GitHub Codespaces (nur für Entwicklung, nicht zum Spielen empfohlen).

## Tech-Stack

| Bereich | Technologie |
|---------|-------------|
| Frontend | React, Vite, TailwindCSS |
| Backend | NestJS, WebSockets |
| Datenbank | PostgreSQL (Neon) |
| Hosting | Render (kostenlos) |

## Features

- Registrierung, Login, Weltkarte (17 Provinzen)
- Dynastien, Diplomatie, Städte, Schlachten
- Ressourcen-Ticks, WebSockets
- Alles online – kein Offline-Spiel

## Roadmap

| Phase | Status |
|-------|--------|
| Cloud-Hosting (ein Link) | ✅ vorbereitet |
| PWA (Handy Homescreen) | 🔄 Grundlagen da |
| App Store / Play Store | Geplant |

Details: [docs/roadmap.md](docs/roadmap.md)

## Lizenz

MIT
