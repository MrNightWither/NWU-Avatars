// Ruhm: persönliche Erfahrung. Eine Quelle für Worker, Website und Overlay.
// Level n braucht insgesamt 50 × n × (n − 1) Ruhm: Level 2 = 100, Level 5 = 1.000, Level 10 = 4.500,
// Level 25 = 30.000, Level 50 = 122.500, Level 100 = 495.000. Plan und Begründung: docs/FORTSCHRITT.md
(function (ziel) {
  const R = {
    // Was Streamer.bot meldet und wie viel Ruhm es gibt
    quellen: {
      anwesenheit: { ruhm: 15,  name: 'Dabei sein (pro 10 Minuten)' },
      chat:        { ruhm: 5,   name: 'Im Chat geschrieben (höchstens einmal pro 10 Minuten)' },
      follow:      { ruhm: 50,  name: 'Folgen' },
      sub:         { ruhm: 200, name: 'Abo, Mitgliedschaft oder verschenktes Abo (pro Abo)', maxAnzahl: 100 },
      raid:        { ruhm: 150, name: 'Raid mitgebracht' },
      bits:        { ruhmPro100: 30, name: 'Bits (pro 100)', maxAnzahl: 100000 },
      pruefung:    { ruhm: 100, name: 'Morrígans Prüfung gewonnen' },
    },
    // Spiele im Overlay. Das Overlay meldet das Ergebnis über Streamer.bot, der Worker bucht nur diese Mengen
    // (verlierer: Abzug, aber nie unter den Beginn des eigenen Levels) und höchstens einmal pro pauseMinuten.
    // haus: zusätzlicher Ruhm für das Siegerhaus im Haus-Pokal, auch wenn niemand mitgemacht hat.
    spiele: {
      rabe:      { name: 'Fang den Raben', gewinner: 25, maxGewinner: 1, pauseMinuten: 3 },
      rennen:    { name: 'Wettrennen der Häuser (wer anfeuert)', gewinner: 30, haus: 100, pauseMinuten: 5 },
      tauziehen: { name: 'Tauziehen (wer mitzieht)', gewinner: 30, haus: 100, pauseMinuten: 3 },
      letzter:   { name: 'Letzter steht', gewinner: 150, maxGewinner: 1, pauseMinuten: 5 },
      schatz:    { name: 'Schatzsuche', gewinner: 100, verlierer: -20, pauseMinuten: 3 },
      // Kreaturen-Kampf hinter dem großen Portal (overlay/kampf.js): alle Mitkämpfer, kein Abzug bei Rückzug
      kreatur:   { name: 'Kreaturen der Spaltung besiegt', gewinner: 40, pauseMinuten: 4 },
      boss:      { name: 'Boss der Spaltung besiegt', gewinner: 150, pauseMinuten: 4 },
    },
    // Würfel der Morrígan (!wurf): einmal pro Stream (wurfStunden), 6 = doppelter Ruhm für doppeltStunden,
    // 1 = Gestalt für 5 Minuten verloren, 2–5 = Augenzahl × wurfRuhm
    wurfStunden: 10,
    doppeltStunden: 4,
    wurfRuhm: 10,
    // Wächter der Zitadelle (Mods, Partnerin) bekommen für Anwesenheit mehr: sie schreiben oft wenig,
    // sind aber da und halten Wache.
    waechterFaktor: 1.5,
    maxLevel: 100,
    ruhmFuerLevel: (n) => 50 * n * (n - 1),
    levelFuerRuhm(r) {
      const n = Math.floor((1 + Math.sqrt(1 + Math.max(0, r) / 12.5)) / 2);
      return Math.max(1, Math.min(R.maxLevel, n));
    },
    // Ruhm für eine Meldung (ohne Wächter-Faktor)
    menge(quelle, anzahl) {
      const q = R.quellen[quelle];
      if (!q) return 0;
      const n = Math.max(1, Math.min(q.maxAnzahl || 1, Math.floor(Number(anzahl) || 1)));
      return q.ruhmPro100 ? Math.floor(n / 100 * q.ruhmPro100) : q.ruhm * n;
    },
  };
  ziel.NWU_RUHM = R;
})(typeof window !== 'undefined' ? window : globalThis);
