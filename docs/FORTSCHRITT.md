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

## Wie man Level bekommt

Im Moment nur über dich: `!levelup @Name`. Für 100 Level reicht das nicht, deshalb der Vorschlag
aus dem Plan (Abschnitt Level): **Erfahrung automatisch**, Streamer.bot meldet sie an den Worker.

| Quelle | Erfahrung (Vorschlag) |
|---|---|
| Im Chat dabei (pro 10 Minuten mit Nachricht) | 10 |
| Follow | 50 |
| Sub / Mitgliedschaft | 200 |
| Raid mitgebracht | 150 |
| Bits (pro 100) | 30 |
| `!levelup` von dir | ein ganzes Level |

Level-Kurve: Level n braucht `100 × n` Erfahrung mehr als das vorige. Level 10 nach etwa
2–3 Wochen regelmäßigem Zuschauen, Level 50 nach vielen Monaten, Level 100 ist etwas für die
treuesten Leute. Die Zahlen sind ein Startpunkt und werden nach den ersten Wochen angepasst.
