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
    hud: an('hud', true),
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

  const lerp = (a, b, t) => a + (b - a) * t;
  const winkelLerp = (a, b, t) => a + (((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * t;
  const hashZahl = (text) => { let h = 2166136261; for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const HAUSFARBE = Object.fromEntries((window.NWU_HAEUSER || []).map((h) => [h.id, h.farbe]));

  // ---------- Laufweg um den Kamera-Rahmen ----------
  const R = { x: cam.x * W, y: cam.y * H, w: cam.w * W, h: cam.h * H };
  const umfang = 2 * (R.w + R.h);
  const norm = (s) => ((s % umfang) + umfang) % umfang;
  const aufPfad = (s) => {   // oben stehen, rechts klettern, unten kopfüber, links klettern
    s = norm(s);
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
  const zStil = new PIXI.TextStyle({ fontFamily: 'Georgia, serif', fontSize: 14, fontStyle: 'italic', fill: 0xd8dcf0 });
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
  function portalBauen(groesse) {
    const root = new PIXI.Container();
    const glanz = new PIXI.Sprite(T.glanz); glanz.anchor.set(0.5); glanz.tint = 0x7a3cff; glanz.scale.set(2.6 * groesse, 4.4 * groesse);
    const oval = new PIXI.Container(); oval.scale.set(1, 1.85);           // Kreis → aufrechtes Oval
    const innen = new PIXI.Graphics().circle(0, 0, 44 * groesse).fill({ color: 0x14081f });
    const wirbel = new PIXI.Container();
    for (let i = 0; i < 3; i++) {
      const b = new PIXI.Graphics().arc(0, 0, (14 + i * 9) * groesse, i, i + 2.4).stroke({ width: 3 * groesse, color: i === 1 ? 0xb3122e : 0x9b6bff, alpha: 0.85 });
      wirbel.addChild(b);
    }
    const ring = new PIXI.Graphics()
      .circle(0, 0, 46 * groesse).stroke({ width: 5 * groesse, color: 0xc9a84c })
      .circle(0, 0, 51 * groesse).stroke({ width: 2 * groesse, color: 0xe8c96d, alpha: 0.6 });
    oval.addChild(innen, wirbel, ring);
    root.addChild(glanz, oval);
    root.scale.set(0.001, 0.001);
    return { root, wirbel, groesse, offen: 0, ziel: 0 };
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
        const s = new PIXI.Sprite(T.punkt); s.anchor.set(0.5); s.tint = Math.random() < 0.6 ? 0xe8c96d : 0x9b6bff; s.scale.set(0.2);
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
  const grossesPortal = portalBauen(1);
  const PORTAL_X = TERRAIN.x + 70;
  grossesPortal.root.position.set(PORTAL_X, TERRAIN.y - 85);
  terrainEbene.addChild(grossesPortal.root);
  const EV = { phase: 'aus', zeit: 0, ende: 0, naechstes: (CFG.portal?.alleMinuten || 0) * 60 };

  // ---------- Figuren ----------
  const figuren = [];
  const nachId = new Map();

  function vorlageFuer(haus, typ, schluessel) {
    return VORLAGEN.find((v) => v.haus === haus && v.typ === typ)
      || VORLAGEN[hashZahl(schluessel || String(Math.random())) % VORLAGEN.length];
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
    const waechter = !info.silhouette && (info.mod || ['waechter', 'koenigin'].includes(info.rolle));
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
    krone.anchor.set(0.5, 1); krone.scale.set(S.hoehe / 70); krone.y = -S.hoehe * 1.04; krone.visible = false;
    root.addChild(krone);
    figurenEbene.addChild(root);
    const fi = {
      krone, zeichen, diadem, rolle: info.rolle || null,
      root, koerper, rig, schatten, basis, vorlage, jubel: 0, winken: 0, farbe: HAUSFARBE[vorlage.haus] || 0xc9a84c,
      id: info.id || null, name: info.name || '', mod: !!info.mod, demo: !!info.demo, gast: !!info.gast,
      level, staub: !info.silhouette && FREI(level, 'staub'), funkenSpur: !info.silhouette && FREI(level, 'funken'), spurZeit: 0,
      ungebunden: !!info.silhouette, pruefeBis: 0,
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
  async function profilLaden(u) {
    if (!S.api) return null;
    try {
      const r = await fetch(`${S.api.replace(/\/$/, '')}/avatare/profil?plattform=twitch&id=${encodeURIComponent(u.id)}`, { credentials: 'omit' });
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

  async function chatter(u, art) {
    const text = (u.text || '').trim().toLowerCase();
    // Aufstieg: Mit Worker meldet Streamer.bot „✨ @Name steigt auf: jetzt Level 6!“ (Ruhm oder !levelup).
    // Ohne Worker (Demo) reagiert das Overlay direkt auf !levelup @Name vom Streamer.
    const vomBot = u.broadcaster || BOTS.includes(u.name);
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
    if (vomBot && wurfNachricht(u.text || '')) return;
    if (darfStarten(u) && spielBefehl(text)) return;
    if (vomBot && !u.broadcaster) return;                // Bot-Nachrichten erzeugen keine Figur
    if (!u.id || u.broadcaster) return;                 // Schattenkönig bekommt später eine eigene Figur
    let fi = nachId.get(u.id);
    if (fi && !fi.entfernen) {
      fi.letzte = zeit;
      if (!fi.root) return;                               // Profil lädt noch
      const duellRuf = text.match(/^!duell\s+@?([a-z0-9_]{2,25})/);
      if (duellRuf) { duellStarten(fi, figuren.find((f) => !f.entfernen && f.name === duellRuf[1])); return; }
      if (spiel && spiel.eingabe(fi, text, u)) return;
      if (!S.api && text.startsWith('!wurf') && !fi.gewuerfelt && !fi.ungebunden) { fi.gewuerfelt = true; wurfZeigen(fi, 1 + Math.floor(Math.random() * 6)); return; }
      if (text.startsWith('!lurk')) { fi.lurker = true; fi.zustandZeit = 0; }
      else if (text.startsWith('!ruf') && !fi.ungebunden) { hausRuf(fi); }
      else if (text.startsWith('!wache') && fi.mod) { fi.wache = true; sammeln(fi, figuren.filter((f) => f.mod), 8, false); }
      else if (art === 'nachricht') { if (fi.lurker && !text.startsWith('!')) { fi.lurker = false; fi.zustandZeit = 0; } leuchten(fi); }
      if (fi.ungebunden) bindungPruefen(fi, u);
      return;
    }
    nachId.set(u.id, { entfernen: false, letzte: zeit });   // Platzhalter gegen doppeltes Anlegen
    const ergebnis = await profilLaden(u);
    const ungebunden = ergebnis === 'ungebunden', profil = ungebunden ? null : ergebnis;
    const vorlage = profil ? vorlageFuer(profil.haus, profil.figur, u.id) : vorlageFuer(null, null, u.id);
    fi = figurErzeugen(vorlage, { id: u.id, name: u.name, mod: u.mod || (profil && ['waechter', 'koenigin'].includes(profil.rolle)), lurker: text.startsWith('!lurk'),
      level: profil ? profil.level : 1, aussehen: profil ? profil.aussehen : null, silhouette: ungebunden, rolle: profil ? profil.rolle : null,
      jahrestag: profil ? profil.jahrestag : 0 });
    if (ungebunden) fi.pruefeBis = zeit + 60;
    if (spiel) spiel.eingabe(fi, text, u);              // z. B. erste Nachricht ist gleich !dabei
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

  // ---------- Ehrenduelle: !duell @Name ----------
  // Beide laufen am Rahmen aufeinander zu, drei Schlagabtausche mit Funken, dann jubelt der Sieger und
  // der Verlierer setzt sich kurz hin. Es geht nur um den Stolz – kein Ruhm wird gewonnen oder verloren.
  const DUELL_PAUSE = 120;                   // Sekunden, bis dieselbe Person wieder fordern darf
  const duellStil = new PIXI.TextStyle({ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 'bold', fill: 0xf1e9d6, stroke: { color: 0x120d06, width: 3 } });
  let duell = null;
  const darfDuellieren = (f) => f && f.root && !f.entfernen && !f.versteckt && !f.ungebunden && f.modus === 'rahmen';
  function duellStarten(a, b) {
    if (duell || spiel || a === b || !darfDuellieren(a) || !darfDuellieren(b) || (a.duellPause || 0) > zeit) return false;
    let d = norm(b.s - a.s); if (d > umfang / 2) d -= umfang;
    const mitte = a.s + d / 2, abstand = S.hoehe * 0.42, r = Math.sign(d) || 1;
    for (const [f, seite] of [[a, -1], [b, 1]]) {
      f.modus = 'duell'; f.zielS = mitte + seite * r * abstand; f.duellRichtung = -seite * r;
      f.lurkerVorher = f.lurker; f.lurker = false; f.angekommen = false;
    }
    a.duellPause = zeit + DUELL_PAUSE;
    duell = { a, b, phase: 'anlauf', t: 0, schlaege: 0 };
    return true;
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
      const sieger = Math.random() < 0.5 + vorteil ? a : b, verlierer = sieger === a ? b : a;
      duell.sieger = sieger;
      sieger.jubelBis = zeit + 3; huepfen(sieger); leuchten(sieger);
      verlierer.zustand = 'sitzen'; verlierer.g.sitzen = 0.5;
      const t = new PIXI.Text({ text: `⚔ ${sieger.name || 'Sieg'}`, style: duellStil });
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
      karte.querySelector('.fuss').textContent = `✦ ${sieg[1]} hat bestanden ✦`;
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

  // ---------- Spiele ----------
  // Fang den Raben, Wettrennen, Tauziehen, Letzter steht und Schatzsuche entscheidet das Overlay und meldet das
  // Ergebnis an Streamer.bot (Aktion „NWU Spiel“), das den Ruhm beim Worker bucht. Den Würfel der Morrígan wirft
  // der Worker, das Overlay zeigt nur, was Streamer.bot im Chat meldet.
  const SP = CFG.spiele || {};
  const RUHM_SP = (window.NWU_RUHM && window.NWU_RUHM.spiele) || {};
  const AKTIV = (window.NWU_AKTIVE_HAEUSER || []).map((h) => h.id);
  const HAUS = Object.fromEntries((window.NWU_HAEUSER || []).map((h) => [h.id, h]));
  const demoChat = !S.kanal;                       // ohne Chat spielen die Demo-Figuren (Taste 1/2/3) selbst mit
  const sbUrl = q.get('sb') ?? CFG.streamerbot ?? '';
  if (window.NWU_SB && sbUrl) window.NWU_SB.verbinden(sbUrl);
  let spiel = null, letzteMeldung = null;
  const spielFrei = () => !spiel && !duell && EV.phase === 'aus';
  const spielbar = (f) => f && f.root && !f.entfernen && !f.versteckt && !f.ungebunden && (f.modus === 'rahmen' || f.modus === 'formation');
  const echt = (f) => f.id && !f.demo && !f.gast && !f.ungebunden;
  const zufall = (liste) => liste[Math.floor(Math.random() * liste.length)];
  const plus = (art) => (RUHM_SP[art] && RUHM_SP[art].gewinner) || 0;

  const ansageStil = new PIXI.TextStyle({ fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: 'bold', fill: 0xe8c96d, stroke: { color: 0x120d06, width: 5 }, letterSpacing: 2 });
  const plusStil = new PIXI.TextStyle({ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 'bold', fill: 0xe8c96d, stroke: { color: 0x120d06, width: 3 } });
  const minusStil = new PIXI.TextStyle({ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 'bold', fill: 0xb9b0c9, stroke: { color: 0x120d06, width: 3 } });
  function ansage(text, dauer) {
    const t = new PIXI.Text({ text, style: ansageStil });
    t.anchor.set(0.5); t.position.set(R.x + R.w / 2, R.y + R.h / 2);
    effekt(t, { vy: -6, leben: dauer || 2.2, max: dauer || 2.2 });
  }
  const ueberKopf = (fi, h) => versetzt(fi.root.x, fi.root.y, fi.winkel, S.hoehe * (h || 1.3));
  function ueberFigur(fi, text, stil) {
    const t = new PIXI.Text({ text, style: stil || plusStil });
    const p = ueberKopf(fi);
    t.anchor.set(0.5); t.position.set(p.x, p.y);
    effekt(t, { vy: -16, leben: 2.4, max: 2.4 });
  }
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

  function melden(art, gewinner, verlierer, haus) {
    const ids = (l) => [...new Set((l || []).filter(echt).map((f) => f.id))];
    const g = ids(gewinner), v = ids(verlierer).filter((id) => !g.includes(id));
    letzteMeldung = { spiel: art, gewinner: g, verlierer: v, haus: haus || '' };
    if (!g.length && !v.length && !haus) return;
    if (window.NWU_SB) window.NWU_SB.aktion(SP.aktion || 'NWU Spiel', { spiel: art, plattform: 'twitch', gewinner: g.join(','), verlierer: v.join(','), haus: haus || '' });
  }

  // Figuren für die Dauer eines Spiels selbst steuern (modus 'spiel', siehe Hauptschleife)
  function insSpiel(f) {
    if (f.modus !== 'spiel') { f.lurkerVorher = f.lurker; f.formZiel = undefined; }
    f.modus = 'spiel'; f.lurker = false; f.zielS = f.s; f.spielBlick = 0; f.spielTempo = 200; f.spielFrei = false; f.spielEile = 0; f.letzte = zeit;
    if (f.zustand === 'sitzen' || f.zustand === 'schlafen') f.zustand = 'idle';
  }
  function ausSpiel(f) {
    if (f.gast) { f.entfernen = true; return; }
    if (f.modus === 'spiel') { f.modus = 'rahmen'; f.lurker = f.lurkerVorher; f.zustand = 'idle'; f.zustandZeit = 1 + Math.random() * 2; }
    f.spielFrei = false; f.getroffen = false;
    if (!f.dunkelBis) aufhellen(f);
  }
  // Haus ohne anwesende Mitglieder: ein Läufer des Hauses kommt als Gast und geht danach wieder
  function gast(haus, s) {
    return figurErzeugen(vorlageFuer(haus, zufall(['a', 'b', 'c', 'd'])), { gast: true, name: HAUS[haus] ? HAUS[haus].kurz : haus, s, level: 5 });
  }
  function abdunkeln(fi) {
    if (fi.dunkel) return;
    const teile = fi.rig ? Object.values(fi.rig.teile).map((t) => t.sprite) : [fi.koerper];
    fi.tintVorher = teile.map((s) => [s, s.tint]);
    teile.forEach((s) => { s.tint = 0x07060a; });
    fi.dunkel = true;
  }
  function aufhellen(fi) {
    if (!fi.dunkel) return;
    for (const [s, t] of fi.tintVorher) if (!s.destroyed) s.tint = t;
    fi.dunkel = false;
  }

  function spielSchritt(dt) {
    if (spiel) {
      spiel.t += dt;
      if (spiel.schritt(dt) === false) spiel = null;
    }
    // ab und zu startet ein Spiel von allein (nur wenn genug Leute da sind)
    if (ZUFALL > 0 && (zufallIn -= dt) <= 0) {
      zufallIn = ZUFALL * (0.6 + Math.random() * 0.8);
      const da = figuren.filter((f) => spielbar(f) && (demoChat || echt(f))).length;
      if (!S.sparmodus && da >= (SP.zufallAb ?? 3) && spielFrei()) zufall([rennenStarten, tauziehenStarten, letzterStarten, schatzStarten])();
    }
    if (RABE > 0 && (rabeIn -= dt) <= 0) {
      rabeIn = RABE * (0.6 + Math.random() * 0.8);
      if (!S.sparmodus && figuren.some(spielbar)) rabeStarten();
    }
  }

  // Start per Chat (Streamer, je nach Einstellung auch Mods) oder Taste
  const darfStarten = (u) => u.broadcaster || (SP.starter !== 'streamer' && u.mod);
  function spielBefehl(text) {
    const m = text.match(/^!(rennen|tauziehen|letzter|schatz|schatzsuche|rabe)\b(.*)$/);
    if (!m) return false;
    if (m[1] === 'rennen') rennenStarten();
    else if (m[1] === 'tauziehen') tauziehenStarten(m[2]);
    else if (m[1] === 'letzter') letzterStarten();
    else if (m[1] === 'rabe') rabeStarten();
    else schatzStarten();
    return true;
  }

  const ZUFALL = (SP.zufallMinuten ?? 30) * 60;
  let zufallIn = ZUFALL * (0.6 + Math.random() * 0.8);

  // ----- Fang den Raben -----
  const RABE = (SP.rabeMinuten ?? 15) * 60;
  let rabeIn = RABE * (0.6 + Math.random() * 0.8);
  function rabeStarten() {
    if (!spielFrei()) return false;
    const r = rabeBauen(); r.scale.set(1.6);
    effektEbene.addChild(r);
    const flug = SP.rabeSekunden || 14, y0 = H * (0.12 + Math.random() * 0.3);
    karteZeigen('Ein Rabe aus dem Westen fliegt durchs Bild!', [], 'Wer zuerst !fang schreibt, fängt ihn.', flug, 'Fang den Raben');
    let x = -40, y = y0, faenger = null, sitzt = 0, weg = -1;
    spiel = {
      art: 'rabe', t: 0,
      eingabe(fi, text) {
        if (faenger || weg >= 0 || !text.startsWith('!fang') || fi.ungebunden || !fi.root) return false;
        faenger = fi; fi.letzte = zeit;
        return true;
      },
      schritt(dt) {
        const u = spiel.t;
        if (demoChat && !faenger && u > 3 && Math.random() < dt * 0.35) { const f = figuren.find((x) => spielbar(x) && x.demo && Math.random() < 0.3); if (f) spiel.eingabe(f, '!fang'); }
        if (faenger && faenger.entfernen && !sitzt) faenger = null;
        let flattern = Math.sin(u * 10);
        if (weg >= 0) {                                           // fliegt davon
          weg += dt; x += 170 * dt; y -= 150 * dt; r.alpha = Math.max(0, 1 - weg / 1.6); r.scale.x = 1.6;
          r.rotation = -0.4;
          if (weg > 1.6) { r.destroy({ children: true }); return false; }
        } else if (!faenger) {
          x = -40 + u * (W + 80) / flug; y = y0 + Math.sin(u * 1.3) * 40;
          r.rotation = Math.sin(u * 1.3) * 0.08; r.scale.x = 1.6;
          if (x > W + 40) { karteFuss('Der Rabe ist entkommen.', 4); r.destroy({ children: true }); return false; }
        } else {
          const ziel = ueberKopf(faenger, 1.12);
          const dx = ziel.x - x, dy = ziel.y - y, d = Math.hypot(dx, dy);
          if (!sitzt && d > 6) {
            const v = Math.min(d, 650 * dt); x += dx / d * v; y += dy / d * v;
            r.scale.x = dx < 0 ? -1.6 : 1.6; r.rotation = 0;
          } else {
            if (!sitzt) {
              sitzt = 0.001;
              funken(ziel.x, ziel.y, 0xb88cff, 14); funken(ziel.x, ziel.y, 0xe8c96d, 8);
              faenger.jubelBis = zeit + 3; huepfen(faenger); faenger.puls = 1;
              ueberFigur(faenger, `+${plus('rabe')} Ruhm`);
              karteFuss(`✦ ${faenger.name || 'Jemand'} hat den Raben gefangen ✦`, 5);
              melden('rabe', [faenger]);
            }
            sitzt += dt; x = ziel.x; y = ziel.y; r.rotation = faenger.winkel;
            r.scale.x = Math.abs(r.scale.x) * (faenger.richtung || 1);
            flattern = sitzt < 0.4 ? flattern : 0.25;
            if (sitzt > 4.5 || faenger.entfernen) weg = 0;
          }
        }
        r.fluegel.forEach((f, i) => { f.scale.y = flattern * (i ? 1 : 0.85); });
        r.position.set(x, y);
        return true;
      },
    };
    return true;
  }

  // ----- Wettrennen der Häuser -----
  function rennenStarten() {
    if (!spielFrei() || AKTIV.length < 2) return false;
    const start = 0;                                          // obere linke Ecke des Rahmens
    const laeufer = AKTIV.map((haus, i) => {
      const eigene = figuren.filter((f) => spielbar(f) && f.vorlage.haus === haus).sort((a, b) => b.letzte - a.letzte);
      const fi = eigene[0] || gast(haus, start - 10);
      insSpiel(fi); fi.zielS = start - i * S.hoehe * 0.12; fi.spielTempo = 260; fi.spielBlick = 1;
      return { haus, fi, weg: 0, schub: 0, fans: new Set() };
    });
    const p0 = aufPfad(start);
    const flagge = new PIXI.Graphics().rect(-1.5, -S.hoehe * 1.5, 3, S.hoehe * 1.5).fill(0x3a2a14)
      .poly([1.5, -S.hoehe * 1.5, 24, -S.hoehe * 1.32, 1.5, -S.hoehe * 1.14]).fill(0xe8c96d).stroke({ width: 1, color: 0x2a1d08 });
    flagge.position.set(p0.x, p0.y); flagge.rotation = p0.a;
    effektEbene.addChild(flagge);
    const sperre = new Map();
    const LAUF = SP.rennenSekunden || 120;
    let phase = 'aufstellen', zaehler = 0, listeZeit = 0, ende = 0, sieger = null;
    karteZeigen('Je ein Läufer pro Haus, einmal um den Rahmen.', laeufer.map((l) => `${HAUS[l.haus].kurz} 0 %`), 'Schreibt im Chat, um euren Läufer anzufeuern!', 0, 'Wettrennen der Häuser');
    karteHalten();
    spiel = {
      art: 'rennen', t: 0,
      eingabe(fi, text) {
        if (phase !== 'lauf' || fi.ungebunden) return false;
        const l = laeufer.find((x) => x.haus === fi.vorlage.haus);
        const k = fi.id || fi;
        if (!l || (sperre.get(k) || 0) > zeit) return false;
        sperre.set(k, zeit + 1);                              // höchstens ein Schub pro Sekunde und Person
        l.schub = Math.min(140, l.schub + 18); l.fans.add(fi); l.fi.puls = 0.5;
        return false;                                         // die Nachricht zählt trotzdem normal
      },
      schritt(dt) {
        const t = spiel.t;
        if (phase === 'aufstellen') {
          if (t > 3 + zaehler && zaehler < 4) { ansage(['3', '2', '1', 'LOS!'][zaehler], 0.9); zaehler++; }
          if (zaehler >= 4) { phase = 'lauf'; spiel.t = 0; laeufer.forEach((l) => { l.start = l.fi.s; l.fi.spielFrei = true; }); }
          return true;
        }
        if (phase === 'lauf') {
          for (const l of laeufer) {
            if (demoChat && Math.random() < dt * 2.5) l.schub = Math.min(140, l.schub + 18);
            l.schub *= Math.exp(-dt * 0.8);
            const v = 14 + l.schub;
            l.weg += v * dt;
            const f = l.fi;
            f.s = l.start + l.weg; f.richtung = 1; f.zustand = 'laufen'; f.spielEile = 1 + v / 30; f.letzte = zeit;
          }
          if ((listeZeit -= dt) <= 0) { listeZeit = 0.4; karteListe(laeufer.map((l) => `${HAUS[l.haus].kurz} ${Math.min(100, Math.round(l.weg / umfang * 100))} %`)); }
          const vorne = laeufer.reduce((a, b) => (b.weg > a.weg ? b : a));
          if (vorne.weg >= umfang || t > LAUF) {
            sieger = vorne; phase = 'ende'; ende = t;
            for (const l of laeufer) { l.fi.spielFrei = false; l.fi.zielS = l.fi.s; l.fi.spielEile = 0; }
            const haus = HAUS[sieger.haus];
            ansage(`${haus.name.toUpperCase()} SIEGT`, 3);
            karteListe(laeufer.map((l) => `${HAUS[l.haus].kurz} ${Math.min(100, Math.round(l.weg / umfang * 100))} %`), laeufer.indexOf(sieger));
            karteFuss(`✦ Das ${haus.name} gewinnt das Rennen ✦`, 7);
            figuren.filter((f) => !f.entfernen && f.root && !f.ungebunden && f.vorlage.haus === sieger.haus)
              .forEach((f, i) => setTimeout(() => { f.jubelBis = zeit + 3; huepfen(f); }, i * 80));
            for (const f of sieger.fans) if (f.root && !f.entfernen) ueberFigur(f, `+${plus('rennen')} Ruhm`);
            const p = ueberKopf(sieger.fi, 0.6); funken(p.x, p.y, haus.farbe, 20); funken(p.x, p.y, 0xe8c96d, 12);
            melden('rennen', [...sieger.fans], [], sieger.haus);
          }
          return true;
        }
        if (t - ende > 4) { laeufer.forEach((l) => ausSpiel(l.fi)); flagge.destroy(); return false; }
        return true;
      },
    };
    return true;
  }

  // ----- Tauziehen: zwei Häuser an der oberen Kante, wer mehr !zieh schreibt, gewinnt -----
  function tauziehenStarten(wunschText) {
    if (!spielFrei() || AKTIV.length < 2) return false;
    const woerter = (wunschText || '').toLowerCase().split(/\s+/);
    const paar = [...new Set(AKTIV.filter((h) => woerter.some((w) => w && (w === HAUS[h].kurz.toLowerCase() || w === h))))].slice(0, 2);
    const anzahl = (h) => figuren.filter((f) => spielbar(f) && f.vorlage.haus === h).length;
    const rest = AKTIV.filter((h) => !paar.includes(h)).sort((a, b) => (anzahl(b) - anzahl(a)) || (Math.random() - 0.5));
    while (paar.length < 2) paar.push(rest.shift());
    const [ha, hb] = Math.random() < 0.5 ? paar : [paar[1], paar[0]];
    const mitte = R.w / 2, abstand = S.hoehe * 0.42;
    const team = (haus, seite) => {
      const m = figuren.filter((f) => spielbar(f) && f.vorlage.haus === haus).sort((a, b) => b.letzte - a.letzte).slice(0, 3);
      const liste = m.length ? m : [gast(haus, mitte + seite * R.w * 0.3)];
      liste.forEach((f, i) => { insSpiel(f); f.platz = seite * (1.1 + i) * abstand; f.spielBlick = -seite; f.spielTempo = 220; });
      return liste;
    };
    const A = team(ha, -1), B = team(hb, 1);
    const seil = new PIXI.Graphics();
    effektEbene.addChild(seil);
    const zieher = [new Set(), new Set()], zuege = [0, 0];
    const DAUER = SP.tauziehenSekunden || 60;
    let phase = 'aufstellen', versatz = 0, listeZeit = 0, ende = 0;
    const liste = () => [`${HAUS[ha].kurz} ${zuege[0]}`, `${HAUS[hb].kurz} ${zuege[1]}`];
    karteZeigen(`${HAUS[ha].name} gegen ${HAUS[hb].name}`, liste(), 'Gleich geht es los …', 0, 'Tauziehen');
    karteHalten();
    const ziehen = (i, fi) => {
      zuege[i]++; if (fi) zieher[i].add(fi);
      const f = zufall(i ? B : A); f.schlagBis = zeit + 0.25; f.puls = 0.4;
    };
    spiel = {
      art: 'tauziehen', t: 0,
      eingabe(fi, text) {
        if (phase !== 'ziehen' || !text.startsWith('!zieh') || fi.ungebunden) return false;
        const i = fi.vorlage.haus === ha ? 0 : fi.vorlage.haus === hb ? 1 : -1;
        if (i < 0) return false;
        ziehen(i, fi); fi.letzte = zeit;
        return true;
      },
      schritt(dt) {
        const t = spiel.t;
        if (phase === 'aufstellen' && t > 3.5) {
          phase = 'ziehen'; spiel.t = 0;
          karteZeigen(`${HAUS[ha].name} gegen ${HAUS[hb].name}`, liste(), 'Schreibt !zieh für euer Haus!', DAUER, 'Tauziehen');
          karteHalten();
        }
        if (phase === 'ziehen') {
          if (demoChat) for (const i of [0, 1]) if (Math.random() < dt * 3) ziehen(i, zufall(i ? B : A));
          if ((listeZeit -= dt) <= 0) { listeZeit = 0.3; karteListe(liste()); }
          if (t > DAUER) {
            phase = 'ende'; ende = t;
            const s = zuege[0] === zuege[1] ? -1 : zuege[0] > zuege[1] ? 0 : 1;
            karteListe(liste(), s);
            if (s < 0) { ansage('UNENTSCHIEDEN', 2.6); karteFuss('Keiner gibt nach – unentschieden.', 6); }
            else {
              const haus = HAUS[s ? hb : ha];
              ansage(`${haus.kurz.toUpperCase()} GEWINNT`, 3);
              karteFuss(`✦ Das ${haus.name} zieht die anderen über die Linie ✦`, 6);
              (s ? B : A).forEach((f) => { f.jubelBis = zeit + 3; huepfen(f); });
              (s ? A : B).forEach((f) => { f.zustand = 'sitzen'; });
              for (const f of zieher[s]) if (f.root && !f.entfernen) ueberFigur(f, `+${plus('tauziehen')} Ruhm`);
              melden('tauziehen', [...zieher[s]], [], s ? hb : ha);
            }
          }
        }
        // Seil verschiebt sich zur stärkeren Seite
        const ziel = Math.max(-R.w * 0.25, Math.min(R.w * 0.25, (zuege[1] - zuege[0]) * 4));
        versatz = lerp(versatz, ziel, Math.min(1, dt * 3));
        for (const f of [...A, ...B]) {
          f.zielS = Math.max(6, Math.min(R.w - 6, mitte + f.platz + versatz));
          f.spielTempo = phase === 'aufstellen' ? 220 : 90; f.letzte = zeit;
        }
        const hand = (f) => ueberKopf(f, 0.42);
        const links = A.reduce((a, b) => (b.s < a.s ? b : a)), rechts = B.reduce((a, b) => (b.s > a.s ? b : a));
        const a = hand(links), b = hand(rechts), m = versetzt(R.x + mitte + versatz, R.y, 0, S.hoehe * 0.42);
        seil.clear();
        if (phase !== 'aufstellen' || t > 2) {
          seil.moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ width: 3, color: 0x8a6a3a })
            .rect(m.x - 2, m.y - 7, 4, 14).fill(0xb3122e)
            .rect(R.x + mitte - 1, R.y - 4, 2, 8).fill(0xe8c96d);
        }
        if (phase === 'ende' && t - ende > 4) { [...A, ...B].forEach(ausSpiel); seil.destroy(); return false; }
        return true;
      },
    };
    return true;
  }

  // ----- Letzter steht: anmelden mit !dabei, dann schlagen Morrígans Blitze ein, bis einer übrig ist -----
  function blitz(fi) {
    const unten = ueberKopf(fi, 0.55), oben = ueberKopf(fi, 6);
    const pkt = [oben];
    for (let i = 1; i < 7; i++) {
      const u = i / 7, quer = (Math.random() - 0.5) * 28;
      pkt.push({ x: lerp(oben.x, unten.x, u) + Math.cos(fi.winkel) * quer, y: lerp(oben.y, unten.y, u) + Math.sin(fi.winkel) * quer });
    }
    pkt.push(unten);
    const g = new PIXI.Graphics();
    for (const [breite, farbe, alpha] of [[7, 0x7a5cff, 0.45], [2.5, 0xffffff, 1]]) {
      g.moveTo(pkt[0].x, pkt[0].y); pkt.slice(1).forEach((p) => g.lineTo(p.x, p.y));
      g.stroke({ width: breite, color: farbe, alpha });
    }
    effekt(g, { leben: 0.5, max: 0.5 });
    funken(unten.x, unten.y, 0xffffff, 12); funken(unten.x, unten.y, 0xb88cff, 8);
  }
  function letzterStarten() {
    if (!spielFrei()) return false;
    const ANMELDUNG = SP.letzterAnmeldung || 45;
    const dabei = new Set();
    let phase = 'anmeldung', kaempfer = [], naechster = 0, phaseStart = 0, nebel = null;
    karteZeigen('Morrígans Blitze suchen den Letzten, der steht.', ['0 Kämpfer'], 'Schreibt !dabei, um anzutreten', ANMELDUNG, 'Letzter steht');
    karteHalten();
    spiel = {
      art: 'letzter', t: 0,
      eingabe(fi, text) {
        if (phase !== 'anmeldung' || !text.startsWith('!dabei') || fi.ungebunden || dabei.has(fi)) return false;
        dabei.add(fi); fi.letzte = zeit; leuchten(fi);
        karteListe([`${dabei.size} Kämpfer`]);
        return true;
      },
      schritt(dt) {
        const t = spiel.t;
        if (phase === 'anmeldung') {
          if (demoChat && Math.random() < dt * 0.6) { const f = zufall(figuren.filter((x) => spielbar(x) && x.demo)); if (f) spiel.eingabe(f, '!dabei'); }
          if (t < ANMELDUNG) return true;
          kaempfer = [...dabei].filter((f) => f.root && !f.entfernen && !f.ungebunden);
          if (kaempfer.length < 2) { karteFuss('Zu wenige Kämpfer. Morrígan wartet auf mutigere Seelen.', 5); return false; }
          kaempfer.forEach((f, i) => { insSpiel(f); f.zielS = i * umfang / kaempfer.length; f.spielTempo = 320; });
          karteZeigen('Morrígans Blitze fallen.', [`${kaempfer.length} Kämpfer`], 'Wer zuletzt steht, gewinnt.', 0, 'Letzter steht');
          karteHalten();
          nebel = new PIXI.Container();
          for (let s = 0; s < umfang; s += 70) {
            const p = aufPfad(s), n = new PIXI.Sprite(T.glanz);
            n.anchor.set(0.5); n.tint = 0x2a1f3d; n.position.set(p.x, p.y); n.scale.set(3); n.alpha = 0;
            nebel.addChild(n);
          }
          terrainEbene.addChild(nebel);
          phase = 'aufstellen'; phaseStart = t;
          return true;
        }
        const lebend = kaempfer.filter((f) => !f.getroffen && !f.entfernen);
        if (nebel) nebel.children.forEach((n, i) => { n.alpha = Math.min(0.75, (t - phaseStart) / 25) * (0.8 + 0.2 * Math.sin(t * 2 + i)); n.scale.set(3 + Math.min(2, (t - phaseStart) / 15)); });
        if (phase === 'aufstellen' && t - phaseStart > 4) { phase = 'kampf'; naechster = t + 1.5; }
        if (phase === 'kampf') {
          kaempfer.forEach((f) => { f.letzte = zeit; });
          if (lebend.length <= 1) {
            phase = 'ende'; phaseStart = t;
            const s = lebend[0];
            if (s) {
              s.jubelBis = zeit + 4; huepfen(s); s.puls = 1;
              const p = ueberKopf(s, 0.6); funken(p.x, p.y, 0xe8c96d, 24); funken(p.x, p.y, s.farbe, 12);
              ansage(`${(s.name || 'Einer').toUpperCase()} STEHT`, 3.2);
              ueberFigur(s, `+${plus('letzter')} Ruhm`);
              karteFuss(`✦ ${s.name || 'Einer'} steht als Letzter ✦`, 7);
              melden('letzter', [s]);
            } else karteFuss('Niemand ist übrig geblieben.', 5);
          } else if (t > naechster) {
            const opfer = zufall(lebend);
            blitz(opfer); opfer.getroffen = true; abdunkeln(opfer); opfer.zustand = 'sitzen'; opfer.puls = 1;
            karteListe([`${lebend.length - 1} stehen noch`]);
            naechster = t + (lebend.length > 6 ? 1.2 : 1.8) + Math.random() * 1.6;
          }
        }
        if (phase === 'ende' && t - phaseStart > 5) {
          kaempfer.forEach(ausSpiel);
          if (nebel) nebel.destroy({ children: true });
          return false;
        }
        return true;
      },
    };
    return true;
  }

  // ----- Schatzsuche: eine Truhe an einer Seite des Rahmens, Raten mit !grab oben/rechts/unten/links -----
  const SEITEN = ['oben', 'rechts', 'unten', 'links'];
  const SEITE_START = [0, R.w, R.w + R.h, 2 * R.w + R.h], SEITE_LAENGE = [R.w, R.h, R.w, R.h];
  function truheBauen() {
    const c = new PIXI.Container();
    const glanz = new PIXI.Sprite(T.glanz); glanz.anchor.set(0.5); glanz.tint = 0xe8c96d; glanz.blendMode = 'add'; glanz.scale.set(2.2); glanz.y = -14; glanz.alpha = 0;
    const kiste = new PIXI.Graphics()
      .rect(-15, -16, 30, 16).fill(0x5a3a1c).stroke({ width: 1.5, color: 0x1e1208 })
      .rect(-15, -12, 30, 3).fill(0xc9a84c).rect(-2.5, -14, 5, 6).fill(0xe8c96d).stroke({ width: 1, color: 0x2a1d08 });
    const deckel = new PIXI.Graphics()
      .roundRect(0, -9, 30, 9, 4).fill(0x6e4823).stroke({ width: 1.5, color: 0x1e1208 }).rect(0, -4, 30, 2).fill(0xc9a84c);
    deckel.position.set(-15, -16);
    c.addChild(glanz, kiste, deckel);
    c.glanz = glanz; c.deckel = deckel;
    return c;
  }
  function schatzStarten() {
    if (!spielFrei()) return false;
    const richtig = Math.floor(Math.random() * 4);
    const SEK = SP.schatzSekunden || 60;
    const tipps = new Map(), zahl = [0, 0, 0, 0];
    let phase = 'raten', ende = 0, truhe = null;
    const liste = () => SEITEN.map((s, i) => `${s} ${zahl[i]}`);
    karteZeigen('Morrígan hat am Rahmen eine Truhe versteckt.', liste(), 'Rate mit !grab oben, unten, links oder rechts', SEK, 'Schatzsuche');
    karteHalten();
    spiel = {
      art: 'schatz', t: 0,
      eingabe(fi, text) {
        const m = text.match(/^!grab\s+(oben|rechts|unten|links)/);
        if (phase !== 'raten' || !m || fi.ungebunden || tipps.has(fi)) return false;
        const i = SEITEN.indexOf(m[1]);
        tipps.set(fi, i); zahl[i]++; fi.letzte = zeit;
        if (spielbar(fi)) { insSpiel(fi); fi.zielS = SEITE_START[i] + SEITE_LAENGE[i] * (0.12 + Math.random() * 0.76); fi.spielTempo = 170; }
        karteListe(liste());
        return true;
      },
      schritt(dt) {
        const t = spiel.t;
        if (phase === 'raten') {
          if (demoChat && Math.random() < dt * 0.5) { const f = zufall(figuren.filter((x) => spielbar(x) && x.demo)); if (f) spiel.eingabe(f, '!grab ' + zufall(SEITEN)); }
          if (t < SEK) return true;
          phase = 'auf'; ende = t;
          const p = aufPfad(SEITE_START[richtig] + SEITE_LAENGE[richtig] / 2);
          truhe = truheBauen(); truhe.position.set(p.x, p.y); truhe.rotation = p.a; truhe.scale.set(0);
          figurenEbene.addChild(truhe);
          const gewinner = [...tipps].filter(([, i]) => i === richtig).map(([f]) => f);
          const verlierer = [...tipps].filter(([, i]) => i !== richtig).map(([f]) => f);
          karteListe(liste(), richtig);
          if (!tipps.size) karteFuss(`Die Truhe lag ${SEITEN[richtig]}. Niemand hat gesucht – sie versinkt wieder im Nebel.`, 6);
          else {
            const abzug = (RUHM_SP.schatz && RUHM_SP.schatz.verlierer) || 0;
            karteFuss(`Die Truhe lag ${SEITEN[richtig]}! ${gewinner.length} finden den Schatz (+${plus('schatz')} Ruhm)` +
              (verlierer.length ? `, ${verlierer.length} gehen leer aus (${abzug} Ruhm)` : ''), 8);
          }
          setTimeout(() => {
            gewinner.filter((f) => f.root && !f.entfernen).forEach((f) => { f.jubelBis = zeit + 3; huepfen(f); ueberFigur(f, `+${plus('schatz')} Ruhm`); });
            verlierer.filter((f) => f.root && !f.entfernen).forEach((f) => { f.zustand = 'sitzen'; ueberFigur(f, `${(RUHM_SP.schatz && RUHM_SP.schatz.verlierer) || 0} Ruhm`, minusStil); });
          }, 1200);
          melden('schatz', gewinner, verlierer);
          return true;
        }
        const u = t - ende;
        truhe.scale.set(Math.min(1, u * 3) * 1.3);
        if (u > 0.9 && truhe.deckel.rotation > -1.1) {
          if (truhe.deckel.rotation === 0) { const p = ueberKopf({ root: truhe, winkel: truhe.rotation }, 0.3); funken(p.x, p.y, 0xe8c96d, 26); }
          truhe.deckel.rotation = Math.max(-1.1, truhe.deckel.rotation - dt * 4);
        }
        truhe.glanz.alpha = u > 0.9 ? 0.55 + 0.25 * Math.sin(u * 5) : 0;
        if (u > 6.5) {
          truhe.alpha = Math.max(0, 1 - (u - 6.5) / 0.8);
          if (u > 7.3) { for (const f of tipps.keys()) ausSpiel(f); truhe.destroy({ children: true }); return false; }
        }
        return true;
      },
    };
    return true;
  }

  // ----- Würfel der Morrígan: „🎲 @Name würfelt eine 6 …“ von Streamer.bot -----
  const AUGEN = { 1: [[11, 11]], 2: [[6, 6], [16, 16]], 3: [[6, 6], [11, 11], [16, 16]], 4: [[6, 6], [16, 6], [6, 16], [16, 16]],
    5: [[6, 6], [16, 6], [11, 11], [6, 16], [16, 16]], 6: [[6, 5], [16, 5], [6, 11], [16, 11], [6, 17], [16, 17]] };
  const WUERFEL = [1, 2, 3, 4, 5, 6].map((n) => textur((g) => {
    g.roundRect(0, 0, 22, 22, 5).fill(0xf4efe2).stroke({ width: 1.5, color: 0x2a1d08 });
    for (const [x, y] of AUGEN[n]) g.circle(x, y, 2.1).fill(n === 1 ? 0xb3122e : 0x1a1208);
  }));
  function wurfZeigen(fi, zahl) {
    if (!fi || !fi.root || fi.entfernen) return;
    const w = new PIXI.Sprite(WUERFEL[0]); w.anchor.set(0.5);
    effektEbene.addChild(w);
    let t = 0, fertig = false;
    laufende.push((dt) => {
      t += dt;
      if (!fi.root || fi.root.destroyed) { w.destroy(); return false; }
      const p = ueberKopf(fi, 1.6 + Math.max(0, 0.6 - t) * 0.8);
      w.position.set(p.x, p.y);
      if (t < 1.3) { w.texture = WUERFEL[Math.floor(t * 14) % 6]; w.rotation = t * 11; }
      else if (!fertig) { fertig = true; w.texture = WUERFEL[zahl - 1]; w.rotation = fi.winkel; w.scale.set(1.25); wurfWirkung(fi, zahl); }
      w.alpha = t > 3.6 ? Math.max(0, 1 - (t - 3.6) / 0.6) : 1;
      if (t > 4.2) { w.destroy(); return false; }
      return true;
    });
  }
  function wurfWirkung(fi, zahl) {
    const p = ueberKopf(fi, 0.6);
    if (zahl === 6) {
      fi.jubelBis = zeit + 3; huepfen(fi); fi.puls = 1;
      funken(p.x, p.y, 0xe8c96d, 22);
      ueberFigur(fi, 'Doppelter Ruhm!');
      if (!fi.doppeltGlanz) {
        const g = new PIXI.Sprite(T.glanz);
        g.anchor.set(0.5); g.tint = 0xe8c96d; g.alpha = 0.45; g.blendMode = 'add';
        g.scale.set(S.hoehe / 34, S.hoehe / 24); g.y = -S.hoehe * 0.5;
        fi.root.addChildAt(g, 1); fi.doppeltGlanz = g;
      }
    } else if (zahl === 1) {
      abdunkeln(fi); fi.dunkelBis = zeit + (SP.wurfSchattenMinuten ?? 5) * 60;
      fi.zustand = 'sitzen'; fi.zustandZeit = 5;
      funken(p.x, p.y, 0x7a5cff, 14);
      ueberFigur(fi, 'Gestalt verloren …', minusStil);
    } else {
      funken(p.x, p.y, fi.farbe, 10);
      ueberFigur(fi, `+${zahl * ((window.NWU_RUHM && window.NWU_RUHM.wurfRuhm) || 10)} Ruhm`);
    }
  }
  function wurfNachricht(text) {
    const m = text.match(/@([A-Za-z0-9_]{2,25}) würfelt eine (\d)/i);
    if (!m) return false;
    const zahl = Number(m[2]);
    if (zahl >= 1 && zahl <= 6) wurfZeigen(figuren.find((f) => !f.entfernen && f.name === m[1].toLowerCase()), zahl);
    return true;
  }

  // ---------- Level-Up ----------
  const lvStil = new PIXI.TextStyle({ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 'bold', fill: 0xe8c96d, stroke: { color: 0x1a1208, width: 3 }, letterSpacing: 1 });
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
  function portalStarten() {
    if (EV.phase !== 'aus' || spiel) return;
    EV.phase = 'oeffnen'; EV.zeit = 0;
    grossesPortal.ziel = 1;
    const dabei = figuren.filter((f) => !f.entfernen && !f.versteckt && f.modus === 'rahmen');
    dabei.forEach((f, i) => { f.modus = 'ins-portal'; f.wartet = 1.2 + i * 0.12; f.reihe = i; });
    EV.ende = (CFG.portal?.dauerSekunden || 150);
  }
  function portalBeenden() {
    if (EV.phase === 'aus' || EV.phase === 'heimkehr' || EV.phase === 'schliessen') return;
    EV.phase = 'heimkehr';
    figuren.forEach((f) => { if (f.modus === 'terrain') { f.modus = 'heim'; f.zustand = 'laufen'; f.eile = 2; } });
    figuren.forEach((f) => { if (f.modus === 'ins-portal' || f.modus === 'wartet') { f.modus = 'rueckkehr'; f.wartet = 0.3; } });
  }

  function portalAblauf(dt) {
    if (EV.phase === 'aus') {
      if (EV.naechstes > 0) { EV.naechstes -= dt; if (EV.naechstes <= 0) { if (spiel || duell) EV.naechstes = 10; else { portalStarten(); EV.naechstes = (CFG.portal?.alleMinuten || 0) * 60; } } }
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
      if (EV.zeit > 1.6) EV.phase = 'aus';
    }
  }

  // ---------- Hauptschleife ----------
  let sichtTimer = 0;
  app.ticker.add((ticker) => {
    const dt = Math.min(0.1, ticker.deltaMS / 1000);
    zeit += dt;
    portalAblauf(dt);
    duellSchritt(dt);
    spielSchritt(dt);
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
      if (fi.zustandZeit <= 0 && fi.modus !== 'formation' && fi.modus !== 'duell' && fi.modus !== 'spiel') zustandWechseln(fi);
      if (fi.dunkelBis && zeit > fi.dunkelBis) { fi.dunkelBis = 0; if (!fi.getroffen) { aufhellen(fi); funken(fi.root.x, fi.root.y - S.hoehe * 0.5, fi.farbe, 10); } }
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
          fi.austrittZiel = PORTAL_X + 80 + Math.random() * (TERRAIN.breite - 200);
        }
      } else if (fi.modus === 'austreten' || fi.modus === 'terrain' || fi.modus === 'heim') {
        if (fi.modus === 'austreten') {
          fi.modusAlpha = Math.min(1, fi.modusAlpha + dt * 2.5);
          fi.x += fi.tempo * 1.6 * dt;
          if (fi.x > fi.austrittZiel) { fi.modus = 'terrain'; fi.zustandZeit = 0; }
        } else if (fi.modus === 'terrain') {
          if (EV.phase === 'heimkehr') { fi.modus = 'heim'; fi.zustand = 'laufen'; }
          if (fi.g.laufen > 0.05) fi.x += fi.richtung * fi.tempo * dt * fi.g.laufen;
          if (fi.x < PORTAL_X + 50) fi.richtung = 1;
          if (fi.x > TERRAIN.x + TERRAIN.breite - 30) fi.richtung = -1;
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

  // ---------- Chat verbinden ----------
  let chatStatus = S.kanal ? 'verbinde …' : 'aus (Demo)';
  if (S.kanal && window.NWU_CHAT) {
    window.NWU_CHAT.verbinden(S.kanal, {
      status: (s) => { chatStatus = s; },
      nachricht: (u) => chatter(u, 'nachricht'),
      raid: () => { formation(10, true); },
      sub: (u) => { const fi = nachId.get(u.id); if (fi && fi.root) { levelUp(fi); fi.letzte = zeit; } else figuren.forEach((f) => huepfen(f)); },
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
      `${S.sparmodus ? ' · <b>Sparmodus</b>' : ''}${EV.phase !== 'aus' ? ' · Portal: ' + EV.phase : ''}` +
      `<div class="klein">T Test-Chatter · M Nachricht · K !lurk · R Raid · P Portal · U Level-Up · G Gruppenbild · J Jubeln · D Duell · F Haus-Ruf · W Westen · B Rabe · E Rennen · Z Tauziehen · L Letzter steht · X Schatz · Q Würfel · S Sparmodus · 1/2/3 Demo · H Anzeige</div>`;
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
    else if (k === 'k') { const f = zufallsFigur(); if (f) { f.lurker = true; f.zustandZeit = 0; } }
    else if (k === 'r') formation(10, true);
    else if (k === 'g') formation(12, false);
    else if (k === 'p') { if (EV.phase === 'aus') portalStarten(); else portalBeenden(); }
    else if (k === 'u') { const f = zufallsFigur(); if (f) levelUp(f); }
    else if (k === 'w') fluestern();
    else if (k === 'b') rabeStarten();
    else if (k === 'e') rennenStarten();
    else if (k === 'z') tauziehenStarten();
    else if (k === 'l') letzterStarten();
    else if (k === 'x') schatzStarten();
    else if (k === 'q') { const f = zufallsFigur(); if (f && !f.ungebunden) wurfZeigen(f, 1 + Math.floor(Math.random() * 6)); }
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
  window.NWU = { S, figuren, chatter, hausRuf, sammeln, fluestern, formation, portalStarten, portalBeenden, levelUp, EV, demoSetzen, figurErzeugen, VORLAGEN, duellStarten, duellLaeuft: () => !!duell,
    rabeStarten, rennenStarten, tauziehenStarten, letzterStarten, schatzStarten, wurfZeigen, spielLaeuft: () => (spiel ? spiel.art : null), letzteMeldung: () => letzteMeldung };
})();
