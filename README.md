# European Handball Scouting Platform

Professionelle, datenbasierte Scouting-Plattform für Sportdirektoren, Scouts, Trainer und Analysten.

---

## Empfohlen: Über GitHub (nicht OneDrive)

OneDrive kann Dateien verzögert synchronisieren und Streamlit-Fehler verursachen.
**Projekt lokal klonen** (z. B. nach `C:\Projects\`) und von dort starten.

### 1. Repository auf GitHub anlegen

```powershell
cd C:\Users\chair\OneDrive\Desktop\handball-scouting-tool
gh auth login
gh repo create handball-scouting-tool --public --source=. --remote=origin --push
```

### 2. Frisch klonen (empfohlen)

```powershell
mkdir C:\Projects -ErrorAction SilentlyContinue
cd C:\Projects
git clone https://github.com/DEIN-USERNAME/handball-scouting-tool.git
cd handball-scouting-tool
pip install -r requirements.txt
streamlit run app.py
```

Browser: **http://localhost:8501**

---

## Lokaler Start (ohne Clone)

```powershell
pip install -r requirements.txt
streamlit run app.py
```

Die SQLite-Datenbank (`data/scouting.db`) wird beim ersten Start automatisch aus den CSV-Dateien erzeugt.

---

## Technologien

| Layer | Stack |
|-------|--------|
| UI | Streamlit (dunkles Design) |
| Analyse | Pandas, Scikit-Learn, Plotly |
| Datenbank | SQLite (`data/scouting.db`) |
| Architektur | Modular, wiederverwendbare Komponenten |

---

## Projektstruktur

```
handball-scouting-tool/
├── app.py                 # Einstieg → Navigation
├── Home.py                # Startseite
├── pages/
│   ├── dashboard.py
│   ├── scouting_search.py
│   ├── player_profile.py
│   ├── player_compare.py
│   ├── shortlists.py
│   ├── reports.py
│   ├── data_import.py
│   └── leagues.py
├── components/            # theme, cards, tables, charts, filters
├── analytics/             # metrics, scoring, similarity, insights
├── config/score_weights.py
├── database/              # SQLite, Shortlist-Helper
├── reports/               # Berichtsgenerator
└── utils/                 # data_service, validation, navigation
```

---

## Scoring anpassen

Gewichtungen in `config/score_weights.py` – Berechnung in `analytics/scoring.py`.

---

## Roadmap

- [ ] PostgreSQL-Migration
- [ ] PDF-Export (`reports/pdf_export.py`)
- [ ] Benutzerverwaltung & API
