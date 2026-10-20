// Portal-Welten und Kreaturen der Spaltung – eine Quelle fürs Overlay (overlay/kampf.js).
// Seit der Spaltung kriechen aus den Rissen Kreaturen. Gegen sie kämpfen alle Häuser gemeinsam.
// Öffnet sich das große Portal, wird eine der vier Welten gewählt (zufällig oder per !portal eis / stein / sumpf / feuer).
//
// BILDER: Solange ein Pfad leer ist (''), zeichnet das Overlay einen Platzhalter. Ist das Bild da
// (Gemini-Prompts: docs/GEMINI-PROMPTS.md Abschnitt 15), nur den Pfad eintragen – relativ zu overlay/, z. B.
//   boden: 'welten/mond-boden.webp'
// Kreaturen: bild = ganze Kreatur als ein Bild (Seitenansicht, Blick nach LINKS, freigestellt). Das Overlay lässt
// sie dann federn, wippen und zuschlagen. Für bewegte Beine und Maul später zusätzlich teile = [ … ] wie in
// overlay/rigs.js (Teile aus tools/teile.py): { id, art: 'rumpf'|'kopf'|'kiefer'|'bein'|'arm'|'schwanz', bild, anker: [x, y],
// pos: [x, y], an: 'kopf' (nur kiefer), versatz: Schrittversatz } und hoehe = Bildhöhe in Pixeln.
//
// bauart (für den Platzhalter): vierbeiner, kriecher, schweber, koloss.
// groesse = Höhe im Verhältnis zur Figurhöhe, leben = Grund-Lebenspunkte (wächst mit der Zahl der Kämpfer).
(function (ziel) {
  const WELTEN = {
    mond: {
      id: 'mond', haus: 'haus1', name: 'Die Eisseen des Mondes', kurz: 'Eiswelt',
      text: 'Hinter dem Portal liegen gefrorene Seen. Aus einem Riss im Eis kriecht etwas.',
      portal: { ring: 0xbfe3ff, glanz: 0x6fa8ff, innen: 0x0a1424, wirbel: [0x9fdcff, 0xffffff] },
      boden: { farbe: 0xb9d3ea, dunkel: 0x5d7a98, linie: 0xe6f4ff, art: 'eis' },
      himmel: { farbe: 0x4a6a96, berge: 0x34557e, art: 'eistuerme' },
      wetter: { art: 'schnee', farbe: 0xffffff, menge: 1 },
      bilder: { boden: '', hintergrund: '', portal: '' },
      kreaturen: [
        { id: 'frostling', name: 'Frostling', bauart: 'schweber', groesse: 0.8, leben: 10,
          farben: { haut: 0xcfe6f7, dunkel: 0x6f93b8, akzent: 0x9fdcff }, stacheln: true, bild: 'kreaturen/mond/frostling.webp' },
        { id: 'eiswolf', name: 'Eiswolf', bauart: 'vierbeiner', groesse: 0.85, leben: 12,
          farben: { haut: 0xa9bccd, dunkel: 0x4c5f75, akzent: 0xdff3ff }, stacheln: true, bild: 'kreaturen/mond/eiswolf.webp' },
      ],
      boss: { id: 'frostwaechter', name: 'Der Gefrorene Wächter', bauart: 'koloss', groesse: 2.3, leben: 40,
        text: 'Ein Riese aus uraltem Eis erhebt sich aus dem See.',
        farben: { haut: 0x9cc4e4, dunkel: 0x3d5a7a, akzent: 0xe6f6ff }, stacheln: true, bild: 'kreaturen/mond/frostwaechter.webp' },
    },
    blut: {
      id: 'blut', haus: 'haus2', name: 'Der rote Stein am Blutfluss', kurz: 'Blutwelt',
      text: 'Roter Fels, ein Fluss aus Blut. Im Stein öffnet sich ein Riss.',
      portal: { ring: 0xff5a5a, glanz: 0xb3122e, innen: 0x1c0507, wirbel: [0xff3a3a, 0xe8c96d] },
      boden: { farbe: 0x6a2420, dunkel: 0x321010, linie: 0xa83a30, art: 'fels' },
      himmel: { farbe: 0x7a1a26, berge: 0x561620, art: 'rote_stadt' },
      wetter: { art: 'asche', farbe: 0xff6a4a, menge: 0.8 },
      bilder: { boden: '', hintergrund: '', portal: '' },
      kreaturen: [
        { id: 'blutkaefer', name: 'Blutkäfer', bauart: 'kriecher', groesse: 0.7, leben: 12,
          farben: { haut: 0x7a2a26, dunkel: 0x3a1110, akzent: 0xff4a4a }, bild: 'kreaturen/blut/blutkaefer.webp' },
        { id: 'blutschemen', name: 'Blutschemen', bauart: 'schweber', groesse: 0.8, leben: 10,
          farben: { haut: 0x9b2232, dunkel: 0x4a0c16, akzent: 0xff8a8a }, bild: 'kreaturen/blut/blutschemen.webp' },
      ],
      boss: { id: 'blutkoloss', name: 'Der Blutkoloss', bauart: 'koloss', groesse: 2.3, leben: 44,
        text: 'Der Fels selbst steht auf – Adern aus Blut glühen in ihm.',
        farben: { haut: 0x6e2420, dunkel: 0x2e0c0a, akzent: 0xff4a4a }, hoerner: true, glut: true, bild: 'kreaturen/blut/blutkoloss.webp' },
    },
    nebel: {
      id: 'nebel', haus: 'haus3', name: 'Die versunkenen Ruinen im Sumpf', kurz: 'Nebelwelt',
      text: 'Moor, Schilf, versunkene Säulen. Etwas regt sich unter dem Wasser.',
      portal: { ring: 0x8fe0c8, glanz: 0x5fb0a4, innen: 0x08140f, wirbel: [0x6fdcb8, 0xd8ffee] },
      boden: { farbe: 0x3a4630, dunkel: 0x1c2418, linie: 0x6a7d50, art: 'moor' },
      himmel: { farbe: 0x3a5a52, berge: 0x2a423a, art: 'ruinen' },
      wetter: { art: 'nebel', farbe: 0xa8c8bc, menge: 1 },
      bilder: { boden: '', hintergrund: '', portal: '' },
      kreaturen: [
        { id: 'moorkroete', name: 'Moorkröte', bauart: 'kriecher', groesse: 0.7, leben: 12,
          farben: { haut: 0x4a5a3a, dunkel: 0x232b1c, akzent: 0x9bd17a }, bild: 'kreaturen/nebel/moorkroete.webp' },
        { id: 'irrlicht', name: 'Irrlicht', bauart: 'schweber', groesse: 0.75, leben: 9,
          farben: { haut: 0x9fc9b8, dunkel: 0x3c5a50, akzent: 0xcfffe0 }, glut: true, bild: 'kreaturen/nebel/irrlicht.webp' },
      ],
      boss: { id: 'versunkener', name: 'Der Versunkene', bauart: 'koloss', groesse: 2.3, leben: 42,
        text: 'Ein Riese aus Ruinenstein und Moos steigt aus dem Sumpf.',
        farben: { haut: 0x4b5747, dunkel: 0x232a22, akzent: 0x8fe0b0 }, bild: 'kreaturen/nebel/versunkener.webp' },
    },
    flamme: {
      id: 'flamme', haus: 'haus4', name: 'Der Vulkan der Flamme', kurz: 'Feuerwelt',
      text: 'Basalt und Lava. Aus einer glühenden Spalte steigt Rauch.',
      portal: { ring: 0xffa040, glanz: 0xe0672b, innen: 0x1c0a04, wirbel: [0xff7a1a, 0xffe08a] },
      boden: { farbe: 0x2a2426, dunkel: 0x141012, linie: 0xff7a1a, art: 'lava' },
      himmel: { farbe: 0x7a3414, berge: 0x4a2418, art: 'vulkane' },
      wetter: { art: 'funken', farbe: 0xffa040, menge: 1 },
      bilder: { boden: '', hintergrund: '', portal: '' },
      kreaturen: [
        { id: 'glutling', name: 'Glutling', bauart: 'kriecher', groesse: 0.65, leben: 11,
          farben: { haut: 0x3a2a26, dunkel: 0x1a1210, akzent: 0xff7a1a }, glut: true, bild: 'kreaturen/flamme/glutling.webp' },
        { id: 'aschehund', name: 'Aschehund', bauart: 'vierbeiner', groesse: 0.85, leben: 12,
          farben: { haut: 0x3a3434, dunkel: 0x1a1616, akzent: 0xff8a2a }, glut: true, stacheln: true, bild: 'kreaturen/flamme/aschehund.webp' },
      ],
      boss: { id: 'glutfuerst', name: 'Der Glutfürst', bauart: 'koloss', groesse: 2.4, leben: 46,
        text: 'Aus der Lava steigt der Glutfürst, Hörner aus Obsidian.',
        farben: { haut: 0x2e2624, dunkel: 0x120e0c, akzent: 0xff6a1a }, hoerner: true, glut: true, bild: 'kreaturen/flamme/glutfuerst.webp' },
    },
  };
  // Wörter für !portal <welt>
  const NAMEN = {
    mond: 'mond', eis: 'mond', schnee: 'mond', frost: 'mond',
    blut: 'blut', stein: 'blut', fels: 'blut', rot: 'blut',
    nebel: 'nebel', sumpf: 'nebel', moor: 'nebel', ruinen: 'nebel',
    flamme: 'flamme', feuer: 'flamme', lava: 'flamme', vulkan: 'flamme',
  };
  ziel.NWU_WELTEN = { welten: WELTEN, namen: NAMEN, ids: Object.keys(WELTEN) };
})(typeof window !== 'undefined' ? window : globalThis);
