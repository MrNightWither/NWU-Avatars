// NWU Avatare – Overlay Stufe 1
// Jede Figur ist EIN Bild (Seitenansicht). Die Bewegung entsteht per Programm.
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
    img.onload = () => ok(PIXI.Texture.from(img));
    img.onerror = () => fehler(new Error('Bild fehlt: ' + src));
    img.src = src;
  });
  const VORLAGEN = await Promise.all(CFG.figuren.map(async (f) => ({ ...f, tex: await laden(f.bild) })));
  const textur = (zeichnen) => {
    const g = new PIXI.Graphics(); zeichnen(g);
    const t = app.renderer.generateTexture({ target: g, resolution: 2 }); g.destroy(); return t;
  };
  const T = {
    punkt: textur((g) => g.circle(8, 8, 8).fill({ color: 0xffffff, alpha: 0.3 }).circle(8, 8, 4).fill(0xffffff)),
    glanz: textur((g) => { for (let r = 32; r > 0; r -= 2) g.circle(32, 32, r).fill({ color: 0xffffff, alpha: 0.035 }); }),
    strahl: textur((g) => { for (let i = 0; i < 12; i++) g.rect(i, 0, 24 - 2 * i, 160).fill({ color: 0xffffff, alpha: 0.06 }); }),
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
    const koerper = new PIXI.Sprite(vorlage.tex);
    koerper.anchor.set(0.5, 1);
    const basis = S.hoehe / vorlage.tex.height;
    koerper.scale.set(basis);
    root.addChild(schatten, koerper);
    root.alpha = 0;
    figurenEbene.addChild(root);
    const fi = {
      root, koerper, schatten, basis, vorlage, farbe: HAUSFARBE[vorlage.haus] || 0xc9a84c,
      id: info.id || null, name: info.name || '', mod: !!info.mod, demo: !!info.demo,
      s: info.s ?? Math.random() * umfang,
      richtung: Math.random() < 0.5 ? 1 : -1,
      tempo: 22 + Math.random() * 16,
      phase: Math.random() * 10, winkel: 0, lurker: !!info.lurker,
      zustand: 'idle', zustandZeit: 1.4 + Math.random() * 2,
      g: { laufen: 0, idle: 1, sitzen: 0, schlafen: 0 },
      sprung: -1, puls: 0, zTimer: 0,
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

    const sy = 1 + laufen * (0.045 * schritt - 0.03) + idle * 0.018 * atmen + hocken * (-0.16 + 0.015 * atmen) + sprungS + fi.puls * 0.12;
    const sx = 1 + (1 - sy) * 0.6 + fi.puls * 0.06;
    fi.koerper.scale.set(fi.basis * sx * fi.richtung, fi.basis * sy);
    fi.koerper.y = -(laufen * schritt * S.hoehe * 0.07 + sprungY);
    fi.koerper.rotation = fi.richtung * (laufen * Math.sin(fi.phase) * 0.07 + schlafen * 0.2 + sitzen * 0.04);
    fi.schatten.scale.set(1 - Math.min(0.5, (-fi.koerper.y) / S.hoehe), 1);
    fi.schatten.alpha = fi.winkel > -0.3 && fi.winkel < 0.3 ? 1 : 0;
  }

  // ---------- Anwesenheit (Chat) ----------
  let zeit = 0;
  async function profilLaden(u) {
    if (!S.api) return null;
    try {
      const r = await fetch(`${S.api.replace(/\/$/, '')}/avatare/profil?plattform=twitch&id=${encodeURIComponent(u.id)}`, { credentials: 'omit' });
      const d = await r.json();
      return d.gefunden ? d : null;
    } catch (e) { return null; }
  }

  async function chatter(u, art) {
    if (!u.id || u.broadcaster) return;                 // Schattenkönig bekommt später eine eigene Figur
    const text = (u.text || '').trim().toLowerCase();
    let fi = nachId.get(u.id);
    if (fi && !fi.entfernen) {
      fi.letzte = zeit;
      if (!fi.root) return;                               // Profil lädt noch
      if (text.startsWith('!lurk')) { fi.lurker = true; fi.zustandZeit = 0; }
      else if (text.startsWith('!wache') && fi.mod) { fi.wache = true; }
      else if (art === 'nachricht') { if (fi.lurker && !text.startsWith('!')) { fi.lurker = false; fi.zustandZeit = 0; } leuchten(fi); }
      return;
    }
    nachId.set(u.id, { entfernen: false, letzte: zeit });   // Platzhalter gegen doppeltes Anlegen
    const profil = await profilLaden(u);
    const vorlage = profil ? vorlageFuer(profil.haus, profil.figur, u.id) : vorlageFuer(null, null, u.id);
    fi = figurErzeugen(vorlage, { id: u.id, name: u.name, mod: u.mod || (profil && profil.rolle === 'waechter'), lurker: text.startsWith('!lurk') });
  }

  function leuchten(fi) {
    fi.puls = 1;
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

  // ---------- Level-Up ----------
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
    huepfen(fi); fi.puls = 1;
  }

  // ---------- Großes Portal: Ablauf ----------
  function portalStarten() {
    if (EV.phase !== 'aus') return;
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
      if (EV.naechstes > 0) { EV.naechstes -= dt; if (EV.naechstes <= 0) { portalStarten(); EV.naechstes = (CFG.portal?.alleMinuten || 0) * 60; } }
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
      if (!fi.demo && !fi.entfernen && !fi.wache && zeit - fi.letzte > (fi.mod ? WAECHTER : ANWESENHEIT)) fi.entfernen = true;

      fi.einblenden = Math.min(1, fi.einblenden + dt * (fi.entfernen ? -0.8 : 2.2));
      if (fi.entfernen && fi.einblenden <= 0) {
        fi.root.destroy({ children: true }); figuren.splice(i, 1);
        if (fi.id && nachId.get(fi.id) === fi) nachId.delete(fi.id);
        continue;
      }
      fi.root.visible = !fi.versteckt;
      if (fi.versteckt) continue;

      fi.zustandZeit -= dt;
      if (fi.zustandZeit <= 0 && fi.modus !== 'formation') zustandWechseln(fi);
      fi.eile = fi.modus === 'heim' ? 2 : fi.modus === 'formation' ? 3 : 1;

      // ----- Bewegung je nach Modus -----
      if (fi.modus === 'rahmen' || fi.modus === 'formation') {
        if (fi.modus === 'formation') {
          let d = norm(fi.zielS - fi.s); if (d > umfang / 2) d -= umfang;
          if (Math.abs(d) > 3) { fi.richtung = Math.sign(d); fi.zustand = 'laufen'; fi.s += Math.sign(d) * Math.min(Math.abs(d), 230 * dt); }
          else {
            fi.richtung = fi.root.x < R.x + R.w / 2 ? 1 : -1; fi.zustand = 'idle';
            if (fi.formJubel && fi.sprung < 0 && Math.random() < dt * 1.2) huepfen(fi);
          }
          if (zeit > fi.formEnde) { fi.modus = 'rahmen'; fi.lurker = fi.lurkerVorher; fi.zustandZeit = 0; }
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
      animieren(fi, dt, zeit);

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
      e.obj.alpha = Math.min(1, rest * 1.5);
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
      `<div class="klein">T Test-Chatter · M Nachricht · K !lurk · R Raid · P Portal · U Level-Up · G Gruppenbild · J Jubeln · S Sparmodus · 1/2/3 Demo · H Anzeige</div>`;
  }

  let testNr = 0;
  const testUser = () => ({ id: 'test' + (++testNr), name: 'test' + testNr, anzeige: 'Test' + testNr, mod: Math.random() < 0.1, text: 'hallo' });
  const zufallsFigur = () => { const da = figuren.filter((f) => !f.entfernen && !f.versteckt && f.root); return da[Math.floor(Math.random() * da.length)]; };
  function demoSetzen(n) {
    const demo = figuren.filter((f) => f.demo && !f.entfernen);
    for (let i = demo.length; i < n; i++) figurErzeugen(vorlageFuer(null, null, 'demo' + Math.random()), { demo: true, lurker: Math.random() < 0.25 });
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
    else if (k === 'j') figuren.forEach((f, i) => setTimeout(() => huepfen(f), i * 60));
    else if (k === 's') { S.sparmodus = !S.sparmodus; sichtbarkeit(); }
    else if (k === '1') demoSetzen(4);
    else if (k === '2') demoSetzen(12);
    else if (k === '3') demoSetzen(30);
    else if (k === 'h') { S.hud = !S.hud; hud.classList.toggle('aus', !S.hud); }
  });

  demoSetzen(S.demo);
  window.NWU = { S, figuren, chatter, formation, portalStarten, portalBeenden, levelUp, EV, demoSetzen };
})();
