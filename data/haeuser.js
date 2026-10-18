// Die 6 Häuser – eine Quelle für Website und Overlay.
// Namen, Farben, Wappen und Sprüche sind ARBEITSTITEL (Plan 15.1) und werden später ersetzt.
// Die ids (haus1 … haus6) bleiben fest, darauf verweist die Datenbank.
// wappenBild: fertiges Wappen aus assets/ – fehlt es, wird ein Platzhalter gezeichnet.
window.NWU_HAEUSER = [
  {
    id: 'haus1', name: 'Haus des Mondes', kurz: 'Mond', symbol: 'mond', wappenBild: 'assets/wappen-haus1.webp',
    farbe: 0x8fa8d8, css: '#8fa8d8',
    wesen: 'Still, wachsam und klar. Ihr seht, was anderen in der Dunkelheit verborgen bleibt.',
    sprueche: [
      'Der Mond hat dich lange beobachtet. Jetzt sieht er dich an.',
      'Du gehörst zu denen, die im Dunkeln sehen. Vergiss nie, wer dir das Licht gab.',
      'Still bist du. Doch die Stille hat Ohren, und sie gehören jetzt dir.',
    ],
  },
  {
    id: 'haus2', name: 'Haus des Blutes', kurz: 'Blut', symbol: 'blut', wappenBild: 'assets/wappen-haus2.webp',
    farbe: 0xb3122e, css: '#d0243f',
    wesen: 'Treu bis in den Tod. Wer zu euch gehört, ist niemals allein.',
    sprueche: [
      'Dein Herz schlägt für andere. Gut. Dieses Haus braucht Herzen, die bluten können.',
      'Mit Blut besiegelt, mit Blut verteidigt. Willkommen in der Familie.',
      'Ich habe deinen Schwur gehört, bevor du ihn ausgesprochen hast.',
    ],
  },
  {
    id: 'haus3', name: 'Haus des Nebels', kurz: 'Nebel', symbol: 'nebel', wappenBild: 'assets/wappen-haus3.webp',
    farbe: 0x9aa3b0, css: '#9aa3b0',
    wesen: 'Ungreifbar und listig. Ihr seid überall und nirgends.',
    sprueche: [
      'Niemand hat dich kommen sehen. Genau deshalb bist du hier.',
      'Du sprichst wenig und weißt viel. Der Nebel nimmt dich gerne auf.',
      'Verschwinde, wann immer du willst. Aber vergiss nicht, wohin du zurückkehrst.',
    ],
  },
  {
    id: 'haus4', name: 'Haus der Flamme', kurz: 'Flamme', symbol: 'flamme', wappenBild: 'assets/wappen-haus4.webp',
    farbe: 0xe0672b, css: '#e8753a',
    wesen: 'Wild, mutig und unaufhaltsam. Wo ihr hingeht, wird es hell und laut.',
    sprueche: [
      'In dir brennt etwas, das sich nicht löschen lässt. Lass es lodern.',
      'Asche ist nur der Anfang. Das Haus der Flamme brennt für dich.',
      'Du bist kein Funke. Du bist der Brand.',
    ],
  },
  {
    id: 'haus5', name: 'Haus der Dornen', kurz: 'Dornen', symbol: 'dornen', wappenBild: 'assets/wappen-haus5.webp',
    farbe: 0x5f9e48, css: '#6fae55',
    wesen: 'Geduldig, standhaft und wehrhaft. Ihr schützt, was euch gehört.',
    sprueche: [
      'Wer dich berührt, wird sich erinnern. Die Dornen haben dich erwählt.',
      'Deine Wurzeln reichen tief. Kein Sturm reißt dich mehr aus.',
      'Du wächst langsam. Aber du wächst durch Stein.',
    ],
  },
  {
    id: 'haus6', name: 'Haus der Raben', kurz: 'Raben', symbol: 'raben', wappenBild: 'assets/wappen-haus6.webp',
    farbe: 0x7a68b5, css: '#8b79c6',
    wesen: 'Neugierig, klug und unvergessen. Ihr tragt das Wissen und die Botschaften.',
    sprueche: [
      'Meine Raben haben mir von dir erzählt. Sie lügen nie.',
      'Du sammelst Wissen wie andere Gold. Hier wird es dir nie ausgehen.',
      'Flieg mit uns. Und bring mir mit, was du gesehen hast.',
    ],
  },
];

// 4 Startcharaktere pro Haus (Plan 3). Gleiche Grundtypen, Aussehen später pro Haus.
// Namen und Beschreibungen sind Platzhalter.
window.NWU_FIGUREN = [
  { id: 'a', typ: 'Klinge',  text: 'Kämpft in vorderster Reihe.' },
  { id: 'b', typ: 'Seher',   text: 'Wirkt Zauber und liest die Zeichen.' },
  { id: 'c', typ: 'Schatten', text: 'Schnell, leise und schwer zu fassen.' },
  { id: 'd', typ: 'Hüter',   text: 'Schützt die anderen mit Schild und Willen.' },
];
