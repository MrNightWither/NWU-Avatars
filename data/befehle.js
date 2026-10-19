// Alle Chat-Befehle – eine Quelle für die Befehlsseite (befehle.html).
// wer: alle | waechter (Mods) | koenig (nur der Streamer)
(typeof window !== 'undefined' ? window : globalThis).NWU_BEFEHLE = [
  {
    gruppe: 'Dein Weg', befehle: [
      { befehl: '!bestätigen <Code>', text: 'Bindet dich nach dem Ritual an dein Haus. Den Code zeigt dir die Website.' },
      { befehl: '!haare <Farbe>', text: 'Ändert die Haarfarbe deiner Figur (ab Level 5, seltene Farben ab Level 25). Geht auch unter „Mein Profil“.', z: '!haare kupfer' },
      { befehl: '!nwu', text: 'Morrígan schickt dir den Link zum Ritual und zu dieser Seite.' },
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
      { befehl: '!duell @Name', text: 'Fordert jemanden zum Ehrenduell. Es geht nur um die Ehre, kein Ruhm.' },
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
    ],
  },
  {
    gruppe: 'Wächter der Zitadelle', wer: 'waechter', befehle: [
      { befehl: '!wache', text: 'Die Wächter stellen sich zusammen und bleiben bis zum Ende des Streams.' },
      { befehl: '!rennen · !tauziehen · !letzter · !schatz · !rabe', text: 'Startet ein Spiel. !tauziehen mond blut wählt die Häuser.' },
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
