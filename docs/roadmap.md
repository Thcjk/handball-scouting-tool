# Roadmap – Kronenchronik

## Phasen-Übersicht

```
Phase 1 (jetzt)     Phase 2              Phase 3              Phase 4
───────────────     ─────────            ─────────            ─────────
GitHub Codespaces → Öffentliche URL  →  PWA / Web-App   →  App Store / Play Store
(Entwicklung)       (Beta-Spieler)       (Handy-Browser)      (Native App)
```

---

## Phase 1: GitHub Codespaces (aktuell)

**Ziel:** Entwickeln und testen, ohne lokale Installation.

- Spiel starten über GitHub → Code → Codespaces
- Voller Stack: React + NestJS + PostgreSQL in der Cloud
- Ideal für Entwicklung vom Smartphone-Browser (mit etwas Geduld beim Setup)

**Status:** ✅ eingerichtet

---

## Phase 2: Öffentliche Web-URL (wenn das Spiel spielbar ist)

**Ziel:** Feste Adresse, die du teilen kannst – ohne Codespace starten.

Typisches Setup:

| Komponente | Dienst (Beispiele) | Kosten |
|------------|-------------------|--------|
| Frontend | Vercel, Netlify, Cloudflare Pages | Kostenlos |
| Backend + API | Railway, Render, Fly.io | Free-Tier / günstig |
| Datenbank | Neon, Supabase, Railway PostgreSQL | Free-Tier |

Die React-App und die NestJS-API bleiben unverändert – nur das Hosting wechselt.

**Voraussetzung:** MVP-Stabilität, sinnvolles Balancing, keine kritischen Bugs.

---

## Phase 3: PWA – „App“ im Browser (schneller Handy-Zwischenschritt)

**Ziel:** Spiel auf dem Handy wie eine App nutzen, ohne App Store.

Was passiert technisch:

- `manifest.webmanifest` → Icon und Name auf dem Homescreen
- Responsive UI (bereits vorhanden)
- Nutzer tippt in Chrome/Safari: **„Zum Startbildschirm hinzufügen“**
- Das Spiel öffnet sich fullscreen wie eine App

**Vorteil:** Kein App-Store-Prozess, eine Codebasis, Updates sofort live.

**Einschränkung:** Kein Offline-Spiel (bewusst so designed – alles serverseitig).

**Status:** 🔄 Grundlagen vorbereitet (`client/public/manifest.webmanifest`)

---

## Phase 4: Native App (App Store / Google Play)

**Ziel:** Echte App in den Stores, wenn das Spiel fertig ist.

### Empfohlener Weg: Capacitor

Da das Frontend bereits **React + Vite** ist, ist [Capacitor](https://capacitorjs.com/) der sinnvollste Weg:

```
client/ (React)  →  Capacitor  →  iOS (.ipa) + Android (.apk)
                         ↓
              Gleiche API wie die Web-Version
```

**Schritte (später):**

1. `npm install @capacitor/core @capacitor/cli`
2. `npx cap init Kronenchronik com.kronenchronik.app`
3. `npm run build -w client` → `npx cap add ios` / `npx cap add android`
4. API-URL auf die Produktions-URL setzen
5. App Store Connect (Apple) + Google Play Console (Google) – je ca. 25–100 €/Jahr

### Alternative: React Native (nicht empfohlen für dieses Projekt)

Würde bedeuten, das UI komplett neu zu schreiben. Nur sinnvoll, wenn native Performance kritisch wird.

---

## Was sich NICHT ändert

| Aspekt | Bleibt gleich |
|--------|---------------|
| Spiellogik | Server-seitig (`server/` + `shared/`) |
| Datenbank | PostgreSQL |
| API | REST + WebSockets |
| Auth | JWT |
| Kein Offline | Spiel läuft nur online |

Die App (Phase 4) ist im Grunde ein **Wrapper um die Web-UI** – die gleiche API, die gleiche Logik.

---

## Empfohlene Reihenfolge

1. ✅ **Codespaces** – jetzt spielen und entwickeln
2. **Features fertigstellen** – Dynastie, Diplomatie, Wirtschaft, Balancing
3. **Production deployen** – feste URL für Beta-Tester
4. **PWA testen** – „Zum Startbildschirm hinzufügen“ auf dem Handy
5. **Capacitor** – wenn Store-Veröffentlichung gewünscht ist

Du musst jetzt nichts für die App vorbereiten. Die aktuelle Architektur (React-Client + REST-API) ist bereits der richtige Grundstein.
