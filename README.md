# Kronenchronik

Browserbasiertes Mittelalter-Strategiespiel – direkt im Browser spielen, Fortschritt wird lokal gespeichert.

## Jetzt spielen

**https://thcjk.github.io/Kronenchronik/**

1. Link öffnen
2. Einmal registrieren (E-Mail, Passwort, Königreichsname)
3. Spielen – dein Fortschritt wird **automatisch im Browser gespeichert**
4. Beim nächsten Besuch einfach wieder einloggen und weiterspielen

> Kein Server, keine Installation, keine Kosten. Der Spielstand liegt nur auf deinem Gerät (localStorage). Browser-Daten löschen = Spielstand weg.

---

## Features

- Registrierung & Login (lokal im Browser)
- Weltkarte mit 17 Provinzen
- Burgen, Gebäude, Armeen, Schlachten
- Städte gründen und ausbauen
- Dynastien & Ressourcen-Ticks
- Automatisches Speichern nach jeder Aktion

---

## Entwicklung (optional)

```bash
npm install && cp .env.example .env
npm run db:generate && npm run db:push && npm run db:seed
npm run dev
```

Für den Online-Modus mit Server (NestJS + PostgreSQL) siehe [docs/EINRICHTUNG.md](docs/EINRICHTUNG.md).

GitHub Pages Build lokal testen:

```bash
npm run build:pages -w client
```

## Tech-Stack

| Bereich | Technologie |
|---------|-------------|
| Frontend | React, Vite, TailwindCSS |
| Spielstand (GitHub Pages) | localStorage im Browser |
| Backend (optional) | NestJS, PostgreSQL, WebSockets |

## Roadmap

Details: [docs/roadmap.md](docs/roadmap.md)

## Lizenz

MIT
