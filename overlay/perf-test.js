// NWU Avatare – Paket 0: Performance-Test
// Platzhalter-Figuren (Puppet aus Ebenen an "Knochen") laufen um den Kamera-Rahmen.
// Ziel: messen, wie viele Figuren und Partikel ein PC neben dem Spiel schafft.
'use strict';

(async () => {
  const CFG = window.NWU_CONFIG;
  const W = 1920, H = 1080;

  // ---------- Einstellungen: config.js, überschreibbar per URL ----------
  const q = new URLSearchParams(location.search);
  const zahl = (k, d) => (q.has(k) && !isNaN(parseFloat(q.get(k))) ? parseFloat(q.get(k)) : d);
  const an = (k, d) => (q.has(k) ? q.get(k) !== '0' : d);

  const S = {
    anzahl: Math.max(0, Math.min(200, zahl('n', 25))),
    fps: zahl('fps', CFG.fps),
    partikel: an('partikel', CFG.partikel),
    partikelMax: zahl('pmax', CFG.partikelMax),
    sparmodus: an('spar', false),
    portal: an('portal', false),
    hud: an('hud', true),
    szene: q.get('szene') || 'standard',
  };
  let cam = CFG.szenen[S.szene] || CFG.szenen.standard;
  if (q.has('cam')) {
    const [x, y, w, h] = q.get('cam').split(',').map(Number);
    if ([x, y, w, h].every((v) => v >= 0 && v <= 1)) cam = { x, y, w, h };
  }
  if (an('bg', false)) document.body.classList.add('vorschau');

  // ---------- PixiJS ----------
  const app = new PIXI.Application();
  await app.init({ backgroundAlpha: 0, resizeTo: window, antialias: false, preference: 'webgl' });
  document.body.appendChild(app.canvas);
  app.ticker.maxFPS = S.fps;

  const welt = new PIXI.Container();           // arbeitet immer in 1920x1080
  app.stage.addChild(welt);
  const skalieren = () => {
    const s = Math.min(app.screen.width / W, app.screen.height / H);
    welt.scale.set(s);
    welt.position.set((app.screen.width - W * s) / 2, (app.screen.height - H * s) / 2);
  };
  skalieren();
  window.addEventListener('resize', skalieren);

  // ---------- Gemeinsame Texturen (wie später ein Bilderatlas) ----------
  // Alle Teile sind weiß und werden pro Figur eingefärbt (tint). Dadurch teilen
  // sich alle Figuren dieselben Texturen und PixiJS kann alles in wenigen Draw-Calls zeichnen.
  const tex = (zeichnen) => {
    const g = new PIXI.Graphics();
    zeichnen(g);
    const t = app.renderer.generateTexture({ target: g, resolution: 2 });
    g.destroy();
    return t;
  };
  const T = {
    torso: tex((g) => g.roundRect(0, 0, 14, 18, 4).fill(0xffffff)),
    glied: tex((g) => g.roundRect(0, 0, 5, 14, 2.5).fill(0xffffff)),
    kopf:  tex((g) => g.circle(8, 8, 8).fill(0xffffff)),
    haar:  tex((g) => g.poly([0, 9, 2, 2, 8, 0, 14, 2, 17, 9, 15, 6, 12, 4, 6, 4, 3, 6]).fill(0xffffff)),
    augen: tex((g) => g.rect(0, 0, 2, 3).rect(6, 0, 2, 3).fill(0xffffff)),
    umhang: tex((g) => g.poly([3, 0, 13, 0, 18, 24, 0, 24]).fill(0xffffff)),
    hut:   tex((g) => g.poly([0, 14, 22, 14, 13, 10, 8, 0, 9, 10]).fill(0xffffff)),
    punkt: tex((g) => { g.circle(16, 16, 16).fill({ color: 0xffffff, alpha: 0.25 }); g.circle(16, 16, 9).fill({ color: 0xffffff, alpha: 0.5 }); g.circle(16, 16, 4).fill(0xffffff); }),
    ring:  tex((g) => g.ellipse(60, 20, 58, 18).stroke({ width: 4, color: 0xffffff })),
  };
  const HAUT = [0xf2d7c4, 0xe8c0a0, 0xc99a74, 0x9c6b4a];
  const HAARE = [0x1d1a24, 0xe8e2d0, 0x7a2030, 0x3a2a1a, 0xc9a84c, 0x6e7fae];
  const dunkler = (c, f) => (((c >> 16 & 255) * f) << 16) | (((c >> 8 & 255) * f) << 8) | ((c & 255) * f);
  const zufall = (a) => a[Math.floor(Math.random() * a.length)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const winkelLerp = (a, b, t) => a + (((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * t;

  const sprite = (t, ax, ay, farbe) => {
    const s = new PIXI.Sprite(t);
    s.anchor.set(ax, ay);
    s.scale.set(0.5);                // Texturen sind mit Auflösung 2 erzeugt
    if (farbe !== undefined) s.tint = farbe;
    return s;
  };

  // ---------- Laufweg um den Kamera-Rahmen ----------
  const R = { x: cam.x * W, y: cam.y * H, w: cam.w * W, h: cam.h * H };
  const umfang = 2 * (R.w + R.h);
  // Liefert Punkt und Ausrichtung: oben stehen, rechts klettern, unten kopfüber, links klettern.
  const aufPfad = (s) => {
    s = ((s % umfang) + umfang) % umfang;
    if (s < R.w) return { x: R.x + s, y: R.y, a: 0 };
    s -= R.w;
    if (s < R.h) return { x: R.x + R.w, y: R.y + s, a: Math.PI / 2 };
    s -= R.h;
    if (s < R.w) return { x: R.x + R.w - s, y: R.y + R.h, a: Math.PI };
    s -= R.w;
    return { x: R.x, y: R.y + R.h - s, a: -Math.PI / 2 };
  };

  const rahmen = new PIXI.Graphics();
  welt.addChild(rahmen);
  const rahmenZeichnen = () => {
    rahmen.clear();
    if (!document.body.classList.contains('vorschau')) return;
    rahmen.rect(R.x, R.y, R.w, R.h).fill({ color: 0x202028, alpha: 0.9 }).stroke({ width: 2, color: 0xc9a84c });
  };
  rahmenZeichnen();

  // ---------- Portal und Terrain (Last-Test für Phase 2/3) ----------
  const portal = new PIXI.Container();
  const terrain = new PIXI.Graphics()
    .rect(0, 0, W * 0.6, 60).fill({ color: 0x15121a, alpha: 0.95 })
    .rect(0, 0, W * 0.6, 4).fill(0xc9a84c);
  terrain.pivot.set(W * 0.3, 0);
  terrain.position.set(W / 2, H);
  const ringe = [sprite(T.ring, 0.5, 0.5, 0xc9a84c), sprite(T.ring, 0.5, 0.5, 0xb3122e)];
  ringe.forEach((r, i) => { r.position.set(W / 2, H - 70); r.scale.set(1.2 - i * 0.25, 0.9 - i * 0.2); });
  portal.addChild(terrain, ...ringe);
  portal.visible = false;
  welt.addChild(portal);
  const TERRAIN_Y = H - 60;
  let portalStaerke = 0;            // 0 = zu, 1 = offen (weicher Übergang)

  // ---------- Partikel ----------
  const partikelEbene = new PIXI.Container();
  const pool = [];
  const aktivP = [];
  const partikel = (x, y, farbe, vx, vy, leben, groesse) => {
    if (!S.partikel || aktivP.length >= S.partikelMax) return;
    const p = pool.pop() || sprite(T.punkt, 0.5, 0.5);
    p.tint = farbe; p.position.set(x, y); p.alpha = 1;
    p.scale.set(groesse * 0.5);
    p.vx = vx; p.vy = vy; p.leben = p.max = leben; p.groesse = groesse;
    partikelEbene.addChild(p);
    aktivP.push(p);
  };

  // ---------- Figuren ----------
  const figurenEbene = new PIXI.Container();
  welt.addChild(figurenEbene, partikelEbene);
  const figuren = [];

  function figurBauen() {
    const haus = zufall(CFG.haeuser);
    const haut = zufall(HAUT), haar = zufall(HAARE);
    const stoff = haus.farbe, stoffDunkel = dunkler(haus.farbe, 0.55);

    const f = new PIXI.Container();           // Wurzel = Füße auf dem Rahmen
    const koerper = new PIXI.Container();     // Hüfte, wippt beim Laufen
    f.addChild(koerper);

    const teile = {
      aura: Math.random() < 0.4 ? sprite(T.punkt, 0.5, 0.5, haus.farbe) : null,
      umhang: Math.random() < 0.7 ? sprite(T.umhang, 0.5, 0, stoffDunkel) : null,
      armHinten: sprite(T.glied, 0.5, 0.1, dunkler(stoff, 0.8)),
      beinHinten: sprite(T.glied, 0.5, 0.05, 0x1a1a22),
      beinVorne: sprite(T.glied, 0.5, 0.05, 0x24242e),
      torso: sprite(T.torso, 0.5, 1, stoff),
      kopf: new PIXI.Container(),
      armVorne: sprite(T.glied, 0.5, 0.1, stoff),
      begleiter: Math.random() < 0.3 ? sprite(T.punkt, 0.5, 0.5, 0xe8c96d) : null,
    };
    // Knochen-Positionen (Ankerpunkte), für alle Figuren gleich – wie im Plan gefordert.
    if (teile.aura) { teile.aura.position.set(0, -24); teile.aura.scale.set(1.5); teile.aura.alpha = 0.35; }
    if (teile.umhang) teile.umhang.position.set(0, -31);
    teile.armHinten.position.set(4, -30);
    teile.beinHinten.position.set(2, -14);
    teile.beinVorne.position.set(-2, -14);
    teile.torso.position.set(0, -13);
    teile.kopf.position.set(0, -38);
    teile.armVorne.position.set(-4, -30);
    if (teile.begleiter) { teile.begleiter.position.set(-16, -44); teile.begleiter.scale.set(0.3); }

    const kopfHaut = sprite(T.kopf, 0.5, 0.5, haut);
    const augen = sprite(T.augen, 0.5, 0.5, 0x15121a); augen.position.set(-1.5, 0);
    const haare = sprite(T.haar, 0.5, 0.9, haar); haare.position.set(0, -2);
    teile.kopf.addChild(kopfHaut, augen, haare);
    if (Math.random() < 0.35) { const hut = sprite(T.hut, 0.45, 1, stoffDunkel); hut.position.set(0, -5); teile.kopf.addChild(hut); }

    for (const k of ['aura', 'umhang', 'armHinten', 'beinHinten', 'beinVorne', 'torso', 'kopf', 'armVorne', 'begleiter']) {
      if (teile[k]) koerper.addChild(teile[k]);
    }

    return {
      root: f, koerper, teile, haus,
      s: Math.random() * umfang,
      richtung: Math.random() < 0.5 ? 1 : -1,
      tempo: 28 + Math.random() * 22,
      phase: Math.random() * 10,
      winkel: 0,
      lurker: Math.random() < 0.3,
      // Zustandsautomat mit weichen Übergängen: jeder Zustand hat ein Gewicht 0..1
      zustand: 'laufen', zustandZeit: 2 + Math.random() * 6,
      g: { laufen: 0, idle: 1, sitzen: 0, schlafen: 0, kampf: 0 },
      // Terrain-Modus (Portal)
      modus: 'rahmen', sprung: 0, von: null, tx: 0,
      einblenden: 0, entfernen: false,
    };
  }

  function zustandWechseln(fi) {
    const r = Math.random();
    if (fi.modus === 'terrain') { fi.zustand = r < 0.6 ? 'kampf' : 'laufen'; fi.zustandZeit = 1 + Math.random() * 2.5; return; }
    if (fi.lurker) fi.zustand = r < 0.5 ? 'sitzen' : r < 0.85 ? 'schlafen' : 'laufen';
    else fi.zustand = r < 0.65 ? 'laufen' : r < 0.85 ? 'idle' : 'sitzen';
    fi.zustandZeit = fi.zustand === 'laufen' ? 3 + Math.random() * 7 : 2 + Math.random() * 6;
  }

  function figurAnimieren(fi, dt, t) {
    // Gewichte weich zum Zielzustand ziehen (nichts springt)
    const k = Math.min(1, dt * 5);
    for (const z in fi.g) fi.g[z] = lerp(fi.g[z], z === fi.zustand ? 1 : 0, k);
    const { laufen, idle, sitzen, schlafen, kampf } = fi.g;
    const sitzend = sitzen + schlafen;

    fi.phase += dt * (6 + fi.tempo * 0.08) * (laufen + kampf * 1.6);
    const sw = Math.sin(fi.phase);
    const tl = fi.teile;

    tl.beinVorne.rotation = sw * 0.6 * laufen - 1.35 * sitzend;
    tl.beinHinten.rotation = -sw * 0.6 * laufen - 1.25 * sitzend;
    tl.armVorne.rotation = -sw * 0.5 * laufen + Math.sin(t * 2 + fi.phase) * 0.06 * idle - 2.4 * kampf + Math.sin(fi.phase * 2) * 0.5 * kampf + 0.3 * sitzend;
    tl.armHinten.rotation = sw * 0.5 * laufen - 0.2 * sitzend;
    fi.koerper.y = -Math.abs(sw) * 1.5 * laufen + 8 * sitzend;
    tl.torso.scale.y = 0.5 * (1 + Math.sin(t * 2.2 + fi.phase) * 0.025 * (idle + sitzend));
    tl.kopf.rotation = 0.45 * schlafen + Math.sin(t * 1.3 + fi.phase) * 0.05 * idle;
    tl.kopf.y = -38 + 2 * schlafen;
    if (tl.umhang) tl.umhang.rotation = 0.15 * laufen + Math.sin(t * 3 + fi.phase) * 0.06;
    if (tl.begleiter) { tl.begleiter.y = -44 + Math.sin(t * 2.5 + fi.phase) * 3; tl.begleiter.x = -16 + Math.cos(t * 1.7 + fi.phase) * 2; }
    if (tl.aura) tl.aura.alpha = 0.25 + Math.sin(t * 2 + fi.phase) * 0.1;
  }

  function figurHinzufuegen() {
    const fi = figurBauen();
    fi.root.alpha = 0;
    figurenEbene.addChild(fi.root);
    figuren.push(fi);
  }

  function anzahlSetzen(n) {
    S.anzahl = n;
    const ziel = Math.min(n, S.sparmodus ? CFG.sparmodus.maxFiguren : 200);
    const lebend = figuren.filter((f) => !f.entfernen);
    for (let i = lebend.length; i < ziel; i++) figurHinzufuegen();
    for (let i = ziel; i < lebend.length; i++) lebend[i].entfernen = true;
  }

  // ---------- Hauptschleife ----------
  let zeit = 0;
  app.ticker.add((ticker) => {
    const dt = Math.min(0.1, ticker.deltaMS / 1000);
    zeit += dt;
    messungFrame(ticker.deltaMS);

    // Portal weich auf/zu
    portalStaerke = lerp(portalStaerke, S.portal ? 1 : 0, Math.min(1, dt * 2.5));
    portal.visible = portalStaerke > 0.01;
    if (portal.visible) {
      terrain.y = lerp(H, TERRAIN_Y, portalStaerke);
      ringe.forEach((r, i) => { r.rotation = Math.sin(zeit * (0.8 + i)) * 0.08; r.alpha = portalStaerke; });
      if (!S.sparmodus && Math.random() < dt * 60 * portalStaerke) {
        partikel(W / 2 + (Math.random() - 0.5) * 220, H - 70, Math.random() < 0.6 ? 0xe8c96d : 0xb3122e,
          (Math.random() - 0.5) * 60, -40 - Math.random() * 80, 1.2 + Math.random(), 0.25 + Math.random() * 0.25);
      }
    }

    for (let i = figuren.length - 1; i >= 0; i--) {
      const fi = figuren[i];

      // Ein- und Ausblenden (Spawn / Abgang)
      fi.einblenden = lerp(fi.einblenden, fi.entfernen ? 0 : 1, Math.min(1, dt * 3));
      fi.root.alpha = fi.einblenden;
      if (fi.entfernen && fi.einblenden < 0.02) { fi.root.destroy({ children: true }); figuren.splice(i, 1); continue; }

      // Zustandsautomat
      fi.zustandZeit -= dt;
      if (fi.zustandZeit <= 0) zustandWechseln(fi);

      // Wechsel Rahmen <-> Terrain mit Sprungbogen
      const willTerrain = S.portal && portalStaerke > 0.6;
      if (willTerrain && fi.modus === 'rahmen') {
        fi.modus = 'sprung-runter'; fi.sprung = 0; fi.von = { x: fi.root.x, y: fi.root.y, a: fi.winkel };
        fi.tx = W * 0.22 + Math.random() * W * 0.56; fi.sprungDauer = 0.6 + Math.random() * 0.8;
      } else if (!willTerrain && fi.modus === 'terrain') {
        fi.modus = 'sprung-hoch'; fi.sprung = 0; fi.von = { x: fi.root.x, y: fi.root.y, a: fi.winkel };
        fi.sprungDauer = 0.6 + Math.random() * 0.6;
      }

      if (fi.modus === 'rahmen') {
        if (fi.g.laufen > 0.05) fi.s += fi.richtung * fi.tempo * dt * fi.g.laufen;
        const p = aufPfad(fi.s);
        fi.winkel = winkelLerp(fi.winkel, p.a, Math.min(1, dt * 8));
        fi.root.position.set(p.x, p.y);
      } else if (fi.modus === 'terrain') {
        if (fi.g.laufen > 0.05) {
          fi.root.x += fi.richtung * fi.tempo * dt * fi.g.laufen;
          if (fi.root.x < W * 0.21 || fi.root.x > W * 0.79) fi.richtung *= -1;
        }
        fi.root.y = TERRAIN_Y;
        fi.winkel = winkelLerp(fi.winkel, 0, Math.min(1, dt * 8));
      } else {
        // Sprung: Bogen von "von" nach Ziel
        fi.sprung += dt / fi.sprungDauer;
        const u = Math.min(1, fi.sprung);
        const ziel = fi.modus === 'sprung-runter' ? { x: fi.tx, y: TERRAIN_Y, a: 0 } : aufPfad(fi.s);
        fi.root.x = lerp(fi.von.x, ziel.x, u);
        fi.root.y = lerp(fi.von.y, ziel.y, u) - Math.sin(u * Math.PI) * 120;
        fi.winkel = winkelLerp(fi.von.a, ziel.a, u);
        if (u >= 1) { fi.modus = fi.modus === 'sprung-runter' ? 'terrain' : 'rahmen'; zustandWechseln(fi); }
      }
      fi.root.rotation = fi.winkel;
      fi.root.scale.x = fi.richtung * (0.85 + 0.15 * fi.einblenden);
      fi.root.scale.y = 0.85 + 0.15 * fi.einblenden;

      figurAnimieren(fi, dt, zeit);

      // Partikel: Aura-Funken und Schlaf-Bläschen
      if (S.partikel) {
        if (fi.teile.aura && Math.random() < dt * 5) {
          const a = fi.winkel, ox = (Math.random() - 0.5) * 16, oy = -10 - Math.random() * 30;
          partikel(fi.root.x + ox * Math.cos(a) - oy * Math.sin(a), fi.root.y + ox * Math.sin(a) + oy * Math.cos(a),
            fi.haus.farbe, Math.sin(a) * 12, -Math.cos(a) * 18, 0.8 + Math.random() * 0.6, 0.12 + Math.random() * 0.1);
        }
        if (fi.g.schlafen > 0.8 && Math.random() < dt * 0.8) {
          partikel(fi.root.x, fi.root.y - 50, 0xd8d8e8, 6, -14, 2, 0.18);
        }
      }
    }

    for (let i = aktivP.length - 1; i >= 0; i--) {
      const p = aktivP[i];
      p.leben -= dt;
      if (p.leben <= 0 || !S.partikel) { partikelEbene.removeChild(p); pool.push(p); aktivP.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.alpha = p.leben / p.max;
    }

    hudAktualisieren(dt);
  });

  // ---------- Messung ----------
  const hud = document.getElementById('hud');
  if (!S.hud) hud.classList.add('aus');
  let fpsFenster = [], letzteMessung = '', messung = null;
  function messungFrame(ms) {
    fpsFenster.push(ms);
    if (fpsFenster.length > 120) fpsFenster.shift();
    if (messung) {
      messung.frames.push(ms);
      if (performance.now() - messung.start >= messung.dauer * 1000) messungBeenden();
    }
  }
  function messungStarten(sek) {
    messung = { start: performance.now(), dauer: sek, frames: [] };
    letzteMessung = `Messung läuft (${sek} s) …`;
  }
  function messungBeenden() {
    const f = messung.frames.slice().sort((a, b) => a - b);
    const summe = f.reduce((a, b) => a + b, 0);
    const p99 = f[Math.floor(f.length * 0.99)] || 0;
    letzteMessung =
      `Ergebnis ${figurenSichtbar()} Figuren, ${S.fps} FPS-Ziel, Partikel ${S.partikel ? 'an' : 'aus'}${S.portal ? ', Portal offen' : ''}:\n` +
      `  Ø ${(1000 * f.length / summe).toFixed(1)} FPS | Ø ${(summe / f.length).toFixed(1)} ms | 99 % < ${p99.toFixed(1)} ms | max ${f[f.length - 1].toFixed(1)} ms`;
    console.log('[NWU Paket 0] ' + letzteMessung.replace(/\n\s*/g, ' – '));
    window.NWU_MESSUNG = letzteMessung;
    messung = null;
  }
  const figurenSichtbar = () => figuren.filter((f) => !f.entfernen).length;
  let hudZeit = 0;
  function hudAktualisieren(dt) {
    hudZeit += dt;
    if (hudZeit < 0.5 || !S.hud) return;
    hudZeit = 0;
    const summe = fpsFenster.reduce((a, b) => a + b, 0);
    const sprites = figuren.reduce((n, f) => n + 1 + f.koerper.children.length + f.teile.kopf.children.length, 0);
    hud.innerHTML =
      `<b>NWU Avatare – Paket 0</b><br>` +
      `Overlay: ${(1000 * fpsFenster.length / summe).toFixed(1)} FPS (Ziel ${S.fps}), Ø ${(summe / fpsFenster.length).toFixed(1)} ms<br>` +
      `Figuren: ${figurenSichtbar()} | Teile: ${sprites} | Partikel: ${aktivP.length}<br>` +
      `Partikel ${S.partikel ? 'an' : 'aus'} | Sparmodus ${S.sparmodus ? 'AN' : 'aus'} | Portal ${S.portal ? 'offen' : 'zu'} | Szene ${S.szene}` +
      (letzteMessung ? `<div class="messung">${letzteMessung}</div>` : '') +
      `<div class="klein">1/2/3/4 = 10/25/50/100 · +/- = ±5 · P Portal · S Sparmodus · T Partikel · F 30/60 FPS · M Messen (60 s) · H HUD</div>`;
  }

  // ---------- Hotkeys (in OBS: Browserquelle → "Interagieren") ----------
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === '1') anzahlSetzen(10);
    else if (k === '2') anzahlSetzen(25);
    else if (k === '3') anzahlSetzen(50);
    else if (k === '4') anzahlSetzen(100);
    else if (k === '+' || k === '=') anzahlSetzen(S.anzahl + 5);
    else if (k === '-') anzahlSetzen(Math.max(0, S.anzahl - 5));
    else if (k === 'p') S.portal = !S.portal;
    else if (k === 't') S.partikel = !S.partikel;
    else if (k === 's') {
      S.sparmodus = !S.sparmodus;
      S.partikel = S.sparmodus ? CFG.sparmodus.partikel : an('partikel', CFG.partikel);
      anzahlSetzen(S.anzahl);
    } else if (k === 'f') { S.fps = S.fps === 30 ? 60 : 30; app.ticker.maxFPS = S.fps; }
    else if (k === 'm') messungStarten(60);
    else if (k === 'h') { S.hud = !S.hud; hud.classList.toggle('aus', !S.hud); }
  });

  if (S.sparmodus) S.partikel = CFG.sparmodus.partikel;
  anzahlSetzen(S.anzahl);
  if (q.has('messen')) messungStarten(zahl('messen', 60));

  // Für Tests von außen
  window.NWU = { S, figuren, anzahlSetzen, messungStarten };
})();
