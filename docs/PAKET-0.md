# Paket 0: Performance-Test – Anleitung

Ziel (Plan Abschnitt 13): Herausfinden, wie viele Figuren und Partikel dein PC neben dem
schwersten Spiel schafft. Daraus folgen Obergrenze, Partikel-Budget und Sparmodus.

**Erst messen, wenn der Umbau deines Setups fertig ist** (steht so im Plan).

## 1. Browserquelle in OBS anlegen

1. Repo auf den PC holen (`git clone https://github.com/MrNightWither/NWU-Avatars.git`).
2. In OBS: Quelle hinzufügen → **Browser**.
3. Haken bei **Lokale Datei**, dann `NWU-Avatars\overlay\perf-test.html` auswählen.
4. Breite **1920**, Höhe **1080**.
5. Haken bei **„Quelle herunterfahren, wenn nicht sichtbar“** setzen (spart Leistung, Plan 12).
6. Die Quelle über das Spiel legen.

Einstellungen gehen auch per Adresse: Haken bei „Lokale Datei“ weg und als URL eintragen, z. B.
`file:///C:/Users/nikip/NWU-Avatars/overlay/perf-test.html?n=25&fps=30&szene=standard`

| Parameter | Bedeutung | Standard |
|---|---|---|
| `n` | Anzahl Figuren | 25 |
| `fps` | Bildrate des Overlays | 30 |
| `partikel` | `1` an, `0` aus | an |
| `pmax` | Partikel-Budget | 400 |
| `spar` | `1` = Sparmodus | aus |
| `portal` | `1` = Portal offen | zu |
| `szene` | Kamera-Rahmen aus `config.js` | standard |
| `cam` | eigener Rahmen `x,y,w,h` (Anteile 0–1) | – |
| `bg` | `1` = dunkler Hintergrund + Rahmen zum Ansehen im Browser | aus |
| `hud` | `0` = Messanzeige ausblenden | an |
| `messen` | startet sofort eine Messung über X Sekunden | – |

## 2. Hotkeys

In OBS: Rechtsklick auf die Browserquelle → **Interagieren**, dann im Fenster die Tasten drücken.

| Taste | Wirkung |
|---|---|
| `1` / `2` / `3` / `4` | 10 / 25 / 50 / 100 Figuren |
| `+` / `-` | 5 Figuren mehr / weniger |
| `P` | Portal auf/zu (Figuren springen aufs Terrain = Spitzenlast) |
| `S` | Sparmodus (max. 10 Figuren, keine Partikel) |
| `T` | Partikel an/aus |
| `F` | 30 ↔ 60 FPS |
| `M` | 60-Sekunden-Messung starten |
| `H` | Anzeige ein/aus |

## 3. Messen

Die Anzeige oben links misst nur das **Overlay selbst**. Entscheidend ist, was mit
deinem **Spiel** und **OBS** passiert. Dafür:

- **Spiel-FPS:** Overlay des Spiels, NVIDIA/AMD-Overlay oder MSI Afterburner
- **GPU/CPU-Last:** Task-Manager → Leistung, oder Afterburner
- **OBS:** Menü **Ansicht → Statistiken**. Wichtig: „Ausgelassene Frames durch Rendering-Verzögerung“ und „… Kodierungsverzögerung“

Ablauf:

1. **Ohne Overlay** spielen, 2 Minuten Werte notieren (Grundlinie).
2. Overlay mit 10 Figuren einblenden, `M` drücken, 60 s spielen, Werte notieren.
3. Dasselbe mit 25 und 50 Figuren.
4. Bei 25 Figuren zusätzlich mit offenem Portal (`P`) messen.
5. Einmal mit Sparmodus (`S`).

**Zielwert vorab festlegen**, z. B.: „Das Spiel verliert höchstens 5 FPS und OBS lässt keine Frames aus.“

## 4. Ergebnisse

| Test | Figuren | Partikel | Portal | Overlay-FPS | Spiel-FPS | GPU % | CPU % | OBS ausgelassen |
|---|---|---|---|---|---|---|---|---|
| Grundlinie | 0 | – | – | – | | | | |
| A | 10 | an | zu | | | | | |
| B | 25 | an | zu | | | | | |
| C | 50 | an | zu | | | | | |
| D | 25 | an | offen | | | | | |
| E (Sparmodus) | 10 | aus | zu | | | | | |

Daraus festlegen und in `overlay/config.js` eintragen:

- `maxFiguren` = höchste Zahl, bei der der Zielwert gehalten wird
- `partikelMax` = Partikel-Budget
- `sparmodus` = Werte für den Hotkey

## Was der Test darstellt

- Platzhalter-Figuren aus 10 bis 13 Teilen an Knochen (wie die späteren Anime-Figuren aus Ebenen)
- Alle Figuren teilen sich dieselben Texturen (wie ein Bilderatlas) und werden pro Haus eingefärbt
- Zustände mit weichen Übergängen: laufen, idle, sitzen, schlafen (Lurker), kämpfen
- Laufweg um den Kamera-Rahmen: oben stehen, Seiten klettern, unten kopfüber
- Portal mit Terrain-Streifen und Funken, Figuren springen hin und zurück
- Ein- und Ausblenden statt hartem Verschwinden

Echte Figuren werden etwas mehr Leistung brauchen (größere Bilder, mehr Ebenen).
Plane deshalb etwas Luft ein.
