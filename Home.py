import streamlit as st

from components.cards import kpi_row, player_card, section_header
from components.tables import display_table
from components.theme import apply_theme, page_header
from database.db import get_connection, init_database
from utils.data_service import get_scouting_data

apply_theme()
init_database()
df = get_scouting_data()

page_header("Start", "European Handball Scouting Platform – Übersicht")

conn = get_connection()
last_import = conn.execute(
    "SELECT filename, rows_imported, imported_at FROM import_log ORDER BY id DESC LIMIT 1"
).fetchone()
conn.close()

kpi_row([
    ("Spieler", str(len(df)), "in Datenbank", "blue"),
    ("Teams", str(df["team"].nunique()), "Vereine", "blue"),
    ("Ligen", str(df["league"].nunique()), "Wettbewerbe", "green"),
    ("Länder", str(df["country"].nunique()), "Nationalverbände", "amber"),
])

section_header("Plattform-Übersicht")
col_a, col_b = st.columns(2)
with col_a:
    st.markdown(
        """
        **Module**
        - Dashboard – KPIs & Highlights
        - Scouting-Suche – Filter & Shortlists
        - Spielervergleich – Radar & Perzentile
        - Shortlists – Priorität & Notizen
        - Scoutingberichte – Auto-Analyse
        - Datenimport – CSV-Validierung
        """
    )
with col_b:
    if last_import:
        st.info(
            f"Letzter Import: **{last_import['filename']}** "
            f"({last_import['rows_imported']} Zeilen) – {last_import['imported_at'][:10]}"
        )
    st.success(
        "Beispiel: RL, 20–25 J., ≥500 Min, Wurfquote >58 %, Marktwert <250.000 € → **Scouting-Suche**"
    )

section_header("Top Performer", "Beste Gesamtbewertung")
top8 = df.nlargest(8, "overall_score")
cols = st.columns(4)
for i, (_, row) in enumerate(top8.iterrows()):
    with cols[i % 4]:
        player_card(
            row["name"],
            f"{row['team']} · {row['position']} · {row['league']}",
            row["overall_score"],
            [(f"Off {row['offensive_score']:.0f}", ""), (f"PM {row['playmaking_score']:.0f}", "amber")],
        )

display_table(
    top8[["name", "team", "league", "position", "age", "overall_score", "market_value_eur"]],
)
