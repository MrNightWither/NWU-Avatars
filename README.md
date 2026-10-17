# NWU Avatare

Stream-Avatare für das NWU-Universum: Zuschauer machen ein Quiz, landen in einem von
6 Häusern, wählen eine Figur, und die läuft im Stream um den Kamera-Rahmen. Mit Level,
Items, Portal-Events und Haus-Duellen.

Die Seite bekommt eine eigene Subdomain und wird nur über Twitch verlinkt
(nicht auf der Hauptseite, nicht im Linktree). Suchmaschinen sind ausgesperrt.

Der vollständige Plan steht in [`docs/PLAN.md`](docs/PLAN.md).

## Stand

| Paket | Inhalt | Status |
|---|---|---|
| **0** | Performance-Test | ✅ Prototyp fertig, **Messung auf deinem PC offen** |
| 1 | Fundament (Datenbank, Chat-Bestätigung, Anwesenheit, Punkte) | 📝 Datenmodell entworfen ([`docs/DATENMODELL.md`](docs/DATENMODELL.md)) |
| **2** | Website | 🟡 Ritual fertig (Quiz, Haus, Gestalt, Bindung per Code), läuft im Demo-Modus bis der Worker steht |
| 3 | Figuren-Overlay | – |
| 4 | Level und Items | – |
| 5 | Portal und Terrain | – |
| 6 | Haus-Duelle | – |
| 7 | Plattformen und Feinschliff | – |

## Aufbau

```
index.html            Die Ritual-Seite (Quiz → Haus → Gestalt → Bindung)
css/ritual.css        Aussehen (NWU-Look: Schwarz, Gold, Rajdhani/Inter)
js/ritual.js          Ablauf der Seite
js/einstellungen.js   Worker-Adresse, Chat-Befehl, Plattformen
js/grafik.js          Platzhalter-Wappen und -Figuren (SVG)
data/haeuser.js       Die 6 Häuser – EINE Quelle für Seite und Overlay
data/quiz.js          24 Fragen, pro Durchgang 12 zufällig
data/auswertung.js    Quiz-Auswertung (gleich für Seite und Worker)
overlay/              OBS-Browserquelle (Paket 0: perf-test.html)
docs/                 Plan, Engine-Prüfung, Datenmodell, Anleitung Paket 0
```

## Häuser und Quiz anpassen

- **Namen, Farben, Beschreibung, Morrígan-Sprüche:** `data/haeuser.js`.
  Die ids `haus1` … `haus6` bitte nicht ändern, darauf verweist die Datenbank.
- **Fragen:** `data/quiz.js`. Jede Antwort gibt Punkte an 1 bis 2 Häuser
  (`'M2'` = Mond 2 Punkte, `'F2 B1'` = Flamme 2, Blut 1). Aktuell bekommt jedes Haus
  gleich viele Punkte über alle Fragen. Wenn du etwas änderst, das Gleichgewicht halten.
- Das Quiz zieht pro Durchgang 12 von 24 Fragen. Bei knappem Ergebnis gewinnt das Haus
  mit weniger Mitgliedern (sobald der Worker die Belegung liefert).

## Ansehen

Lokal: Im Repo-Ordner `python -m http.server` starten und `http://localhost:8000` öffnen.
Paket 0 in OBS: siehe [`docs/PAKET-0.md`](docs/PAKET-0.md).
