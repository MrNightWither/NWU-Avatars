// NWU Avatare – Overlay
// Stufe 1: Figur ist EIN Bild (Seitenansicht), die Bewegung entsteht per Programm.
// Stufe 2: Figur aus Teilen mit Gelenken (rig.js, rigs.js), sobald es für sie Teile gibt.
// Chatter erscheinen aus einem kleinen Portal am Rahmen, das große Portal ist ein
// aufrechtes Tor, aus dem die Figuren aufs Terrain laufen.
'use strict';

(async () => {
  const CFG = window.NWU_CONFIG;
  const W = 1920, H = 1080;

  // ---------- Einstellungen (config.js, per URL überschreibbar) ----------
  const q = new URLSearchParams(location.search);
  const zahl = (k, d) => (q.has(k) && !isNaN(parseFloat(q.get(k))) ? parseFloat(q.get(k)) : d);
  const an = (k, d) => (q.has(k) ? q.get(k) !== '0' : d);
  const S = {
    kanal: q.get('kanal') ?? CFG.kanal ?? '',
    api: q.get('api') ?? CFG.api ?? '',
    demo: Math.max(0, Math.min(100, zahl('n', CFG.kanal || q.get('kanal') ? 0 : 8))),
    fps: zahl('fps', CFG.fps),
    hoehe: zahl('groesse', CFG.figurHoehe),
    max: zahl('max', CFG.maxFiguren),
    hud: an('hud', !(window.obsstudio || navigator.userAgent.includes('OBS/'))),          // in OBS (Stream) aus, im Browser zum Testen an; ?hud=1 erzwingt sie, H schaltet um
    szene: q.get('szene') || 'standard',
    sparmodus: an('spar', false),
    portalOffen: false,
  };
  const ANWESENHEIT = (CFG.anwesenheitMinuten || 15) * 60;
  const WAECHTER = (CFG.waechterMinuten || 120) * 60;
  let cam = CFG.szenen[S.szene] || CFG.szenen.standard;
  if (q.has('cam')) {
    const [x, y, w, h] = q.get('cam').split(',').map(Number);
    if ([x, y, w, h].every((v) => v >= 0 && v <= 1)) cam = { x, y, w, h };
  }
  const vorschau = an('bg', false);
  if (vorschau) document.body.classList.add('vorschau');

  // ---------- PixiJS ----------
  const app = new PIXI.Application();
  await app.init({ backgroundAlpha: 0, resizeTo: window, antialias: true, preference: 'webgl' });
  document.body.appendChild(app.canvas);
  app.ticker.maxFPS = S.fps;
  const welt = new PIXI.Container();
  app.stage.addChild(welt);
  const skalieren = () => {
    const s = Math.min(app.screen.width / W, app.screen.height / H);
    welt.scale.set(s);
    welt.position.set((app.screen.width - W * s) / 2, (app.screen.height - H * s) / 2);
  };
  skalieren();
  window.addEventListener('resize', skalieren);

  // ---------- Bilder ----------
  const laden = (src) => new Promise((ok, fehler) => {
    const img = new Image();
    img.onload = () => {
      const t = PIXI.Texture.from(img);
      t.source.autoGenerateMipmaps = true;     // weicheres Verkleinern ohne Flimmern (Figuren sind stark verkleinert)
      ok(t);
    };
    img.onerror = () => fehler(new Error('Bild fehlt: ' + src));
    img.src = src;
  });
  const RIGS = window.NWU_RIGS || {};
  const VORLAGEN = await Promise.all(CFG.figuren.map(async (f) => {
    const v = { ...f, tex: await laden(f.bild) };
    v.hoehe = v.tex.height;
    const def = !q.has('stufe1') && f.rig && RIGS[f.rig];
    if (def && window.NWU_RIG) {
      try {
        const namen = [...new Set(def.teile.map((t) => t.bild))];
        const tex = await Promise.all(namen.map((n) => laden(`figuren/${f.rig}/${n}.webp`)));
        v.rigDef = def; v.rigTex = Object.fromEntries(namen.map((n, i) => [n, tex[i]])); v.hoehe = def.hoehe;
      } catch (e) { console.warn('Teile fehlen, nehme Einzelbild:', f.rig, e.message); }
    }
    return v;
  }));
  // Besucher-Figuren für alle ohne Ritual (config.js → besucher). Fehlen die Bilder, laufen sie als Silhouette.
  const BESUCHER = [];
  for (const eintrag of [].concat(CFG.besucher || [])) {
    try {
      const v = { haus: null, typ: 'besucher', ...eintrag, tex: await laden(eintrag.bild) };
      v.hoehe = v.tex.height;
      const def = !q.has('stufe1') && v.rig && RIGS[v.rig];
      if (def && window.NWU_RIG) {
        const namen = [...new Set(def.teile.map((t) => t.bild))];
        const tex = await Promise.all(namen.map((n) => laden(`figuren/${v.rig}/${n}.webp`)));
        v.rigDef = def; v.rigTex = Object.fromEntries(namen.map((n, i) => [n, tex[i]])); v.hoehe = def.hoehe;
      }
      BESUCHER.push(v);
    } catch (e) { console.warn('Besucher-Figur fehlt:', e.message); }
  }
  // 👑 Der Schattenkönig (Streamer) bekommt seine eigene Figur (config.js → koenig, Teile in figuren/koenig/)
  let KOENIG = null;
  if (CFG.koenig) {
    try {
      const v = { haus: null, typ: 'koenig', ...CFG.koenig, tex: await laden(CFG.koenig.bild) };
      v.hoehe = v.tex.height;
      const def = !q.has('stufe1') && v.rig && RIGS[v.rig];
      if (def && window.NWU_RIG) {
        const namen = [...new Set(def.teile.map((t) => t.bild))];
        const tex = await Promise.all(namen.map((n) => laden(`figuren/${v.rig}/${n}.webp`)));
        v.rigDef = def; v.rigTex = Object.fromEntries(namen.map((n, i) => [n, tex[i]])); v.hoehe = def.hoehe;
      }
      KOENIG = v;
    } catch (e) { console.warn('Königs-Figur fehlt:', e.message); }
  }
  const textur = (zeichnen) => {
    const g = new PIXI.Graphics(); zeichnen(g);
    const t = app.renderer.generateTexture({ target: g, resolution: 2 }); g.destroy(); return t;
  };
  const T = {
    punkt: textur((g) => g.circle(8, 8, 8).fill({ color: 0xffffff, alpha: 0.3 }).circle(8, 8, 4).fill(0xffffff)),
    glanz: textur((g) => { for (let r = 32; r > 0; r -= 2) g.circle(32, 32, r).fill({ color: 0xffffff, alpha: 0.035 }); }),
    strahl: textur((g) => { for (let i = 0; i < 12; i++) g.rect(i, 0, 24 - 2 * i, 160).fill({ color: 0xffffff, alpha: 0.06 }); }),
    diadem: textur((g) => g.poly([0, 9, 4, 6, 7, 8, 11, 1, 15, 8, 18, 6, 22, 9, 18, 11, 4, 11]).fill(0xd9dcf2).stroke({ width: 1.4, color: 0x221a33 })
      .circle(11, 5, 2).fill(0xb88cff)),
    krone: textur((g) => g.poly([1, 15, 1, 4, 6, 9, 11, 1, 16, 9, 21, 4, 21, 15]).fill(0xe8c96d).stroke({ width: 1.6, color: 0x2a1d08 })
      .circle(11, 2, 1.6).fill(0xfff0b8).rect(1, 15, 20, 3).fill(0xc9a84c).stroke({ width: 1.2, color: 0x2a1d08 })),
  };
  // Haus-Pokal-Krone als Bild (goldene Krone mit Tropfen); bis es geladen ist, gilt die gezeichnete von oben
  const kronenGroesse = () => (S.hoehe * 0.42) / T.krone.width;
  laden('symbole/krone.webp').then((t) => {
    T.krone = t;
    try {   // Figuren, die schon mit der gezeichneten Krone da sind, umstellen (figuren gibt es evtl. noch nicht)
      for (const fi of figuren) if (fi.krone) { fi.krone.texture = t; fi.krone.scale.set(kronenGroesse()); }
    } catch (e) { /* noch keine Figuren */ }
  }).catch((e) => console.warn('Krone fehlt:', e.message));

  const lerp = (a, b, t) => a + (b - a) * t;
  const winkelLerp = (a, b, t) => a + (((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * t;
  const hashZahl = (text) => { let h = 2166136261; for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const HAUSFARBE = Object.fromEntries((window.NWU_HAEUSER || []).map((h) => [h.id, h.farbe]));

  // ---------- Laufweg um den Kamera-Rahmen ----------
  // R bleibt dasselbe Objekt (Spiele halten es fest) – bei einem OBS-Szenenwechsel wird es nur neu gefüllt
  // Szenen ohne Kamera (z. B. NoCam): statt Rechteck einzelne Linien {x0, x1, y, kopf} – die erste ist der Boden.
  // Am Ende einer Linie geht es per Portal (Funken) auf die nächste; kopf = kopfüber darunter hängen.
  const R = { x: 0, y: 0, w: 1, h: 0 };
  let umfang = 1, linien = null;
  const rahmenSetzen = (c) => {
    if (Array.isArray(c.linien) && c.linien.length) {
      linien = c.linien.map((l) => ({ x0: Math.min(l.x0, l.x1) * W, x1: Math.max(l.x0, l.x1) * W, y: l.y * H, kopf: !!l.kopf, laenge: Math.abs(l.x1 - l.x0) * W }));
      Object.assign(R, { x: linien[0].x0, y: linien[0].y, w: linien[0].laenge, h: 0 });   // Spiele nutzen den Boden
      umfang = linien.reduce((n, l) => n + l.laenge, 0);
    } else {
      linien = null;
      Object.assign(R, { x: c.x * W, y: c.y * H, w: c.w * W, h: c.h * H });
      umfang = 2 * (R.w + R.h);
    }
  };
  rahmenSetzen(cam);
  const laufwegSetzen = (c) => {
    const alt = umfang;
    rahmenSetzen(c);
    for (const f of figuren) { if (typeof f.s === 'number') f.s = f.s / alt * umfang; if (typeof f.zielS === 'number') f.zielS = f.zielS / alt * umfang; f.linie = undefined; }
  };
  const norm = (s) => ((s % umfang) + umfang) % umfang;
  const linieBei = (s) => {
    if (!linien) return 0;
    s = norm(s);
    for (let i = 0; i < linien.length; i++) { if (s < linien[i].laenge) return i; s -= linien[i].laenge; }
    return linien.length - 1;
  };
  const aufPfad = (s) => {   // Rechteck: oben stehen, rechts klettern, unten kopfüber, links klettern
    s = norm(s);
    if (linien) {
      const l = linien[linieBei(s)];
      const t = Math.min(l.laenge, s - linien.slice(0, linien.indexOf(l)).reduce((n, x) => n + x.laenge, 0));
      return l.kopf ? { x: l.x1 - t, y: l.y, a: Math.PI } : { x: l.x0 + t, y: l.y, a: 0 };
    }
    if (s < R.w) return { x: R.x + s, y: R.y, a: 0 };
    s -= R.w;
    if (s < R.h) return { x: R.x + R.w, y: R.y + s, a: Math.PI / 2 };
    s -= R.h;
    if (s < R.w) return { x: R.x + R.w - s, y: R.y + R.h, a: Math.PI };
    s -= R.w;
    return { x: R.x, y: R.y + R.h - s, a: -Math.PI / 2 };
  };
  // Punkt neben dem Pfad (nach außen versetzt), z. B. für Effekte über dem Kopf
  const versetzt = (x, y, a, hoch) => ({ x: x + Math.sin(a) * hoch, y: y - Math.cos(a) * hoch });

  if (vorschau) {
    welt.addChild(new PIXI.Graphics().rect(R.x, R.y, R.w, R.h).fill({ color: 0x2a2c34 }).rect(R.x, R.y, R.w, R.h).stroke({ width: 3, color: 0xc9a84c }));
  }

  // ---------- Ebenen ----------
  const terrainEbene = new PIXI.Container();
  const figurenEbene = new PIXI.Container();
  const effektEbene = new PIXI.Container();
  welt.addChild(terrainEbene, figurenEbene, effektEbene);

  // ---------- Effekte ----------
  const effekte = [];
  const PARTIKEL_MAX = 350;
  function effekt(obj, opt) { effektEbene.addChild(obj); effekte.push({ obj, vx: 0, vy: 0, leben: 1, max: 1, ...opt }); }
  function funken(x, y, farbe, anzahl) {
    if (S.sparmodus) return;
    for (let i = 0; i < anzahl && effekte.length < PARTIKEL_MAX; i++) {
      const p = new PIXI.Sprite(T.punkt);
      p.anchor.set(0.5); p.tint = farbe; p.scale.set(0.25 + Math.random() * 0.25);
      p.position.set(x + (Math.random() - 0.5) * 20, y - Math.random() * 30);
      const w = Math.random() * Math.PI * 2, l = 0.7 + Math.random() * 0.6;
      effekt(p, { vx: Math.cos(w) * 45, vy: Math.sin(w) * 45 - 30, leben: l, max: l });
    }
  }
  const zStil = new PIXI.TextStyle({ fontFamily: 'Georgia, serif', fontSize: 18, fontStyle: 'italic', fill: 0xd8dcf0 });
  function zzz(fi) {
    const t = new PIXI.Text({ text: 'z', style: zStil });
    t.anchor.set(0.5);
    const p = versetzt(fi.root.x, fi.root.y, fi.winkel, S.hoehe * 1.05);
    t.position.set(p.x + 8, p.y);
    effekt(t, { vx: 8, vy: -14, leben: 2.2, max: 2.2, wachsen: true });
  }

  // Staub (ab Level 3) und Funken in Hausfarbe (ab Level 10) an den Füßen beim Laufen
  const staubFarbe = 0x9a948c;
  function spur(fi, dt) {
    if (S.sparmodus || (!fi.staub && !fi.funkenSpur) || fi.g.laufen < 0.6 || fi.root.alpha < 0.5) return;
    fi.spurZeit -= dt * fi.g.laufen * (fi.eile || 1);
    if (fi.spurZeit > 0 || effekte.length >= PARTIKEL_MAX) return;
    fi.spurZeit = fi.funkenSpur ? 0.12 : 0.22;
    const a = fi.winkel, hinten = -fi.richtung;
    const fx = fi.root.x + Math.cos(a) * hinten * S.hoehe * 0.12, fy = fi.root.y + Math.sin(a) * hinten * S.hoehe * 0.12;
    const p = new PIXI.Sprite(T.punkt);
    p.anchor.set(0.5);
    // nach "oben" relativ zum Rahmen-Rand aufsteigen und nach hinten wegtreiben
    const hoch = { x: Math.sin(a), y: -Math.cos(a) };
    if (fi.funkenSpur) {
      p.tint = fi.farbe; p.scale.set(0.18 + Math.random() * 0.12); p.blendMode = 'add';
      p.position.set(fx, fy - 2);
      effekt(p, { vx: hoch.x * 18 + Math.cos(a) * hinten * 10, vy: hoch.y * 18 + Math.sin(a) * hinten * 10, leben: 0.7, max: 0.7 });
    } else {
      p.tint = staubFarbe; p.scale.set(0.35 + Math.random() * 0.25);
      p.position.set(fx, fy);
      effekt(p, { vx: hoch.x * 8 + Math.cos(a) * hinten * 14, vy: hoch.y * 8 + Math.sin(a) * hinten * 14, leben: 0.6, max: 0.6, wachsen: true, deckkraft: 0.45 });
    }
  }

  // ---------- Portale (aufrechte Tore) ----------
  // f = Farben einer Portal-Welt (data/welten.js → portal), sonst Gold/Violett
  function portalBauen(groesse, f) {
    f = f || { ring: 0xc9a84c, glanz: 0x7a3cff, innen: 0x14081f, wirbel: [0x9b6bff, 0xb3122e], rand: 0xe8c96d };
    const root = new PIXI.Container();
    const glanz = new PIXI.Sprite(T.glanz); glanz.anchor.set(0.5); glanz.tint = f.glanz; glanz.scale.set(2.6 * groesse, 4.4 * groesse);
    const oval = new PIXI.Container(); oval.scale.set(1, 1.85);           // Kreis → aufrechtes Oval
    const innen = new PIXI.Graphics().circle(0, 0, 44 * groesse).fill({ color: f.innen });
    const wirbel = new PIXI.Container();
    for (let i = 0; i < 3; i++) {
      const b = new PIXI.Graphics().arc(0, 0, (14 + i * 9) * groesse, i, i + 2.4).stroke({ width: 3 * groesse, color: f.wirbel[i === 1 ? 1 : 0], alpha: 0.85 });
      wirbel.addChild(b);
    }
    const ring = new PIXI.Graphics()
      .circle(0, 0, 46 * groesse).stroke({ width: 5 * groesse, color: f.ring })
      .circle(0, 0, 51 * groesse).stroke({ width: 2 * groesse, color: f.rand || f.ring, alpha: 0.6 });
    oval.addChild(innen, wirbel, ring);
    root.addChild(glanz, oval);
    root.scale.set(0.001, 0.001);
    return { root, wirbel, ring, groesse, offen: 0, ziel: 0, funkenFarben: [f.rand || f.ring, f.wirbel[0]] };
  }
  function portalAktualisieren(p, dt, zeit) {
    p.offen = lerp(p.offen, p.ziel, Math.min(1, dt * 3));
    const o = p.offen;
    p.root.scale.set(Math.max(0.001, o * (0.85 + 0.05 * Math.sin(zeit * 3))), Math.max(0.001, o));
    p.root.visible = o > 0.01;
    p.wirbel.rotation += dt * 2.2;
    if (o > 0.5 && !S.sparmodus && Math.random() < dt * 20 * p.groesse) {
      const w = Math.random() * Math.PI * 2;
      const x = p.root.x + Math.cos(w) * 46 * p.groesse, y = p.root.y + Math.sin(w) * 85 * p.groesse;
      if (effekte.length < PARTIKEL_MAX) {
        const s = new PIXI.Sprite(T.punkt); s.anchor.set(0.5); s.tint = p.funkenFarben[Math.random() < 0.6 ? 0 : 1]; s.scale.set(0.2);
        effekt(s, { vx: (Math.random() - 0.5) * 20, vy: -20 - Math.random() * 30, leben: 1, max: 1 });
        s.position.set(x, y);
      }
    }
  }

  // Kleine Portale am Rahmen für erscheinende / heimkehrende Figuren
  const kleinePortale = [];
  function kleinesPortal(x, y, winkel, dauer) {
    const p = portalBauen(0.32);
    const m = versetzt(x, y, winkel, S.hoehe * 0.55);
    p.root.position.set(m.x, m.y); p.root.rotation = winkel; p.ziel = 1;
    terrainEbene.addChild(p.root);
    kleinePortale.push({ p, rest: dauer });
  }

  // ---------- Großes Portal + Terrain ----------
  const TERRAIN = { x: W * 0.2, breite: W * 0.6, y: H - 62 };
  const terrain = new PIXI.Container();
  terrain.addChild(
    new PIXI.Graphics().rect(0, 0, TERRAIN.breite, 70).fill({ color: 0x120f18, alpha: 0.96 }),
    new PIXI.Graphics().rect(0, 0, TERRAIN.breite, 4).fill(0xc9a84c),
  );
  terrain.position.set(TERRAIN.x, H + 10);
  terrainEbene.addChild(terrain);
  let grossesPortal = portalBauen(1);
  const PORTAL_X = TERRAIN.x + 70;
  grossesPortal.root.position.set(PORTAL_X, TERRAIN.y - 85);
  terrainEbene.addChild(grossesPortal.root);
  // Portal in den Farben der Welt neu bauen (nur solange es zu ist), mit Rand-Bild aus data/welten.js, wenn vorhanden
  function grossesPortalFaerben(w) {
    const alt = grossesPortal, neu = portalBauen(1, w && w.portal);
    neu.root.position.copyFrom(alt.root.position);
    terrainEbene.addChildAt(neu.root, terrainEbene.getChildIndex(alt.root));
    alt.root.destroy({ children: true });
    grossesPortal = neu;
    const src = w && w.bilder && w.bilder.portal;
    if (src) texHolen(src).then((t) => {
      if (!t || grossesPortal !== neu || neu.root.destroyed) return;
      const sp = new PIXI.Sprite(t); sp.anchor.set(0.5); sp.scale.set(225 / t.height);   // das Loch im Bild passt dann um den Wirbel
      neu.ring.visible = false;
      neu.root.addChild(sp);
    });
  }
  // Das Portal (= Kreaturen-Kampf) kommt von allein ungefähr alle portal.alleMinuten, zufällig ±40 %
  const portalAbstand = () => (CFG.portal?.alleMinuten || 0) * 60 * (0.6 + Math.random() * 0.8);
  const EV = { phase: 'aus', zeit: 0, ende: 0, naechstes: portalAbstand() };

  // ---------- Figuren ----------
  const figuren = [];
  const nachId = new Map();

  function vorlageFuer(haus, typ, schluessel) {
    return VORLAGEN.find((v) => v.haus === haus && v.typ === typ)
      || VORLAGEN[hashZahl(schluessel || String(Math.random())) % VORLAGEN.length];
  }

  // ---------- Aussehen nach Level: Haus-Abzeichen, Frisur, Kopfschmuck, Begleiter ----------
  // Die Bilder werden erst geladen, wenn jemand sie trägt, und dann an die fertige Figur gehängt.
  const texCache = new Map();
  const texHolen = (src) => { if (!texCache.has(src)) texCache.set(src, laden(src).catch(() => null)); return texCache.get(src); };
  const RAHMEN = { b: 420, h: 520, nase: [300, 230] };        // Bezugsrahmen der Frisuren (tools/frisuren.py)
  const SYMBOLE = { haus2: 'symbole/haus2-schnalle.webp', haus3: 'symbole/haus3-schnalle.webp', haus4: 'symbole/haus4-schnalle.webp' };
  // Ein Bild, das dem Kopf folgt, aber im Körper davor (nach) oder dahinter (vor) einem Teil liegt
  function kopfFolger(fi, tex, kr, nachTeil, vorTeil, id) {
    const rig = fi.rig, kopf = rig.teile.kopf, ad = kopf.def.anker;
    const ox = kr.nase[0] - RAHMEN.nase[0] * kr.s, oy = kr.nase[1] - RAHMEN.nase[1] * kr.s;
    const sp = new PIXI.Sprite(tex);
    sp.anchor.set((ad[0] - ox) / kr.s / RAHMEN.b, (ad[1] - oy) / kr.s / RAHMEN.h);
    sp.scale.set(kr.s * RAHMEN.b / tex.width);
    const k = rig.koerper;
    const i = nachTeil ? k.getChildIndex(rig.teile[nachTeil].sprite) + 1 : k.getChildIndex(rig.teile[vorTeil].sprite);
    k.addChildAt(sp, i);
    (rig.folger = rig.folger || []).push({ sprite: sp, ziel: kopf.sprite });
    rig.teile[id] = { def: { an: 'kopf', id }, sprite: sp, dreh: 0 };      // damit Abdunkeln (Spiele) es mitnimmt
    return sp;
  }
  async function ausstatten(fi, aus, haarFarbe) {
    const rig = fi.rig, def = fi.vorlage.rigDef;
    if (!rig || !def) return;
    const FREI = window.NWU_FREI || (() => false), WAHL = window.NWU_WAHL_FREI || (() => false);
    const lebt = () => fi.root && !fi.root.destroyed;
    // Haus-Abzeichen an der Gürtelschnalle (Mond trägt schon den Mond)
    if (def.abzeichen && FREI(fi.level, 'abzeichen') && SYMBOLE[fi.vorlage.haus]) {
      const t = await texHolen(SYMBOLE[fi.vorlage.haus]);
      if (t && lebt()) {
        const r = rig.teile.rumpf, [bx, by, d] = def.abzeichen, an = r.def.anker;
        const sp = new PIXI.Sprite(t); sp.anchor.set(0.5); sp.scale.set(d / Math.max(t.width, t.height));
        sp.position.set(bx - an[0], by - an[1]); r.sprite.addChild(sp);
      }
    }
    const kr = def.kopfRahmen;
    if (!kr || !aus) return;
    const frisur = kr.frisur && WAHL(fi.level, 'frisur', aus.frisur) ? aus.frisur : null;
    const schmuck = WAHL(fi.level, 'kopf', aus.kopf, aus) ? aus.kopf : null;   // aus: behaltene Event-Stücke (Kürbiskopf)
    if (frisur) {
      const [kf, hf, fr] = await Promise.all([texHolen(`figuren/${fi.vorlage.rig}/kopf-frei.webp`), texHolen('frisuren/kopfform.webp'),
        frisur === 'glatze' ? null : texHolen(`frisuren/${frisur}.webp`)]);
      if (kf && hf && lebt()) {
        rig.teile.kopf.sprite.texture = kf;
        rig.teile.haare.sprite.visible = false;
        kopfFolger(fi, hf, kr, null, 'kopf', 'kopfhaut');
        if (fr) {
          const sp = kopfFolger(fi, fr, kr, kr.frisur === 'vorne' ? 'haare' : null, kr.frisur === 'vorne' ? null : 'kopf', 'frisur');
          if (haarFarbe) sp.tint = haarFarbe;
        }
      }
    }
    if (schmuck) {
      const t = await texHolen(`kopfschmuck/${schmuck}.webp`);
      if (t && lebt()) kopfFolger(fi, t, kr, rig.teile.frisur && kr.frisur === 'vorne' ? 'frisur' : 'haare', null, 'schmuck');
    }
    if (WAHL(fi.level, 'begleiter', aus.begleiter)) {
      const t = await texHolen(`begleiter/${aus.begleiter}.webp`);
      if (t && lebt()) {
        const art = window.NWU_BEGLEITER[aus.begleiter];
        const sp = new PIXI.Sprite(t); sp.anchor.set(0.5, 1);
        const h = S.hoehe * (art.fliegt ? 0.32 : aus.begleiter === 'wolf' ? 0.5 : 0.38);
        sp.scale.set(h / t.height);
        if (art.leuchtet) sp.blendMode = 'add';
        fi.root.addChildAt(sp, 1);
        fi.begleiter = { sprite: sp, art, basis: h / t.height, t: Math.random() * 6 };
      }
    }
  }
  function begleiterBewegen(fi, dt) {
    const b = fi.begleiter;
    if (!b) return;
    b.t += dt;
    const r = fi.richtung || 1, lauf = fi.g.laufen;
    const x = -r * S.hoehe * (b.art.fliegt ? 0.45 : 0.62);
    const y = b.art.fliegt ? -S.hoehe * (0.85 + 0.08 * Math.sin(b.t * 2.4)) : -Math.abs(Math.sin(b.t * 9)) * S.hoehe * 0.06 * lauf;
    b.sprite.position.set(b.sprite.x ? lerp(b.sprite.x, x, Math.min(1, dt * 4)) : x, y);
    b.sprite.scale.x = Math.abs(b.basis) * r;
    b.sprite.alpha = b.art.leuchtet ? 0.75 + 0.2 * Math.sin(b.t * 3) : 1;
    if (b.art.fliegt) b.sprite.rotation = 0.05 * Math.sin(b.t * 4);
  }

  function figurErzeugen(vorlage, info) {
    const root = new PIXI.Container();
    const schatten = new PIXI.Graphics().ellipse(0, 0, S.hoehe * 0.32, S.hoehe * 0.06).fill({ color: 0x000000, alpha: 0.35 });
    const rig = vorlage.rigDef ? window.NWU_RIG.bauen(vorlage.rigDef, vorlage.rigTex) : null;
    const koerper = rig ? rig.koerper : new PIXI.Sprite(vorlage.tex);
    if (!rig) koerper.anchor.set(0.5, 1);
    const basis = S.hoehe / vorlage.hoehe;
    koerper.scale.set(basis);
    root.addChild(schatten, koerper);
    root.alpha = 0;
    // Aussehen: Haarfarbe (eigene Wahl ab Level, sonst Standard des Hauses), Staub- und Funkenspur nach Level
    const level = info.level || 1, aus = info.aussehen || {};
    const FARBEN = window.NWU_HAARFARBEN || {}, FREI = window.NWU_FREI || (() => false);
    const erlaubt = window.NWU_HAARFARBE_FREI || (() => false);
    const haarId = erlaubt(level, aus.haare) ? aus.haare : (window.NWU_HAARE_STANDARD || {})[vorlage.haus];
    if (rig && rig.teile.haare && FARBEN[haarId]) rig.teile.haare.sprite.tint = FARBEN[haarId].farbe;
    // Silhouette: ganz dunkel, mit einem schwachen violetten Schimmer dahinter
    if (info.silhouette) {
      const dunkel = 0x07060a;
      if (rig) for (const t of Object.values(rig.teile)) t.sprite.tint = dunkel; else koerper.tint = dunkel;
      const schimmer = new PIXI.Sprite(T.glanz);
      schimmer.anchor.set(0.5); schimmer.tint = 0x7a5cff; schimmer.alpha = 0.55;
      schimmer.scale.set(S.hoehe / 40, S.hoehe / 30); schimmer.y = -S.hoehe * 0.5;
      root.addChildAt(schimmer, 1);
    }
    // Zeichen der Zitadelle: Wächter (Mods) tragen einen goldenen Ring zu ihren Füßen,
    // die Königin (Rolle koenigin) zusätzlich ein Diadem und einen violett-goldenen Schimmer
    const waechter = !info.silhouette && !info.besucher && (info.mod || ['waechter', 'koenigin'].includes(info.rolle));
    const koenigin = !info.silhouette && info.rolle === 'koenigin';
    let zeichen = null, diadem = null;
    if (waechter) {
      zeichen = new PIXI.Graphics()
        .ellipse(0, 0, S.hoehe * 0.38, S.hoehe * 0.075).stroke({ width: 2, color: 0xe8c96d, alpha: 0.9 })
        .ellipse(0, 0, S.hoehe * 0.3, S.hoehe * 0.055).stroke({ width: 1, color: 0xfff0b8, alpha: 0.6 });
      root.addChildAt(zeichen, 1);
    }
    if (koenigin) {
      const aura = new PIXI.Sprite(T.glanz);
      aura.anchor.set(0.5); aura.tint = 0xb88cff; aura.alpha = 0.4; aura.blendMode = 'add';
      aura.scale.set(S.hoehe / 38, S.hoehe / 28); aura.y = -S.hoehe * 0.5;
      root.addChildAt(aura, 1);
      diadem = new PIXI.Sprite(T.diadem);
      diadem.anchor.set(0.5, 1); diadem.scale.set(S.hoehe / 75);
      root.addChild(diadem);
    }
    if (info.jahrestag > 0 && !info.silhouette) {
      const gold = new PIXI.Sprite(T.glanz);
      gold.anchor.set(0.5); gold.tint = 0xe8c96d; gold.alpha = 0.5; gold.blendMode = 'add';
      gold.scale.set(S.hoehe / 36, S.hoehe / 26); gold.y = -S.hoehe * 0.5;
      root.addChildAt(gold, 1);
    }
    const krone = new PIXI.Sprite(T.krone);
    krone.anchor.set(0.5, 1); krone.scale.set(kronenGroesse()); krone.y = -S.hoehe * 1.04; krone.visible = false;
    root.addChild(krone);
    figurenEbene.addChild(root);
    const fi = {
      krone, zeichen, diadem, rolle: info.rolle || null,
      root, koerper, rig, schatten, basis, vorlage, jubel: 0, winken: 0, farbe: HAUSFARBE[vorlage.haus] || 0xc9a84c,
      id: info.id || null, name: info.name || '', mod: !!info.mod, demo: !!info.demo, gast: !!info.gast,
      level, staub: !info.silhouette && FREI(level, 'staub'), funkenSpur: !info.silhouette && FREI(level, 'funken'), spurZeit: 0,
      ungebunden: !!(info.silhouette || info.besucher), pruefeBis: 0,
      aussehenSchluessel: JSON.stringify(info.aussehen || {}) + level, profilZeit: zeit,
      s: info.s ?? Math.random() * umfang,
      richtung: Math.random() < 0.5 ? 1 : -1,
      tempo: 22 + Math.random() * 16,
      phase: Math.random() * 10, winkel: 0, lurker: !!info.lurker,
      zustand: 'idle', zustandZeit: 1.4 + Math.random() * 2,
      g: { laufen: 0, idle: 1, sitzen: 0, schlafen: 0 },
      sprung: -1, puls: 0, zTimer: 0, versatz: Math.random() * 20, jubelBis: 0, winkenBis: 0,
      einblenden: 0, entfernen: false, letzte: zeit,
      modus: 'rahmen', modusAlpha: 1, wartet: 0, x: 0,
    };
    fi.winkel = aufPfad(fi.s).a;
    const p = aufPfad(fi.s);
    kleinesPortal(p.x, p.y, p.a, 1.6);           // aus dem kleinen Portal heraustreten
    fi.einblenden = -0.6;                         // kurz warten, bis das Portal offen ist
    figuren.push(fi);
    if (fi.id) nachId.set(fi.id, fi);
    if (!info.silhouette && !info.besucher) ausstatten(fi, aus, FARBEN[haarId] ? FARBEN[haarId].farbe : 0);
    return fi;
  }

  function zustandWechseln(fi) {
    const r = Math.random();
    if (fi.modus === 'terrain') { fi.zustand = r < 0.7 ? 'laufen' : 'idle'; fi.zustandZeit = 1 + Math.random() * 3; if (r > 0.85) huepfen(fi); return; }
    if (fi.lurker) fi.zustand = r < 0.45 ? 'sitzen' : r < 0.9 ? 'schlafen' : 'laufen';
    else if (fi.mod) fi.zustand = r < 0.6 ? 'idle' : 'laufen';      // Wächter halten eher Wache
    else fi.zustand = r < 0.6 ? 'laufen' : r < 0.9 ? 'idle' : 'sitzen';
    fi.zustandZeit = fi.zustand === 'laufen' ? 3 + Math.random() * 7 : 2.5 + Math.random() * 6;
    if (fi.zustand === 'idle' && Math.random() < 0.3) fi.richtung *= -1;
    if (!fi.lurker && Math.random() < 0.06) huepfen(fi);
  }
  const huepfen = (fi) => { if (fi.sprung < 0) fi.sprung = 0; };

  function animieren(fi, dt, t) {
    const k = Math.min(1, dt * 4);
    for (const z in fi.g) fi.g[z] = lerp(fi.g[z], z === fi.zustand ? 1 : 0, k);
    const { laufen, idle, sitzen, schlafen } = fi.g;
    const hocken = sitzen + schlafen;
    fi.phase += dt * (5 + fi.tempo * 0.12) * laufen * (fi.eile || 1);
    const schritt = Math.abs(Math.sin(fi.phase));
    const atmen = Math.sin(t * (schlafen > 0.5 ? 1.4 : 2.3) + fi.phase);

    let sprungY = 0, sprungS = 0;
    if (fi.sprung >= 0) {
      fi.sprung += dt / 0.55;
      const u = Math.min(1, fi.sprung);
      sprungY = Math.sin(u * Math.PI) * S.hoehe * 0.35;
      sprungS = u < 0.15 ? -0.12 * (u / 0.15) : u > 0.9 ? -0.1 * ((u - 0.9) / 0.1) : 0.08;
      if (u >= 1) fi.sprung = -1;
    }
    fi.puls = Math.max(0, fi.puls - dt * 2.5);

    // Jubeln (Raid, Taste J) und Winken (Chat-Nachricht) – nur Teil-Figuren heben die Arme
    const jubelZiel = fi.jubelBis > zeit ? 1 : 0;
    fi.jubel = lerp(fi.jubel, jubelZiel, Math.min(1, dt * 5));
    fi.winken = lerp(fi.winken, fi.winkenBis > zeit ? 1 : 0, Math.min(1, dt * 6));

    if (fi.rig) {
      // Gelenke machen die Bewegung, der ganze Körper federt nur noch leicht
      const sy = 1 + laufen * 0.015 * schritt + idle * 0.01 * atmen + sprungS + fi.puls * 0.1;
      const sx = 1 + (1 - sy) * 0.6 + fi.puls * 0.05;
      fi.koerper.scale.set(fi.basis * sx * fi.richtung, fi.basis * sy);
      fi.koerper.y = -(laufen * schritt * S.hoehe * 0.035 + sprungY);
      fi.koerper.rotation = fi.richtung * schlafen * 0.1;
      fi.schlag = lerp(fi.schlag || 0, fi.schlagBis > zeit ? 1 : 0, Math.min(1, dt * 14));
      window.NWU_RIG.pose(fi.rig, { laufen, idle, sitzen, schlafen, phase: fi.phase, t: t + fi.versatz, jubel: fi.jubel, winken: fi.winken, schlag: fi.schlag });
    } else {
      const sy = 1 + laufen * (0.045 * schritt - 0.03) + idle * 0.018 * atmen + hocken * (-0.16 + 0.015 * atmen) + sprungS + fi.puls * 0.12;
      const sx = 1 + (1 - sy) * 0.6 + fi.puls * 0.06;
      fi.koerper.scale.set(fi.basis * sx * fi.richtung, fi.basis * sy);
      fi.koerper.y = -(laufen * schritt * S.hoehe * 0.07 + sprungY);
      fi.koerper.rotation = fi.richtung * (laufen * Math.sin(fi.phase) * 0.07 + schlafen * 0.2 + sitzen * 0.04);
    }
    fi.schatten.scale.set(1 - Math.min(0.5, (-fi.koerper.y) / S.hoehe), 1);
    fi.schatten.alpha = fi.winkel > -0.3 && fi.winkel < 0.3 ? 1 : 0;
  }

  // ---------- Anwesenheit (Chat) ----------
  let zeit = 0;
  // Ergebnis: Profil · 'ungebunden' (Worker sagt: noch kein Ritual) · null (kein Worker oder nicht erreichbar)
  async function profilLaden(u, frisch) {
    if (!S.api) return null;
    try {
      const r = await fetch(`${S.api.replace(/\/$/, '')}/avatare/profil?plattform=twitch&id=${encodeURIComponent(u.id)}`, { credentials: 'omit', cache: frisch ? 'no-store' : 'default' });
      const d = await r.json();
      return d.gefunden ? d : d.gefunden === false ? 'ungebunden' : null;
    } catch (e) { return null; }
  }

  // Wer noch kein Ritual gemacht hat, läuft als Silhouette. Schreibt die Person wieder, wird (höchstens
  // einmal pro Minute) nachgesehen, ob sie inzwischen gebunden ist – dann tritt ihre echte Gestalt hervor.
  async function bindungPruefen(fi, u) {
    if (fi.pruefeBis > zeit) return;
    fi.pruefeBis = zeit + 60;
    const profil = await profilLaden(u);
    if (!profil || profil === 'ungebunden' || fi.entfernen) return;
    fi.entfernen = true; fi.einblenden = Math.min(fi.einblenden, 0.3);
    nachId.delete(u.id);
    const neu = figurErzeugen(vorlageFuer(profil.haus, profil.figur, u.id), { id: u.id, name: u.name, mod: u.mod || ['waechter', 'koenigin'].includes(profil.rolle),
      level: profil.level, aussehen: profil.aussehen, s: fi.s, rolle: profil.rolle });
    setTimeout(() => levelUp(neu), 900);
    // Willkommen: das eigene Haus läuft zur neuen Gestalt und jubelt
    setTimeout(() => sammeln(neu, figuren.filter((f) => f.vorlage.haus === neu.vorlage.haus), 8, true), 2200);
  }

  // Neues Aussehen (Chat-Befehl oder „Mein Profil“): die Figur kleidet sich neu ein. Nach einem Befehl sofort
  // (Bot meldet „🪞 @Name …“), sonst prüft das Overlay höchstens alle 5 Minuten, wenn jemand schreibt.
  async function umziehen(fi, sofort) {
    if (!S.api || !fi.id || fi.ungebunden || fi.entfernen) return;
    if (!sofort && zeit - (fi.profilZeit || 0) < 300) return;
    fi.profilZeit = zeit;
    const p = await profilLaden({ id: fi.id }, true);
    if (!p || p === 'ungebunden' || fi.entfernen || fi.modus !== 'rahmen') return;
    if (JSON.stringify(p.aussehen || {}) + p.level === fi.aussehenSchluessel) return;
    fi.entfernen = true; fi.einblenden = Math.min(fi.einblenden, 0.3);
    nachId.delete(fi.id);
    const neu = figurErzeugen(vorlageFuer(p.haus, p.figur, fi.id), { id: fi.id, name: fi.name, mod: fi.mod || ['waechter', 'koenigin'].includes(p.rolle),
      level: p.level, aussehen: p.aussehen, s: fi.s, rolle: p.rolle, jahrestag: p.jahrestag, lurker: fi.lurker });
    setTimeout(() => { if (neu.root && !neu.root.destroyed) leuchten(neu); }, 900);
  }

  async function chatter(u, art) {
    const text = (u.text || '').trim().toLowerCase();
    // Aufstieg: Mit Worker meldet Streamer.bot „✨ @Name steigt auf: jetzt Level 6!“ (Ruhm oder !levelup).
    // Ohne Worker (Demo) reagiert das Overlay direkt auf !levelup @Name vom Streamer.
    const vomBot = u.broadcaster || BOTS.includes(u.name);
    if (art === 'nachricht' && !vomBot) chatPuls();             // Chat-Aktivität zählt fürs nächste Portal
    const auf = vomBot && text.match(/@([a-z0-9_]{2,25}) steigt auf.*?level (\d+)/);
    const lv = !S.api && u.broadcaster && text.match(/^!(?:levelup|lvlup|lvl)\s+@?([a-z0-9_]{2,25})/);
    if (auf || lv) {
      const ziel = figuren.find((f) => !f.entfernen && f.name === (auf || lv)[1]);
      if (ziel && ziel.root) {
        ziel.letzte = zeit;
        if (auf) aufsteigen(ziel, Number(auf[2]));
        levelUp(ziel);
      }
      if (lv || !u.broadcaster) return;
    }
    if (vomBot && pruefungNachricht(u.text || '')) return;
    if (vomBot && SPIELE.wurfNachricht(u.text || '')) return;
    const spiegel = vomBot && (u.text || '').match(/🪞 @([A-Za-z0-9_]{2,25})/);
    if (spiegel) { const f = figuren.find((x) => !x.entfernen && x.name === spiegel[1].toLowerCase()); if (f) umziehen(f, true); return; }
    // Duell (21.10.2026): Der Zähler in Streamer.bot entscheidet und zählt (!duell @Name → !annehmen),
    // hier wird nur noch der Kampf mit genau diesem Sieger gezeigt: „⚔️ A gegen B – A gewinnt das Duell! (3. Sieg)“
    const duellErgebnis = vomBot && (u.text || '').match(/⚔️?\s*@?([A-Za-z0-9_]{2,25}) gegen @?([A-Za-z0-9_]{2,25}) – @?([A-Za-z0-9_]{2,25}) gewinnt das Duell/);
    if (duellErgebnis) {
      const [na, nb, ns] = duellErgebnis.slice(1).map((n) => n.toLowerCase());
      const fa = figuren.find((f) => !f.entfernen && f.name === na), fb = figuren.find((f) => !f.entfernen && f.name === nb);
      if (fa && fb) duellStarten(fa, fb, ns === na ? fa : ns === nb ? fb : null);
      return;
    }
    if (SPIELE.darfStarten(u) && (SPIELE.befehl(text) || KAMPF.befehl(text))) return;
    if (vomBot && !u.broadcaster) return;                // Bot-Nachrichten erzeugen keine Figur
    if (!u.id || (u.broadcaster && !KOENIG)) return;    // ohne Königs-Figur (Bild fehlt) bleibt der Streamer unsichtbar
    let fi = nachId.get(u.id);
    if (fi && !fi.entfernen) {
      fi.letzte = zeit;
      if (!fi.root) return;                               // Profil lädt noch
      if (KAMPF.eingabe(fi, text) || SPIELE.eingabe(fi, text, u)) return;
      if (!S.api && text.startsWith('!wurf') && !fi.gewuerfelt && !fi.ungebunden) { fi.gewuerfelt = true; SPIELE.wurfZeigen(fi, 1 + Math.floor(Math.random() * 6)); return; }
      if (text.startsWith('!lurk')) { fi.lurker = true; fi.zustandZeit = 0; }
      else if (text.startsWith('!ruf') && !fi.ungebunden) { hausRuf(fi); }
      else if (text.startsWith('!wache') && fi.mod) { fi.wache = true; sammeln(fi, figuren.filter((f) => f.mod), 8, false); }
      else if (art === 'nachricht') { if (fi.lurker && !text.startsWith('!')) { fi.lurker = false; fi.zustandZeit = 0; } leuchten(fi); }
      if (fi.ungebunden) bindungPruefen(fi, u); else umziehen(fi, false);
      return;
    }
    nachId.set(u.id, { entfernen: false, letzte: zeit });   // Platzhalter gegen doppeltes Anlegen
    if (u.broadcaster) {                                  // 👑 der Schattenkönig: eigene Figur, kein Profil nötig, bleibt wie ein Wächter
      fi = figurErzeugen(KOENIG, { id: u.id, name: u.name, mod: true, lurker: text.startsWith('!lurk'), level: 10, aussehen: null, rolle: 'koenig', jahrestag: 0 });
      return;
    }
    const ergebnis = await profilLaden(u);
    const ungebunden = ergebnis === 'ungebunden', profil = ungebunden ? null : ergebnis;
    const vorlage = profil ? vorlageFuer(profil.haus, profil.figur, u.id) : ungebunden && BESUCHER.length ? BESUCHER[hashZahl(u.id) % BESUCHER.length] : vorlageFuer(null, null, u.id);
    fi = figurErzeugen(vorlage, { id: u.id, name: u.name, mod: u.mod || (profil && ['waechter', 'koenigin'].includes(profil.rolle)), lurker: text.startsWith('!lurk'),
      level: profil ? profil.level : 1, aussehen: profil ? profil.aussehen : null, silhouette: ungebunden && !BESUCHER.length, besucher: ungebunden && BESUCHER.length > 0, rolle: profil ? profil.rolle : null,
      jahrestag: profil ? profil.jahrestag : 0 });
    if (ungebunden) fi.pruefeBis = zeit + 60;
    if (!KAMPF.eingabe(fi, text)) SPIELE.eingabe(fi, text, u);   // z. B. erste Nachricht ist gleich !dabei oder !angriff
  }

  function leuchten(fi) {
    fi.puls = 1;
    if (fi.g && fi.g.laufen < 0.5 && fi.g.schlafen < 0.5) fi.winkenBis = zeit + 1.6;
    const p = versetzt(fi.root.x, fi.root.y, fi.winkel, S.hoehe * 0.6);
    funken(p.x, p.y, fi.farbe, 5);
  }

  // Nicht mehr als S.max Figuren gleichzeitig zeigen: Wächter und zuletzt Aktive zuerst
  function sichtbarkeit() {
    const max = S.sparmodus ? CFG.sparmodus.maxFiguren : S.max;
    const da = figuren.filter((f) => !f.entfernen).sort((a, b) => (b.mod - a.mod) || (b.letzte - a.letzte));
    da.forEach((f, i) => { f.versteckt = i >= max; });
  }

  // ---------- Raid-Formation und Gruppenbild ----------
  function formation(dauer, jubeln) {
    const reihe = figuren.filter((f) => !f.entfernen && !f.versteckt && f.modus === 'rahmen').sort((a, b) => a.root.x - b.root.x);
    reihe.forEach((f, i) => {
      f.modus = 'formation';
      f.zielS = R.w * (i + 1) / (reihe.length + 1);
      f.formEnde = zeit + dauer;
      f.formJubel = jubeln;
      f.lurkerVorher = f.lurker; f.lurker = false;
    });
  }

  // Neues Level übernehmen: Freischaltungen (Staub, Funken, Haarfarbe) sofort aktualisieren
  const BOTS = (CFG.botNamen || []).map((n) => n.toLowerCase());
  function aufsteigen(fi, level) {
    const FREI = window.NWU_FREI || (() => false);
    fi.level = level;
    fi.staub = FREI(level, 'staub');
    fi.funkenSpur = FREI(level, 'funken');
  }

  // ---------- Duelle ----------
  // Beide laufen am Rahmen aufeinander zu, drei Schlagabtausche mit Funken, dann jubelt der Sieger und
  // der Verlierer setzt sich kurz hin. Kein Ruhm wird gewonnen oder verloren.
  // Chat-Duelle (!duell @Name → !annehmen) entscheidet seit 21.10.2026 der Zähler in Streamer.bot (Siege zählen in !stats);
  // dann kommt der Sieger als `vorgabe` mit. Ohne Vorgabe (Duelle von selbst) entscheidet der Zufall.
  const DUELL_PAUSE = 120;                   // Sekunden, bis dieselbe Person wieder fordern darf
  const duellStil = new PIXI.TextStyle({ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 'bold', fill: 0xf1e9d6, stroke: { color: 0x120d06, width: 3 } });
  let duell = null;
  const darfDuellieren = (f) => f && f.root && !f.entfernen && !f.versteckt && !f.ungebunden && f.modus === 'rahmen';
  function duellStarten(a, b, vorgabe) {
    if (duell || SPIELE.laeuft() || KAMPF.laeuft() || a === b || !darfDuellieren(a) || !darfDuellieren(b) || (!vorgabe && (a.duellPause || 0) > zeit)) return false;
    let d = norm(b.s - a.s); if (d > umfang / 2) d -= umfang;
    const mitte = a.s + d / 2, abstand = S.hoehe * 0.42, r = Math.sign(d) || 1;
    for (const [f, seite] of [[a, -1], [b, 1]]) {
      f.modus = 'duell'; f.zielS = mitte + seite * r * abstand; f.duellRichtung = -seite * r;
      f.lurkerVorher = f.lurker; f.lurker = false; f.angekommen = false;
    }
    a.duellPause = zeit + DUELL_PAUSE;
    duell = { a, b, phase: 'anlauf', t: 0, schlaege: 0, vorgabe: vorgabe || null };
    return true;
  }
  // Duelle von selbst: begegnen sich zwei Figuren aus verschiedenen Häusern am Rahmen, kommt es ab und zu zum Kampf.
  // Höchstens alle CFG.duell.autoMinuten (Standard 4), 0 = aus. Schlafende und Lurker lassen sich nicht herausfordern.
  let autoDuellAb = q.has('duelltest') ? -1 : 60, autoDuellPruefen = 0;     // ?duelltest: erstes Duell sofort möglich
  function autoDuell(dt) {
    const minuten = CFG.duell?.autoMinuten ?? 4;
    if (!minuten || duell || zeit < autoDuellAb || (autoDuellPruefen -= dt) > 0) return;
    autoDuellPruefen = 2;
    const wach = (f) => darfDuellieren(f) && f.vorlage.haus && !f.lurker && f.zustand !== 'schlafen' && f.zustand !== 'sitzen' && (f.duellPause || 0) <= zeit;
    const da = figuren.filter(wach);
    for (let i = 0; i < da.length; i++) {
      for (let j = i + 1; j < da.length; j++) {
        const a = da[i], b = da[j];
        if (a.vorlage.haus === b.vorlage.haus) continue;
        let d = Math.abs(norm(b.s - a.s)); d = Math.min(d, umfang - d);
        if (d > S.hoehe * 0.8 || Math.random() > (CFG.duell?.autoChance ?? 0.3)) continue;
        if (duellStarten(a, b)) { autoDuellAb = zeit + minuten * 60 * (0.7 + Math.random() * 0.6); return; }
      }
    }
  }

  function duellSchritt(dt) {
    if (!duell) return;
    const { a, b } = duell;
    duell.t += dt;
    const weg = [a, b].some((f) => f.entfernen || f.versteckt || f.modus !== 'duell');
    const beenden = () => {
      for (const f of [a, b]) if (f.modus === 'duell') { f.modus = 'rahmen'; f.lurker = f.lurkerVorher; f.zustandZeit = 2; }
      duell = null;
    };
    if (weg) { beenden(); return; }
    if (duell.phase === 'anlauf') {
      if ((a.angekommen && b.angekommen) || duell.t > 10) { duell.phase = 'kampf'; duell.t = 0; }
    } else if (duell.phase === 'kampf') {
      if (duell.t > 0.85) {
        duell.t = 0;
        const angreifer = duell.schlaege % 2 ? b : a;
        angreifer.schlagBis = zeit + 0.32; angreifer.puls = 0.6;
        const m = { x: (a.root.x + b.root.x) / 2, y: (a.root.y + b.root.y) / 2 };
        const oben = versetzt(m.x, m.y, a.winkel, S.hoehe * 0.55);
        funken(oben.x, oben.y, 0xffe2a0, 7); funken(oben.x, oben.y, angreifer.farbe, 5);
        if (++duell.schlaege >= 6) { duell.phase = 'ende'; duell.t = 0; }
      }
    } else if (duell.phase === 'ende' && !duell.sieger) {
      // Höheres Level hilft ein wenig, entscheidet aber nie sicher (höchstens 70 : 30)
      const vorteil = Math.max(-0.2, Math.min(0.2, ((a.level || 1) - (b.level || 1)) * 0.02));
      const sieger = duell.vorgabe || (Math.random() < 0.5 + vorteil ? a : b), verlierer = sieger === a ? b : a;
      duell.sieger = sieger;
      sieger.jubelBis = zeit + 3; huepfen(sieger); leuchten(sieger);
      verlierer.zustand = 'sitzen'; verlierer.g.sitzen = 0.5;
      const t = new PIXI.Text({ text: '⚔ Sieg', style: duellStil });
      t.anchor.set(0.5);
      const p = versetzt(sieger.root.x, sieger.root.y, sieger.winkel, S.hoehe * 1.35);
      t.position.set(p.x, p.y);
      effekt(t, { vy: -14, leben: 2.6, max: 2.6 });
    } else if (duell.phase === 'ende' && duell.t > 3.5) {
      beenden();
    }
  }

  // ---------- Morrígans Prüfung (aus den Bot-Nachrichten von Streamer.bot) ----------
  // „🔮 Morrígans Prüfung: Frage — A) … · B) … · C) … — Antworte mit !a … (45 Sekunden)“
  // „🔮 @Name hat Morrígans Prüfung bestanden! …“ · „🔮 Die Zeit ist um. Niemand … Richtig war B) …“
  const karte = document.getElementById('pruefung');
  let karteZu = null, zeitAnim = null;
  function karteZeigen(frage, antworten, fuss, sekunden, kopf) {
    karte.querySelector('.kopf').textContent = kopf || 'Morrígans Prüfung';
    karte.querySelector('.frage').textContent = frage;
    karte.querySelector('.antworten').replaceChildren(...antworten.map((a) => { const s = document.createElement('span'); s.textContent = a; return s; }));
    karte.querySelector('.fuss').textContent = fuss;
    const zeit = karte.querySelector('.zeit');
    if (zeitAnim) zeitAnim.cancel();
    zeit.hidden = !sekunden;
    if (sekunden) zeitAnim = zeit.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: sekunden * 1000, fill: 'forwards' });
    karte.classList.add('an');
    clearTimeout(karteZu);
    karteZu = setTimeout(() => karte.classList.remove('an'), ((sekunden || 0) + 8) * 1000);
  }
  function pruefungNachricht(text) {
    const prophezeiung = text.match(/Morrígan prophezeit:\s*(.+)$/i);
    if (prophezeiung) { karteZeigen(`„${prophezeiung[1].trim()}“`, [], '', 0, 'Morrígans Prophezeiung'); clearTimeout(karteZu); karteZu = setTimeout(() => karte.classList.remove('an'), 14000); return true; }
    const start = text.match(/Morrígans Prüfung:\s*(.+?)\s+—\s+(.+?)\s+—\s+.*?\((\d+) Sekunden\)/i);
    if (start) { karteZeigen(start[1], start[2].split(' · '), 'Antworte im Chat mit !a, !b oder !c', Number(start[3])); return true; }
    const sieg = text.match(/@([A-Za-z0-9_]{2,25}) hat Morrígans Prüfung bestanden/i);
    if (sieg) {
      const name = sieg[1].toLowerCase();
      karte.querySelector('.fuss').textContent = '✦ Bestanden ✦';
      if (zeitAnim) zeitAnim.finish();
      clearTimeout(karteZu); karteZu = setTimeout(() => karte.classList.remove('an'), 7000);
      const fi = figuren.find((f) => !f.entfernen && f.name === name);
      if (fi && fi.root) { fi.jubelBis = zeit + 4; leuchten(fi); huepfen(fi); }
      return true;
    }
    const keiner = text.match(/Niemand hat Morrígans Prüfung bestanden\.\s*Richtig war ([A-D])\)/i);
    if (keiner) {
      const b = keiner[1].toUpperCase();
      karte.querySelectorAll('.antworten span').forEach((s) => s.classList.toggle('richtig', s.textContent.startsWith(b + ')')));
      karte.querySelector('.fuss').textContent = 'Niemand hat bestanden.';
      if (zeitAnim) zeitAnim.finish();
      clearTimeout(karteZu); karteZu = setTimeout(() => karte.classList.remove('an'), 7000);
      return true;
    }
    return false;
  }

  // ---------- Haus-Pokal: das Siegerhaus des letzten Monats trägt eine Krone ----------
  // Ohne Worker zum Testen: ?sieger=haus2
  let siegerHaus = q.get('sieger') || null;
  async function pokalLaden() {
    if (!S.api) return;
    try {
      const d = await (await fetch(`${S.api.replace(/\/$/, '')}/pokal`, { credentials: 'omit' })).json();
      siegerHaus = (d.vormonat && d.vormonat.sieger) || null;
    } catch (e) { /* nächstes Mal */ }
  }
  pokalLaden();
  setInterval(pokalLaden, 10 * 60 * 1000);

  // ---------- Flüstern aus dem Westen: seltenes Zeichen der verborgenen Häuser (Raben, Dornen) ----------
  // Am linken Bildrand: Nebel, zwei violette Augen und entweder ein Rabe, der davonfliegt, oder eine Dornenranke.
  const laufende = [];                      // kleine Abläufe mit eigener update(dt)-Funktion
  const FLUESTERN = (CFG.fluesternMinuten ?? 25) * 60;
  let fluesterIn = FLUESTERN * (0.6 + Math.random() * 0.8);
  // Rabe: Körper, Kopf mit Schnabel, Schwanz, zwei Flügel (schlagen über scale.y)
  function rabeBauen() {
    const linie = { width: 1.2, color: 0x7d6ca8 }, schwarz = 0x15121e;
    const fluegel = () => new PIXI.Graphics().poly([0, 0, -5, -7, -16, -20, -9, -19, -2, -12, 6, -14, 3, -4]).fill(schwarz).stroke(linie);
    const hinten = fluegel(), vorne = fluegel();
    hinten.position.set(-2, -2); hinten.tint = 0x9a90b0;
    vorne.position.set(1, -2);
    const koerper = new PIXI.Graphics()
      .poly([-12, -2, -24, -6, -21, 1, -24, 5, -12, 3]).fill(schwarz).stroke(linie)
      .ellipse(0, 0, 13, 5).fill(schwarz).stroke(linie)
      .circle(12, -3, 5).fill(schwarz).stroke(linie)
      .poly([16, -4, 24, -2, 16, -1]).fill(0x2a2433).stroke(linie)
      .circle(13, -4, 1.3).fill(0xc9a8ff);
    const r = new PIXI.Container();
    r.addChild(hinten, koerper, vorne);
    r.fluegel = [hinten, vorne];
    return r;
  }
  function fluestern(art) {
    if (S.sparmodus) return;
    art = art || (Math.random() < 0.5 ? 'rabe' : 'dornen');
    const y = H * (0.25 + Math.random() * 0.5);
    const box = new PIXI.Container();
    effektEbene.addChild(box);
    const nebel = new PIXI.Sprite(T.glanz); nebel.anchor.set(0.5); nebel.tint = 0x8a849a; nebel.scale.set(5, 4); nebel.position.set(0, y);
    const augen = new PIXI.Graphics().circle(-9, 0, 3).circle(9, 0, 3).fill(0xc9a8ff);
    augen.position.set(34, y - 10); augen.alpha = 0;
    box.addChild(nebel, augen);
    let t = 0, ende = 6;
    let figur = null;
    if (art === 'rabe') {
      figur = rabeBauen();
      figur.position.set(-30, y + 10); figur.scale.set(1.8);
      box.addChild(figur);
    } else {
      figur = new PIXI.Graphics();
      box.addChild(figur);
    }
    laufende.push((dt) => {
      t += dt;
      const ein = Math.min(1, t / 1.2), aus = Math.max(0, Math.min(1, (ende - t) / 1.5));
      nebel.alpha = 0.55 * ein * aus;
      augen.alpha = (t > 0.8 && t < 3.2 ? 1 : 0) * aus * (0.7 + 0.3 * Math.sin(t * 9));
      if (art === 'rabe') {
        const u = Math.max(0, t - 1.6);
        figur.x = -30 + u * 210; figur.y = y + 10 - u * 70 - Math.sin(u * 3) * 8;
        const schlag = Math.sin(u * 10);
        figur.fluegel.forEach((f, i) => { f.scale.y = schlag * (i ? 1 : 0.85); });
        figur.rotation = -0.25 + Math.sin(u * 3) * 0.06;
        figur.alpha = Math.min(1, u * 2) * aus;
      } else {
        // Ranke wächst herein und zieht sich wieder zurück
        const laenge = 260 * Math.min(1, Math.max(0, t - 0.8) / 2) * (t > ende - 1.8 ? Math.max(0, (ende - t) / 1.8) : 1);
        figur.clear();
        if (laenge > 2) {
          const pkt = (x) => ({ x, y: y + 18 + Math.sin(x / 34) * 12 });
          figur.moveTo(0, pkt(0).y);
          for (let x = 6; x <= laenge; x += 6) figur.lineTo(x, pkt(x).y);
          figur.stroke({ width: 5, color: 0x1c2a14 });
          for (let x = 24; x < laenge; x += 30) {
            const p = pkt(x), s = x % 60 ? -1 : 1;
            figur.poly([p.x - 4, p.y, p.x + 4, p.y, p.x, p.y + s * 11]).fill(0x2e4220);
          }
        }
      }
      if (t >= ende) { box.destroy({ children: true }); return false; }
      return true;
    });
  }

  // ---------- Sammeln: Haus-Ruf (!ruf), Wächter-Wache (!wache), Willkommen für Neu-Gebundene ----------
  // Die anderen laufen abwechselnd links und rechts neben die Person, schauen zu ihr und jubeln (oder halten Wache).
  const RUF_PAUSE = 180;                      // Sekunden pro Haus
  const rufPause = {};
  const sammelbar = (f) => f && f.root && !f.entfernen && !f.versteckt && !f.ungebunden && f.modus === 'rahmen';
  function sammeln(mitte, mitglieder, dauer, jubeln) {
    const andere = mitglieder.filter((f) => f !== mitte && sammelbar(f));
    if (!andere.length || !sammelbar(mitte)) return 0;
    const abstand = S.hoehe * 0.55;
    andere.sort((a, b) => Math.abs(norm(a.s - mitte.s)) - Math.abs(norm(b.s - mitte.s)));
    [mitte, ...andere].forEach((f, i) => {
      const seite = i === 0 ? 0 : (i % 2 ? -1 : 1) * Math.ceil(i / 2);
      f.modus = 'formation'; f.zielS = mitte.s + seite * abstand; f.formZiel = i === 0 ? undefined : mitte.s;
      f.formEnde = zeit + dauer; f.formJubel = jubeln; f.lurkerVorher = f.lurker; f.lurker = false;
    });
    return andere.length;
  }
  function hausRuf(fi) {
    const haus = fi.vorlage.haus;
    if ((rufPause[haus] || 0) > zeit) return;
    if (sammeln(fi, figuren.filter((f) => f.vorlage.haus === haus), 9, true)) {
      rufPause[haus] = zeit + RUF_PAUSE;
      leuchten(fi);
    }
  }

  // Karte während eines Spiels aktualisieren (Fußzeile, Liste mit markierter Antwort, offen halten)
  function karteFuss(text, zuIn) {
    karte.querySelector('.fuss').textContent = text;
    if (zuIn) { if (zeitAnim) zeitAnim.finish(); clearTimeout(karteZu); karteZu = setTimeout(() => karte.classList.remove('an'), zuIn * 1000); }
  }
  function karteListe(liste, richtig) {
    karte.querySelector('.antworten').replaceChildren(...liste.map((a, i) => {
      const s = document.createElement('span'); s.textContent = a; if (i === richtig) s.className = 'richtig'; return s;
    }));
  }
  function karteHalten() { clearTimeout(karteZu); karteZu = null; }

  const SPIELE = window.NWU_SPIELE({
    CFG, S, q, W, H, R, umfang, umfangVon: () => umfang, aufPfad, versetzt, lerp, figuren, effekt, funken, T, textur, effektEbene, figurenEbene, terrainEbene,
    karte, karteZeigen, karteFuss, karteListe, karteHalten, laufende, leuchten, huepfen, figurErzeugen, vorlageFuer, rabeBauen, EV,
    zeit: () => zeit, duellLaeuft: () => !!duell,
  });
  // Kreaturen-Kämpfe hinter dem großen Portal (overlay/kampf.js, Welten in data/welten.js)
  const KAMPF = window.NWU_KAMPF({
    CFG, S, W, H, TERRAIN, PORTAL_X, terrain, terrainEbene, figurenEbene, effektEbene, figuren, effekt, funken, T, textur, lerp, texHolen, EV,
    karteZeigen, karteFuss, karteListe, karteHalten, huepfen, versetzt, melden: SPIELE.melden, portalStarten, zeit: () => zeit,
  });
  // Fluchkammer: wird der Streamer verflucht, brennen / vernebeln / verlangsamen alle Figuren (fluch.js)
  if (window.NWU_FLUCH) window.NWU_FLUCH.anbinden({ app, S, CFG, figuren, effektEbene, versetzt, T });
  // Goldene Rüstung für König, Königin und Mods im Kreaturen-Kampf (ruestung.js)
  if (window.NWU_RUESTUNG) window.NWU_RUESTUNG.anbinden({ app, S, figuren, texHolen, funken, kampf: KAMPF });

  // ---------- OBS-Szene → Laufweg (eine Quelle für Gaming/Shooter/NoCam, 20.10.2026) ----------
  const szeneWaehlen = (name) => {
    const ziel = CFG.obsSzenen && CFG.obsSzenen[name];
    if (!ziel || q.has('cam') || ziel === S.szene || !CFG.szenen[ziel]) return;
    S.szene = ziel;
    laufwegSetzen(CFG.szenen[ziel]);
  };
  window.addEventListener('obsSceneChanged', (e) => szeneWaehlen(e.detail && e.detail.name));
  if (window.obsstudio && window.obsstudio.getCurrentScene) window.obsstudio.getCurrentScene((s) => s && szeneWaehlen(s.name));

  // ---------- Level-Up ----------
  const lvStil = new PIXI.TextStyle({ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 'bold', fill: 0xe8c96d, stroke: { color: 0x1a1208, width: 3 }, letterSpacing: 1 });
  function levelUp(fi) {
    const a = fi.winkel, mitte = versetzt(fi.root.x, fi.root.y, a, S.hoehe * 0.5);
    const strahl = new PIXI.Sprite(T.strahl);
    strahl.anchor.set(0.5, 1); strahl.tint = 0xe8c96d; strahl.rotation = a;
    strahl.position.set(fi.root.x, fi.root.y); strahl.scale.set(1.4, 1.2 * S.hoehe / 56);
    effekt(strahl, { leben: 1.8, max: 1.8 });
    const ring = new PIXI.Graphics().circle(0, 0, 10).stroke({ width: 3, color: fi.farbe });
    ring.position.set(mitte.x, mitte.y);
    effekt(ring, { leben: 1, max: 1, ring: true });
    funken(mitte.x, mitte.y, 0xe8c96d, 18);
    const schrift = new PIXI.Text({ text: 'LEVEL UP!', style: lvStil });
    schrift.anchor.set(0.5);
    const oben = versetzt(fi.root.x, fi.root.y, a, S.hoehe * 1.35);
    schrift.position.set(oben.x, oben.y);
    effekt(schrift, { vy: -18, leben: 2.4, max: 2.4 });
    huepfen(fi); fi.puls = 1; fi.jubelBis = zeit + 1.8;
  }

  // ---------- Großes Portal: Ablauf ----------
  // opt: { welt: 'mond'|'blut'|'nebel'|'flamme', boss: true } – ohne Angabe wählt der Kampf zufällig
  function portalStarten(opt) {
    if (EV.phase !== 'aus' || SPIELE.laeuft() || duell) return false;
    grossesPortalFaerben(KAMPF.vorbereiten(opt));
    EV.phase = 'oeffnen'; EV.zeit = 0;
    grossesPortal.ziel = 1;
    const dabei = figuren.filter((f) => !f.entfernen && !f.versteckt && f.modus === 'rahmen');
    dabei.forEach((f, i) => { f.modus = 'ins-portal'; f.wartet = 1.2 + i * 0.12; f.reihe = i; });
    EV.ende = (CFG.portal?.dauerSekunden || 150);
    return true;
  }
  function portalBeenden() {
    if (EV.phase === 'aus' || EV.phase === 'heimkehr' || EV.phase === 'schliessen') return;
    EV.phase = 'heimkehr';
    KAMPF.abbrechen();
    figuren.forEach((f) => { if (f.modus === 'terrain') { f.modus = 'heim'; f.zustand = 'laufen'; f.eile = 2; } });
    figuren.forEach((f) => { if (f.modus === 'ins-portal' || f.modus === 'wartet') { f.modus = 'rueckkehr'; f.wartet = 0.3; } });
  }

  // Chat-Aktivität: viele Nachrichten kurz hintereinander holen das nächste Portal nach vorne
  const chatZeiten = [];
  function chatPuls() {
    const P = CFG.portal || {};
    if (!P.chatNachrichten || !P.alleMinuten) return;
    chatZeiten.push(zeit);
    while (chatZeiten.length && zeit - chatZeiten[0] > (P.chatMinuten || 2) * 60) chatZeiten.shift();
    const frei = zeit - (EV.letztesEnde ?? -Infinity) > (P.chatPauseMinuten ?? 8) * 60;
    if (EV.phase === 'aus' && frei && chatZeiten.length >= P.chatNachrichten && EV.naechstes > 3) {
      EV.naechstes = 3;                     // in ein paar Sekunden – die üblichen Prüfungen (Spiel, Duell, Figuren da) gelten weiter
      chatZeiten.length = 0;
    }
  }

  function portalAblauf(dt) {
    // Boden fährt nach unten weg; der Hintergrund darüber (300 px hoch) würde sonst sichtbar bleiben → ausblenden
    const weg = EV.phase === 'aus' || EV.phase === 'schliessen';
    terrain.alpha = lerp(terrain.alpha, weg ? 0 : 1, Math.min(1, dt * (weg ? 1.5 : 3)));
    terrain.visible = terrain.alpha > 0.01;
    if (EV.phase === 'aus') {
      if (EV.naechstes > 0) { EV.naechstes -= dt; if (EV.naechstes <= 0) { if (SPIELE.laeuft() || duell) EV.naechstes = 10;
        else if (!figuren.some((f) => !f.entfernen && !f.versteckt && f.root && f.modus === 'rahmen')) EV.naechstes = 60;   // niemand da: später nochmal
        else { portalStarten(); EV.naechstes = portalAbstand(); } } }
      terrain.y = lerp(terrain.y, H + 10, Math.min(1, dt * 2));
      return;
    }
    EV.zeit += dt;
    if (EV.phase !== 'schliessen') terrain.y = lerp(terrain.y, TERRAIN.y, Math.min(1, dt * 2));
    if (EV.phase === 'oeffnen' && EV.zeit > 1.4) EV.phase = 'aktiv';
    if (EV.phase === 'aktiv' && EV.zeit > EV.ende) portalBeenden();
    if (EV.phase === 'heimkehr' && !figuren.some((f) => ['terrain', 'heim', 'ins-portal', 'wartet', 'austreten'].includes(f.modus))) {
      EV.phase = 'schliessen'; EV.zeit = 0; grossesPortal.ziel = 0;
    }
    if (EV.phase === 'schliessen') {
      terrain.y = lerp(terrain.y, H + 10, Math.min(1, dt * 2));
      if (EV.zeit > 1.6) { EV.phase = 'aus'; EV.letztesEnde = zeit; }
    }
  }

  // ---------- Hauptschleife ----------
  let sichtTimer = 0;
  app.ticker.add((ticker) => {
    const dt = Math.min(0.1, ticker.deltaMS / 1000);
    zeit += dt;
    portalAblauf(dt);
    raidPruefen();
    KAMPF.schritt(dt);
    duellSchritt(dt);
    autoDuell(dt);
    SPIELE.schritt(dt);
    for (let i = laufende.length - 1; i >= 0; i--) if (!laufende[i](dt)) laufende.splice(i, 1);
    if (FLUESTERN > 0 && (fluesterIn -= dt) <= 0) { fluestern(); fluesterIn = FLUESTERN * (0.6 + Math.random() * 0.8); }
    portalAktualisieren(grossesPortal, dt, zeit);
    for (let i = kleinePortale.length - 1; i >= 0; i--) {
      const k = kleinePortale[i];
      k.rest -= dt; if (k.rest <= 0.5) k.p.ziel = 0;
      portalAktualisieren(k.p, dt, zeit);
      if (k.rest <= 0) { k.p.root.destroy({ children: true }); kleinePortale.splice(i, 1); }
    }
    sichtTimer -= dt;
    if (sichtTimer <= 0) { sichtbarkeit(); sichtTimer = 1; }

    for (let i = figuren.length - 1; i >= 0; i--) {
      const fi = figuren[i];

      // Anwesenheit: nach Stille verabschieden (Demo-Figuren bleiben)
      if (!fi.demo && !fi.gast && !fi.entfernen && !fi.wache && zeit - fi.letzte > (fi.mod ? WAECHTER : ANWESENHEIT)) fi.entfernen = true;

      fi.einblenden = Math.min(1, fi.einblenden + dt * (fi.entfernen ? -0.8 : 2.2));
      if (fi.entfernen && fi.einblenden <= 0) {
        fi.root.destroy({ children: true }); figuren.splice(i, 1);
        if (fi.id && nachId.get(fi.id) === fi) nachId.delete(fi.id);
        continue;
      }
      fi.root.visible = !fi.versteckt;
      if (fi.versteckt) continue;

      fi.zustandZeit -= dt;
      if (fi.zustandZeit <= 0 && fi.modus !== 'formation' && fi.modus !== 'duell' && fi.modus !== 'spiel' && fi.kampfX === undefined) zustandWechseln(fi);
      if (fi.dunkelBis && zeit > fi.dunkelBis) { fi.dunkelBis = 0; if (!fi.getroffen) { SPIELE.aufhellen(fi); funken(fi.root.x, fi.root.y - S.hoehe * 0.5, fi.farbe, 10); } }
      fi.eile = fi.modus === 'heim' ? 2 : fi.modus === 'formation' ? 3 : fi.modus === 'spiel' ? (fi.spielEile || 2.2) : 1;

      // ----- Bewegung je nach Modus -----
      if (fi.modus === 'rahmen' || fi.modus === 'formation' || fi.modus === 'duell' || fi.modus === 'spiel') {
        if (fi.modus === 'spiel') {
          // ein Spiel steuert die Figur: zum Ziel laufen (zielS), dort in Blickrichtung stehen; spielFrei = Spiel setzt s selbst
          if (!fi.spielFrei) {
            let d = norm(fi.zielS - fi.s); if (d > umfang / 2) d -= umfang;
            if (Math.abs(d) > 2) { fi.richtung = Math.sign(d); fi.zustand = 'laufen'; fi.s += Math.sign(d) * Math.min(Math.abs(d), fi.spielTempo * dt); }
            else { if (fi.spielBlick) fi.richtung = fi.spielBlick; if (fi.zustand === 'laufen') fi.zustand = 'idle'; }
          }
        } else if (fi.modus === 'duell') {
          // zum Duellplatz laufen, dann dem Gegner zugewandt stehen (duellSchritt steuert den Rest)
          let d = norm(fi.zielS - fi.s); if (d > umfang / 2) d -= umfang;
          if (Math.abs(d) > 3) { fi.richtung = Math.sign(d); fi.zustand = 'laufen'; fi.s += Math.sign(d) * Math.min(Math.abs(d), 160 * dt); fi.angekommen = false; }
          else { fi.richtung = fi.duellRichtung; if (fi.zustand === 'laufen') fi.zustand = 'idle'; fi.angekommen = true; }
        } else if (fi.modus === 'formation') {
          let d = norm(fi.zielS - fi.s); if (d > umfang / 2) d -= umfang;
          if (Math.abs(d) > 3) { fi.richtung = Math.sign(d); fi.zustand = 'laufen'; fi.s += Math.sign(d) * Math.min(Math.abs(d), 230 * dt); }
          else {
            if (fi.formZiel !== undefined) { let z = norm(fi.formZiel - fi.s); if (z > umfang / 2) z -= umfang; fi.richtung = Math.abs(z) < 2 ? fi.richtung : Math.sign(z); }
            else fi.richtung = fi.root.x < R.x + R.w / 2 ? 1 : -1;
            fi.zustand = 'idle';
            if (fi.formJubel) fi.jubelBis = zeit + 0.3;
            if (fi.formJubel && fi.sprung < 0 && Math.random() < dt * 1.2) huepfen(fi);
          }
          if (zeit > fi.formEnde) { fi.modus = 'rahmen'; fi.lurker = fi.lurkerVorher; fi.zustandZeit = 0; fi.formZiel = undefined; }
        } else if (fi.g.laufen > 0.05) {
          fi.s += fi.richtung * fi.tempo * dt * fi.g.laufen;
        }
        const p = aufPfad(fi.s);
        if (linien) {     // Linienwechsel = Portal: Funken und sofort richtig herum
          const li = linieBei(fi.s);
          if (fi.linie !== undefined && li !== fi.linie) { funken(p.x, p.y, fi.farbe, 8); fi.winkel = p.a; }
          fi.linie = li;
        }
        fi.winkel = winkelLerp(fi.winkel, p.a, Math.min(1, dt * 6));
        fi.root.position.set(p.x, p.y);
        fi.modusAlpha = lerp(fi.modusAlpha, 1, Math.min(1, dt * 3));
      } else if (fi.modus === 'ins-portal') {
        // vom Rahmen ins Portal "gezogen": funkeln und verblassen
        fi.wartet -= dt;
        if (fi.wartet < 0.6) fi.modusAlpha = Math.max(0, fi.wartet / 0.6);
        if (fi.wartet <= 0) {
          const p = aufPfad(fi.s); funken(p.x, p.y, fi.farbe, 6);
          fi.modus = 'wartet'; fi.wartet = 0.6 + fi.reihe * 0.45;
        }
      } else if (fi.modus === 'wartet') {
        fi.wartet -= dt;
        if (fi.wartet <= 0) {
          fi.modus = 'austreten'; fi.x = PORTAL_X; fi.richtung = 1; fi.zustand = 'laufen'; fi.modusAlpha = 0;
          fi.austrittZiel = PORTAL_X + 80 + Math.random() * (KAMPF.laeuft() ? 160 : TERRAIN.breite - 200);   // im Kampf nur kurz heraus, dann in die Reihe
        }
      } else if (fi.modus === 'austreten' || fi.modus === 'terrain' || fi.modus === 'heim') {
        if (fi.modus === 'austreten') {
          fi.modusAlpha = Math.min(1, fi.modusAlpha + dt * 2.5);
          fi.x += fi.tempo * 1.6 * dt; fi.zustand = 'laufen';
          if (fi.x > fi.austrittZiel) { fi.modus = 'terrain'; fi.zustandZeit = 0; }
        } else if (fi.modus === 'terrain') {
          if (EV.phase === 'heimkehr') { fi.modus = 'heim'; fi.zustand = 'laufen'; fi.kampfX = undefined; }
          if (fi.kampfX !== undefined) {
            // Kreaturen-Kampf: zum Platz in der Reihe laufen, dann zur Kreatur schauen (kampf.js steuert die Schläge)
            const d = fi.kampfX - fi.x;
            if (Math.abs(d) > 3) { fi.richtung = Math.sign(d); fi.zustand = 'laufen'; fi.x += Math.sign(d) * Math.min(Math.abs(d), 140 * dt); }
            else { fi.richtung = fi.kampfBlick || 1; fi.zustand = 'idle'; }
          } else {
            if (fi.g.laufen > 0.05) fi.x += fi.richtung * fi.tempo * dt * fi.g.laufen;
            if (fi.x < PORTAL_X + 50) fi.richtung = 1;
            if (fi.x > TERRAIN.x + TERRAIN.breite - 30) fi.richtung = -1;
          }
        } else {
          fi.richtung = -1; fi.zustand = 'laufen';
          fi.x -= Math.max(170, fi.tempo * 5) * dt;          // zügig zurück ins Portal
          if (fi.x < PORTAL_X + 20) fi.modusAlpha = Math.max(0, (fi.x - PORTAL_X) / 20);
          if (fi.x <= PORTAL_X) { fi.modus = 'rueckkehr'; fi.wartet = 0.4 + Math.random() * 1.2; fi.modusAlpha = 0; }
        }
        fi.winkel = winkelLerp(fi.winkel, 0, Math.min(1, dt * 8));
        fi.root.position.set(fi.x, terrain.y);
      } else if (fi.modus === 'rueckkehr') {
        fi.wartet -= dt;
        if (fi.wartet <= 0) {
          const p = aufPfad(fi.s);
          kleinesPortal(p.x, p.y, p.a, 1.4);
          fi.winkel = p.a; fi.root.position.set(p.x, p.y);
          fi.modus = 'rahmen'; fi.modusAlpha = 0; fi.zustandZeit = 0;
        }
      }

      fi.root.alpha = Math.max(0, fi.einblenden) * fi.modusAlpha;
      fi.root.scale.set(0.6 + 0.4 * Math.max(0, Math.min(1, fi.einblenden)) * (0.7 + 0.3 * fi.modusAlpha));
      fi.root.rotation = fi.winkel;
      fi.krone.visible = !fi.ungebunden && !fi.diadem && fi.vorlage.haus === siegerHaus;
      if (fi.zeichen) fi.zeichen.alpha = 0.55 + 0.35 * Math.sin(zeit * 2.2 + fi.versatz);
      if (fi.diadem) fi.diadem.y = fi.koerper.y - S.hoehe * 0.93 + (fi.koerper.pivot.y || 0) * fi.basis;
      if (fi.krone.visible) fi.krone.y = fi.koerper.y - S.hoehe * 0.95 + (fi.koerper.pivot.y || 0) * fi.basis;
      animieren(fi, dt, zeit);
      begleiterBewegen(fi, dt);
      spur(fi, dt);

      if (fi.g.schlafen > 0.8 && !S.sparmodus) {
        fi.zTimer -= dt;
        if (fi.zTimer <= 0) { zzz(fi); fi.zTimer = 1.2 + Math.random() * 0.8; }
      }
    }

    for (let i = effekte.length - 1; i >= 0; i--) {
      const e = effekte[i];
      e.leben -= dt;
      if (e.leben <= 0) { e.obj.destroy(); effekte.splice(i, 1); continue; }
      e.obj.x += e.vx * dt; e.obj.y += e.vy * dt;
      const rest = e.leben / e.max;
      e.obj.alpha = Math.min(1, rest * 1.5) * (e.deckkraft ?? 1);
      if (e.wachsen) e.obj.scale.set(1 + (1 - rest) * 0.6);
      if (e.ring) e.obj.scale.set(1 + (1 - rest) * 4);
    }
    hudAktualisieren(dt);
  });

  // ---------- Raid: erst jubeln alle am Rahmen, dann öffnet sich das Portal zur Schatten-Invasion ----------
  // Der Raider kommt als riesiger Boss „Schatten von …“ (kampf.js). Abschalten: CFG.kampf.raidBoss = false.
  const JUBEL_SEK = 4;
  let raidWartet = null;
  function raidEmpfangen(u) {
    formation(JUBEL_SEK, true);
    if (CFG.kampf?.raidBoss === false) return;
    raidWartet = { raider: { name: (u && (u.anzeige || u.name)) || 'Unbekannt', zuschauer: (u && u.zuschauer) || 0 }, bei: zeit + JUBEL_SEK + 0.3 };
  }
  function raidPruefen() {           // nach dem Jubeln (Overlay-Zeit, nicht Uhrzeit) – wenn das Portal frei ist
    if (!raidWartet || zeit < raidWartet.bei) return;
    if (EV.phase === 'aus') portalStarten({ raider: raidWartet.raider });
    raidWartet = null;
  }

  // ---------- Chat verbinden ----------
  let chatStatus = S.kanal ? 'verbinde …' : 'aus (Demo)';
  if (S.kanal && window.NWU_CHAT) {
    window.NWU_CHAT.verbinden(S.kanal, {
      status: (s) => { chatStatus = s; },
      nachricht: (u) => chatter(u, 'nachricht'),
      raid: (u) => raidEmpfangen(u),
      sub: (u) => { const fi = nachId.get(u.id); if (fi && fi.root) { levelUp(fi); fi.letzte = zeit; } else figuren.forEach((f) => huepfen(f)); SPIELE.ernte(3); },
      bits: (u, menge) => SPIELE.ernte(Math.min(6, 1 + Math.floor(menge / 100))),     // Seelen-Ernte: je 100 Bits eine Kugel mehr
    });
  }

  // ---------- Anzeige und Tasten ----------
  const hud = document.getElementById('hud');
  if (!S.hud) hud.classList.add('aus');
  let hudZeit = 0;
  function hudAktualisieren(dt) {
    hudZeit += dt;
    if (hudZeit < 0.5 || !S.hud) return;
    hudZeit = 0;
    const da = figuren.filter((f) => !f.entfernen);
    hud.innerHTML =
      `<b>NWU Avatare</b> · ${Math.round(app.ticker.FPS)} FPS · ${da.filter((f) => !f.versteckt).length}/${da.length} Figuren · Chat: ${chatStatus}` +
      `${S.sparmodus ? ' · <b>Sparmodus</b>' : ''}${EV.phase !== 'aus' ? ' · Portal: ' + EV.phase + (KAMPF.welt() ? ' (' + KAMPF.welt().kurz + ')' : '') : ''}` +
      `${KAMPF.stand() ? ' · Kampf: ' + KAMPF.stand().phase : ''}` +
      `<div class="klein">T Test-Chatter · M Nachricht · N !lurk · K Kreaturen-Kampf (Shift+K Boss) · R Raid (Shift+R Raid-Boss) · P Portal · U Level-Up · G Gruppenbild · J Jubeln · D Duell · F Haus-Ruf · W Westen · B Rabe · E Rennen · Z Tauziehen · L Letzter steht · X Schatz · O Seelen-Ernte · Q Würfel · V Fluch · S Sparmodus · 1/2/3 Demo · H Anzeige</div>`;
  }

  let testNr = 0;
  const testUser = () => ({ id: 'test' + (++testNr), name: 'test' + testNr, anzeige: 'Test' + testNr, mod: Math.random() < 0.1, text: 'hallo' });
  const zufallsFigur = () => { const da = figuren.filter((f) => !f.entfernen && !f.versteckt && f.root); return da[Math.floor(Math.random() * da.length)]; };
  let demoNr = 0;
  function demoSetzen(n) {
    const demo = figuren.filter((f) => f.demo && !f.entfernen);
    const farben = Object.keys(window.NWU_HAARFARBEN || {});
    for (let i = demo.length; i < n; i++) {
      figurErzeugen(vorlageFuer(null, null, 'demo' + Math.random()), {
        demo: true, name: 'demo' + (++demoNr), lurker: Math.random() < 0.25,
        level: [1, 1, 3, 5, 5, 10][Math.floor(Math.random() * 6)],
        aussehen: { haare: farben[Math.floor(Math.random() * farben.length)] },
      });
    }
    for (let i = n; i < demo.length; i++) demo[i].entfernen = true;
  }

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 't') chatter(testUser(), 'nachricht');
    else if (k === 'm') { const f = zufallsFigur(); if (f) leuchten(f); }
    else if (k === 'n') { const f = zufallsFigur(); if (f) { f.lurker = true; f.zustandZeit = 0; } }
    else if (k === 'k') { if (EV.phase === 'aus') portalStarten({ boss: e.shiftKey ? true : undefined }); else portalBeenden(); }
    else if (k === 'r') { if (e.shiftKey) raidEmpfangen({ anzeige: 'TestRaider', zuschauer: 30 }); else formation(10, true); }
    else if (k === 'g') formation(12, false);
    else if (k === 'p') { if (EV.phase === 'aus') portalStarten(); else portalBeenden(); }
    else if (k === 'u') { const f = zufallsFigur(); if (f) levelUp(f); }
    else if (k === 'w') fluestern();
    else if (k === 'b') SPIELE.rabe();
    else if (k === 'e') SPIELE.rennen();
    else if (k === 'z') SPIELE.tauziehen();
    else if (k === 'l') SPIELE.letzter();
    else if (k === 'x') SPIELE.schatz();
    else if (k === 'o') SPIELE.ernte(4);
    else if (k === 'q') { const f = zufallsFigur(); if (f && !f.ungebunden) SPIELE.wurfZeigen(f, 1 + Math.floor(Math.random() * 6)); }
    else if (k === 'f') { const f = zufallsFigur(); if (f) hausRuf(f); }
    else if (k === 'd') { const da = figuren.filter(darfDuellieren); if (da.length > 1) duellStarten(da[0], da[1 + Math.floor(Math.random() * (da.length - 1))]); }
    else if (k === 'j') figuren.forEach((f, i) => setTimeout(() => { huepfen(f); f.jubelBis = zeit + 2.5; }, i * 60));
    else if (k === 's') { S.sparmodus = !S.sparmodus; sichtbarkeit(); }
    else if (k === '1') demoSetzen(4);
    else if (k === '2') demoSetzen(12);
    else if (k === '3') demoSetzen(30);
    else if (k === 'h') { S.hud = !S.hud; hud.classList.toggle('aus', !S.hud); }
  });

  demoSetzen(S.demo);
  window.NWU = { S, figuren, chatter, hausRuf, sammeln, fluestern, formation, portalStarten, portalBeenden, levelUp, EV, demoSetzen, figurErzeugen, VORLAGEN, duellStarten, duellLaeuft: () => !!duell, autoDuell,
    rabeStarten: SPIELE.rabe, rennenStarten: SPIELE.rennen, tauziehenStarten: SPIELE.tauziehen, letzterStarten: SPIELE.letzter,
    kampfStarten: portalStarten, kampfStand: KAMPF.stand, kampfEingabe: KAMPF.eingabe, kampfBefehl: KAMPF.befehl,
    schatzStarten: SPIELE.schatz, ernteStarten: SPIELE.ernte, wurfZeigen: SPIELE.wurfZeigen, spielLaeuft: () => (SPIELE.laeuft() ? SPIELE.laeuft().art : null), letzteMeldung: SPIELE.letzteMeldung };
})();
