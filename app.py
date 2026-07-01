"""Main entry – European Handball Scouting Platform."""

from pathlib import Path

import streamlit as st

from components.theme import apply_theme
from database.db import init_database

ROOT = Path(__file__).resolve().parent


def build_navigation() -> st.navigation:
    """Navigation defined inline to avoid stale import caches."""
    pages = ROOT / "pages"
    return st.navigation(
        {
            "Start": [
                st.Page(str(ROOT / "Home.py"), title="Start", default=True),
            ],
            "Scouting": [
                st.Page(str(pages / "dashboard.py"), title="Dashboard"),
                st.Page(str(pages / "scouting_search.py"), title="Scouting-Suche"),
                st.Page(str(pages / "player_profile.py"), title="Spielerprofil"),
                st.Page(str(pages / "player_compare.py"), title="Spielervergleich"),
                st.Page(str(pages / "shortlists.py"), title="Shortlists"),
                st.Page(str(pages / "reports.py"), title="Scoutingberichte"),
            ],
            "Daten": [
                st.Page(str(pages / "data_import.py"), title="Datenimport"),
                st.Page(str(pages / "leagues.py"), title="Europäische Ligen"),
            ],
        }
    )


st.set_page_config(
    page_title="Handball Scouting Platform",
    layout="wide",
    initial_sidebar_state="expanded",
)

apply_theme()
init_database()
build_navigation().run()
