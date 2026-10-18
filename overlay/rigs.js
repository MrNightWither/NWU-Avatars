// Gelenke der Teil-Figuren (Stufe 2). Alle Werte in Pixeln der Teil-Bilder in overlay/figuren/<id>/.
// Ursprung (0, 0) = zwischen den Füßen am Boden, y nach oben negativ. Blick nach rechts.
//   anker: Drehpunkt im Teil-Bild (Hals, Schulter, Hüfte, Griff)
//   pos:   wo dieser Drehpunkt an der Figur sitzt (bei an: … im Eltern-Teil)
//   art:   welche Bewegung das Teil macht (beinV/beinH, armV/armH, kopf, rumpf, umhang)
//   oben:  kippt mit dem Oberkörper · dunkel: hinteres Teil · dreh: Grundwinkel · an: hängt an diesem Teil
//   haengt: zeigt immer nach unten und pendelt (Kette) · senkrecht: bleibt aufrecht (Stab) · s: Größe
// Reihenfolge der Teile = Zeichenreihenfolge (erstes ganz hinten).
window.NWU_RIGS = {
  // Haus des Mondes · Klinge (gebogener Säbel, blauer Umhang)
  'haus1-a': {
    hoehe: 403, huefte: [0, -145],
    teile: [
      { id: 'umhang', bild: 'umhang', anker: [140, 8], pos: [-8, -240], art: 'umhang', oben: true },
      { id: 'armH', bild: 'armH', anker: [27, 15], pos: [-10, -232], art: 'armH', oben: true, dunkel: true },
      { id: 'beinH', bild: 'beinH', anker: [23, 5], pos: [-8, -145], art: 'beinH', dunkel: true },
      { id: 'beinV', bild: 'beinV', anker: [21, 5], pos: [6, -145], art: 'beinV' },
      { id: 'rumpf', bild: 'rumpf', anker: [62, 120], pos: [0, -145], art: 'rumpf', oben: true },
      { id: 'kopf', bild: 'kopf', anker: [112, 150], pos: [4, -253], art: 'kopf', oben: true },
      { id: 'armV', bild: 'armV', anker: [29, 15], pos: [8, -232], art: 'armV', oben: true },
      { id: 'waffeV', bild: 'waffeV', anker: [27, 23], an: 'armV', pos: [0, 138], dreh: 0.05 },
    ],
  },
  // Haus des Mondes · Schatten (Kapuze, zwei Dolche)
  'haus1-c': {
    hoehe: 381, huefte: [0, -150],
    teile: [
      { id: 'umhang', bild: 'umhang', anker: [150, 12], pos: [-8, -228], art: 'umhang', oben: true },
      { id: 'armH', bild: 'armH', anker: [25, 12], pos: [-10, -214], art: 'armH', oben: true, dunkel: true },
      { id: 'waffeH', bild: 'waffeH', anker: [88, 25], an: 'armH', pos: [0, 112], dreh: 0.3, dunkel: true },
      { id: 'beinH', bild: 'beinH', anker: [30, 10], pos: [-8, -150], art: 'beinH', dunkel: true },
      { id: 'beinV', bild: 'beinV', anker: [35, 10], pos: [6, -150], art: 'beinV' },
      { id: 'rumpf', bild: 'rumpf', anker: [102, 105], pos: [0, -150], art: 'rumpf', oben: true },
      { id: 'kopf', bild: 'kopf', anker: [125, 145], pos: [4, -236], art: 'kopf', oben: true },
      { id: 'armV', bild: 'armV', anker: [26, 12], pos: [8, -214], art: 'armV', oben: true },
      { id: 'waffeV', bild: 'waffeV', anker: [98, 25], an: 'armV', pos: [0, 112], dreh: 0.3 },
    ],
  },
  // Haus des Mondes · Seher (Hut, Stab mit Kugel)
  'haus1-b': {
    hoehe: 424, huefte: [0, -120],
    teile: [
      { id: 'umhang', bild: 'umhang', anker: [65, 10], pos: [-14, -262], art: 'umhang', oben: true },
      { id: 'armH', bild: 'armH', anker: [29, 12], pos: [-10, -248], art: 'armH', oben: true, dunkel: true },
      { id: 'beinH', bild: 'bein', anker: [33, 8], pos: [-8, -120], art: 'beinH', dunkel: true },
      { id: 'beinV', bild: 'bein', anker: [33, 8], pos: [6, -120], art: 'beinV' },
      { id: 'rumpf', bild: 'rumpf', anker: [75, 167], pos: [0, -120], art: 'rumpf', oben: true },
      { id: 'kopf', bild: 'kopf', anker: [115, 148], pos: [4, -276], art: 'kopf', oben: true },
      { id: 'armV', bild: 'armV', anker: [29, 12], pos: [8, -248], art: 'armV', oben: true, dreh: -0.7 },
      { id: 'stab', bild: 'stab', anker: [30, 165], an: 'armV', pos: [2, 108], senkrecht: true },
    ],
  },
  // Haus des Mondes · Hüter (Rüstung, Morgenstern)
  'haus1-d': {
    hoehe: 436, huefte: [0, -190],
    teile: [
      { id: 'armH', bild: 'armH', anker: [38, 30], pos: [-12, -270], art: 'armH', oben: true, dunkel: true },
      { id: 'beinH', bild: 'bein', anker: [34, 8], pos: [-8, -190], art: 'beinH', dunkel: true },
      { id: 'beinV', bild: 'bein', anker: [34, 8], pos: [8, -190], art: 'beinV' },
      { id: 'rumpf', bild: 'rumpf', anker: [65, 120], pos: [0, -190], art: 'rumpf', oben: true },
      { id: 'kopf', bild: 'kopf', anker: [112, 140], pos: [4, -296], art: 'kopf', oben: true },
      { id: 'armV', bild: 'armV', anker: [38, 30], pos: [10, -270], art: 'armV', oben: true },
      { id: 'waffeV', bild: 'waffeV', anker: [31, 8], an: 'armV', pos: [4, 132], s: 0.75, haengt: true },
    ],
  },
};

// Haare als eigene Ebene über dem Kopf (wird im Overlay pro Person eingefärbt), und dieselben
// Figuren für die anderen Häuser: gleiche Gelenke, umgefärbte Teile (tools/umfaerben.py).
(function () {
  const R = window.NWU_RIGS;
  for (const id of Object.keys(R)) {
    const teile = R[id].teile, i = teile.findIndex((t) => t.id === 'kopf');
    if (i >= 0 && !teile.some((t) => t.id === 'haare')) teile.splice(i + 1, 0, { ...teile[i], id: 'haare', bild: 'haare', haare: true });
  }
  for (const haus of ['haus2', 'haus3', 'haus4']) {
    for (const typ of 'abcd') R[`${haus}-${typ}`] = R[`haus1-${typ}`];
  }
})();
