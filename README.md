# NWU Avatare

Stream-Avatare für das NWU-Universum: Zuschauer machen auf nightwither.de ein Quiz,
landen in einem von 6 Häusern, wählen eine Figur, und die läuft im Stream um den
Kamera-Rahmen. Mit Level, Items, Portal-Events und Haus-Duellen.

Der vollständige Plan steht in [`docs/PLAN.md`](docs/PLAN.md).

## Stand

| Paket | Inhalt | Status |
|---|---|---|
| **0** | Performance-Test | ✅ Prototyp fertig, **Messung auf deinem PC offen** |
| 1 | Fundament (Datenbank, Chat-Bestätigung, Anwesenheit, Punkte) | – |
| 2 | Website (Quiz, Charakterwahl, Schrank, Profil) | – |
| 3 | Figuren-Overlay | – |
| 4 | Level und Items | – |
| 5 | Portal und Terrain | – |
| 6 | Haus-Duelle | – |
| 7 | Plattformen und Feinschliff | – |

## Aufbau

```
docs/
  PLAN.md       Gesamtplan
  ENGINE.md     Prüfung der Animations-Engine (Plan 15.5)
  PAKET-0.md    Anleitung und Ergebnistabelle für den Performance-Test
overlay/
  perf-test.html  OBS-Browserquelle für Paket 0
  perf-test.js    Platzhalter-Figuren, Laufweg, Portal, Messung
  config.js       zentrale Einstellungen (FPS, Obergrenze, Partikel, Szenen, Häuser)
  lib/            PixiJS 8 (MIT), lokal, damit nichts aus dem Internet geladen werden muss
```

## Schnellstart Paket 0

In OBS eine **Browserquelle** mit **Lokale Datei** → `overlay/perf-test.html`, 1920 × 1080.
Alles Weitere in [`docs/PAKET-0.md`](docs/PAKET-0.md).

Zum Anschauen im Browser: `overlay/perf-test.html?bg=1` öffnen.
