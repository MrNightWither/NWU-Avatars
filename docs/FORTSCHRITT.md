# Fortschritt: Level und Freischaltungen (Vorschlag)

Ziel: Niemand ist nach ein paar Wochen „fertig“. Bis Level 100 gibt es regelmäßig etwas Neues,
danach geht es mit **Aufstieg** (Prestige) weiter. Die ersten Stufen kommen schnell (damit neue
Leute sofort etwas merken), später werden die Abstände größer.

✅ = funktioniert schon · 🎨 = braucht Bilder (Prompts in `GEMINI-PROMPTS.md`) · ⚙️ = nur Programmierung

| Level | Freischaltung | Stand |
|---|---|---|
| 1 | Gestalt im Haus, Standard-Haarfarbe des Hauses | ✅ |
| 2 | Haus-Abzeichen am Gürtel (statt Mond) | 🎨 Abschnitt 8 |
| 3 | Staubspur beim Laufen | ✅ |
| 5 | Haarfarbe wählen, 7 Grundfarben (`!haare`) | ✅ |
| 8 | Frisur wählen, erste 3 Frisuren (`!frisur`) | 🎨 Abschnitt 9 |
| 10 | Funkenspur in Hausfarbe | ✅ |
| 12 | Emotes: `!tanz`, `!verbeugen`, `!schlafen` | ⚙️ |
| 15 | Umhangfarbe wählen (`!umhang`) | ⚙️ |
| 18 | Weitere 3 Frisuren | 🎨 |
| 20 | Erster Begleiter (Rabe oder Katze) | 🎨 Abschnitt 11 |
| 25 | Seltene Haarfarben: Blau, Lila, Grün, Rosa | ✅ |
| 30 | Kopfschmuck Stufe 1 (Reif, Kapuze) | 🎨 Abschnitt 10 |
| 35 | Alle Frisuren aus Bogen 2 | 🎨 |
| 40 | Aura in Hausfarbe (leichtes Leuchten um die Figur) | ⚙️ |
| 45 | Zweiter Begleiter (Wolf, Fledermaus) | 🎨 |
| 50 | **Titel** über dem Namen (z. B. „Klinge des Mondes“) | ⚙️ |
| 55 | Waffe leuchtet in Hausfarbe | ⚙️ |
| 60 | Kopfschmuck Stufe 2 (Hörner, Maske) | 🎨 |
| 65 | Haus-Spur: Blutstropfen, Nebelschwaden, Flammen, Mondstaub | ⚙️ |
| 70 | Seltene Begleiter (Geisterlicht, Salamander) | 🎨 |
| 75 | Eigene Rüstungs-Akzentfarbe | ⚙️ |
| 80 | Kopfschmuck Stufe 3 (Eisenkrone, Heiligenschein) | 🎨 |
| 90 | Leuchtende Augen | ⚙️ |
| 100 | **Legende:** goldener Umriss, eigenes Siegel beim Erscheinen | ⚙️ |
| 100+ | **Aufstieg:** zurück auf Level 1, ein Stern neben dem Namen, alles Freigeschaltete bleibt | ⚙️ |

Die Werte stehen in `data/aussehen.js` (`NWU_FREISCHALTUNGEN`) und lassen sich jederzeit verschieben.

## Wie man Level bekommt: Ruhm

Gebaut (Worker `POST /ruhm`, Streamer.bot-Code in `worker/README.md`). Werte in `data/ruhm.js`:

| Quelle | Ruhm |
|---|---|
| Dabei sein (pro 10 Minuten, Present Viewers) | 15 – Wächter (Mods, Partnerin) ×1,5 |
| Im Chat geschrieben (höchstens einmal pro 10 Minuten) | 5 |
| Follow | 50 |
| Sub / Mitgliedschaft / verschenktes Abo (pro Abo) | 200 |
| Raid mitgebracht | 150 |
| Bits (pro 100) | 30 |
| Morrígans Prüfung gewonnen | 100 |
| `!levelup @Name` vom Streamer | ein ganzes Level (Fortschritt bleibt) |

Level n braucht insgesamt `50 × n × (n − 1)` Ruhm: Level 2 = 100, 5 = 1.000, 10 = 4.500, 25 = 30.000,
50 = 122.500, 100 = 495.000. Wer bei drei Streams à 3 Stunden pro Woche dabei ist und ab und zu schreibt,
sammelt etwa 1.100 Ruhm pro Woche: Level 5 nach gut einer Woche, Level 10 nach etwa vier Wochen.
Gesammelter Ruhm zählt außerdem für das eigene Haus im Haus-Pokal (`!levelup` zählt dort nicht).
