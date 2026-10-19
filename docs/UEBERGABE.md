# Übergabe: Stand und offene Entscheidungen (18.10.2026)

Für die Weiterarbeit mit Claude Code direkt auf dem Stream-PC (Overlays, Kameras, OBS).
Erst `README.md`, `docs/GESCHICHTE.md`, `docs/FORTSCHRITT.md` lesen.

## Zeitplan und großer Bogen (Stand 19.10.2026)

- **Release erst, wenn alles fertig ist – Ziel: in etwa einem Monat (ca. 19.11.2026).** Bis dahin in Ruhe testen.
  Vorher kommen eigene Sachen (KI, Sicherheitspatches). Nichts davon geht beim nächsten Stream live.
- **Warum das Ganze:** Wie Stream Avatars (Figuren laufen, kämpfen), aber **mit Geschichte**: Die Community heißt Unity,
  der Prolog erklärt, wie es zur Spaltung kam – und die Geschichte bleibt bewusst offen für die Wiedervereinigung.
- **Die Häuser kehren mit der Community zurück** (regelmäßige Zuschauer, jeweils **4 Streams hintereinander**):
  1. **Dornen** erwachen bei **50 Zuschauern**.
  2. **Raben** (das letzte verborgene Haus) bei **500 Zuschauern**.
  3. **Die Vereinigung** bei **1.000 Zuschauern**: Unity wird wieder ein Bündnis, eine Familie. Kein Haus-gegen-Haus mehr
     (nur noch Spaßduelle), stattdessen kämpfen alle gemeinsam gegen Kreaturen. Level, Ruhm und Freischaltungen bleiben,
     das Overlay läuft weiter.
  Technisch: `verloren: true` in `data/haeuser.js` entfernen, Quiz/Film um das Haus ergänzen, Nebel im Westen lichten,
  Hauspokal und Haus-Spiele (Rennen, Tauziehen) nach der Vereinigung abschalten oder umbauen. Das ersetzt die frühere
  Idee „Das Erwachen über die Reise-Karte“.

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

## Gebaut am 18.10. (abends, in der Cloud)

Alles getestet (Worker-Tests, Overlay/Website im Browser), aber noch nicht live mit Streamer.bot und Worker:
- **Ruhm automatisch** (`data/ruhm.js`, Worker `POST /ruhm`, Streamer.bot-Code) inkl. Wächter ×1,5
- **Silhouette** für Ungebundene + Verwandlung nach dem Ritual + Morrígans Hinweis (First Words)
- **Haus-Pokal** (`/pokal`) mit Krone für das Siegerhaus, **Chronik** (`chronik.html`, `/chronik`)
- **Morrígans Prüfung** (26 Fragen, `/pruefung/*`, Overlay-Karte, Streamer.bot-Code)
- **Zeichen der Zitadelle** (Mods: goldener Ring; Rolle `koenigin`: Diadem + Schimmer)
- **Ehrenduelle** (`!duell @Name`, Taste D)
- **Mipmaps** für die Figuren (in OBS prüfen, ob es schärfer/ruhiger aussieht)

Später am 18.10. dazugekommen (ebenfalls getestet, nicht live):
- **Zurück-Knopf** im Ritual, Bestätigung vor Morrígans Urteil, andere Gestalt wählen
- **Haus-Ruf** (`!ruf`), **Wächter-Wache** (`!wache`), **Willkommen** für Neu-Gebundene
- **Flüstern aus dem Westen** (Rabe/Dornen am linken Rand, `fluesternMinuten`)
- **Morrígans Prophezeiung** (`/prophezeiung`, Overlay-Karte) und **Jahrestag der Bindung**
- **Figurenseite** `figur.html` und **Hausseiten** `haus.html` (mit Geschichte je Haus in `data/haeuser.js`)
- Hinweis: Auf der Website zeigen die Figurenbilder noch die Standard-Haarfarbe des Hauses, nicht die eigene.

Ebenfalls am 18.10. (getestet im Browser und mit Worker-Tests, nicht live):
- **Spiele im Overlay** (auch zufällig von allein, Siegerhaus bei Rennen/Tauziehen +100 Pokal-Ruhm): Fang den Raben (`!fang`), Wettrennen der Häuser (`!rennen`), Tauziehen (`!tauziehen`, `!zieh`),
  Letzter steht (`!letzter`, Anmeldung `!dabei`), Schatzsuche (`!schatz`, `!grab oben`, +100 / −20 Ruhm),
  Würfel der Morrígan (`!wurf`). Das Overlay meldet Ergebnisse über den **Streamer.bot-WebSocket-Server** an die
  Aktion „NWU Spiel“, der Worker bucht feste Mengen (`/spiel`, `/wurf`). Einrichtung: `worker/README.md`.
  Offen: am PC WebSocket-Server einschalten, `streamerbot` in `overlay/config.js` eintragen, Aktionen anlegen.
  Tauziehen läuft an der **oberen** Kante (unten hängen die Figuren kopfüber).

## Gebaut 19.10. (getestet mit Worker-Tests und im Browser, nicht live)

- **Keine Namen im Overlay** – Namen nur im Chat (Bot markiert mit @Name).
- **Nur Twitch beim Ritual**; Kick/YouTube unter „Mein Profil“ verknüpfen (`!verknüpfen <code>` im jeweiligen Chat). TikTok nie.
- **Ritual-Antworten werden nach der Bindung nicht gespeichert** (Profil `quiz` = NULL, Anmeldung geleert, nach 7 Tagen gelöscht).
- **Mein Profil** (`ich.html`): Anmelden per Code (`!anmelden 1234`, 30 Tage pro Gerät, nur Hash des Schlüssels in der DB),
  Haarfarbe, Anonym, Konten, Profil löschen, Abmelden.
- **`!anonym`**: Chronik zeigt „Unbekannte Seele“, Figurenseite nicht per Name auffindbar.
- **`!löschen` → `!löschen ja`** und Löschen-Knopf auf der Website: löscht sofort alles in Cloudflare.
- **Besucher-Figur** vorbereitet (`besucher` in `overlay/config.js`), Prompt in `GEMINI-PROMPTS.md` Abschnitt 13. Bis das Bild
  da ist: Silhouette.
- Streamer.bot-Code für `!anmelden`, `!anonym`, `!löschen`, `!verknüpfen`: `worker/README.md`.
- Offen: **Datenschutztext** (Kurzfassung) anpassen – auf Wunsch erst später. Am PC prüfen, wie in deiner
  Streamer.bot-Version das Plattform-Argument heißt (`commandSource`).
- Offen: eigene Figuren für dich (Schattenkönig) und die Partnerin (Prompts: `GEMINI-PROMPTS.md` Abschnitt 14).

## Gebaut 19.10. (abends): die Bilder von Gemini

- **Reise-Karte** (vier Pfade) und **Erfolgs-Karte** eingesetzt, alle Orte auf die Landmarken gesetzt.
- **Prolog** mit vier Bildern: Morrígan mit der Kugel, Unity-Fest, die Spaltung, der Westen.
- **Haus-Abzeichen** (Blut, Nebel, Flamme) ab Level 2 an der Figur, dazu auf Haus- und Figurenseite.
- **24 Frisuren + Glatze, 12 Kopfschmuck, 6 Begleiter**: Overlay, Chat (`!frisur`, `!kopf`, `!begleiter`), „Mein Profil“,
  Level-Freischaltungen, Stufen-Seite. Streamer.bot-Aktion „Aussehen“ ersetzt die alte „Haare“.
- **Besucher und Besucherin** aus Teilen für alle ohne Ritual.
- Rohbilder liegen in `assets/roh/` (Bögen), fertige Teile in `overlay/frisuren`, `overlay/kopfschmuck`,
  `overlay/begleiter`, `overlay/symbole`, `overlay/figuren/besucher*`.
- Noch offen bei den Bildern: Kopfschmuck auf dem Schatten (Kapuze) sitzt nur ungefähr – live in OBS prüfen.
  Website-Bilder der Figuren zeigen noch nicht die eigene Frisur/Farbe.

## Gewünschte Features (Reihenfolge-Vorschlag, ursprünglich)

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

## Prolog vorlesen (offen)

`prolog.html` spielt Sprachdateien `assets/stimme/prolog-01.mp3` … `prolog-13.mp3` ab, wenn sie da sind
(Texte: `docs/PROLOG-TEXT.md`). Stimme: die eigene KI-Stimme. Sie klingt jung – entweder älter machen
(Tonhöhe −2 bis −4 Halbtöne, langsamer, etwas Hall, Höhen absenken, z. B. in Audacity) oder bewusst jung
lassen (Idee für die Geschichte: Morrígan ist uralt, die Kugel hält sie jung).

## Ideen für später (gemerkt, noch nicht gebaut)

- **Kanalpunkte:** Zuschauer lösen für Kanalpunkte etwas mit ihrer Figur aus (tanzen, Funken sprühen,
  kurz auf dem Thron der Zitadelle sitzen). Streamer.bot → Reward Redemption → Bot-Nachricht, die das Overlay liest.
- **Stream-Ende:** Alle Figuren verneigen sich, winken und gehen durch das Portal (Streamer.bot „Stream Offline“
  oder Taste/Befehl kurz vor Schluss).
- **Kreaturen-Kämpfe:** alle Häuser gemeinsam gegen Kreaturen der Spaltung, Untergrund je nach Portal
  (Eis, roter Stein, Sumpf, Lava). Braucht Gemini-Bilder (Kreaturen, Untergründe).
- **Das Erwachen:** einmaliges Live-Event, wenn die Zitadelle auf der Reise-Karte erreicht ist – Nebel lichtet sich
  in Overlay und Website, Raben und Dornen werden wählbar (`verloren: true` entfernen, Quiz/Film ergänzen).
- **Truhe oder Falle:** drei Truhen, der Chat stimmt ab, welche du öffnest; Belohnung für alle oder Strafe für dich.
- **Haus-Lotterie:** nur mit einer eigenen Spielwährung (nicht mit Ruhm, sonst verliert man Level; und kein
  Glücksspiel mit etwas, das man über Subs/Bits bekommen hat).
