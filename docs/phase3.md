# Phase 3 – Lebendige Welt, KI, Kriege & dynamische Story

Schwerpunkt: KI-Reiche mit Persönlichkeiten, Diplomatie, Belagerungen, Ereignisse, Chronik.

## Umgesetzt

### KI-Reiche
- 4 KI-Königreiche spawnen beim Spielstart (gleiche Regeln, kein Cheaten)
- Persönlichkeiten: Aggressiv, Diplomatisch, Wirtschaftlich, Religiös, Eroberer, Verteidiger
- Pro Tick: Wirtschaft, Rekrutierung, Burgen/Dörfer, Expansion, Diplomatie, Kriege

### Kriege & Belagerungen
- Casus Belli (Grenze, Religion, Rache, schwacher Nachbar, …)
- Gegen KI: erst Krieg erklären
- Burgen → Belagerung (Fortschritt, Moral, Vorräte, Mauern)
- Optionen: warten, stürmen, abbrechen

### Diplomatie & Spione
- Beziehungen (−100…+100), Handel, Bündnis, Krieg, Frieden
- Spionage: Aufklären, Stehlen, Sabotieren, Unruhen

### Ereignisse & Chronik
- Zufallsereignisse mit Entscheidungen (Hungersnot, Pest, Turnier, Reliquie, …)
- Chronik-Seite mit Filter
- Dynastie-Alterung und Thronfolge
- Generäle & langfristige Ziele

## Dateien

- `shared/src/aiPersonality.ts`, `aiTurn.ts`, `worldState.ts`, `worldEvents.ts`, `siegeLogic.ts`
- `client/src/local/worldSim.ts`, `localApi.ts`
- `client/src/pages/DiplomacyPage.tsx`, `ChroniclePage.tsx`
- `client/src/components/EventModal.tsx`
