# NWU Stream-Avatare: Gesamtplan

Stand: 17.10.2026. Status: **nur Planung, noch nichts bauen.**
Zweck dieser Datei: Alles bisher Festgelegte an einem Ort, damit Claude Code (oder ich selbst) daraus Pakete umsetzen kann.

---

## 1. Grundidee

Zuschauer gehen auf eine Internetseite (nightwither.de), beantworten dort Fragen und werden dadurch einem von **6 Häusern** zugeteilt. In ihrem Haus wählen sie aus **4 Startcharakteren**. Die gewählte Figur läuft im Stream herum. Je nach Aktivität (Chat, Watchtime, Support, Events) steigt das Level, es werden **immer mehr Anpassungs-Slots** und kosmetische Items freigeschaltet.

Ein eigenes, von Morrígan gesteuertes Overlay, ohne Drittanbieter-Tools. Es verbindet Chat-Engagement, Haus-Lore und die globale Meilensteinkarte.

---

## 2. Festlegungen (verbindlich)

- **6 Häuser**, Namen und Wappen kommen später (als Variablen/Konfiguration hinterlegen).
- **Stil:** Anime, gezeichnet. (Frühere Notiz "Pixel-/Vektor-Avatar" gilt nicht mehr.)
- **Animation:** muss richtig sauber laufen. Ansatz: Puppet-/Knochen-Animation mit Ebenen.
- **Anmeldung:** Chat-Bestätigung (siehe Abschnitt 5). Twitch-Login (OAuth) kommt später als Ergänzung. (Frühere Notiz "No-Login, nur Twitch-Name" gilt nicht mehr.)
- **Keine Namensschilder** über den Figuren. Individualität entsteht über Aussehen und Level.
- **Level-Staffelung:** je höher das Level, desto mehr Slots werden freigeschaltet.
- **Alle machen das Quiz**, auch Mods, Partner und Verbündete.
- **Kein Hauswechsel.** "Verbündete" zwischen Häusern eventuell später, nicht jetzt.
- **Kein Sound**, höchstens im Pausen- und Startscreen.
- **Läuft aktuell auf einem PC**, ob ein zweiter PC kommt, ist offen. Das System muss mit einem PC gut laufen.
- **Vor jedem größeren Umbau eine Sicherung anlegen.**

---

## 3. Häuser und Quiz

- 6 Häuser, Namen später. Themen-Ideen für die Lore (unverbindlich): Mond, Blut, Nebel, Flamme, Dornen, Raben.
- Quiz mit etwa 10 bis 15 Fragen, jede Antwort gibt versteckte Punkte an 1 bis 2 Häuser.
- Zufallsfragen, damit Wiederholen nicht dasselbe Ergebnis liefert.
- Auswertung leicht so gewichten, dass kein Haus dauerhaft leer bleibt (nur bei knappen Ergebnissen).
- Ergebnis-Seite mit Haus-Wappen, Haus-Farben und einem Morrígan-Spruch.
- Jedes Haus hat 4 Startcharaktere (also 24 Figuren insgesamt).
- Haus-Zugehörigkeit ist **endgültig** (kein Wechsel).

---

## 4. Rollen

| Rolle | Haus | Besonderheit |
|---|---|---|
| **Schattenkönig** (Streamer) | keins | alles freigeschaltet, eigene Sachen, eigene Krone/Aura, besonderer Auftritt |
| **Morrígan** | keins | eigene Figur, eigene Rolle im Portal-Event |
| **Wächter** (Mods) | aus dem Quiz | Sonderauswahl im Wächter-Look, dauerhaft aktiv solange anwesend |
| **Königlicher Kreis** (Partnerin) | aus dem Quiz | Sonderauswahl zusätzlich |
| **Verbündete** (feste Streaming-Partner) | aus dem Quiz | Sonderauswahl im eigenen Look |
| **Alle anderen** | aus dem Quiz | Level und Pfade |

Regeln:
- Die Sonderauswahl gilt **zusätzlich** zum normalen Freischalten. Slots und Level müssen auch Mods und Partner selbst erreichen.
- Rollen-Erkennung über Abzeichen am Aussehen (Krone, Wächter-Siegel, Bündnis-Wappen), nicht über Namen.
- Datenmodell: **Rollenfeld neben dem Haus**, nicht statt dessen. Haus ist Pflicht (außer König und Morrígan), Rolle ist optional.
- Rolle wird per Hand oder aus Streamer.bot-Gruppen gesetzt.
- Mögliche Zusatzidee: zeitlich begrenzte Sonderrollen für Events (z. B. "Schattenbote des Monats").
- Partner-Item pro Streamer (Brücke zwischen Communities) als Ausbaustufe.

---

## 5. Anmeldung und Identität (Chat-Bestätigung)

1. Zuschauer gibt auf der Website seinen Plattform-Namen ein.
2. Er bekommt einen kurzen Code.
3. Er schreibt den Code per Befehl im Chat (z. B. `!bestätigen 4821`).
4. Streamer.bot prüft Code und Chat-Absender, das Profil wird verknüpft.

Vorteile: kein Login nötig, funktioniert auf Twitch, Kick, YouTube und TikTok gleich, weil der Chat selbst der Beweis ist.

Wichtig fürs Datenmodell:
- Jedes Profil hat eine **interne Profil-ID**. Plattform und Name hängen nur als Verknüpfung daran.
- So lassen sich später Konten zusammenführen und ein Twitch-Login ergänzen, ohne die Datenbank umzubauen.
- Nach der ersten Bestätigung ist die Auswahl gesperrt, Änderungen nur über definierte Wege.

---

## 6. Anwesenheit

- Die Figur ist sichtbar, solange der Zuschauer **im Chat schreibt** oder `!lurk` eingibt.
- Jede Nachricht oder jedes `!lurk` setzt einen **15-Minuten-Timer** zurück.
- Läuft er ab, verschwindet die Figur (mit Abgang: Gähnen oder Verblassen, kein hartes Verschwinden).
- Wiederkommen mit kleiner Einlauf-Animation.
- Watchtime zählt weiter, solange der Zuschauer im Stream ist, auch wenn die Figur gerade weg ist (sonst verlieren stille Zuschauer Fortschritt).
- **Lurker-Haltung:** Figur sitzt, liest oder schläft, damit man sofort sieht, wer da ist, aber nicht schreibt.
- **Mods** bleiben dauerhaft aktiv, solange sie da sind, auch ohne zu schreiben:
  - Anwesenheit über die Zuschauerliste (Streamer.bot, wo verfügbar).
  - Fallback `!wache` auf Plattformen ohne Zuschauerliste (gilt bis zum Weggehen oder Stream-Ende).
  - Verlässt der Mod den Chat, geht die Figur nach kurzer Schonfrist ab.
  - Eigene Haltung: Wache halten auf dem Cam-Rahmen.
  - Gleiche Regel für Partnerin und Verbündete, wenn sie als solche gelten.
- Offene Feinheit: Ob ein einmaliges `!lurk` länger als 15 Minuten gilt, ist noch nicht entschieden.

---

## 7. Figuren und Animation

**Ansatz:** Puppet-/Knochen-Animation. Jede Figur besteht aus Ebenen (Körper, Haar, Kopfteil, Umhang, Begleiter, Aura) an Knochen. So passt jede Kosmetik zu jeder Pose, es gibt keine Kombinations-Explosion.

- Alle 24 Startfiguren nutzen dasselbe Skelett mit **festen Ankerpunkten** (Kopf, Rücken, Hand).
- Pro Pose, wo nötig, eigene Ebenen-Varianten (z. B. Umhang beim Klettern).
- **Zustandsautomat:** spawn → idle → laufen → klettern → hängen (kopfüber) → springen → landen → kämpfen → treffer → fallen → jubeln → sitzen/schlafen (Lurker) → wache halten (Mods) → despawn.
- Jeder Wechsel hat einen **weichen Übergang**, nichts springt.
- Dokumentierte Animationsliste: pro Zustand Dauer, Loop ja/nein, Übergänge.
- Renderer: Browserquelle in OBS mit einer Sprite-Engine (z. B. PixiJS mit Spine- oder DragonBones-Animationen). Die genaue Wahl prüft Claude Code.
- Alles aus **einem gemeinsamen Bilderatlas**.

Weitere angenommene Ideen:
- Emotes als Freischaltung (Tanz, Verbeugung, Zauberpose)
- Level-Up-Animation, für alle im Stream sichtbar
- Begleiter wächst mit dem Level
- Tageszeit und Mondphase: Auren leuchten nachts stärker, bei Vollmond Sondereffekt
- Mini-Dialoge: zwei Figuren tauschen Emoji-Sprechblasen aus
- Rahmen-Rennen: Figuren laufen um die Wette, Chat tippt mit
- Raid-Formation: bei einem Raid stellen sich alle Figuren zur Begrüßung auf
- Gruppenbild am Stream-Ende für den Endscreen
- Chat-Nachricht erzeugt Sprechblase, Befehle wie `!tanz`, `!winken`

---

## 8. Level, Slots, Items

**Slots (Vorschlag, anpassbar):**

| Level | Neuer Slot |
|---|---|
| 1 | Startfigur (1 von 4 im Haus) |
| 3 | Grundfarbe |
| 6 | Kopfteil |
| 10 | Umhang oder Kleidung |
| 15 | Hausabzeichen/Muster |
| 20 | Begleiter (Rabe, Katze, Irrlicht) |
| 30 | Aura oder Partikel |
| 40 | Lauf-Spur |
| 50 | Idle-Animation |
| 75+ | Titel-Symbol, Sondereffekte |

Ein Slot freischalten heißt: er wird nutzbar. Die Auswahl an Items pro Slot wächst separat.

**Individualität ohne Namen:**
- Viele Slots, dadurch tausende Kombinationen
- Freie Farbwahl ab höherem Level
- Eigenes kleines Symbol über dem Kopf (Emoji-artig) statt Text
- Eigene Sprechblasen-Farbe oder -Rahmen
- Eigene Ruf-Animation bei `!tanz`/`!winken`
- Beim eigenen Chat-Beitrag leuchtet die Figur kurz auf

**Aktivitäts-Pfade (liefern die Items):**
- Chatter-Pfad: Meilensteine bei Nachrichten (z. B. 50, 250, 1000)
- Watchtime-Pfad: Meilensteine bei Stunden (auch für Lurker)
- Supporter-Pfad: Follow, Sub, Raid, Bits/Geschenke
- Event-Pfad: Halloween, Jubiläum, Goldene Stunde, Chat-Quiz-Siege
- Haus-Pfad: Items nur fürs eigene Haus, wenn es die Woche gewinnt

**Level-Entstehung:** Punkte aus Chat, Watchtime, Follows, Subs, Raids, mit Tageslimit pro Quelle gegen Spam. Kurve anfangs flach (schnelle erste Level), später steiler.

**Seltenheiten:** normal, selten, episch, legendär. Seltene Items nur durch Events oder Drops.

**Bindungs-Ideen (angenommen):**
- Haus-Quests: wöchentliches Gemeinschaftsziel pro Haus
- Tägliche Mini-Aufgaben und Serien-Bonus (7-Tage-Serie)
- Rückkehr-Bonus nach langer Pause
- Willkommensgeschenk direkt nach dem Quiz
- Mentor-System: hohe Level nehmen Neulinge unter die Fittiche, beide bekommen einen Bonus
- Figuren-Geburtstag (Jahrestag seit dem Quiz) mit Spezial-Item
- Schattenpfad: Saison-Belohnungsleiste, nur durch Aktivität, nie bezahlt
- Item-Drops im Stream: zufällig bekommt ein Chatter ein Item
- Verknüpfung mit Goldener Stunde und Saison-Look (Halloween)

---

## 9. Ablauf im Stream: drei Phasen

**Phase 1: Cam-Walk (Standard)**
- Figuren aktiver Chatter laufen auf den Rändern des Kamera-Rahmens entlang.
- Sie klettern an den Kanten, hängen kopfüber oder zeigen Idle-Animationen (Zaubern, Sitzen).
- Das Gameplay bleibt clean, ohne störende Dauer-Balken.
- Der Laufweg braucht **pro Szene gespeicherte Eckpunkte**, weil Position und Größe der Kamera je Szene variieren.

**Phase 2: Portal-Event (Trigger)**
- Öffnet sich dynamisch, z. B. alle 20 Minuten, bei Raids, Hype-Trains, hoher Chat-Aktivität, Goldener Stunde.
- Am unteren Bildrand öffnet sich ein okkultes Portal mit Gold/Blutrot-Funken, ein schmaler Terrain-Streifen schiebt sich heraus.
- Bei einem Meilenstein auf der Karte: besonders großes Portal mit neuem Gebiet.

**Phase 3: Terrain-Invasion (Event-Modus)**
- Figuren springen vom Cam-Rahmen auf den Boden.
- Sie kämpfen gegen Schatten-Kreaturen, tragen Haus-Duelle aus oder sammeln Schatten-Essenz (bei Subs/Bits).
- Nach 2 bis 3 Minuten zieht sich das Terrain ins Portal zurück, Überlebende klettern wieder auf den Cam-Rahmen.

**Kopplung an die Meilensteinkarte:**
- Aussehen des Terrains (z. B. Sumpf, Zitadelle, Schmiede) und Gegnertypen richten sich nach dem aktuellen Punkt auf der Karte.
- Die Community sieht sofort, in welchem Gebiet des NWU-Universums sie ist.
- Start mit **2 bis 3 Terrain-Sets**, weitere später.

---

## 10. Kämpfe

**Modus A: gegen Kreaturen (alle gemeinsam)**
- Kämpfe laufen automatisch, Chat-Aktivität und Level bestimmen den Schaden. Niemand muss etwas drücken.
- Höhere Level kämpfen vorne.
- **Rollen-Fähigkeiten sind an:**
  - Wächter (Mods): heilen automatisch (Reichweite und Abklingzeit begrenzt), Schutzschild, ziehen Aufmerksamkeit auf sich
  - Königlicher Kreis (Partnerin): Segen mit kurzzeitig mehr Schaden für alle
  - Verbündete: Gast-Auftritt mit starkem Zauber, einmal pro Portal-Event
  - Schattenkönig: großer Finisher, wenn der Boss fast besiegt ist
  - Morrígan: warnt vor Angriffen, Lore-Sprüche, kann einen Rabenschwarm rufen
- Heilen als sanfter Lichtpuls, damit es nicht chaotisch aussieht. Abklingzeit, damit Kämpfe nicht unverlierbar werden.
- Boss-Phase: gemeinsamer Lebensbalken, jedes Haus schlägt zu, Haus mit dem meisten Schaden bekommt Hauspunkte.
- Gefallene Figuren sind 5 Minuten halb durchsichtige Geister (kein Fortschrittsverlust), können Gegner kurz stören.
- Auren und Begleiter haben im Kampf sichtbare Effekte, aber **nur Optik, kein Vorteil**.
- Zusätze: Loot-Truhen mit seltenen Items, Rätselportale (Chat löst Rätsel, sonst bleibt das Portal zu), wöchentlicher Weltboss und Zwischenbosse an Meilensteinen, Wetter im Terrain (Nebel, Gewitter, Blutmond), Kreaturen mit leichter Haus-Schwäche.
- Schatten-Essenz (aus Subs, Bits, Geschenken) als Sammel-Währung für Items oder Hausboni.

**Modus B: Haus-Duell (Haus gegen Haus)**
- **Keine Vorteile für Rollen.** Heilen, Segen und Co. sind in diesem Modus aus.
- Mods und Partner kämpfen **auf der Seite ihres Hauses**, wie normale Zuschauer.
- Schattenkönig und Morrígan sind neutral (König setzt das Signal, Morrígan kommentiert).
- Hauspunkte, Wochensieger-Haus bekommt ein Banner im Startscreen, Sieger-Haus pflanzt eine Fahne auf das Terrain.
- Haus-Pokal im Endscreen.

**Technisch:** Moduswechsel (Kreaturen/Haus-Duell) schaltet nur die Rollen-Fähigkeiten ab, nicht das Aussehen. Fähigkeiten hängen an der Rolle, nicht am Item.

---

## 11. Website (nightwither.de)

- Quiz und Haus-Auswertung
- Charakterwahl (4 pro Haus)
- Kosmetik-Schrank mit Live-Vorschau, gesperrte Slots sichtbar aber grau
- Hausseite mit Rangliste und Haus-Pinnwand (Gemeinschaftsraum)
- Öffentliche Profilseite mit Aussehen, Seltenheiten, Statistiken
- Vitrine für gesammelte Items
- Lore-Buch, das mit den Meilensteinen wächst
- Teilbare Figurenkarte (Haus, Level, Aussehen) als Bild
- Porträt-Export: Figur als Kopfbild für Steam, Discord oder Twitch (Brücke zur ursprünglichen Avatar-Idee)
- Automatische Discord-Rolle pro Haus
- Fester Itemkatalog: Zuschauer wählen nur aus vordefinierten Items

---

## 12. Technik und Architektur

**Aufteilung:**
- **Server (z. B. Oracle-VPS):** Datenbank, Punkte, Level, Anwesenheit, Kampf-Logik, Portal-Trigger, Website. Das Overlay bekommt nur fertige Zustände (Position, Pose, Aussehen).
- **Eigener PC (OBS):** nur das Zeichnen der Figuren in der Browserquelle. Auch wenn das Overlay über das Internet läuft, wird es lokal in OBS gerendert.
- Alternative "Server rendert ein Video" nur, falls der Test zeigt, dass lokal nicht reicht (aufwendig, Verzögerung, Transparenz schwierig).
- Overlay ist eine **Webseite** und lässt sich jederzeit auf einen anderen PC verschieben (gleiche Adresse als Browserquelle).

**Performance (Ein-PC-first):**
- Overlay mit **30 FPS** statt 60
- Gemeinsamer Bilderatlas
- **Obergrenze sichtbarer Figuren** (z. B. 20 bis 30), Rest wird nicht gezeichnet oder klein im Hintergrund
- Partikel sparsam, Dauer-Effekte nur für wenige Figuren
- Browserquelle nur in den Szenen aktiv, in denen sie gebraucht wird
- **Sparmodus per Hotkey:** weniger Figuren, keine Partikel, einfachere Portal-Animation
- Einstellungen (Figurenzahl, Partikel, FPS) zentral in einer Konfiguration

**Datenquellen:**
- Streamer.bot für Chat, Follows, Subs, Raids, Anwesenheit (Twitch, Kick, YouTube)
- TikTok über Tiktory-Flow (Webhook oder Streamer.bot-Ausführung)
- Konten über Profil-ID zusammenführbar

**Missbrauchsschutz und Datenschutz:**
- Punkte pro Minute begrenzen, Bots ausschließen
- Nur Name und Plattform-ID speichern
- Feste Itemauswahl, nichts Anstößiges möglich
- Automatische Datenbank-Sicherungen

**Pflege:**
- Admin-Panel: Items vergeben, Profile prüfen, Zuschauer sperren
- Testmodus: per Hotkey Testfiguren spawnen, um Animationen und Performance zu prüfen
- Ausbau denkbar: Verbündete und Haus-Beziehungen als eigene Tabelle (später)

---

## 13. Pakete (Reihenfolge)

**Paket 0: Performance-Test**
- Prototyp mit Platzhalter-Figuren in der Browserquelle: 10 / 25 / 50 gleichzeitig
- Messen unter Last des schwersten Spiels: Spiel-FPS, GPU/CPU-Last, OBS-Dropped-Frames
- Ergebnis legt fest: Obergrenze, Partikel-Budget, Sparmodus-Einstellungen, Atlas-Größe
- Zielwert vorab festlegen (Spiel verliert höchstens wenige FPS)
- Verbindlich messen, sobald der Umbau des Setups abgeschlossen ist

**Paket 1: Fundament**
- Datenbank mit interner Profil-ID, Plattform-Verknüpfung, Haus, Rolle, Level, Items
- Chat-Bestätigung per Code über Streamer.bot
- Anwesenheit (15 Minuten, `!lurk`, Mods dauerhaft)
- Punkte-Regeln mit Tageslimits und Bot-Filter

**Paket 2: Website**
- Quiz, Haus-Auswertung, Charakterwahl, Schrank, Profil, Rangliste, Figurenkarte
- Porträt-Export, Discord-Rolle pro Haus

**Paket 3: Figuren-Overlay**
- Puppet-System, Zustandsautomat, saubere Übergänge
- Cam-Walk mit Eckpunkten pro Szene
- Lurker- und Wächter-Haltung, Rollen-Optik
- Emotes, Level-Up-Animation, Raid-Formation, Mini-Dialoge, Rahmen-Rennen
- Obergrenze, Performance, Sparmodus

**Paket 4: Level und Items**
- Slot-Tabelle, Aktivitäts-Pfade, Seltenheiten, Drops, Event-Items
- Quests, Serien, Rückkehr-Bonus, Mentor, Geburtstag, Schattenpfad
- Sonderauswahl für Rollen

**Paket 5: Portal und Terrain**
- Portal-Trigger (Zeit, Raid, Train, Goldene Stunde)
- 2 bis 3 Terrain-Sets, Kopplung an die Meilensteinkarte
- Kämpfe gegen Kreaturen, Boss-Phase, Heilen, Rollen-Fähigkeiten
- Schatten-Essenz, Loot-Truhen, Wetter, Rätselportale, Weltboss

**Paket 6: Haus-Duelle**
- Duell-Modus ohne Rollen-Boni
- Hauspunkte, Wochensieger, Banner, Pokal im Endscreen

**Paket 7: Plattformen und Feinschliff**
- TikTok, Kick, YouTube anbinden, Konten zusammenführen
- Twitch-Login als Ergänzung
- Admin-Panel, Testmodus, Sicherungen, Missbrauchs- und Datenschutz
- Verbündete und Streaming-Partner-Items

---

## 14. Bewusst gestrichen

- Figuren reagieren aufs Spiel (Sieg/Kill)
- Feste Effektstufen (stattdessen ein Sparmodus per Hotkey)
- Namensschilder über den Figuren
- Hauswechsel
- Dauerhafter Sound im Overlay

---

## 15. Offene Entscheidungen

1. Haus-Namen, Wappen und Farben
2. Gewichtung Chat gegen Watchtime (Lurker nicht benachteiligen)
3. Genaue Slot-Kurve und Level-Schwellen
4. Gilt ein einzelnes `!lurk` länger als 15 Minuten?
5. Wahl der Animations-Engine (PixiJS/Spine/DragonBones oder anderes), Prüfung durch Claude Code
6. Ob und wann ein zweiter PC kommt
7. Verbündete (Haus-Beziehungen) erst später

---

## 16. Hinweise für die Umsetzung

- Planung steht, **vor dem Bauen mit Paket 0 beginnen**.
- Vor jedem größeren Umbau Sicherung anlegen.
- Haus-Namen, Wappen und Rollen als Konfiguration/Variablen halten, nicht fest im Code.
- Alles so bauen, dass es auf einem PC gut läuft und später verschiebbar ist.
- Bezug zu bestehenden Plänen: NWU-Overlays (Portal-Trigger, Goldene Stunde, Saison-Look, Schatten-Train, Raid-Begrüßung) und Morrígan Command Station (Oracle-VPS, Streamer.bot, OBS-Anbindung).

---

## 17. Nachträge (18.10.2026)

- **Ton:** Auf der **Website** ist Ton erlaubt (mit Stumm-Knopf, startet erst nach dem ersten Klick). Im **Overlay** bleibt es bei: kein Ton, höchstens Pausen- und Startscreen.
- **Website wie ein Film:** Die Ritual-Seite wird eine Kamerafahrt über eine **Karte des NWU-Universums**. Start mit Blick über die Karte, bei jeder Frage fliegt die Kamera weiter, bei der Verkündung Zoom auf das Gebiet des Hauses, dort Wahl der Gestalt.
- **Karte:** gibt es noch nicht, wird neu erstellt. Sie dient gleichzeitig als Grundlage für die **Meilensteinkarte**.
- **Bilder:** Karte, Wappen und Charaktere werden mit **Gemini** erzeugt. Prompts: `docs/GEMINI-PROMPTS.md`.
- **Overlay-Figuren:** werden aus Gemini-Teile-Bögen **zerlegt** (getrennte Ebenen fürs Puppet-System). Nachbesserung einplanen.
- **Proportionen (Vorschlag):** leicht kindlich, etwa 3 Köpfe groß, damit die Figuren im Stream bei ca. 50 Pixeln erkennbar bleiben. Noch zu bestätigen.
- **Figuren-Stil (Entscheidung):** Alle Figuren im **Stil des Schattenkönig-Avatars**: Cartoon-Sticker/Emote-Look, dicker schwarzer Umriss, große klare Farbflächen, wenig Kleinkram, Chibi etwa 2,5 Köpfe hoch. Grund: im Stream bei ca. 56 px gut erkennbar und passend zur bestehenden NWU-Marke. Die Anime-Figuren von Haus 1 sind damit überholt (bleiben als Platzhalter, bis die neuen da sind). Karte, Gebiete und Wappen bleiben.
- **4 statt 6 Häuser (Entscheidung):** Zum Start gibt es nur **Mond, Blut, Nebel und Flamme**. Grund: Bei der aktuellen Community-Größe hätte jedes von 6 Häusern zu wenige Mitglieder für Duelle und Gemeinschaftsgefühl, außerdem 16 statt 24 Figuren. **Dornen und Raben** werden „verlorene Häuser“: Der Westen der Karte liegt in Dunkelheit und Nebel, die beiden erwachen später als Story-Event (z. B. bei einem großen Meilenstein). Wappen und Gebietsbilder bleiben dafür erhalten. Technisch: `verloren: true` in `data/haeuser.js`, das Quiz kennt nur die 4 aktiven Häuser.
