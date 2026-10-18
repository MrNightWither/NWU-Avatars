// Meilensteinkarte: die gemeinsame Reise der Community.
// Eine Währung für alles: Schatten-Essenz. Jede Quelle bringt Essenz, jeder Meilenstein
// liegt bei einer Essenz-Schwelle. Gilt für Website, Stream-Szene und Worker.
//
// ort: Position auf der Reise-Karte als Anteil von Breite/Höhe (0–1).
// Die Orte unten passen grob auf die PLATZHALTER-Karte (assets/karte.webp) und werden
// neu gesetzt, sobald die eigene Reise-Karte da ist.
(typeof window !== 'undefined' ? window : globalThis).NWU_REISE = {
  karte: 'assets/karte.webp',

  // Wie viel Essenz bringt was? (anpassbar)
  essenz: {
    chatNachricht: 1,        // pro Nachricht, gesammelt von Streamer.bot
    chatMaxProPaket: 120,    // Obergrenze pro 5-Minuten-Paket (gegen Spam)
    follow: 15,
    sub: 60,                 // auch Gift-Sub, pro Sub
    bitsPro100: 10,
    raid: 80,
    streamStunde: 100,
  },

  meilensteine: [
    { id: 'm01', name: 'Das Erwachen',        essenz: 0,     ort: { x: 0.14, y: 0.90 }, text: 'Hier begann alles. Aus dem Schatten trat eine Krone.' },
    { id: 'm02', name: 'Sumpf der Flüche',    essenz: 1000,  ort: { x: 0.30, y: 0.80 }, text: 'Wer hier stehen bleibt, versinkt. Wer weitergeht, wird stärker.' },
    { id: 'm03', name: 'Die Runensteine',     essenz: 2500,  ort: { x: 0.27, y: 0.60 }, text: 'Alte Zeichen, die nur lesen kann, wer zusammenhält.' },
    { id: 'm04', name: 'Der Nebelpfad',       essenz: 4500,  ort: { x: 0.40, y: 0.50 }, text: 'Im Nebel verliert man den Weg. Gemeinsam findet man ihn.' },
    { id: 'm05', name: 'Brücke der Raben',    essenz: 7000,  ort: { x: 0.31, y: 0.33 }, text: 'Die Raben zählen jeden, der hinübergeht.' },
    { id: 'm06', name: 'Die Schwarze Schmiede', essenz: 10000, ort: { x: 0.60, y: 0.60 }, text: 'Hier wird geschmiedet, was die Zitadelle öffnen kann.' },
    { id: 'm07', name: 'Die Blutfurt',        essenz: 14000, ort: { x: 0.70, y: 0.42 }, text: 'Das Wasser ist rot. Niemand fragt, warum.' },
    { id: 'm08', name: 'Am Mondsee',          essenz: 19000, ort: { x: 0.55, y: 0.18 }, text: 'Im Spiegel des Sees zeigt sich der letzte Weg.' },
    { id: 'm09', name: 'Die Zitadelle',       essenz: 25000, ort: { x: 0.50, y: 0.42 }, text: 'Der Thron des Schattenkönigs. Das Ende der ersten Reise.' },
  ],
};

// Hilfsfunktion: wo steht die Reise bei einer bestimmten Essenz-Menge?
(typeof window !== 'undefined' ? window : globalThis).NWU_REISE_STAND = function (essenz) {
  const m = (typeof window !== 'undefined' ? window : globalThis).NWU_REISE.meilensteine;
  let i = 0;
  while (i + 1 < m.length && essenz >= m[i + 1].essenz) i++;
  const naechster = m[i + 1] || null;
  const anteil = naechster ? (essenz - m[i].essenz) / (naechster.essenz - m[i].essenz) : 1;
  return { index: i, erreicht: m[i], naechster, anteil: Math.max(0, Math.min(1, anteil)), essenz };
};
