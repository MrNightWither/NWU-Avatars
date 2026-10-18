// Die Häuser – eine Quelle für Website und Overlay.
// Zum Start gibt es 4 Häuser. Dornen und Raben sind "verlorene Häuser" (verloren: true):
// Ihre Gebiete liegen im Nebel, sie erwachen später (z. B. bei einem großen Meilenstein).
// Namen, Farben, Wappen und Sprüche sind ARBEITSTITEL (Plan 15.1) und werden später ersetzt.
// Die ids (haus1 … haus6) bleiben fest, darauf verweist die Datenbank.
// wappenBild: fertiges Wappen aus assets/ – fehlt es, wird ein Platzhalter gezeichnet.
// figurBilder: true = assets/figur-hausX-a … -d.webp sind da, sonst Platzhalter-Figuren.
(typeof window !== 'undefined' ? window : globalThis).NWU_HAEUSER = [
  {
    id: 'haus1', name: 'Haus des Mondes', kurz: 'Mond', symbol: 'mond', wappenBild: 'assets/wappen-haus1.webp', figurBilder: true,
    farbe: 0x8fa8d8, css: '#8fa8d8',
    geschichte: 'Als Unity zerbrach, zogen die Stillen nach Norden, zu den Seen, die nie ganz zufrieren. Sie nahmen den Mond mit, das alte Zeichen des Königs, und hüten es seitdem wie ein Versprechen. In ihren Türmen brennt nachts kein Feuer – sie sehen auch so.',
    wesen: 'Still, wachsam und klar. Ihr seht, was anderen in der Dunkelheit verborgen bleibt.',
    sprueche: [
      'Der Mond hat dich lange beobachtet. Jetzt sieht er dich an.',
      'Du gehörst zu denen, die im Dunkeln sehen. Vergiss nie, wer dir das Licht gab.',
      'Still bist du. Doch die Stille hat Ohren, und sie gehören jetzt dir.',
    ],
  },
  {
    id: 'haus2', name: 'Haus des Blutes', kurz: 'Blut', symbol: 'blut', wappenBild: 'assets/wappen-haus2.webp', figurBilder: true,
    farbe: 0xb3122e, css: '#d0243f',
    geschichte: 'Die Treuen nahmen die rote Stadt am Fluss. Für sie zerbrach in jener Nacht nicht ein Haus, sondern eine Familie – und eine Familie gibt man nicht auf. Wer zu ihnen gehört, ist nie allein. Wer sie verrät, ist nie mehr sicher.',
    wesen: 'Treu bis in den Tod. Wer zu euch gehört, ist niemals allein.',
    sprueche: [
      'Dein Herz schlägt für andere. Gut. Dieses Haus braucht Herzen, die bluten können.',
      'Mit Blut besiegelt, mit Blut verteidigt. Willkommen in der Familie.',
      'Ich habe deinen Schwur gehört, bevor du ihn ausgesprochen hast.',
    ],
  },
  {
    id: 'haus3', name: 'Haus des Nebels', kurz: 'Nebel', symbol: 'nebel', wappenBild: 'assets/wappen-haus3.webp', figurBilder: true,
    farbe: 0x5fb0a4, css: '#6fbcb0',
    geschichte: 'Niemand hat gesehen, wie die Listigen gingen. Am Morgen nach der Spaltung waren ihre Hallen leer, und über den Sümpfen im Osten lag Nebel. Sie wissen mehr, als sie sagen, und sie sind überall, wo man sie nicht erwartet.',
    wesen: 'Ungreifbar und listig. Ihr seid überall und nirgends.',
    sprueche: [
      'Niemand hat dich kommen sehen. Genau deshalb bist du hier.',
      'Du sprichst wenig und weißt viel. Der Nebel nimmt dich gerne auf.',
      'Verschwinde, wann immer du willst. Aber vergiss nicht, wohin du zurückkehrst.',
    ],
  },
  {
    id: 'haus4', name: 'Haus der Flamme', kurz: 'Flamme', symbol: 'flamme', wappenBild: 'assets/wappen-haus4.webp', figurBilder: true,
    farbe: 0xe0672b, css: '#e8753a',
    geschichte: 'Die Wilden gingen in den Süden, wo die Erde selbst brennt. Sie schmiedeten ihre Rüstungen neu in den Vulkanen und tragen die Glut seitdem im Herzen. Wo die Flamme hinkommt, wird es laut, hell und warm.',
    wesen: 'Wild, mutig und unaufhaltsam. Wo ihr hingeht, wird es hell und laut.',
    sprueche: [
      'In dir brennt etwas, das sich nicht löschen lässt. Lass es lodern.',
      'Asche ist nur der Anfang. Das Haus der Flamme brennt für dich.',
      'Du bist kein Funke. Du bist der Brand.',
    ],
  },
  {
    id: 'haus5', name: 'Haus der Dornen', kurz: 'Dornen', symbol: 'dornen', wappenBild: 'assets/wappen-haus5.webp', verloren: true,
    farbe: 0x5f9e48, css: '#6fae55',
    geschichte: 'Die Dornen verschwanden in jener Nacht im Westen. Man sagt, sie haben sich hinter Ranken verschanzt, die mit jedem Jahr dichter werden. Sie warten.',
    wesen: 'Geduldig, standhaft und wehrhaft. Ihr schützt, was euch gehört.',
    sprueche: [
      'Wer dich berührt, wird sich erinnern. Die Dornen haben dich erwählt.',
      'Deine Wurzeln reichen tief. Kein Sturm reißt dich mehr aus.',
      'Du wächst langsam. Aber du wächst durch Stein.',
    ],
  },
  {
    id: 'haus6', name: 'Haus der Raben', kurz: 'Raben', symbol: 'raben', wappenBild: 'assets/wappen-haus6.webp', verloren: true,
    farbe: 0x7a68b5, css: '#8b79c6',
    geschichte: 'Auch die Raben flogen nach Westen und kehrten nie zurück. Manchmal sieht man einen einzelnen Raben über der Zitadelle kreisen. Niemand weiß, wem er berichtet.',
    wesen: 'Neugierig, klug und unvergessen. Ihr tragt das Wissen und die Botschaften.',
    sprueche: [
      'Meine Raben haben mir von dir erzählt. Sie lügen nie.',
      'Du sammelst Wissen wie andere Gold. Hier wird es dir nie ausgehen.',
      'Flieg mit uns. Und bring mir mit, was du gesehen hast.',
    ],
  },
];
// Nur die Häuser, in die man aktuell kommen kann
(typeof window !== 'undefined' ? window : globalThis).NWU_AKTIVE_HAEUSER =
  (typeof window !== 'undefined' ? window : globalThis).NWU_HAEUSER.filter((h) => !h.verloren);


// 4 Startcharaktere pro Haus (Plan 3). Gleiche Grundtypen, Aussehen später pro Haus.
// Namen und Beschreibungen sind Platzhalter.
(typeof window !== 'undefined' ? window : globalThis).NWU_FIGUREN = [
  { id: 'a', typ: 'Klinge',  text: 'Kämpft in vorderster Reihe.' },
  { id: 'b', typ: 'Seher',   text: 'Wirkt Zauber und liest die Zeichen.' },
  { id: 'c', typ: 'Schatten', text: 'Schnell, leise und schwer zu fassen.' },
  { id: 'd', typ: 'Hüter',   text: 'Schützt die anderen mit Schild und Willen.' },
];
