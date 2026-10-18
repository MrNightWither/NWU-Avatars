# Übergabe: Stand und offene Entscheidungen (18.10.2026)

Für die Weiterarbeit mit Claude Code direkt auf dem Stream-PC (Overlays, Kameras, OBS).
Erst `README.md`, `docs/GESCHICHTE.md`, `docs/FORTSCHRITT.md` lesen.

## Was steht

- **Website** (GitHub Pages, Demo-Modus bis der Worker läuft): Ritual als Film über die Karte, Nebel zieht beim
  Start auf, 4 Häuser (Mond, Blut, Nebel, Flamme), Raben und Dornen verborgen im Westen. Seiten: `reise.html`,
  `erfolge.html`, `stufen.html`. Test: `?haus=1` landet immer in Haus 1.
- **Overlay** `overlay/avatare.html`: 16 Figuren (4 Häuser × Klinge/Seher/Schatten/Hüter) aus Teilen mit Gelenken,
  Haare pro Person einfärbbar, Staub/Funken nach Level, Portal mit Terrain, Raid, Level-Up, Chat mitlesen.
- **Worker** `worker/` (noch nicht hochgeladen): Anmeldung, Bestätigung per Chat-Code, Profil, `!levelup`,
  `!haare`, Reise-Essenz, Erfolge. `npm test` läuft durch.

## Entscheidungen aus dem Gespräch

1. **Mods und Partnerin machen ganz normal das Ritual**, kommen in ein Haus, sammeln Ruhm und schalten frei wie
   alle. Zusätzlich tragen sie ein **Zeichen der Zitadelle** (sie gehören auch zur Zitadelle):
   - Mods = **Wächter der Zitadelle**: goldener Saum am Umhang oder Wächter-Abzeichen, bleiben länger sichtbar
     (schon gebaut), erste Reihe bei Kreaturen-Kämpfen.
   - Partnerin: eigene Rolle (Vorschläge in `GESCHICHTE.md`: Schattenkönigin, Hüterin der Kugel, Stimme des
     Westens), z. B. eigene Krone oder Aura. Sie entscheidet.
   - **Die Partnerin ist auch Mod.** Sie bekommt also alles, was Wächter haben (bleibt länger sichtbar, erste
     Reihe bei Kreaturen, Wächter-Ruhm), **und zusätzlich** ihr eigenes Zeichen. Ihr eigenes Aussehen geht vor
     dem Wächter-Aussehen, die Wächter-Rechte bleiben.
   - Technisch: Mod-Verhalten im Overlay kommt vom Twitch-Abzeichen im Chat (`u.mod`), gilt also automatisch.
     Das Aussehen kommt aus `profil.rolle` (`waechter`, `koenigskreis`, …). Für die Partnerin eine eigene Rolle
     (z. B. `koenigin`) anlegen, die Wächter-Rechte **mit einschließt**. Aussehen pro Rolle fehlt noch.
2. **Ruhm ohne viel zu schreiben**: Wer still zuschaut (Mods, Partnerin, Lurker), soll trotzdem leveln.
   Vorschlag: Ruhm vor allem für **Anwesenheit** (Streamer.bot „Present Viewers“, z. B. alle 10 Minuten),
   Chatten nur als kleiner Bonus. Mods bekommen zusätzlich **Wächter-Dienst** (Ruhm für Moderations-Aktionen
   oder einfach etwas mehr pro Anwesenheit).
3. **Mond auf allen Rüstungen ist Absicht**: Der Mond war das Zeichen von Unity. Das eigene Haus-Zeichen kommt
   ab Level 2 **zusätzlich** dazu (Prompts: `GEMINI-PROMPTS.md` Abschnitt 8).
4. **Wer noch nicht gebunden ist, läuft als Silhouette** (schwarze Schattenfigur ohne Haus). Schreibt so jemand
   im Chat, antwortet Morrígan einmal pro Stream: *„Du gehörst noch keinem Haus an. Vollende das Ritual …“*
   mit Link (Streamer.bot, Cooldown pro Person). Im Overlay bekommen Ungebundene im Moment noch eine zufällige
   Figur – das soll die Silhouette werden.
5. **TikTok: keine Figuren im TikTok-Stream** (Hochformat, wäre zu klein). TikTok bleibt auf Reise- und
   Erfolgskarte (Zahlen), nur kein Figuren-Overlay. ❓ noch bestätigen.
6. **Drei Szenen**: zwei verschiedene Kameras und eine Szene **ohne Kamera**. Für jede Szene in
   `overlay/config.js` → `szenen` einen Laufweg eintragen. Ohne Kamera brauchen die Figuren einen anderen Weg
   (z. B. unterer Bildrand als Terrain-Streifen oder Rahmen eines anderen Elements). Am PC in OBS ausmessen.

## Gewünschte Features (Reihenfolge-Vorschlag)

1. **Ruhm automatisch** (Grundlage für alles) – inkl. Anwesenheit für stille Zuschauer
2. **Silhouette** für Ungebundene + Morrígans Hinweis im Chat
3. **Zeichen der Zitadelle** für Mods und Partnerin
4. **Haus-Pokal** (Banner der Zitadelle) und **Chronik** (Rangliste auf der Website)
5. **Morrígans Prüfung** (Fragen zur Geschichte im Chat)
6. **Ehrenduelle** (`!duell @Name`)
7. **Auftritt des Schattenkönigs** bei Stream-Start (braucht seine Figur von der Seite + Teile-Bogen)
8. **Kreaturen-Kämpfe** unten am Terrain, gemeinsam gegen Kreaturen der Spaltung, Untergrund je nach Portal
   (Eis, roter Stein, Sumpf, Lava) – braucht Prompts für Kreaturen und Untergründe

## Noch zu tun außerhalb des Codes

- GitHub Pages einschalten, Worker hochladen (`worker/README.md`), Streamer.bot-Aktionen anlegen
- Twitch-Kanal in `overlay/config.js` eintragen
- Bilder: Haus-Symbole, Frisuren, Kopfschmuck, Begleiter (`GEMINI-PROMPTS.md` 8–11), Reise- und Erfolgskarte (6–7)
- Zahlen für Subs/Mitglieder pro Plattform (Erfolgskarte)
- Rolle der Partnerin, Grund der Spaltung (darf auch offen bleiben)

## Qualität der Figuren im Stream (offen, wichtig)

Test 18.10.: Bei 56 px Höhe verschwimmen Haare, Gravuren und Waffen – die Illustrationen haben zu viele feine
Details für diese Größe. Bei 96 px erkennt man fast alles. Dicke Umrisse per Programm nachträglich zu
erzeugen hilft nicht (Rüstungsschatten werden mit schwarz).

Stream Avatars wirkt scharf, weil es Pixel-Art ist, die für die kleine Größe gezeichnet und ganzzahlig
hochskaliert wird.

Plan:
1. Figuren größer zeigen (80–100 px statt 56, `figurHoehe` in `overlay/config.js`) und in OBS vergleichen.
2. „Klein-Version“ je Figur von Gemini: vereinfacht, großer Kopf, dicke Linien, keine feinen Details
   (Prompt steht im Chat-Verlauf; als Test zuerst die Klinge).
3. Mipmaps für die Figuren-Texturen aktivieren (weicheres Verkleinern ohne Flimmern), in OBS prüfen.
4. Erst wenn das nicht reicht: echte Pixel-Art mit Laufbildern (größter Umbau, eher mit Zeichner).
