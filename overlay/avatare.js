// NWU Avatare – Overlay Stufe 1
// Jede Figur ist EIN Bild (Seitenansicht). Die Bewegung entsteht per Programm:
// Wippen, Strecken/Stauchen, Neigen, Atmen, Hüpfen. Ebenen-Animation folgt in Stufe 2.
'use strict';

(async () => {
  const CFG = window.NWU_CONFIG;
  const W = 1920, H = 1080;

  // ---------- Einstellungen (config.js, per URL überschreibbar) ----------
  const q = new URLSearchParams(location.search);
  const zahl = (k, d) => (q.has(k) && !isNaN(parseFloat(q.get(k))) ? parseFloat(q.get(k)) : d);
  const an = (k, d) => (q.has(k) ? q.get(k) !== '0' : d);
  const S = {
    anzahl: Math.max(0, Math.min(100, zahl('n', 8))),
    fps: zahl('fps', CFG.fps),
    hoehe: zahl('groesse', CFG.figurHoehe),
    hud: an('hud', true),
    szene: q.get('szene') || 'standard',
  };
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

  // ---------- Bilder laden (per <img>, funktioniert auch als lokale Datei in OBS) ----------
  const laden = (src) => new Promise((ok, fehler) => {
    const img = new Image();
    img.onload = () => ok(PIXI.Texture.from(img));
    img.onerror = () => fehler(new Error('Bild fehlt: ' + src));
    img.src = src;
  });
  const VORLAGEN = await Promise.all(CFG.figuren.map(async (f) => ({ ...f, tex: await laden(f.bild) })));

  const lerp = (a, b, t) => a + (b - a) * t;
  const winkelLerp = (a, b, t) => a + (((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * t;
  const zufall = (a) => a[Math.floor(Math.random() * a.length)];

  // ---------- Laufweg um den Kamera-Rahmen ----------
  const R = { x: cam.x * W, y: cam.y * H, w: cam.w * W, h: cam.h * H };
  const umfang = 2 * (R.w + R.h);
  // oben stehen, rechts klettern, unten kopfüber, links klettern
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

  if (vorschau) {
    const rahmen = new PIXI.Graphics()
      .rect(R.x, R.y, R.w, R.h).fill({ color: 0x2a2c34 })
      .rect(R.x, R.y, R.w, R.h).stroke({ width: 3, color: 0xc9a84c });
    welt.addChild(rahmen);
  }

  // ---------- Effekte: Funken beim Erscheinen, "z" beim Schlafen ----------
  const effektEbene = new PIXI.Container();
  const effekte = [];
  const punktTex = (() => {
    const g = new PIXI.Graphics().circle(8, 8, 8).fill({ color: 0xffffff, alpha: 0.3 }).circle(8, 8, 4).fill(0xffffff);
    const t = app.renderer.generateTexture({ target: g, resolution: 2 }); g.destroy(); return t;
  })();
  function funken(x, y, farbe, anzahl) {
    for (let i = 0; i < anzahl; i++) {
      const p = new PIXI.Sprite(punktTex);
      p.anchor.set(0.5); p.tint = farbe; p.scale.set(0.25 + Math.random() * 0.25);
      p.position.set(x + (Math.random() - 0.5) * 20, y - Math.random() * 40);
      const w = Math.random() * Math.PI * 2;
      effekte.push({ obj: p, vx: Math.cos(w) * 40, vy: Math.sin(w) * 40 - 30, leben: 0.8 + Math.random() * 0.5, max: 1.3 });
      effektEbene.addChild(p);
    }
  }
  const zStil = new PIXI.TextStyle({ fontFamily: 'Georgia, serif', fontSize: 14, fontStyle: 'italic', fill: 0xd8dcf0 });
  function zzz(fi) {
    const t = new PIXI.Text({ text: 'z', style: zStil });
    t.anchor.set(0.5);
    const a = fi.winkel, oy = -S.hoehe * 1.05;
    t.position.set(fi.root.x - Math.sin(a) * oy + 8, fi.root.y + Math.cos(a) * oy);
    effekte.push({ obj: t, vx: 8, vy: -14, leben: 2.2, max: 2.2, wachsen: true });
    effektEbene.addChild(t);
  }

  // ---------- Figuren ----------
  const figurenEbene = new PIXI.Container();
  welt.addChild(figurenEbene, effektEbene);
  const figuren = [];

  function figurErzeugen(vorlage) {
    const root = new PIXI.Container();
    const schatten = new PIXI.Graphics().ellipse(0, 0, S.hoehe * 0.32, S.hoehe * 0.06).fill({ color: 0x000000, alpha: 0.35 });
    const koerper = new PIXI.Sprite(vorlage.tex);
    koerper.anchor.set(0.5, 1);
    const basis = S.hoehe / vorlage.tex.height;
    koerper.scale.set(basis);
    root.addChild(schatten, koerper);
    root.alpha = 0;
    figurenEbene.addChild(root);
    const haus = (window.NWU_HAEUSER || []).find((h) => h.id === vorlage.haus);
    const fi = {
      root, koerper, schatten, basis, vorlage, farbe: haus ? haus.farbe : 0xc9a84c,
      s: Math.random() * umfang,
      richtung: Math.random() < 0.5 ? 1 : -1,
      tempo: 22 + Math.random() * 16,
      phase: Math.random() * 10,
      winkel: 0,
      lurker: Math.random() < 0.25,
      zustand: 'idle', zustandZeit: 0.5 + Math.random() * 2,
      g: { laufen: 0, idle: 1, sitzen: 0, schlafen: 0 },
      sprung: -1,                     // < 0 = kein Sprung, sonst 0..1
      einblenden: 0, entfernen: false, zTimer: 0,
    };
    figuren.push(fi);
    const p = aufPfad(fi.s);
    funken(p.x, p.y, fi.farbe, 10);
    return fi;
  }

  function zustandWechseln(fi) {
    const r = Math.random();
    if (fi.lurker) fi.zustand = r < 0.45 ? 'sitzen' : r < 0.85 ? 'schlafen' : 'laufen';
    else fi.zustand = r < 0.6 ? 'laufen' : r < 0.9 ? 'idle' : 'sitzen';
    fi.zustandZeit = fi.zustand === 'laufen' ? 3 + Math.random() * 7 : 2.5 + Math.random() * 6;
    if (fi.zustand === 'idle' && Math.random() < 0.3) fi.richtung *= -1;   // umschauen
    if (!fi.lurker && Math.random() < 0.08) huepfen(fi);
  }

  function huepfen(fi) { if (fi.sprung < 0) fi.sprung = 0; }

  function animieren(fi, dt, t) {
    const k = Math.min(1, dt * 4);
    for (const z in fi.g) fi.g[z] = lerp(fi.g[z], z === fi.zustand ? 1 : 0, k);
    const { laufen, idle, sitzen, schlafen } = fi.g;
    const hocken = sitzen + schlafen;

    fi.phase += dt * (5 + fi.tempo * 0.12) * laufen;
    const schritt = Math.abs(Math.sin(fi.phase));          // 0 = Fuß auf dem Boden, 1 = oben
    const atmen = Math.sin(t * (schlafen > 0.5 ? 1.4 : 2.3) + fi.phase);

    // Sprung (Freude): Bogen nach oben, im Flug gestreckt, bei der Landung gestaucht
    let sprungY = 0, sprungS = 0;
    if (fi.sprung >= 0) {
      fi.sprung += dt / 0.55;
      const u = Math.min(1, fi.sprung);
      sprungY = Math.sin(u * Math.PI) * S.hoehe * 0.35;
      sprungS = u < 0.15 ? -0.12 * (u / 0.15) : u > 0.9 ? -0.1 * ((u - 0.9) / 0.1) : 0.08;
      if (u >= 1) fi.sprung = -1;
    }

    const sy = 1
      + laufen * (0.045 * schritt - 0.03)        // beim Aufsetzen stauchen, oben strecken
      + idle * 0.018 * atmen
      + hocken * (-0.16 + 0.015 * atmen)
      + sprungS;
    const sx = 1 + (1 - sy) * 0.6;                // Volumen bleibt ungefähr gleich

    fi.koerper.scale.set(fi.basis * sx * fi.richtung, fi.basis * sy);
    fi.koerper.y = -(laufen * schritt * S.hoehe * 0.07 + sprungY);
    fi.koerper.rotation = fi.richtung * (laufen * Math.sin(fi.phase) * 0.07 + schlafen * 0.2 + sitzen * 0.04);
    fi.schatten.scale.set(1 - Math.min(0.5, (-fi.koerper.y) / S.hoehe), 1);
    fi.schatten.alpha = fi.winkel > -0.3 && fi.winkel < 0.3 ? 1 : 0;   // nur oben sinnvoll
  }

  function anzahlSetzen(n) {
    S.anzahl = n;
    const lebend = figuren.filter((f) => !f.entfernen);
    for (let i = lebend.length; i < n; i++) figurErzeugen(zufall(VORLAGEN));
    for (let i = n; i < lebend.length; i++) lebend[i].entfernen = true;
  }

  // ---------- Hauptschleife ----------
  let zeit = 0;
  app.ticker.add((ticker) => {
    const dt = Math.min(0.1, ticker.deltaMS / 1000);
    zeit += dt;

    for (let i = figuren.length - 1; i >= 0; i--) {
      const fi = figuren[i];
      fi.einblenden = lerp(fi.einblenden, fi.entfernen ? 0 : 1, Math.min(1, dt * (fi.entfernen ? 1.5 : 3)));
      fi.root.alpha = fi.einblenden;
      fi.root.scale.set(0.7 + 0.3 * fi.einblenden);
      if (fi.entfernen && fi.einblenden < 0.02) { fi.root.destroy({ children: true }); figuren.splice(i, 1); continue; }

      fi.zustandZeit -= dt;
      if (fi.zustandZeit <= 0) zustandWechseln(fi);

      if (fi.g.laufen > 0.05) fi.s += fi.richtung * fi.tempo * dt * fi.g.laufen;
      const p = aufPfad(fi.s);
      fi.winkel = winkelLerp(fi.winkel, p.a, Math.min(1, dt * 6));
      fi.root.position.set(p.x, p.y);
      fi.root.rotation = fi.winkel;

      animieren(fi, dt, zeit);

      if (fi.g.schlafen > 0.8) {
        fi.zTimer -= dt;
        if (fi.zTimer <= 0) { zzz(fi); fi.zTimer = 1.2 + Math.random() * 0.8; }
      }
    }

    for (let i = effekte.length - 1; i >= 0; i--) {
      const e = effekte[i];
      e.leben -= dt;
      if (e.leben <= 0) { e.obj.destroy(); effekte.splice(i, 1); continue; }
      e.obj.x += e.vx * dt; e.obj.y += e.vy * dt;
      e.obj.alpha = Math.min(1, e.leben / e.max * 1.5);
      if (e.wachsen) e.obj.scale.set(1 + (1 - e.leben / e.max) * 0.6);
    }

    hudAktualisieren(dt);
  });

  // ---------- Anzeige und Tasten ----------
  const hud = document.getElementById('hud');
  if (!S.hud) hud.classList.add('aus');
  let hudZeit = 0;
  function hudAktualisieren(dt) {
    hudZeit += dt;
    if (hudZeit < 0.5 || !S.hud) return;
    hudZeit = 0;
    hud.innerHTML =
      `<b>NWU Avatare – Stufe 1</b> · ${Math.round(app.ticker.FPS)} FPS · ${figuren.filter((f) => !f.entfernen).length} Figuren` +
      `<div class="klein">1/2/3 = 4/12/30 Figuren · N neue Figur · X eine weg · J alle jubeln · L Lurker an/aus · H Anzeige</div>`;
  }

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === '1') anzahlSetzen(4);
    else if (k === '2') anzahlSetzen(12);
    else if (k === '3') anzahlSetzen(30);
    else if (k === 'n') anzahlSetzen(S.anzahl + 1);
    else if (k === 'x') anzahlSetzen(Math.max(0, S.anzahl - 1));
    else if (k === 'j') figuren.forEach((f, i) => setTimeout(() => huepfen(f), i * 60));
    else if (k === 'l') { const alle = !figuren.every((f) => f.lurker); figuren.forEach((f) => { f.lurker = alle; f.zustandZeit = 0; }); }
    else if (k === 'h') { S.hud = !S.hud; hud.classList.toggle('aus', !S.hud); }
  });

  anzahlSetzen(S.anzahl);
  window.NWU = { S, figuren, anzahlSetzen, huepfen };
})();
