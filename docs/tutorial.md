# Tutorial & Tipps

Einsteigerfreundlichkeit für Kronenchronik.

## Start-Tutorial

Nach der Intro-Geschichte folgt ein **11-Schritte-Tutorial**:

1. Willkommen  
2. Weltkarte  
3. Provinzen  
4. Stadt bauen  
5. Ressourcen  
6. Zeitsteuerung  
7. Hof  
8. Reich  
9. Welt  
10. Codex  
11. Erstes Ziel  

Währenddessen steht die Zeit auf **Pause**. Am Ende (oder bei „Überspringen“) läuft das Spiel wieder normal.

Erneut starten: **Codex → Hilfe → Tutorial erneut starten**

## Laufende Tipps

Nach dem Tutorial erscheinen kontextbezogene Hinweise unten auf der Karte, z. B.:

- Erste Bauschritte  
- Nahrung/Gold knapp  
- Hohe Steuern  
- Offene Ereignisse / Quests  
- Krieg / Invasion / Krisen  
- Periodische allgemeine Tipps  

Spieler können Tipps mit „OK“ oder „Nicht mehr“ ausblenden (Cooldown 90 s).

## Dateien

- `client/src/lore/helpContent.ts` – Texte & Logik  
- `client/src/components/TutorialOverlay.tsx`  
- `client/src/components/TipBanner.tsx`  
- Einbindung in `GamePage.tsx` / `CodexView.tsx`
