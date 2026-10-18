// Meilensteinkarte: vier Pfade, einer pro Plattform, alle führen zur Zitadelle.
// Jede Plattform sammelt ihre eigene Schatten-Essenz und bringt damit ihren Pfad voran.
// Die Zitadelle öffnet sich erst, wenn ALLE vier Pfade angekommen sind.
// Gilt für Website, Stream-Szene und Worker.
//
// ort: Position auf der Karte als Anteil von Breite/Höhe (0–1).
// Die Orte passen grob auf die PLATZHALTER-Karte (assets/karte.webp) und werden neu gesetzt,
// sobald die eigene Reise-Karte da ist.
(function (ziel) {
  ziel.NWU_REISE = {
    karte: 'assets/karte.webp',

    // Wie viel Essenz bringt was? Standard für Twitch, YouTube und Kick (anpassbar).
    // Ein Pfad kann eigene Regeln haben (siehe TikTok unten).
    essenz: {
      chatNachricht: 1,        // pro Nachricht, gesammelt von Streamer.bot
      chatMaxProPaket: 120,    // Obergrenze pro 5-Minuten-Paket (gegen Spam)
      follow: 15,
      sub: 60,                 // Sub / Mitglied / Gift, pro Stück
      bitsPro100: 10,          // Bits, Kick-Kicks, TikTok-Geschenke umgerechnet
      raid: 80,
      streamStunde: 100,
    },

    // Gemeinsames Ziel in der Mitte
    zitadelle: { name: 'Die Zitadelle', ort: { x: 0.50, y: 0.42 }, text: 'Der Thron des Schattenkönigs. Erst wenn alle vier Pfade ankommen, öffnen sich die Tore.' },

    pfade: [
      {
        id: 'twitch', name: 'Pfad der Raben', plattform: 'Twitch', farbe: '#a970ff',
        meilensteine: [
          { id: 'tw1', name: 'Das Erwachen',      essenz: 0,     ort: { x: 0.10, y: 0.20 }, text: 'Hier begann alles. Aus dem Schatten trat eine Krone.' },
          { id: 'tw2', name: 'Die Gräberklippe',  essenz: 500,   ort: { x: 0.14, y: 0.42 }, text: 'Die Toten flüstern jedem, der vorbeigeht, einen Namen zu.' },
          { id: 'tw3', name: 'Brücke der Raben',  essenz: 4000,  ort: { x: 0.25, y: 0.33 }, text: 'Die Raben zählen jeden, der hinübergeht.' },
          { id: 'tw4', name: 'Sumpf der Flüche',  essenz: 8000,  ort: { x: 0.32, y: 0.47 }, text: 'Wer hier stehen bleibt, versinkt.' },
          { id: 'tw5', name: 'Das Rabentor',      essenz: 13000, ort: { x: 0.43, y: 0.42 }, text: 'Das erste Tor der Zitadelle. Schwarz wie Federn.' },
        ],
      },
      {
        id: 'youtube', name: 'Pfad des Blutes', plattform: 'YouTube', farbe: '#ff4e45',
        meilensteine: [
          { id: 'yt1', name: 'Die Rote Stadt',    essenz: 0,     ort: { x: 0.84, y: 0.17 }, text: 'Hinter roten Mauern schwört man ewige Treue.' },
          { id: 'yt2', name: 'Die Blutfurt',      essenz: 500,   ort: { x: 0.70, y: 0.30 }, text: 'Das Wasser ist rot. Niemand fragt, warum.' },
          { id: 'yt3', name: 'Die Bannerwacht',   essenz: 4000,  ort: { x: 0.64, y: 0.20 }, text: 'Hier weht jedes Banner, das je gefallen ist.' },
          { id: 'yt4', name: 'Die Klingenschlucht', essenz: 8000, ort: { x: 0.60, y: 0.34 }, text: 'Ein Schritt daneben, und der Fels schneidet.' },
          { id: 'yt5', name: 'Das Rote Tor',      essenz: 13000, ort: { x: 0.55, y: 0.38 }, text: 'Das zweite Tor der Zitadelle. Es glüht, wenn man es berührt.' },
        ],
      },
      {
        id: 'kick', name: 'Pfad der Dornen', plattform: 'Kick', farbe: '#53fc18',
        meilensteine: [
          { id: 'ki1', name: 'Der Wurzelgrund',   essenz: 0,     ort: { x: 0.10, y: 0.82 }, text: 'Unter den Wurzeln schläft etwas Altes.' },
          { id: 'ki2', name: 'Der Dornenwall',    essenz: 500,   ort: { x: 0.20, y: 0.70 }, text: 'Nur wer blutet, kommt hindurch.' },
          { id: 'ki3', name: 'Die Runensteine',   essenz: 4000,  ort: { x: 0.30, y: 0.80 }, text: 'Alte Zeichen, die nur lesen kann, wer zusammenhält.' },
          { id: 'ki4', name: 'Der Friedhof am Fluss', essenz: 8000, ort: { x: 0.38, y: 0.62 }, text: 'Die Steine stehen schief. Die Toten auch.' },
          { id: 'ki5', name: 'Das Dornentor',     essenz: 13000, ort: { x: 0.45, y: 0.52 }, text: 'Das dritte Tor der Zitadelle. Es wächst jede Nacht ein Stück.' },
        ],
      },
      {
        id: 'tiktok', name: 'Pfad des Nebels', plattform: 'TikTok', farbe: '#25f4ee',
      // TikTok hat keine Subs, Bits oder Raids – hier zählen Likes, Zuschauer und Follower.
      // Kommt über Tikory (Webhook / Streamer.bot-Ausführung).
      essenz: {
        likesPro100: 3,
        likesMaxProPaket: 60,    // pro 5-Minuten-Paket
        zuschauer: 1,            // pro Zuschauer, alle 5 Minuten
        zuschauerMaxProPaket: 40,
        follow: 15,
        streamStunde: 100,
      },
        meilensteine: [
          { id: 'tt1', name: 'Die Nebelküste',    essenz: 0,     ort: { x: 0.90, y: 0.80 }, text: 'Hier endet das Land und beginnt der Nebel.' },
          { id: 'tt2', name: 'Die Versunkenen Ruinen', essenz: 500,  ort: { x: 0.82, y: 0.62 }, text: 'Was der Nebel verschluckt, gibt er nicht zurück.' },
          { id: 'tt3', name: 'Die Schwarze Schmiede', essenz: 4000, ort: { x: 0.63, y: 0.60 }, text: 'Hier wird geschmiedet, was die Zitadelle öffnen kann.' },
          { id: 'tt4', name: 'Die Laternen',      essenz: 8000,  ort: { x: 0.60, y: 0.73 }, text: 'Folge dem Licht. Aber nicht jedem.' },
          { id: 'tt5', name: 'Das Nebeltor',      essenz: 13000, ort: { x: 0.55, y: 0.52 }, text: 'Das vierte Tor der Zitadelle. Niemand hat es je ganz gesehen.' },
        ],
      },
    ],
  };

  // Essenz-Regeln eines Pfads: eigene Regeln, sonst der Standard
  ziel.NWU_REISE_REGELN = function (pfadId) {
    const pfad = ziel.NWU_REISE.pfade.find((p) => p.id === pfadId);
    return (pfad && pfad.essenz) || ziel.NWU_REISE.essenz;
  };

  // Wie viel Essenz bringt ein Ereignis auf einem Pfad? null = gibt es dort nicht.
  ziel.NWU_ESSENZ_FUER = function (pfadId, quelle, anzahl) {
    const E = ziel.NWU_REISE_REGELN(pfadId);
    const n = Math.max(0, Math.floor(Number(anzahl) || 1));
    const deckel = (wert, max) => (max ? Math.min(wert, max) : wert);
    switch (quelle) {
      case 'chat': return E.chatNachricht ? deckel(n * E.chatNachricht, E.chatMaxProPaket) : null;
      case 'follow': return E.follow ?? null;
      case 'sub': return E.sub ? Math.min(n, 100) * E.sub : null;
      case 'bits': return E.bitsPro100 ? Math.floor(Math.min(n, 1000000) / 100) * E.bitsPro100 : null;
      case 'raid': return E.raid ?? null;
      case 'stunde': return E.streamStunde ?? null;
      case 'likes': return E.likesPro100 ? deckel(Math.floor(Math.min(n, 10000000) / 100) * E.likesPro100, E.likesMaxProPaket) : null;
      case 'zuschauer': return E.zuschauer ? deckel(Math.min(n, 100000) * E.zuschauer, E.zuschauerMaxProPaket) : null;
      default: return null;
    }
  };

  // Wo steht ein Pfad bei einer bestimmten Essenz-Menge?
  ziel.NWU_REISE_STAND = function (essenz, pfadId) {
    const pfad = ziel.NWU_REISE.pfade.find((p) => p.id === pfadId);
    const m = pfad.meilensteine;
    let i = 0;
    while (i + 1 < m.length && essenz >= m[i + 1].essenz) i++;
    const naechster = m[i + 1] || null;
    const anteil = naechster ? (essenz - m[i].essenz) / (naechster.essenz - m[i].essenz) : 1;
    return { pfad, index: i, erreicht: m[i], naechster, anteil: Math.max(0, Math.min(1, anteil)), essenz, angekommen: !naechster };
  };
})(typeof window !== 'undefined' ? window : globalThis);
