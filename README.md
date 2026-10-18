# NWU Avatare

Stream-Avatare für das NWU-Universum: Zuschauer machen ein Quiz, landen in einem von
4 Häusern, wählen eine Figur, und die läuft im Stream um den Kamera-Rahmen. Mit Level,
Items, Portal-Events und Haus-Duellen.

Die Seite bekommt eine eigene Subdomain und wird nur über Twitch verlinkt
(nicht auf der Hauptseite, nicht im Linktree). Suchmaschinen sind ausgesperrt.

Der vollständige Plan steht in [`docs/PLAN.md`](docs/PLAN.md).

## Stand

| Paket | Inhalt | Status |
|---|---|---|
| **0** | Performance-Test | ✅ Prototyp fertig, **Messung auf deinem PC offen** |
| **1** | Fundament (Datenbank, Chat-Bestätigung, Anwesenheit, Punkte) | 🟡 Worker `nwu-avatare` fertig und getestet (`worker/`), muss noch hochgeladen werden; Anwesenheit im Overlay |
| **2** | Website | 🟡 Ritual als Film über die Karte (Quiz, Haus, Gestalt, Bindung per Code, Ton), Demo-Modus bis der Worker steht |
| **3** | Figuren-Overlay | 🟡 Alle 4 Häuser × 4 Gestalten aus Teilen mit Gelenken (laufen, sitzen, jubeln, winken). Blut, Nebel, Flamme sind umgefärbte Mond-Figuren (`tools/umfaerben.py`), Haare pro Person einfärbbar |
| 4 | Level und Items | 🟡 `!levelup @Name [Anzahl]` nur für den Streamer. Freischaltungen (`data/aussehen.js`): Level 3 Staubspur, Level 5 Haarfarbe (`!haare rot`), Level 10 Funkenspur. Items fehlen noch |
| 5 | Portal und Terrain | 🟡 aufrechtes Portal, Figuren laufen aufs Terrain; Kämpfe und Terrain-Bilder fehlen noch |
| ➕ | Meilensteinkarte | 🟡 vier Pfade (Twitch, YouTube, Kick, TikTok) zur Zitadelle, `reise.html` (Website) und `reise.html?szene=1` (OBS), Essenz pro Plattform im Worker; eigene Reise-Karte fehlt noch |
| ➕ | Erfolgskarte | 🟡 `erfolge.html`: Follower-Weg bis 100.000 und Unterstützer-Weg bis 2.000, pro Plattform; eigene Karte fehlt noch |
| 6 | Haus-Duelle | – |
| 7 | Plattformen und Feinschliff | – |

## Aufbau

```
index.html            Die Ritual-Seite (Quiz → Haus → Gestalt → Bindung)
reise.html            Meilensteinkarte (Website; ?szene=1 als OBS-Szene; Test: ?twitch=5200&kick=9000 …)
erfolge.html          Erfolgskarte Follower/Unterstützer (?szene=1 für OBS; Test: ?f_twitch=640&u_twitch=13)
worker/               Eigener Cloudflare Worker nwu-avatare (D1), Anleitung + Streamer.bot-Code
css/ritual.css        Aussehen (NWU-Look: Schwarz, Gold, Rajdhani/Inter)
js/ritual.js          Ablauf der Seite
js/einstellungen.js   Worker-Adresse, Chat-Befehl, Plattformen
js/grafik.js          Platzhalter-Wappen und -Figuren (SVG)
js/film.js            Kamera über die Karte, Szenen der Gebiete
js/ton.js             Klang (im Browser erzeugt), Stumm-Knopf
assets/               Karte und Gebiete (WebP), Originale in assets/roh/
data/haeuser.js       Die Häuser (4 aktiv, Dornen/Raben verloren) – EINE Quelle für Seite und Overlay
data/quiz.js          24 Fragen, pro Durchgang 12 zufällig
data/auswertung.js    Quiz-Auswertung (gleich für Seite und Worker)
data/erfolge.js       Erfolgskarte: Stufen der beiden Wege, Plattformen
data/meilensteine.js  Reise: vier Pfade, Meilensteine, Essenz-Regeln, Orte auf der Karte
overlay/              OBS-Browserquellen: avatare.html (Figuren), rig-test.html (Teil-Figuren prüfen), perf-test.html (Paket 0)
docs/                 Plan, Fortschritt (Level 1–100), Engine-Prüfung, Datenmodell, Gemini-Prompts, Anleitung Paket 0
```

## Häuser und Quiz anpassen

- **Namen, Farben, Beschreibung, Morrígan-Sprüche:** `data/haeuser.js`.
  Die ids `haus1` … `haus6` bitte nicht ändern, darauf verweist die Datenbank.
- **Fragen:** `data/quiz.js`. Jede Antwort gibt Punkte an 1 bis 2 Häuser
  (`'M2'` = Mond 2 Punkte, `'F2 B1'` = Flamme 2, Blut 1). Aktuell bekommt jedes Haus
  gleich viele Punkte über alle Fragen (jede Frage hat genau eine starke Antwort pro Haus).
  Wenn du etwas änderst, das Gleichgewicht halten.
- **Verlorene Häuser wecken:** in `data/haeuser.js` bei Dornen/Raben `verloren: true` entfernen,
  im Quiz Antworten mit `D`/`R` ergänzen und in `js/film.js` die Orte wieder eintragen.
  Den Nebel auf der Karte macht `tools/nebel.py` (Original liegt in `assets/roh/karte.jpg`).
- Das Quiz zieht pro Durchgang 12 von 24 Fragen. Bei knappem Ergebnis gewinnt das Haus
  mit weniger Mitgliedern (sobald der Worker die Belegung liefert).

## Overlay Stufe 1 in OBS

Browserquelle → **Lokale Datei** → `overlay/avatare.html`, 1920 × 1080.
Oder per Adresse mit Einstellungen, z. B. `…/overlay/avatare.html?n=12&szene=standard`.

| Parameter | Bedeutung |
|---|---|
| `n` | Anzahl Demo-Figuren (Standard 8, mit Chat 0) |
| `kanal` | Twitch-Kanal für den Chat |
| `max` | höchstens so viele Figuren gleichzeitig sichtbar (Standard 30) |
| `spar=1` | Sparmodus |
| `groesse` | Figurhöhe in Pixeln (Standard 56) |
| `szene` / `cam` | Kamera-Rahmen aus `overlay/config.js` oder eigener `x,y,w,h` |
| `bg=1` | dunkler Hintergrund mit Rahmen zum Ansehen im Browser |
| `hud=0` | Anzeige oben links aus |
| `stufe1` | alle Figuren als Einzelbild statt aus Teilen (zum Vergleichen) |

**Chat:** In `overlay/config.js` bei `kanal` deinen Twitch-Namen eintragen (oder `?kanal=…`).
Das Overlay liest den Chat anonym mit, ohne Login. Wer schreibt, tritt aus einem kleinen Portal
am Rahmen. Nach 15 Minuten Stille geht die Figur, `!lurk` = hinsetzen/schlafen,
Mods bleiben als Wächter 2 Stunden (`!wache` = bis zum Ende). Raid → alle stellen sich oben auf
und jubeln. Sub → Level-Up-Effekt bei der Figur. Ist `api` eingetragen, bekommt jeder Chatter
seine echte Figur aus dem Ritual, sonst eine zufällige.

**Großes Portal:** aufrechtes Tor am Terrain-Streifen unten, die Figuren laufen heraus und nach
2,5 Minuten wieder hinein. Automatisch alle 20 Minuten (`portal` in `config.js`) oder per Taste.

Tasten (OBS: Rechtsklick → Interagieren): `T` Test-Chatter, `M` Nachricht, `K` !lurk, `R` Raid,
`P` Portal auf/zu, `U` Level-Up (zufällige Figur), `G` Gruppenbild, `J` alle jubeln, `S` Sparmodus,
`1/2/3` = 4/12/30 Demo-Figuren, `H` Anzeige.

**Aussehen und Freischaltungen:** Die Haare jeder Figur sind eine eigene Ebene und werden pro Person
eingefärbt. Standard je Haus: Mond Silber, Blut Schwarz, Nebel Weiß, Flamme Rot. Ab Level 3 zieht die Figur
beim Laufen eine Staubspur, ab Level 5 kann man mit `!haare <farbe>` die Haarfarbe wählen, ab Level 10 gibt
es eine Funkenspur in Hausfarbe, ab Level 25 seltene Haarfarben. Stufen und Farben stehen in
`data/aussehen.js`, der ganze Plan bis Level 100 (und Aufstieg danach) in `docs/FORTSCHRITT.md`.
Andere Häuser umfärben: Farben in `tools/umfaerben.py` anpassen und `python tools/umfaerben.py` ausführen.

**Level-Up:** Nur du (nicht die Mods) schreibst `!levelup @Name` (oder `!levelup @Name 5`). Die Figur bekommt
Lichtstrahl, Funken und „LEVEL UP!“ und jubelt. Gespeichert wird das Level über Streamer.bot im Worker
(Anleitung in `worker/README.md`).

Neue Figuren (Stufe 1): Seitenansicht freistellen (`tools/figur.py`), auf 160 px Höhe verkleinern,
nach `overlay/figuren/` legen und in `overlay/config.js` unter `figuren` eintragen.

Neue Figuren (Stufe 2, aus Teilen): Teile-Bogen mit `tools/teile.py` zerlegen, die Teile nach
`overlay/figuren/<haus-typ>/` legen, Gelenke in `overlay/rigs.js` eintragen, in `config.js` bei der Figur
`rig: '<haus-typ>'` setzen. Prüfen mit `overlay/rig-test.html` (alle Posen nebeneinander, `?bewegt=1` animiert).

## Ansehen

Lokal: Im Repo-Ordner `python -m http.server` starten und `http://localhost:8000` öffnen.
Paket 0 in OBS: siehe [`docs/PAKET-0.md`](docs/PAKET-0.md).
