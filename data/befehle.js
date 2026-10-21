// Alle Chat-Befehle – eine Quelle für die Befehlsseite (befehle.html).
// wer: alle | waechter (Mods) | koenig (nur der Streamer)
(typeof window !== 'undefined' ? window : globalThis).NWU_BEFEHLE = [
  {
    gruppe: 'Dein Weg', befehle: [
      { befehl: '!bestätigen <Code>', text: 'Bindet dich nach dem Ritual an dein Haus. Den Code zeigt dir die Website.' },
      { befehl: '!nwu', text: 'Morrígan schickt dir den Link zum Ritual und zu dieser Seite.' },
      { befehl: '!nwu haare <Farbe>', text: 'Ändert die Haarfarbe deiner Figur (ab Level 5, seltene Farben ab Level 25). Geht auch unter „Mein Profil“.', z: '!nwu haare kupfer' },
      { befehl: '!nwu frisur <Name>', text: 'Neue Frisur ab Level 8 (mehr ab 18, alle 24 ab 35). Mit „keine“ zurück zur eigenen.', z: '!nwu frisur pferdeschwanz' },
      { befehl: '!nwu kopf <Name>', text: 'Kopfschmuck ab Level 30: Silberreif, Kapuze, Blumenkranz … später Hörner, Krone, Heiligenschein.', z: '!nwu kopf blumenkranz' },
      { befehl: '!nwu begleiter <Name>', text: 'Ein Tier läuft mit dir: ab Level 20 Rabe oder Katze, ab 45 Wolfswelpe oder Fledermaus, ab 70 noch seltener.', z: '!nwu begleiter rabe' },
      { befehl: '!anonym', text: 'Dein Name verschwindet aus der Chronik („Unbekannte Seele“). Nochmal schreiben = wieder sichtbar.' },
      { befehl: '!löschen', text: 'Löscht dein Profil endgültig. Morrígan fragt einmal nach, dann: !löschen ja' },
      { befehl: '!anmelden <Code>', text: 'Nur für die Website: meldet dich unter „Mein Profil“ an (Code gibt es dort).' },
      { befehl: '!verknüpfen <Code>', text: 'Im Kick- oder YouTube-Chat: verbindet das Konto mit deiner Figur (Code unter „Mein Profil“).' },
    ],
  },
  {
    gruppe: 'Deine Figur', befehle: [
      { befehl: '!lurk', text: 'Deine Figur setzt sich hin und schläft ein. Schreibst du wieder, wacht sie auf.' },
      { befehl: '!ruf', text: 'Ruft dein Haus: alle Figuren deines Hauses laufen zu dir und jubeln.' },
      { befehl: '!duell @Name', text: 'Fordert jemanden zum Duell. Wer gefordert wird, sagt mit !annehmen zu (60 Sekunden), dann kämpfen eure Figuren. Siege zählen in !stats.' },
    ],
  },
  {
    gruppe: 'Spiele', befehle: [
      { befehl: '!fang', text: 'Fliegt ein Rabe durchs Bild: wer zuerst schreibt, fängt ihn.' },
      { befehl: 'einfach schreiben', text: 'Beim Wettrennen schiebt jede Nachricht den Läufer deines Hauses an.' },
      { befehl: '!zieh', text: 'Beim Tauziehen für dein Haus ziehen.' },
      { befehl: '!dabei', text: 'Bei „Letzter steht“ anmelden.' },
      { befehl: '!grab oben / rechts / unten / links', text: 'Bei der Schatzsuche raten, wo die Truhe liegt. Richtig: +100 Ruhm, falsch: −20.' },
      { befehl: '!wurf', text: 'Würfel der Morrígan, einmal pro Stream: 6 = doppelter Ruhm, 1 = du verlierst kurz deine Gestalt.' },
      { befehl: '!a / !b / !c', text: 'Antwort bei Morrígans Prüfung. Wer zuerst richtig liegt, gewinnt 100 Ruhm.' },
      { befehl: '!angriff', text: 'Beim Kampf gegen die Kreaturen der Spaltung: ein starker Schlag deiner Figur (alle 3 Sekunden). Sieg = Ruhm für alle Mitkämpfer.' },
    ],
  },
  {
    gruppe: 'Wächter der Zitadelle', wer: 'waechter', befehle: [
      { befehl: '!wache', text: 'Die Wächter stellen sich zusammen und bleiben bis zum Ende des Streams.' },
      { befehl: '!rennen · !tauziehen · !letzter · !schatz · !rabe', text: 'Startet ein Spiel. !tauziehen mond blut wählt die Häuser.' },
      { befehl: '!portal [eis · stein · sumpf · feuer] [boss]', text: 'Öffnet das große Portal: alle kämpfen gemeinsam gegen die Kreaturen der Spaltung. Ohne Welt zufällig, mit boss ein Bosskampf.', z: '!portal eis boss' },
    ],
  },
  {
    gruppe: 'Nur der Schattenkönig', wer: 'koenig', befehle: [
      { befehl: '!levelup @Name', text: 'Erhebt jemanden um ein Level (oder !levelup @Name 5 auf ein bestimmtes).' },
      { befehl: '!pruefung', text: 'Morrígan stellt eine Frage zur Geschichte.' },
      { befehl: '!prophezeiung', text: 'Morrígan spricht eine Prophezeiung.' },
    ],
  },
];
