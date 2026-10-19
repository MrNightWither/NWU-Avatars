// Erfolgskarte: zwei Wege mit echten Zahlen, getrennt pro Plattform.
//   Follower-Weg:      Follower / Abonnenten, bis 100.000
//   Unterstützer-Weg:  alles Bezahlte (Subs, Resubs, Gift-Subs, Mitgliedschaften), bis 2.000
// Nichts mit Avataren oder Schatten-Essenz zu tun. Jede Plattform läuft als eigener Marker.
//
// ort: Positionen der Stufen auf der Karte (Anteil von Breite/Höhe), passend zu den Landmarken der
// Erfolgs-Karte (assets/erfolge-karte.webp).
(function (ziel) {
  ziel.NWU_ERFOLGE = {
    karte: 'assets/erfolge-karte.webp',

    plattformen: [
      { id: 'twitch',  name: 'Twitch',  farbe: '#a970ff', kuerzel: 'T' },
      { id: 'youtube', name: 'YouTube', farbe: '#ff4e45', kuerzel: 'Y' },
      { id: 'kick',    name: 'Kick',    farbe: '#53fc18', kuerzel: 'K' },
      { id: 'tiktok',  name: 'TikTok',  farbe: '#25f4ee', kuerzel: '♪' },
    ],

    wege: [
      {
        id: 'follower', name: 'Weg der Gefolgschaft', einheit: 'Follower', farbe: '#e8c96d',
        plattformen: ['twitch', 'youtube', 'kick', 'tiktok'],
        stufen: [
          { wert: 100,    name: 'Die ersten Hundert', ort: { x: 0.090, y: 0.89 } },
          { wert: 250,    name: 'Das Lager',          ort: { x: 0.270, y: 0.80 } },
          { wert: 500,    name: 'Der Wachturm',       ort: { x: 0.115, y: 0.62 } },
          { wert: 1000,   name: 'Das Tausendtor',     ort: { x: 0.190, y: 0.47 } },
          { wert: 2500,   name: 'Die Steinbrücke',    ort: { x: 0.300, y: 0.48 } },
          { wert: 5000,   name: 'Die Festung',        ort: { x: 0.380, y: 0.35 } },
          { wert: 10000,  name: 'Die Silberne Halle', ort: { x: 0.510, y: 0.27 } },
          { wert: 25000,  name: 'Der Mondturm',       ort: { x: 0.610, y: 0.18 } },
          { wert: 50000,  name: 'Das Goldene Banner', ort: { x: 0.740, y: 0.23 } },
          { wert: 100000, name: 'Die Krone der Hunderttausend', ort: { x: 0.870, y: 0.17 } },
        ],
      },
      {
        id: 'unterstuetzer', name: 'Weg der Treue', einheit: 'Unterstützer', farbe: '#d0243f',
        plattformen: ['twitch', 'youtube', 'kick'],          // TikTok hat keine bezahlten Unterstützer
        stufen: [
          { wert: 10,   name: 'Der erste Schwur',   ort: { x: 0.930, y: 0.85 } },
          { wert: 25,   name: 'Der Kreis',          ort: { x: 0.710, y: 0.82 } },
          { wert: 50,   name: 'Die Blutbank',       ort: { x: 0.800, y: 0.69 } },
          { wert: 100,  name: 'Die Hundertschaft',  ort: { x: 0.880, y: 0.60 } },
          { wert: 250,  name: 'Die Ehrengarde',     ort: { x: 0.880, y: 0.47 } },
          { wert: 500,  name: 'Der Treueeid',       ort: { x: 0.720, y: 0.50 } },
          { wert: 1000, name: 'Die Tausend Schwüre', ort: { x: 0.650, y: 0.60 } },
          { wert: 2000, name: 'Der Bund der Zweitausend', ort: { x: 0.530, y: 0.57 } },
        ],
      },
    ],
  };

  // Wo steht eine Plattform auf einem Weg? Vor der ersten Stufe: index -1.
  ziel.NWU_ERFOLG_STAND = function (wegId, wert) {
    const weg = ziel.NWU_ERFOLGE.wege.find((w) => w.id === wegId);
    const s = weg.stufen;
    let i = -1;
    while (i + 1 < s.length && wert >= s[i + 1].wert) i++;
    const von = i >= 0 ? s[i].wert : 0, naechste = s[i + 1] || null;
    const anteil = naechste ? (wert - von) / (naechste.wert - von) : 1;
    return { weg, index: i, erreicht: s[i] || null, naechste, anteil: Math.max(0, Math.min(1, anteil)), wert, fertig: !naechste };
  };
})(typeof window !== 'undefined' ? window : globalThis);
