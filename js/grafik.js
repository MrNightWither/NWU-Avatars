// Platzhalter-Grafiken als SVG: Haus-Wappen und Startfiguren.
// Werden ersetzt, sobald echte Wappen und gezeichnete Figuren da sind.
(function () {
  const NS = 'http://www.w3.org/2000/svg';

  function svg(viewBox, inhalt, label) {
    const el = document.createElementNS(NS, 'svg');
    el.setAttribute('viewBox', viewBox);
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', label);
    el.innerHTML = inhalt;            // nur feste, eigene Inhalte – keine Nutzereingaben
    return el;
  }

  const SYMBOLE = {
    mond: (f) => `<circle cx="60" cy="70" r="27" fill="${f}"/><circle cx="72" cy="62" r="23" fill="#0b0b0e"/>`,
    blut: (f) => `<path d="M60 38 C60 38 37 68 37 84 a23 23 0 0 0 46 0 C83 68 60 38 60 38Z" fill="${f}"/><path d="M50 86 a10 10 0 0 0 8 10" stroke="#0b0b0e" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>`,
    nebel: (f) => [52, 68, 84].map((y, i) => `<path d="M${30 + i * 4} ${y} q8 -8 16 0 t16 0 t16 0 t16 0" stroke="${f}" stroke-width="5" fill="none" stroke-linecap="round" opacity="${1 - i * 0.2}"/>`).join(''),
    flamme: (f) => `<path d="M60 34 C72 52 86 62 82 84 C79 101 69 108 60 108 C47 108 37 98 39 83 C41 71 50 68 52 57 C57 68 61 71 63 68 C67 59 62 48 60 34Z" fill="${f}"/><path d="M60 78 C66 86 68 92 64 99 C62 102 58 102 56 99 C53 94 56 88 60 78Z" fill="#0b0b0e" opacity=".55"/>`,
    dornen: (f) => `<path d="M60 36 C52 56 68 74 60 108" stroke="${f}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
      [[57, 48, -1], [62, 60, 1], [61, 74, -1], [64, 88, 1], [61, 99, -1]].map(([x, y, s]) => `<path d="M${x} ${y} l${s * 13} -5 l${-s * 9} 9Z" fill="${f}"/>`).join(''),
    raben: (f) => `<path d="M60 34 C80 50 84 82 63 110 L57 110 C42 84 42 54 60 34Z" fill="${f}"/><path d="M60 42 L60 108" stroke="#0b0b0e" stroke-width="2.5"/>` +
      [56, 66, 76, 86, 96].map((y) => `<path d="M60 ${y} l-9 -6 M60 ${y} l9 -6" stroke="#0b0b0e" stroke-width="1.6"/>`).join(''),
  };

  function wappen(haus) {
    if (haus.wappenBild) {
      const img = new Image();
      img.src = haus.wappenBild;
      img.alt = `Wappen ${haus.name}`;
      img.decoding = 'async';
      return img;
    }
    const f = haus.css;
    return svg('0 0 120 140', `
      <defs>
        <linearGradient id="wg-${haus.id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${f}" stop-opacity=".22"/>
          <stop offset="1" stop-color="#0b0b0e" stop-opacity="1"/>
        </linearGradient>
      </defs>
      <path d="M60 5 L111 21 V68 C111 104 87 126 60 136 C33 126 9 104 9 68 V21 Z" fill="#0b0b0e"/>
      <path d="M60 5 L111 21 V68 C111 104 87 126 60 136 C33 126 9 104 9 68 V21 Z" fill="url(#wg-${haus.id})" stroke="#c9a84c" stroke-width="2.5"/>
      <path d="M60 13 L103 27 V68 C103 99 83 118 60 127 C37 118 17 99 17 68 V27 Z" fill="none" stroke="#c9a84c" stroke-opacity=".35" stroke-width="1"/>
      ${SYMBOLE[haus.symbol](f)}`, `Wappen ${haus.name}`);
  }

  // Einfache Figur, Blick nach vorne. typ: a Klinge, b Seher, c Schatten, d Hüter
  function figur(haus, typ) {
    if (haus.figurBilder) {
      const img = new Image();
      img.src = `assets/figur-${haus.id}-${typ}.webp`;
      img.alt = '';
      img.decoding = 'async';
      return img;
    }
    const f = haus.css, haut = '#f2d7c4', dunkel = '#16141c';
    const extra = {
      a: `<path d="M74 66 L90 30 L93 32 L78 68Z" fill="#cfd3da"/><rect x="71" y="64" width="12" height="4" rx="2" fill="#c9a84c" transform="rotate(-25 77 66)"/>`,
      b: `<path d="M30 30 L50 4 L56 26 L70 30Z" fill="${dunkel}" stroke="${f}" stroke-width="1.5"/><rect x="25" y="27" width="50" height="6" rx="3" fill="${dunkel}" stroke="${f}" stroke-width="1.5"/><rect x="80" y="40" width="3.5" height="80" rx="1.7" fill="#6b4b2e"/><circle cx="81.7" cy="38" r="6" fill="${f}"/>`,
      c: `<path d="M30 44 C30 18 70 18 70 44 L70 56 L30 56Z" fill="${dunkel}" stroke="${f}" stroke-width="1.5"/><rect x="36" y="60" width="28" height="8" rx="3" fill="${f}" opacity=".8"/>`,
      d: `<path d="M14 70 L34 64 L34 92 C34 102 24 108 14 110 C4 108 -6 102 -6 92 L-6 64Z" transform="translate(8 0)" fill="${dunkel}" stroke="#c9a84c" stroke-width="2"/><circle cx="22" cy="86" r="5" fill="${f}"/>`,
    }[typ];
    return svg('0 0 100 140', `
      <ellipse cx="50" cy="132" rx="26" ry="5" fill="#000" opacity=".5"/>
      <rect x="38" y="104" width="9" height="26" rx="4" fill="${dunkel}"/>
      <rect x="53" y="104" width="9" height="26" rx="4" fill="${dunkel}"/>
      <path d="M34 60 L66 60 L74 110 L26 110Z" fill="${f}"/>
      <path d="M34 60 L66 60 L68 72 L32 72Z" fill="#000" opacity=".2"/>
      <rect x="24" y="62" width="9" height="34" rx="4.5" fill="${f}" transform="rotate(8 28 62)"/>
      <rect x="67" y="62" width="9" height="34" rx="4.5" fill="${f}" transform="rotate(-8 72 62)"/>
      <circle cx="50" cy="42" r="18" fill="${haut}"/>
      <path d="M32 42 C30 22 70 22 68 42 C64 32 56 30 50 31 C44 30 36 32 32 42Z" fill="${dunkel}"/>
      <rect x="42" y="42" width="4" height="6" rx="2" fill="${dunkel}"/>
      <rect x="54" y="42" width="4" height="6" rx="2" fill="${dunkel}"/>
      ${extra}`, `Platzhalter-Figur`);
  }

  window.NWU_GRAFIK = { wappen, figur };
})();
