# Einmalige Einrichtung (kostenlos) – für den Repository-Besitzer

**Nur du musst das einmal machen (~10 Min.).** Danach können alle Spieler einfach den Link öffnen – ohne Codespaces, ohne Installation, ohne Kosten.

## Ergebnis

| Link | Was |
|------|-----|
| **https://kronenchronik.onrender.com** | Das Spiel (Hauptlink) |
| **https://thcjk.github.io/Kronenchronik/** | Leitet automatisch zum Spiel weiter |

---

## Schritt 1: Kostenlose Datenbank (Neon)

1. Gehe zu [neon.tech](https://neon.tech) und erstelle einen kostenlosen Account
2. **New Project** → Name: `kronenchronik`
3. Kopiere die **Connection String** (PostgreSQL), z. B.:
   ```
   postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/kronenchronik?sslmode=require
   ```

> Neon Free Tier: 0.5 GB, dauerhaft kostenlos.

---

## Schritt 2: Spiel auf Render deployen

1. Gehe zu [render.com](https://render.com) → kostenloser Account (mit GitHub)
2. Klicke: **[Deploy to Render](https://render.com/deploy?repo=https://github.com/Thcjk/Kronenchronik)**
3. Beim Deploy unter **Environment** hinzufügen:
   - `DATABASE_URL` = dein Neon Connection String
4. **Deploy** starten (dauert ca. 5–10 Min.)

> Render Free Tier: 750 Std./Monat, Server schläft nach 15 Min. Inaktivität (erster Aufruf dauert ~30 Sek.).

---

## Schritt 3: Fertig!

Öffne: **https://kronenchronik.onrender.com**

- Registrieren → spielen
- Link teilen – andere brauchen nichts installieren
- GitHub Pages leitet automatisch weiter

---

## Kosten-Übersicht

| Dienst | Kosten | Limit |
|--------|--------|-------|
| Neon (Datenbank) | **0 €** | 0.5 GB |
| Render (Server) | **0 €** | 750 Std./Monat |
| GitHub Pages (Weiterleitung) | **0 €** | unbegrenzt |

**Kein Codespaces nötig** – das war nur für Entwicklung gedacht.

---

## Updates deployen

Jeder Push auf `main` kann automatisch neu deployen, wenn Render mit GitHub verbunden ist (Auto-Deploy in Render-Dashboard aktivieren).
