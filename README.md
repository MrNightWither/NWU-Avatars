# NWU Avatare

Stream-Avatare für das NWU-Universum: Zuschauer machen ein Quiz, landen in einem von
4 Häusern, wählen eine Figur, und die läuft im Stream um den Kamera-Rahmen. Mit Level,
Items, Portal-Events und Haus-Duellen.

Die Seite bekommt eine eigene Subdomain und wird nur über Twitch verlinkt
(nicht auf der Hauptseite, nicht im Linktree). Suchmaschinen sind ausgesperrt.

Der vollständige Plan steht in [`docs/PLAN.md`](docs/PLAN.md), die Geschichte in [`docs/GESCHICHTE.md`](docs/GESCHICHTE.md),
der aktuelle Stand mit allen offenen Entscheidungen in [`docs/UEBERGABE.md`](docs/UEBERGABE.md).

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
stufen.html           Alle Stufen bis Level 100 und „Dein Stand“ per Chat-Name (Test: ?level=12&haus=haus2&figur=c)
chronik.html          Haus-Pokal (Kampf um das Banner) und die zehn Ruhmreichsten jedes Hauses
prolog.html           Prolog „Die Spaltung“: Morrígan erzählt die Geschichte (Stimme: assets/stimme/)
figur.html            Eigene Figurenseite zum Teilen: ?p=twitch&n=Name (Test: ?beispiel=1)
haus.html             Hausseiten: ?h=haus1 … haus4 (haus5/haus6 zeigen nur die Legende der Verborgenen)
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
data/aussehen.js      Haarfarben und Freischaltungen, die schon funktionieren (Overlay + Worker)
data/fortschritt.js   Der ganze Stufenplan für die Website (fertig/bald)
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
- Das Quiz zieht pro Durchgang 12 von 64 Fragen (40 Situationen, 24 über einen selbst): immer 4 über einen selbst (ids mit „s“), 8 Situationen. Bei knappem Ergebnis gewinnt das Haus
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
| `sb` | Adresse des Streamer.bot-WebSocket-Servers (sonst aus `config.js`), z. B. `sb=ws://127.0.0.1:8080/` |
| `sieger` | Haus mit Krone zum Testen, z. B. `sieger=haus2` (mit Worker kommt es aus `/pokal`) |

**Chat:** In `overlay/config.js` bei `kanal` deinen Twitch-Namen eintragen (oder `?kanal=…`).
Das Overlay liest den Chat anonym mit, ohne Login. Wer schreibt, tritt aus einem kleinen Portal
am Rahmen. Nach 15 Minuten Stille geht die Figur, `!lurk` = hinsetzen/schlafen,
Mods bleiben als Wächter 2 Stunden (`!wache` = bis zum Ende). Wer noch kein Ritual gemacht hat (Worker sagt
„nicht gebunden“), läuft als **Silhouette**; nach dem Ritual tritt beim nächsten Schreiben die echte Gestalt hervor. Raid → alle stellen sich oben auf
und jubeln. Sub → Level-Up-Effekt bei der Figur. Ist `api` eingetragen, bekommt jeder Chatter
seine echte Figur aus dem Ritual, sonst eine zufällige.

**Großes Portal:** aufrechtes Tor am Terrain-Streifen unten, die Figuren laufen heraus und nach
2,5 Minuten wieder hinein. Automatisch alle 20 Minuten (`portal` in `config.js`) oder per Taste.

**Ehrenduelle:** `!duell @Name` – beide laufen am Rahmen aufeinander zu, drei Schlagabtausche mit Funken, der Sieger
jubelt, der Verlierer setzt sich kurz. Höheres Level hilft etwas (höchstens 70 : 30). Pro Person alle 2 Minuten.

**Morrígans Prophezeiung:** einmal pro Stream ein rätselhafter Satz (teils mit dem echten Pokal-Stand) als Karte.
**Jahrestag der Bindung:** an diesem Tag leuchtet die Figur golden, Morrígan gratuliert im Chat.
**Haus-Ruf:** `!ruf` – alle Figuren des eigenen Hauses laufen zur rufenden Person und jubeln (pro Haus alle 3 Minuten).
**Wächter-Wache:** schreibt ein Mod `!wache`, stellen sich die anderen Mods für einige Sekunden neben ihn.
**Willkommen:** wird eine Silhouette durch das Ritual zur echten Gestalt, läuft ihr Haus zu ihr und begrüßt sie.
**Flüstern aus dem Westen:** etwa alle 25 Minuten (`fluesternMinuten` in `config.js`) erscheint am linken Rand Nebel
mit violetten Augen, dazu ein Rabe oder eine Dornenranke – ein leiser Hinweis auf die verborgenen Häuser.

**Mein Profil** (`ich.html`): anmelden per Code (`!anmelden 1234` im Twitch-Chat, 30 Tage pro Gerät), dann Haarfarbe,
Anonym, Kick/YouTube verknüpfen, Profil löschen. Test ohne Worker: `ich.html?beispiel=1`. Das Ritual geht nur über Twitch,
Ritual-Antworten werden nach der Bindung nicht gespeichert. Ohne Ritual läuft man als Besucher (`besucher` in
`overlay/config.js`, bis das Bild da ist als Silhouette). Im Overlay stehen nie Namen.

Alle Chat-Befehle für Zuschauer stehen auf `befehle.html` (Quelle: `data/befehle.js`), `!nwu` schickt den Link.
Die Spiele stehen in `overlay/spiele.js`.

**Spiele** (Start im Chat durch dich und – wenn `spiele.starter` auf `'mods'` steht – durch Mods; Zeiten in
`overlay/config.js` → `spiele`, Ruhm in `data/ruhm.js` → `spiele`):

| Spiel | Start | Mitmachen | Ruhm |
|---|---|---|---|
| Fang den Raben | von allein (etwa alle 15 Min.) oder `!rabe` | als Erster `!fang` | +25 |
| Wettrennen der Häuser | `!rennen` oder von allein | jede Nachricht schiebt den Läufer des eigenen Hauses an (1× pro Sekunde) | +30 für alle, die das Siegerhaus angefeuert haben, +100 Pokal-Ruhm fürs Siegerhaus |
| Tauziehen | `!tauziehen`, `!tauziehen mond blut` oder von allein | `!zieh` (60 Sekunden, höchstens 2 pro Sekunde und Person) | +30 für alle, die im Siegerhaus gezogen haben, +100 Pokal-Ruhm fürs Siegerhaus |
| Letzter steht | `!letzter` oder von allein | `!dabei` (45 Sekunden anmelden), dann schlagen Blitze ein | +150 für den Letzten |
| Schatzsuche | `!schatz` oder von allein | `!grab oben` / `rechts` / `unten` / `links` (60 Sekunden, zählt der erste Tipp) | +100 richtig, −20 falsch (nie unter den Beginn des Levels) |
| Würfel der Morrígan | `!wurf` (jeder, 1× pro Stream) | – | 6 = doppelter Ruhm für 4 Std., 1 = 5 Min. Silhouette, 2–5 = Augenzahl × 10 |

Rennen, Tauziehen, Letzter steht und Schatzsuche starten außerdem etwa alle 30 Minuten von allein (`zufallMinuten`), wenn
mindestens 3 Figuren da sind. Fehlt einem Haus beim Rennen oder Tauziehen ein Mitglied im Chat, läuft ein Gast für das Haus. Den Ruhm bucht
Streamer.bot (Aktion „NWU Spiel“ und „NWU Würfel“, Anleitung in `worker/README.md`). Ohne Streamer.bot-Verbindung
(`streamerbot` in `config.js`) laufen die Spiele nur zum Spaß. Während eines Spiels gibt es keine Duelle und kein
großes Portal.

**Zeichen der Zitadelle:** Mods (Wächter) tragen einen goldenen Ring zu ihren Füßen, die Rolle `koenigin`
(Partnerin) zusätzlich Diadem und violetten Schimmer. Das Siegerhaus des Vormonats trägt Kronen.

Tasten (OBS: Rechtsklick → Interagieren): `T` Test-Chatter, `M` Nachricht, `K` !lurk, `R` Raid,
`P` Portal auf/zu, `U` Level-Up (zufällige Figur), `G` Gruppenbild, `J` alle jubeln, `D` Duell, `F` Haus-Ruf, `W` Flüstern aus dem Westen, `B` Rabe, `E` Wettrennen, `Z` Tauziehen, `L` Letzter steht, `X` Schatzsuche, `Q` Würfel (zufällige Figur), `S` Sparmodus,
`1/2/3` = 4/12/30 Demo-Figuren, `H` Anzeige.

**Aussehen und Freischaltungen** (alles in `data/aussehen.js`, Plan bis Level 100 in `docs/FORTSCHRITT.md`):
Level 2 Haus-Abzeichen an der Gürtelschnalle (Blut, Nebel, Flamme; der Mond trägt das alte Unity-Zeichen),
3 Staubspur, 5 Haarfarbe, 8 Frisur (4 zum Start, 18 mehr, 35 alle 24 + Glatze), 10 Funkenspur, 20 Begleiter
(Rabe, Katze; 45 Wolfswelpe, Fledermaus; 70 Geisterlicht, Feuersalamander), 25 seltene Haarfarben,
30 Kopfschmuck (Silberreif, Kapuze, Blumenkranz, Federn; 60 Hörner, Maske, Augenklappe, Hexenhut, Vogelschädel;
80 Eisenkrone, Heiligenschein, Geweih). Wählen im Chat (`!haare`, `!frisur`, `!kopf`, `!begleiter`) oder unter
„Mein Profil“; die Figur kleidet sich sofort neu ein. Frisuren und Kopfschmuck liegen in einem gemeinsamen
Bezugsrahmen (`tools/frisuren.py`, `tools/kopfschmuck.py`) und passen dadurch auf jede Figur (`kopfRahmen` in
`overlay/rigs.js`). Beim Schatten verdeckt die Kapuze die Frisur. Wer kein Ritual gemacht hat, läuft als **Besucher**
oder **Besucherin** (Reisemantel, keine Waffe).

**Morrígans Prüfung:** Startet Streamer.bot eine Prüfung (`!pruefung` oder Timer), zeigt das Overlay die Frage
als Karte oben in der Mitte; der Gewinner jubelt, ohne Gewinner wird die richtige Antwort markiert.
Fragen in `data/pruefung.js`, Streamer.bot-Code in `worker/README.md`.

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
