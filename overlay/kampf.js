// Kreaturen-Kämpfe hinter dem großen Portal: vier Portal-Welten (data/welten.js) und die Kreaturen der Spaltung.
// Öffnet sich das große Portal, wird eine Welt gewählt (zufällig oder per !portal eis / stein / sumpf / feuer [boss]).
// Der Terrain-Streifen bekommt den Boden der Welt, dahinter ein schwaches Hintergrundbild, dazu Wetter (Schnee, Asche,
// Nebel, Funken). Aus einem Riss rechts kriechen Kreaturen, alle Figuren kämpfen gemeinsam von selbst, !angriff im Chat
// ist ein starker Schlag (1× pro 3 Sekunden pro Person). Wächter (Mods) und hohe Level stehen vorne.
// Sieg = Ruhm für alle Mitkämpfer (Streamer.bot → Worker /spiel, Quelle 'kreatur' bzw. 'boss' in data/ruhm.js).
// Zeit um = die Kreaturen ziehen sich zurück, ohne Strafe. Beim Boss macht der Schattenkönig den Finisher, wenn er da ist.
// Ohne Bilder zeichnet alles Platzhalter mit PIXI.Graphics. avatare.js ruft NWU_KAMPF(K) auf.
'use strict';

window.NWU_KAMPF = function (K) {
  const { CFG, S, H, TERRAIN, PORTAL_X, terrain, terrainEbene, figurenEbene, effektEbene, figuren, effekt, funken, T, textur,
    lerp, texHolen, EV, karteZeigen, karteFuss, karteListe, karteHalten, huepfen, versetzt, melden } = K;
  const WD = window.NWU_WELTEN || { welten: {}, namen: {}, ids: [] };
  const KC = CFG.kampf || {};
  const RUHM_SP = (window.NWU_RUHM && window.NWU_RUHM.spiele) || {};
  const zeit = () => K.zeit();
  const demoChat = !S.kanal;
  const zufall = (l) => l[Math.floor(Math.random() * l.length)];
  const echt = (f) => f.id && !f.demo && !f.gast && !f.ungebunden;

  const BODEN_H = 70, BG_H = 300;
  const RISS_X = TERRAIN.x + TERRAIN.breite - 70;
  const FRONT_X = TERRAIN.x + TERRAIN.breite * 0.64;
  const VIOLETT = 0xc9a8ff;

  const ANSAGE = { fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: 'bold', fill: 0xe8c96d, stroke: { color: 0x120d06, width: 5 }, letterSpacing: 2 };
  const ansageStil = new PIXI.TextStyle(ANSAGE);
  const plusStil = new PIXI.TextStyle({ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 'bold', fill: 0xe8c96d, stroke: { color: 0x120d06, width: 3 } });
  const nameStil = new PIXI.TextStyle({ fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 'bold', fill: 0xf1e9d6, stroke: { color: 0x120d06, width: 3 } });
  function ansage(text, dauer, farbe) {
    const stil = farbe ? new PIXI.TextStyle({ ...ANSAGE, fill: farbe }) : ansageStil;
    const t = new PIXI.Text({ text, style: stil });
    t.anchor.set(0.5); t.position.set(TERRAIN.x + TERRAIN.breite / 2, terrain.y - 190);
    effekt(t, { vy: -6, leben: dauer || 2.4, max: dauer || 2.4 });
  }
  function ueberFigur(fi, text) {
    const t = new PIXI.Text({ text, style: plusStil });
    const p = versetzt(fi.root.x, fi.root.y, fi.winkel, S.hoehe * 1.3);
    t.anchor.set(0.5); t.position.set(p.x, p.y);
    effekt(t, { vy: -16, leben: 2.6, max: 2.6 });
  }

  // ---------- Zufall mit Startwert (Platzhalter sehen jedes Mal gleich aus) ----------
  let saat = 1;
  const rnd = () => { saat = (saat * 16807) % 2147483647; return saat / 2147483647; };
  const saatSetzen = (text) => { saat = 7; for (const c of text) saat = (saat * 31 + c.charCodeAt(0)) % 2147483647; if (saat <= 0) saat = 7; };

  // ---------- Welt: Boden, Hintergrund, Wetter ----------
  let welt = null, boden = null, hinten = null, adern = null;
  const BLENDE = textur((g) => { for (let i = 0; i < 50; i++) g.rect(0, i * 5, 4, 5).fill({ color: 0xffffff, alpha: Math.pow(i / 49, 1.4) }); });

  function bodenZeichnen(w) {
    const B = TERRAIN.breite, b = w.boden, g = new PIXI.Graphics();
    const innen = (r) => r + rnd() * (B - 2 * r);                  // nichts ragt über den Streifen hinaus
    saatSetzen(w.id + 'boden');
    g.rect(0, 0, B, BODEN_H).fill({ color: b.farbe, alpha: 0.97 });
    g.rect(0, BODEN_H * 0.45, B, BODEN_H * 0.55).fill({ color: b.dunkel, alpha: 0.55 });
    if (b.art === 'eis') {
      for (let i = 0; i < 14; i++) { const rx = 30 + rnd() * 60; g.ellipse(innen(rx), 14 + rnd() * 20, rx, 3 + rnd() * 3).fill({ color: 0xffffff, alpha: 0.25 }); }   // Glanz auf dem See
      for (let i = 0; i < 18; i++) {                              // Risse im Eis
        let x = rnd() * B, y = 8 + rnd() * 50; g.moveTo(x, y);
        for (let k = 0; k < 4; k++) { x += (rnd() - 0.3) * 30; y += (rnd() - 0.5) * 14; g.lineTo(x, Math.max(4, Math.min(66, y))); }
        g.stroke({ width: 1.3, color: b.dunkel, alpha: 0.6 });
      }
      for (let x = 30; x < B - 30; x += 26 + rnd() * 40) g.ellipse(x, 1, 10 + rnd() * 16, 4 + rnd() * 3).fill({ color: 0xf4fbff, alpha: 0.95 });       // Schnee an der Kante
    } else if (b.art === 'fels') {
      for (let i = 0; i < 26; i++) {                              // roter Fels mit Brocken
        const r = 6 + rnd() * 12, x = innen(r), y = 6 + rnd() * 18;
        g.poly([x - r, y + r * 0.5, x - r * 0.4, y - r * 0.5, x + r * 0.6, y - r * 0.4, x + r, y + r * 0.6]).fill({ color: b.dunkel, alpha: 0.7 });
      }
      g.rect(0, 36, B, 13).fill(0x7a0c1a);                        // der Blutfluss
      for (let x = 0; x < B - 50; x += 40 + rnd() * 50) g.rect(x, 39 + rnd() * 6, 20 + rnd() * 30, 1.5).fill({ color: 0xff5a6a, alpha: 0.55 });
    } else if (b.art === 'moor') {
      for (let i = 0; i < 12; i++) {                              // Pfützen im Moor
        const rx = 26 + rnd() * 40, x = innen(rx), y = 22 + rnd() * 30;
        g.ellipse(x, y, rx, 4 + rnd() * 4).fill({ color: 0x101a14, alpha: 0.8 });
        g.rect(x - 10, y - 1, 16, 1).fill({ color: 0x8fb8a0, alpha: 0.35 });
      }
      for (let x = 4; x < B - 4; x += 18 + rnd() * 50) {              // Schilf über der Kante
        const h = 10 + rnd() * 16;
        g.moveTo(x, 2).lineTo(x - 2 + rnd() * 4, -h).stroke({ width: 1.6, color: b.linie });
        g.ellipse(x, -h, 1.6, 4).fill(0x4a3a22);
      }
    } else if (b.art === 'lava') {
      for (let i = 0; i < 30; i++) {                              // Basalt-Kanten
        const x = rnd() * (B - 40), y = 4 + rnd() * 56;
        g.poly([x, y, x + 14 + rnd() * 20, y + rnd() * 6, x + 10, y + 10 + rnd() * 6]).stroke({ width: 1.2, color: 0x000000, alpha: 0.6 });
      }
    }
    g.rect(0, 0, B, 3).fill(b.linie);
    return g;
  }
  function adernZeichnen(w) {                                       // Lava-Adern leuchten und pulsieren
    if (w.boden.art !== 'lava') return null;
    const B = TERRAIN.breite, g = new PIXI.Graphics();
    saatSetzen(w.id + 'adern');
    for (let i = 0; i < 9; i++) {
      let x = rnd() * B, y = 6 + rnd() * 50; const pkt = [[x, y]];
      for (let k = 0; k < 6 && x < B - 45; k++) { x += 12 + rnd() * 30; y += (rnd() - 0.5) * 16; pkt.push([x, Math.max(4, Math.min(66, y))]); }
      for (const [breite, alpha] of [[7, 0.25], [2.5, 1]]) { g.moveTo(...pkt[0]); pkt.slice(1).forEach((p) => g.lineTo(...p)); g.stroke({ width: breite, color: w.boden.linie, alpha }); }
    }
    g.blendMode = 'add';
    return g;
  }
  function hintergrundZeichnen(w) {
    const B = TERRAIN.breite + 140, h = w.himmel, g = new PIXI.Graphics();
    saatSetzen(w.id + 'himmel');
    for (let i = 0; i < 10; i++) g.rect(0, -BG_H + i * (BG_H / 10), B, BG_H / 10).fill({ color: h.farbe, alpha: 0.05 + i * 0.04 });
    const zacken = (farbe, alpha, hoch, schritt) => {
      const p = [0, 0];
      for (let x = 0; x <= B; x += schritt * (0.6 + rnd() * 0.8)) p.push(x, -hoch * (0.4 + rnd() * 0.6));
      p.push(B, 0);
      g.poly(p).fill({ color: farbe, alpha });
    };
    if (h.art === 'eistuerme') {
      zacken(h.berge, 0.55, BG_H * 0.8, 90);
      for (let i = 0; i < 7; i++) {                               // spitze Eistürme
        const x = 60 + rnd() * (B - 120), th = 80 + rnd() * 120, tb = 10 + rnd() * 12;
        g.poly([x - tb, 0, x - tb * 0.7, -th, x, -th - 30, x + tb * 0.7, -th, x + tb, 0]).fill({ color: 0x6f93b8, alpha: 0.55 });
      }
      zacken(0x8fb0d0, 0.35, BG_H * 0.35, 60);
    } else if (h.art === 'rote_stadt') {
      zacken(h.berge, 0.5, BG_H * 0.6, 120);
      for (let x = 30; x < B - 30; x += 40 + rnd() * 60) {         // Türme der roten Stadt
        const th = 50 + rnd() * 130, tb = 14 + rnd() * 18;
        g.rect(x, -th, tb, th).fill({ color: 0x4a141a, alpha: 0.8 });
        g.poly([x - 3, -th, x + tb / 2, -th - 24 - rnd() * 20, x + tb + 3, -th]).fill({ color: 0x4a141a, alpha: 0.8 });
        for (let k = 0; k < 3; k++) if (rnd() < 0.6) g.rect(x + tb * 0.35, -th + 14 + k * 22, 4, 6).fill({ color: 0xff6a4a, alpha: 0.7 });
      }
    } else if (h.art === 'ruinen') {
      zacken(h.berge, 0.5, BG_H * 0.45, 140);
      for (let x = 40; x < B - 40; x += 70 + rnd() * 90) {        // versunkene Säulen und Bögen
        const th = 40 + rnd() * 110, tb = 12 + rnd() * 10;
        g.poly([x, 0, x, -th, x + tb * 0.3, -th - 8, x + tb * 0.6, -th + 4, x + tb, -th - 4, x + tb, 0]).fill({ color: 0x34504a, alpha: 0.75 });
        if (rnd() < 0.4) g.arc(x + tb + 30, -th + 10, 30, Math.PI, 0).stroke({ width: 9, color: 0x34504a, alpha: 0.75 });
      }
      for (let i = 0; i < 4; i++) g.rect(0, -20 - i * 34 - rnd() * 10, B, 10).fill({ color: 0xa8c8bc, alpha: 0.08 });
    } else if (h.art === 'vulkane') {
      for (let i = 0; i < 4; i++) {                               // Vulkane mit glühenden Kratern und Rauch
        const x = 100 + i * (B - 200) / 3 + (rnd() - 0.5) * 80, vh = 110 + rnd() * 120, vb = 120 + rnd() * 80;
        g.poly([x - vb, 0, x - 18, -vh, x + 18, -vh, x + vb, 0]).fill({ color: h.berge, alpha: 0.8 });
        g.ellipse(x, -vh, 20, 5).fill({ color: 0xff7a1a, alpha: 0.85 });
        for (let k = 1; k < 5; k++) g.circle(x + k * 6 * (rnd() - 0.3), -vh - k * 18, 8 + k * 4).fill({ color: 0x3a2a24, alpha: 0.25 });
      }
    }
    return g;
  }

  // Baut Boden und Hintergrund der Welt ins Terrain (wird mit dem Streifen ein- und ausgefahren)
  function weltSetzen(id) {
    welt = WD.welten[id] || null;
    if (!welt) return null;
    for (const c of terrain.removeChildren()) c.destroy({ children: true });
    hinten = new PIXI.Container();
    const bild = hintergrundZeichnen(welt);
    hinten.addChild(bild);
    hinten.alpha = KC.hintergrundDeckkraft ?? 0.8;
    hinten.x = -70;
    const blende = new PIXI.Sprite(BLENDE);
    blende.width = TERRAIN.breite; blende.height = BG_H; blende.y = -BG_H;
    terrain.addChild(hinten, blende);
    hinten.mask = blende;                                           // oben weich ausblenden
    boden = bodenZeichnen(welt);
    adern = adernZeichnen(welt);
    terrain.addChild(boden);
    if (adern) terrain.addChild(adern);
    const w = welt, bilder = welt.bilder || {};
    if (bilder.hintergrund) texHolen(bilder.hintergrund).then((t) => {
      if (!t || welt !== w || hinten.destroyed) return;
      const sp = new PIXI.Sprite(t); const s = (TERRAIN.breite + 140) / t.width;
      sp.scale.set(s); sp.y = -t.height * s;
      bild.destroy(); hinten.addChild(sp);
    });
    if (bilder.boden) texHolen(bilder.boden).then((t) => {
      if (!t || welt !== w || boden.destroyed) return;
      // eine Kachel = halbe Streifenbreite; bodenKante = Pixel im Bild über der Lauffläche (Schnee, Schilf)
      const s = TERRAIN.breite / 2 / t.width, kante = (bilder.bodenKante || 0) * s;
      const ts = new PIXI.TilingSprite({ texture: t, width: TERRAIN.breite, height: BODEN_H + kante });
      ts.tileScale.set(s); ts.y = -kante;
      terrain.addChildAt(ts, terrain.getChildIndex(boden)); boden.destroy(); boden = ts;
      if (adern) { adern.destroy(); adern = null; }
    });
    for (const k of [...welt.kreaturen, welt.boss]) {
      for (const src of [k.bild, ...(k.teile || []).map((t) => t.bild)]) if (src) texHolen(src).then((t) => { if (t) bildFertig.set(src, t); });
    }
    return welt;
  }

  // Wetter: ein kleiner fester Vorrat an Teilchen, der immer wieder verwendet wird (Sparmodus: aus)
  const wetter = [];
  const wetterEbene = new PIXI.Container();
  effektEbene.addChildAt(wetterEbene, 0);
  function wetterNeu(s, art, anfang) {
    const x = TERRAIN.x + Math.random() * TERRAIN.breite, f = welt.wetter.farbe, oben = terrain.y - BG_H, unten = terrain.y;
    s.t = 0; s.p = Math.random() * 6; s.leben = 0; s.blendMode = 'normal'; s.tint = f;
    if (art === 'schnee') { s.position.set(x, anfang ? oben + Math.random() * BG_H : oben + 2); s.vx = -6; s.vy = 22 + Math.random() * 22; s.scale.set(0.14 + Math.random() * 0.16); s.a = s.alpha = 0.85; }
    else if (art === 'asche') { s.position.set(x, anfang ? oben + Math.random() * BG_H : unten); s.vx = 6 + Math.random() * 10; s.vy = -(12 + Math.random() * 20); s.scale.set(0.12 + Math.random() * 0.14); s.tint = Math.random() < 0.5 ? f : 0x3a2a2a; s.a = 0.8; }
    else if (art === 'funken') { s.position.set(x, anfang ? oben + Math.random() * BG_H : unten); s.vx = (Math.random() - 0.5) * 16; s.vy = -(30 + Math.random() * 50); s.scale.set(0.1 + Math.random() * 0.12); s.blendMode = 'add'; s.tint = Math.random() < 0.6 ? f : 0xffe08a; s.a = 1; }
    else if (art === 'nebel') { s.position.set(TERRAIN.x + 180 + Math.random() * (TERRAIN.breite - 360), unten - 10 - Math.random() * 70); s.vx = (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 8); s.vy = 0; s.scale.set(4 + Math.random() * 3, 1.4 + Math.random()); s.leben = 9 + Math.random() * 6; s.t = anfang ? Math.random() * 5 : 0; s.a = 0.5; }
  }
  function wetterSchritt(dt) {
    const sicht = Math.max(0, Math.min(1, (H + 10 - terrain.y) / (H + 10 - TERRAIN.y)));
    const art = welt && welt.wetter ? welt.wetter.art : null;
    const max = !art || S.sparmodus || sicht <= 0 ? 0 : Math.round((KC.partikel ?? 60) * (welt.wetter.menge || 1) * (art === 'nebel' ? 0.15 : 1));
    while (wetter.length > max) wetter.pop().destroy();
    while (wetter.length < max) {
      const s = new PIXI.Sprite(art === 'nebel' ? T.glanz : T.punkt);
      s.anchor.set(0.5); s.art = art; wetterNeu(s, art, true);
      wetterEbene.addChild(s); wetter.push(s);
    }
    wetterEbene.alpha = sicht;
    const oben = terrain.y - BG_H, unten = terrain.y;
    for (const s of wetter) {
      if (s.art !== art) { s.art = art; s.texture = art === 'nebel' ? T.glanz : T.punkt; wetterNeu(s, art, true); }
      s.t += dt; s.x += s.vx * dt + (art === 'schnee' ? Math.sin(s.t * 1.7 + s.p) * 12 * dt : 0); s.y += s.vy * dt;
      if (art === 'funken' || art === 'asche') s.alpha = s.a * (0.6 + 0.4 * Math.sin(s.t * 9 + s.p));
      if (art === 'nebel') s.alpha = s.a * Math.max(0, Math.min(1, s.t / 3, (s.leben - s.t) / 3));
      const rand = art === 'nebel' ? -120 : 60;
      const raus = s.y > unten + 4 || s.y < oben || s.x < TERRAIN.x - rand || s.x > TERRAIN.x + TERRAIN.breite + rand || (s.leben && s.t > s.leben);
      if (raus) wetterNeu(s, art, false);
    }
  }

  // ---------- Kreaturen: Platzhalter aus Teilen (gleiches Format wie spätere Bilder) ----------
  const bildFertig = new Map();
  function platzhalter(def, h) {
    const c = def.farben, rand = { width: Math.max(1.4, h * 0.022), color: 0x0a0810 };
    const teile = [];
    const teil = (id, art, x, y, zeichnen, extra) => { const g = new PIXI.Graphics(); zeichnen(g); teile.push({ id, art, pos: [x, y], sprite: g, versatz: 0, ...extra }); return g; };
    const auge = (g, x, y, r) => g.circle(x, y, r).fill(VIOLETT).circle(x - r * 0.3, y - r * 0.3, r * 0.35).fill(0xffffff);
    const stacheln = (g, x0, x1, y, hoch) => { if (!def.stacheln) return; for (let x = x0; x < x1; x += h * 0.09) g.poly([x, y, x + h * 0.03, y - hoch * (0.6 + 0.4 * Math.sin(x)), x + h * 0.06, y]).fill(c.akzent).stroke(rand); };
    const glut = (g, x, y, rx, ry) => { if (def.glut) g.ellipse(x, y, rx, ry).fill({ color: c.akzent, alpha: 0.55 }); };
    if (def.bauart === 'vierbeiner') {
      teil('schwanz', 'schwanz', 0.40 * h, -0.58 * h, (g) => g.poly([0, -0.03 * h, 0.22 * h, -0.2 * h, 0.27 * h, -0.13 * h, 0.04 * h, 0.05 * h]).fill(c.haut).stroke(rand));
      const bein = (id, x, v, farbe) => teil(id, 'bein', x, -0.42 * h, (g) => g.roundRect(-0.055 * h, -0.02 * h, 0.11 * h, 0.44 * h, 0.04 * h).fill(farbe).stroke(rand), { versatz: v });
      bein('beinHH', 0.26 * h, 0, c.dunkel); bein('beinVH', -0.24 * h, Math.PI, c.dunkel);
      teil('rumpf', 'rumpf', 0, -0.52 * h, (g) => { stacheln(g, -0.24 * h, 0.3 * h, -0.14 * h, 0.16 * h); g.ellipse(0, 0, 0.44 * h, 0.19 * h).fill(c.haut).stroke(rand); glut(g, 0, 0.02 * h, 0.3 * h, 0.06 * h); });
      bein('beinHV', 0.22 * h, Math.PI, c.haut); bein('beinVV', -0.28 * h, 0, c.haut);
      const kopf = teil('kopf', 'kopf', -0.36 * h, -0.62 * h, (g) => {
        g.poly([-0.02 * h, -0.07 * h, 0.03 * h, -0.25 * h, 0.07 * h, -0.06 * h]).fill(c.dunkel).stroke(rand);
        g.ellipse(-0.08 * h, 0, 0.15 * h, 0.12 * h).fill(c.haut).stroke(rand);
        g.poly([-0.16 * h, -0.06 * h, -0.36 * h, -0.01 * h, -0.35 * h, 0.04 * h, -0.15 * h, 0.06 * h]).fill(c.haut).stroke(rand);
        auge(g, -0.15 * h, -0.03 * h, 0.03 * h);
      });
      kopf.addChildAt(teil('kiefer', 'kiefer', -0.14 * h, 0.05 * h, (g) => g.poly([0, 0, -0.2 * h, 0.0, -0.18 * h, 0.05 * h, 0, 0.05 * h]).fill(c.dunkel).stroke(rand), { an: 'kopf' }), 0);
    } else if (def.bauart === 'kriecher') {
      const bein = (id, x, v, farbe) => teil(id, 'bein', x, -0.2 * h, (g) => g.poly([-0.03 * h, 0, 0.03 * h, 0, 0.05 * h, 0.2 * h, -0.02 * h, 0.21 * h]).fill(farbe).stroke(rand), { versatz: v });
      [0.26, 0.02, -0.22].forEach((x, i) => bein('beinH' + i, x * h, i * 2.1, c.dunkel));
      teil('rumpf', 'rumpf', 0.05 * h, -0.38 * h, (g) => {
        g.ellipse(0, 0, 0.42 * h, 0.28 * h).fill(c.haut).stroke(rand);
        g.arc(0.05 * h, 0.1 * h, 0.3 * h, -2.6, -0.5).stroke({ width: rand.width, color: c.dunkel });
        g.moveTo(0.02 * h, -0.27 * h).lineTo(0.06 * h, 0.2 * h).stroke({ width: rand.width, color: c.dunkel });
        glut(g, -0.1 * h, -0.08 * h, 0.06 * h, 0.04 * h); glut(g, 0.14 * h, 0.0, 0.07 * h, 0.04 * h); glut(g, 0.0, 0.1 * h, 0.05 * h, 0.03 * h);
      });
      [0.3, 0.06, -0.18].forEach((x, i) => bein('beinV' + i, x * h, i * 2.1 + Math.PI, c.haut));
      const kopf = teil('kopf', 'kopf', -0.34 * h, -0.32 * h, (g) => {
        g.circle(-0.08 * h, 0, 0.17 * h).fill(c.haut).stroke(rand);
        auge(g, -0.17 * h, -0.06 * h, 0.035 * h); auge(g, -0.06 * h, -0.1 * h, 0.03 * h);
      });
      kopf.addChild(teil('kiefer', 'kiefer', -0.2 * h, 0.06 * h, (g) => g.poly([0, 0, -0.15 * h, -0.03 * h, -0.19 * h, 0.04 * h, -0.04 * h, 0.07 * h]).fill(c.dunkel).stroke(rand), { an: 'kopf' }));
    } else if (def.bauart === 'schweber') {
      teil('schwanz', 'schwanz', 0.04 * h, -0.34 * h, (g) => g.poly([-0.13 * h, 0, 0.13 * h, 0, 0.06 * h, 0.26 * h, 0.0, 0.18 * h, -0.06 * h, 0.3 * h]).fill({ color: c.haut, alpha: 0.8 }).stroke(rand));
      teil('armH', 'arm', 0.14 * h, -0.62 * h, (g) => g.poly([-0.03 * h, 0, 0.03 * h, 0, 0.0, 0.2 * h]).fill(c.dunkel).stroke(rand), { versatz: 1 });
      teil('rumpf', 'rumpf', 0, -0.55 * h, (g) => {
        if (def.stacheln) for (let i = 0; i < 5; i++) { const w = -2.4 + i * 0.55; g.poly([Math.cos(w) * 0.16 * h, Math.sin(w) * 0.2 * h, Math.cos(w) * 0.36 * h, Math.sin(w) * 0.4 * h, Math.cos(w + 0.25) * 0.18 * h, Math.sin(w + 0.25) * 0.2 * h]).fill(c.akzent).stroke(rand); }
        g.ellipse(0, 0, 0.22 * h, 0.26 * h).fill(c.haut).stroke(rand); glut(g, 0, 0.04 * h, 0.12 * h, 0.14 * h);
      });
      const kopf = teil('kopf', 'kopf', -0.02 * h, -0.82 * h, (g) => {
        g.circle(0, 0, 0.17 * h).fill(c.haut).stroke(rand);
        auge(g, -0.08 * h, -0.02 * h, 0.035 * h); auge(g, 0.03 * h, -0.03 * h, 0.03 * h);
      });
      kopf.addChild(teil('kiefer', 'kiefer', -0.05 * h, 0.08 * h, (g) => g.ellipse(0, 0.01 * h, 0.06 * h, 0.03 * h).fill(c.dunkel), { an: 'kopf' }));
      teil('armV', 'arm', -0.15 * h, -0.62 * h, (g) => g.poly([-0.03 * h, 0, 0.03 * h, 0, 0.0, 0.22 * h]).fill(c.haut).stroke(rand), { versatz: 0 });
    } else {                                                            // koloss (Bosse)
      const bein = (id, x, v, farbe) => teil(id, 'bein', x, -0.4 * h, (g) => g.roundRect(-0.09 * h, -0.02 * h, 0.18 * h, 0.4 * h, 0.04 * h).fill(farbe).stroke(rand)
        .roundRect(-0.12 * h, 0.33 * h, 0.22 * h, 0.08 * h, 0.03 * h).fill(farbe).stroke(rand), { versatz: v });
      const arm = (id, x, v, farbe) => teil(id, 'arm', x, -0.8 * h, (g) => g.roundRect(-0.07 * h, -0.03 * h, 0.14 * h, 0.4 * h, 0.05 * h).fill(farbe).stroke(rand)
        .circle(0, 0.42 * h, 0.09 * h).fill(farbe).stroke(rand), { versatz: v });
      bein('beinH', 0.1 * h, Math.PI, c.dunkel); arm('armH', 0.22 * h, 0, c.dunkel);
      teil('rumpf', 'rumpf', 0, -0.62 * h, (g) => {
        if (def.stacheln) for (let i = 0; i < 4; i++) g.poly([-0.24 * h + i * 0.15 * h, -0.24 * h, -0.2 * h + i * 0.15 * h, -0.4 * h, -0.15 * h + i * 0.15 * h, -0.24 * h]).fill(c.akzent).stroke(rand);
        g.roundRect(-0.27 * h, -0.26 * h, 0.54 * h, 0.5 * h, 0.08 * h).fill(c.haut).stroke(rand);
        const riss = (pkt) => { g.moveTo(pkt[0] * h, pkt[1] * h); for (let i = 2; i < pkt.length; i += 2) g.lineTo(pkt[i] * h, pkt[i + 1] * h); g.stroke({ width: rand.width * (def.glut ? 1.6 : 1), color: def.glut ? c.akzent : c.dunkel }); };
        riss([-0.18, -0.15, -0.08, -0.02, -0.14, 0.12]); riss([0.1, -0.2, 0.04, -0.04, 0.15, 0.1]);
        g.circle(-0.02 * h, -0.05 * h, 0.05 * h).fill({ color: VIOLETT, alpha: 0.7 });      // der Splitter der Spaltung im Herzen
      });
      bein('beinV', -0.1 * h, 0, c.haut);
      const kopf = teil('kopf', 'kopf', -0.05 * h, -0.88 * h, (g) => {
        if (def.hoerner) { g.poly([0.02 * h, -0.16 * h, 0.12 * h, -0.36 * h, 0.08 * h, -0.14 * h]).fill(0x1a1414).stroke(rand); g.poly([-0.1 * h, -0.17 * h, -0.2 * h, -0.36 * h, -0.05 * h, -0.15 * h]).fill(0x1a1414).stroke(rand); }
        if (def.stacheln && !def.hoerner) for (let i = 0; i < 3; i++) g.poly([-0.1 * h + i * 0.07 * h, -0.18 * h, -0.07 * h + i * 0.07 * h, -0.3 * h, -0.04 * h + i * 0.07 * h, -0.18 * h]).fill(c.akzent).stroke(rand);
        g.roundRect(-0.13 * h, -0.2 * h, 0.22 * h, 0.2 * h, 0.05 * h).fill(c.haut).stroke(rand);
        auge(g, -0.09 * h, -0.12 * h, 0.025 * h); auge(g, -0.02 * h, -0.12 * h, 0.025 * h);
      });
      kopf.addChild(teil('kiefer', 'kiefer', -0.04 * h, -0.03 * h, (g) => g.roundRect(-0.09 * h, 0, 0.16 * h, 0.06 * h, 0.02 * h).fill(c.dunkel).stroke(rand), { an: 'kopf' }));
      arm('armV', -0.24 * h, Math.PI, c.haut);
    }
    const koerper = new PIXI.Container();
    for (const t of teile) { t.sprite.position.set(t.pos[0], t.pos[1]); if (!t.an) koerper.addChild(t.sprite); }
    return { koerper, teile, massstab: 1 };
  }
  // Aus Bildern (data/welten.js): ein Bild (federt nur) oder Teile mit Gelenken
  function ausBildern(def, h) {
    const koerper = new PIXI.Container();
    if (def.teile && def.teile.length && def.hoehe) {
      if (def.teile.some((d) => !bildFertig.get(d.bild))) return null;
      const teile = [], nachId = {};
      for (const d of def.teile) {
        const tx = bildFertig.get(d.bild);
        const s = new PIXI.Sprite(tx); s.anchor.set(d.anker[0] / tx.width, d.anker[1] / tx.height); s.position.set(d.pos[0], d.pos[1]);
        const t = { ...d, sprite: s, versatz: d.versatz || 0 }; teile.push(t); nachId[d.id] = t;
        if (d.an && nachId[d.an]) nachId[d.an].sprite.addChild(s); else koerper.addChild(s);
      }
      return { koerper, teile, massstab: h / def.hoehe };
    }
    const tx = def.bild && bildFertig.get(def.bild);
    if (!tx) return null;
    const s = new PIXI.Sprite(tx); s.anchor.set(0.5, 1); koerper.addChild(s);
    return { koerper, teile: [], massstab: h / tx.height, einBild: true };
  }

  const kreaturEbene = new PIXI.Container();
  figurenEbene.addChildAt(kreaturEbene, 0);
  function kreaturErzeugen(def, lebenFaktor, boss) {
    const h = def.groesse * S.hoehe * (KC.kreaturGroesse ?? 1.1);
    const bau = ausBildern(def, h) || platzhalter(def, h);
    const root = new PIXI.Container();
    const schatten = new PIXI.Graphics().ellipse(0, 0, h * 0.4, h * 0.06).fill({ color: 0x000000, alpha: 0.4 });
    const leiste = new PIXI.Graphics();
    root.addChild(schatten, bau.koerper, leiste);
    let schild = null;
    if (boss) { schild = new PIXI.Text({ text: def.name, style: nameStil }); schild.anchor.set(0.5, 1); root.addChild(schild); }
    if (def.glut || boss) {
      const g = new PIXI.Sprite(T.glanz); g.anchor.set(0.5); g.tint = def.farben.akzent; g.blendMode = 'add'; g.alpha = 0.35;
      g.scale.set(h / 30, h / 36); g.y = -h * 0.5; root.addChildAt(g, 1);
    }
    kreaturEbene.addChild(root);
    const max = Math.round(def.leben * lebenFaktor);
    return {
      def, h, boss, root, koerper: bau.koerper, teile: bau.teile, massstab: bau.massstab, einBild: !!bau.einBild, leiste, schild,
      x: RISS_X, zielX: RISS_X, hp: max, max, laufen: 0, phase: Math.random() * 6, t: Math.random() * 6, angriff: 0, angriffT: -1,
      treffer: 0, cd: 2 + Math.random() * 2, tot: false, sterben: 0, ein: 0, weg: false, richtung: -1,
      breite: bau.einBild ? bau.koerper.children[0].texture.width * bau.massstab * 0.8 : h * (def.bauart === 'koloss' ? 0.55 : 0.85),
    };
  }
  function kreaturPose(c, dt) {
    c.t += dt; c.phase += dt * 8 * c.laufen;
    c.treffer = Math.max(0, c.treffer - dt * 4);
    if (c.angriffT >= 0) { c.angriffT += dt; if (c.angriffT > 0.55) c.angriffT = -1; }
    c.angriff = c.angriffT >= 0 ? Math.sin(Math.PI * Math.min(1, c.angriffT / 0.55)) : 0;
    const h = c.h, m = c.massstab;
    for (const t of c.teile) {
      let r = 0;
      if (t.art === 'bein') r = Math.sin(c.phase + t.versatz) * 0.45 * c.laufen;
      else if (t.art === 'arm') r = Math.sin(c.phase + t.versatz) * 0.25 * c.laufen + 0.06 * Math.sin(c.t * 2 + t.versatz) + c.angriff * 1.7;
      else if (t.art === 'kopf') { r = 0.04 * Math.sin(c.t * 2.2) - c.angriff * 0.15; t.sprite.x = t.pos[0] - c.angriff * h * 0.06 / m; }
      else if (t.art === 'kiefer') r = -c.angriff * 0.7 - 0.05 * (1 + Math.sin(c.t * 3));
      else if (t.art === 'schwanz') r = 0.25 * Math.sin(c.t * 3 + c.phase);
      else if (t.art === 'rumpf') t.sprite.y = t.pos[1] + Math.sin(c.t * 2.4) * h * 0.012 / m;
      t.sprite.rotation = r;
    }
    const blick = c.richtung < 0 ? 1 : -1;                      // Bilder schauen nach links
    const schwebt = c.def.bauart === 'schweber';
    const s = m * (1 + c.treffer * 0.06);
    const quetsch = c.einBild ? 1 + 0.04 * Math.sin(c.phase * 2) * c.laufen + 0.02 * Math.sin(c.t * 2.3) : 1;
    c.koerper.scale.set(s * blick / quetsch, s * quetsch);
    c.koerper.x = -c.angriff * h * 0.12 * blick + (c.treffer > 0 ? Math.sin(c.t * 60) * 2 * c.treffer : 0);
    c.koerper.y = schwebt ? -h * 0.14 - Math.sin(c.t * 2) * h * 0.05 : -Math.abs(Math.sin(c.phase)) * h * 0.03 * c.laufen;
    c.koerper.rotation = c.einBild ? -c.angriff * 0.12 * blick : 0;
    c.koerper.tint = c.treffer > 0.3 ? 0xffa0a0 : 0xffffff;
  }
  function leisteZeichnen(c) {
    const b = c.boss ? 150 : Math.max(34, c.h * 0.7), y = -c.h - (c.def.bauart === 'schweber' ? c.h * 0.2 : 0) - (c.boss ? 14 : 8);
    const anteil = Math.max(0, c.hp / c.max), hoch = c.boss ? 9 : 6;
    c.leiste.clear().roundRect(-b / 2 - 1.5, y - 1.5, b + 3, hoch + 3, 3).fill({ color: 0x0a0810, alpha: 0.85 })
      .rect(-b / 2, y, b * anteil, hoch).fill(anteil > 0.3 ? 0xb3122e : 0xff5a3a);
    if (c.boss) c.leiste.roundRect(-b / 2 - 1.5, y - 1.5, b + 3, hoch + 3, 3).stroke({ width: 1.2, color: 0xc9a84c });
    c.leiste.alpha = c.tot ? 0 : 1;
    if (c.schild) { c.schild.y = y - 4; c.schild.alpha = c.tot ? 0 : 1; }
  }

  // ---------- Der Riss, aus dem sie kommen ----------
  const riss = new PIXI.Container();
  const rissGlanz = new PIXI.Sprite(T.glanz); rissGlanz.anchor.set(0.5); rissGlanz.tint = 0x7a3cff; rissGlanz.blendMode = 'add'; rissGlanz.scale.set(1.6, 3.4); rissGlanz.y = -70;
  const rissForm = new PIXI.Graphics()
    .poly([0, -150, 9, -120, 2, -100, 12, -70, 3, -46, 10, -18, 0, 0, -10, -22, -3, -48, -12, -74, -3, -98, -10, -124]).fill(0x0c0614)
    .stroke({ width: 3, color: 0x9b6bff });
  riss.addChild(rissGlanz, rissForm); riss.scale.set(0.001, 1); riss.visible = false;
  terrainEbene.addChild(riss);
  let rissOffen = 0, rissZiel = 0;

  // ---------- Ablauf ----------
  let geplant = null, kampf = null;
  const geschosse = [];
  const kaempfer = () => figuren.filter((f) => f.modus === 'terrain' && !f.entfernen && f.root && !f.versteckt);
  const lebende = () => (kampf ? kampf.kreaturen.filter((c) => !c.tot && !c.weg) : []);
  const kaempferSortiert = () => kaempfer().sort((a, b) => (b.mod - a.mod) || ((b.level || 1) - (a.level || 1)) || String(a.id || a.name).localeCompare(String(b.id || b.name)));

  // vor dem Öffnen des Portals: Welt wählen und aufbauen (avatare.js färbt damit das Portal)
  function vorbereiten(opt) {
    opt = opt || {};
    const id = WD.welten[opt.welt] ? opt.welt : zufall(WD.ids);
    if (!id) return null;
    geplant = { boss: opt.raider ? true : opt.boss, welt: id, raider: opt.raider || null };
    return weltSetzen(id);
  }

  // Schatten-Invasion (Raid): der Raider kommt als riesiger Boss „Schatten von …“ – nur der Boss, kurze Zeit,
  // jede Chat-Nachricht ist ein Schlag. Mehr Raid-Zuschauer = mehr Leben.
  function raidBoss(w, raider) {
    const name = String(raider.name || 'Unbekannt').replace(/[^\p{L}\p{N}_ .-]/gu, '').slice(0, 25) || 'Unbekannt';
    return { ...w.boss, name: `Schatten von ${name}`, groesse: w.boss.groesse * (KC.raidGroesse ?? 1.35),
      leben: w.boss.leben * (1 + Math.min(3, (raider.zuschauer || 0) / 25)) };
  }
  const bossName = () => (kampf && kampf.bossDef ? kampf.bossDef.name : welt.boss.name);

  function starten() {
    const w = welt, plan = geplant || {};
    const n = Math.max(1, figuren.filter((f) => !f.entfernen && ['ins-portal', 'wartet', 'austreten', 'terrain'].includes(f.modus)).length);
    const raider = plan.raider;
    const boss = plan.boss ?? Math.random() < (KC.bossChance ?? 0.12);
    const bossDef = raider ? raidBoss(w, raider) : w.boss;
    const maxK = S.sparmodus ? 2 : (KC.maxKreaturen || 5);
    const klein = raider ? 0 : boss ? Math.min(S.sparmodus ? 0 : 2, Math.floor(n / 6)) : Math.min(maxK, 2 + Math.floor(n / 5));
    const welle = [];
    for (let i = 0; i < klein; i++) welle.push({ def: zufall(w.kreaturen), boss: false });
    if (boss) welle.push({ def: bossDef, boss: true });
    const limit = raider ? (KC.raidSekunden || 60) : boss ? (KC.bossSekunden || 120) : (KC.sekunden || 75);
    kampf = { phase: 'kampf', t: 0, boss, raider, bossDef, welle, gesamt: welle.length, besiegt: 0, kreaturen: [], teilnehmer: new Set(), sperre: new Map(), limit,
      faktor: 1 + 0.35 * n, spawn: 1.2, finisher: null, listeZeit: 0, ende: 0 };
    rissZiel = 1;
    EV.ende = Math.max(EV.ende, EV.zeit + limit + 25);
    if (raider) {
      const wer = bossDef.name.replace(/^Schatten von /, '');
      karteZeigen(`${wer} fällt mit Gefolge ein – ein Schatten aus der Spaltung hat sich an die Fersen geheftet. Ringt ihn gemeinsam nieder!`,
        [`${bossDef.name} 100 %`], 'Jede Chat-Nachricht ist ein Schlag · !angriff = starker Schlag', limit, `⚔ Schatten-Invasion · ${w.kurz}`);
    } else if (boss) karteZeigen(w.boss.text, [`${w.boss.name} 100 %`], 'Alle Häuser gemeinsam! !angriff im Chat = starker Schlag', limit, `⚠ Boss · ${w.kurz}`);
    else karteZeigen(w.text, [`0 / ${welle.length} besiegt`], 'Eure Figuren kämpfen von selbst · !angriff = starker Schlag (alle 3 Sek.)', limit, `Kreaturen der Spaltung · ${w.kurz}`);
    karteHalten();
    if (boss) ansage('EIN BOSS NAHT', 2.6, 0xff6a6a);
  }

  const schadenVon = (f, stark) => { const lv = Math.min(100, f.level || 1); return stark ? 4 + lv * 0.1 : 1 + lv * 0.05; };
  function treffen(c, schaden, von, stark) {
    if (!c || c.tot || c.weg) return;
    c.hp -= schaden; c.treffer = 1;
    const p = { x: c.x - c.breite * 0.3 * (c.richtung < 0 ? 1 : -1), y: terrain.y - c.h * 0.5 };
    funken(p.x, p.y, von ? von.farbe : 0xffffff, stark ? 12 : 3);
    if (stark) funken(p.x, p.y, 0xffe2a0, 6);
    if (c.hp <= 0) sterben(c);
  }
  function sterben(c) {
    c.tot = true; c.hp = 0; c.sterben = 0;
    if (kampf) kampf.besiegt++;
    funken(c.x, terrain.y - c.h * 0.5, VIOLETT, c.boss ? 30 : 14); funken(c.x, terrain.y - c.h * 0.5, c.def.farben.akzent, c.boss ? 20 : 8);
  }
  function geschoss(von, ziel, stark) {
    const start = versetzt(von.root.x, von.root.y, von.winkel, S.hoehe * 0.6);
    const s = new PIXI.Sprite(T.punkt); s.anchor.set(0.5); s.tint = von.farbe || 0xe8c96d; s.blendMode = 'add'; s.scale.set(stark ? 0.7 : 0.38);
    effektEbene.addChild(s);
    const dauer = Math.min(1.1, 0.35 + Math.hypot(ziel.x - start.x, terrain.y - start.y) / 1400);
    geschosse.push({ s, x0: start.x, y0: start.y, ziel, von, stark, t: 0, dauer, schaden: schadenVon(von, stark) });
  }
  function angreifen(f, stark, vorne, reihe) {
    f.schlagBis = zeit() + 0.3; f.puls = Math.max(f.puls || 0, stark ? 0.8 : 0.25);
    if (kampf) kampf.teilnehmer.add(f);
    const nah = f.modus === 'terrain' && reihe < 3 && vorne && f.kampfX !== undefined && Math.abs(f.x - f.kampfX) < 8;
    if (nah) { treffen(vorne, schadenVon(f, stark), f, stark); return; }
    const z = vorne || zufall(lebende().filter((c) => c.x < RISS_X - 20));
    if (z) geschoss(f, z, stark);
  }

  // !angriff: stärkerer Schlag, 1× pro 3 Sekunden pro Person; wer noch am Rahmen steht, schießt von dort
  function eingabe(fi, text) {
    if (!kampf || kampf.phase !== 'kampf' || !fi.root) return false;
    if (kampf.raider && !text.startsWith('!')) {           // Schatten-Invasion: jede Nachricht (auch Emotes) ist ein Schlag
      const k = 'chat:' + (fi.id || fi.name);
      if ((kampf.sperre.get(k) || 0) <= zeit()) {
        kampf.sperre.set(k, zeit() + (KC.raidNachrichtPause ?? 1));
        angreifen(fi, false, lebende().find((c) => c.x < RISS_X - 30), fi.modus === 'terrain' ? kaempferSortiert().indexOf(fi) : 99);
      }
      return false;                                         // Nachricht wirkt sonst ganz normal weiter (Winken usw.)
    }
    if (!text.startsWith('!angriff')) return false;
    const k = fi.id || fi;
    if ((kampf.sperre.get(k) || 0) > zeit()) return true;
    kampf.sperre.set(k, zeit() + (KC.angriffPause ?? 3));
    fi.letzte = zeit();
    angreifen(fi, true, lebende().find((c) => c.x < RISS_X - 30), fi.modus === 'terrain' ? kaempferSortiert().indexOf(fi) : 99);
    return true;
  }

  // !portal [eis|stein|sumpf|feuer] [boss] – Streamer und (je nach spiele.starter) Mods
  function befehl(text) {
    const m = text.match(/^!portal\b(.*)$/);
    if (!m) return false;
    const woerter = m[1].trim().split(/\s+/);
    const id = woerter.map((w) => WD.namen[w]).find(Boolean);
    if (EV.phase === 'aus') K.portalStarten({ welt: id, boss: woerter.includes('boss') ? true : undefined });
    return true;
  }

  function sieg() {
    kampf.phase = 'sieg'; kampf.ende = kampf.t;
    const art = kampf.boss ? 'boss' : 'kreatur';
    const plus = (RUHM_SP[art] && RUHM_SP[art].gewinner) || 0;
    ansage(kampf.boss ? 'BOSS BESIEGT' : 'SIEG!', 3.2);
    karteFuss(kampf.boss ? `✦ ${bossName()} ist gefallen – alle Häuser haben gemeinsam gesiegt ✦` : '✦ Die Kreaturen der Spaltung sind besiegt ✦', 7);
    karteListe([kampf.boss ? `${bossName()} 0 %` : `${kampf.gesamt} / ${kampf.gesamt} besiegt`], 0);
    const alle = [...new Set([...kampf.teilnehmer, ...kaempfer()])].filter((f) => f.root && !f.entfernen);
    alle.forEach((f, i) => setTimeout(() => {
      if (!f.root || f.root.destroyed || f.entfernen) return;
      f.jubelBis = zeit() + 3.5; huepfen(f);
      if (echt(f) && plus) ueberFigur(f, `+${plus} Ruhm`);
    }, i * 70));
    melden(art, alle);
    rissZiel = 0;
    EV.ende = Math.min(EV.ende, EV.zeit + 9);
  }
  function rueckzug(text) {
    if (!kampf || kampf.phase !== 'kampf') return;
    kampf.phase = 'rueckzug'; kampf.ende = kampf.t; kampf.welle = [];
    for (const c of lebende()) { c.richtung = 1; c.zielX = RISS_X + 10; }
    karteFuss(text || 'Die Kreaturen ziehen sich in den Riss zurück … diesmal sind sie entkommen.', 6);
    for (const f of figuren) f.kampfX = undefined;
    EV.ende = Math.min(EV.ende, EV.zeit + 9);
  }
  function abbrechen() {
    if (kampf && kampf.phase === 'kampf') rueckzug('Das Portal schließt sich – die Kreaturen weichen zurück.');
    for (const f of figuren) f.kampfX = undefined;
  }
  function aufraeumen() {
    if (kampf) for (const c of kampf.kreaturen) c.root.destroy({ children: true });
    for (const g of geschosse) g.s.destroy();
    geschosse.length = 0;
    kampf = null; geplant = null; rissZiel = 0;
    for (const f of figuren) f.kampfX = undefined;
  }

  // Die vorderste Kreatur schlägt zurück: die erste Reihe wird zurückgestoßen (nur zum Ansehen, keine Strafe)
  function zurueckschlagen(vorne, liste) {
    vorne.cd = vorne.boss ? 3.2 + Math.random() : 2.4 + Math.random() * 1.6; vorne.angriffT = 0;
    setTimeout(() => {
      if (!kampf || vorne.tot) return;
      for (const f of vorne.boss ? liste.slice(0, 5) : liste.slice(0, 1)) {
        if (!f.root || f.entfernen) continue;
        f.x -= vorne.boss ? 22 : 14; f.puls = 1; funken(f.root.x, f.root.y - S.hoehe * 0.5, vorne.def.farben.akzent, 5);
        if (vorne.boss) huepfen(f);
      }
      if (vorne.boss) {
        const ring = new PIXI.Graphics().ellipse(0, 0, 20, 5).stroke({ width: 3, color: vorne.def.farben.akzent });
        ring.position.set(vorne.x - vorne.breite * 0.6, terrain.y); effekt(ring, { leben: 0.8, max: 0.8, ring: true });
      }
    }, 260);
  }
  // 👑 Der Schattenkönig macht beim Boss den großen Finisher, wenn er gerade da ist
  function finisher(k, boss, dt) {
    if (!boss) return;
    if (!k.finisher && boss.hp < boss.max * 0.25) {
      const koenig = figuren.find((f) => f.vorlage && f.vorlage.typ === 'koenig' && !f.entfernen && f.root && !f.versteckt);
      k.finisher = { t: 0, koenig };
      if (koenig) {
        koenig.jubelBis = zeit() + 2; huepfen(koenig); koenig.puls = 1;
        ansage('DER SCHATTENKÖNIG', 2.6);
        karteFuss('👑 Der Schattenkönig greift ein!');
      }
    }
    if (!k.finisher || !k.finisher.koenig || k.finisher.fertig) return;
    k.finisher.t += dt;
    if (k.finisher.t < 0.9) return;
    k.finisher.fertig = true;
    const strahl = new PIXI.Sprite(T.strahl); strahl.anchor.set(0.5, 1); strahl.tint = 0xe8c96d; strahl.blendMode = 'add';
    strahl.position.set(boss.x, terrain.y); strahl.scale.set(3, 5); effekt(strahl, { leben: 1.4, max: 1.4 });
    funken(boss.x, terrain.y - boss.h * 0.5, 0xe8c96d, 40); funken(boss.x, terrain.y - boss.h * 0.6, 0xffffff, 20);
    k.finisher.koenig.schlagBis = zeit() + 0.5;
    k.teilnehmer.add(k.finisher.koenig);
    treffen(boss, boss.hp + 1, k.finisher.koenig, true);
  }

  function kampfPhase(k, dt) {
    if (k.welle.length && rissOffen > 0.8 && (k.spawn -= dt) <= 0) {
      const w = k.welle.shift();
      k.kreaturen.push(kreaturErzeugen(w.def, k.faktor, w.boss));
      k.spawn = w.boss ? 2 : 1.3;
      if (w.boss) funken(RISS_X, terrain.y - 60, VIOLETT, 30);
    }
    // Kreaturen stellen sich hintereinander auf, die vorderste kämpft
    const leb = lebende();
    let x = FRONT_X;
    for (const c of leb) { c.zielX = x + c.breite / 2; x += c.breite + S.hoehe * 0.35; }
    const vorne = leb.find((c) => c.x < RISS_X - 30);
    // Figuren: vorne Wächter und hohe Level, dahinter der Rest (greift aus der Ferne an)
    const liste = kaempferSortiert();
    for (const f of liste) k.teilnehmer.add(f);
    const front = vorne ? vorne.x - vorne.breite / 2 : FRONT_X - S.hoehe * 1.5;
    const platz = Math.max(S.hoehe * 0.2, Math.min(S.hoehe * 0.42, (front - PORTAL_X - 70) / Math.max(1, liste.length)));
    liste.forEach((f, i) => {
      f.kampfX = Math.max(PORTAL_X + 50, front - S.hoehe * 0.3 - i * platz); f.kampfBlick = 1;
      if (!vorne) return;
      f.kampfCd = (f.kampfCd ?? Math.random()) - dt;
      if (f.kampfCd <= 0 && Math.abs(f.x - f.kampfX) < 8) { angreifen(f, false, vorne, i); f.kampfCd = 1 + Math.random() * 0.8; }
    });
    if (demoChat && vorne && Math.random() < dt * 0.8) { const f = zufall(liste.filter((d) => d.demo)); if (f) eingabe(f, '!angriff'); }
    if (vorne && liste.length && (vorne.cd -= dt) <= 0 && Math.abs(vorne.x - vorne.zielX) < 6) zurueckschlagen(vorne, liste);
    finisher(k, leb.find((c) => c.boss), dt);
    if (!k.welle.length && !lebende().length) { sieg(); return; }
    if (k.t > k.limit) { rueckzug(); return; }
    if ((k.listeZeit -= dt) <= 0) {
      k.listeZeit = 0.4;
      const b = k.kreaturen.find((c) => c.boss);
      karteListe([k.boss ? `${bossName()} ${b ? Math.ceil(Math.max(0, b.hp) / b.max * 100) : 100} %` : `${k.besiegt} / ${k.gesamt} besiegt`]);
    }
  }

  function kampfSchritt(dt) {
    const k = kampf;
    k.t += dt;
    if (k.phase === 'kampf') kampfPhase(k, dt);
    if (k.phase === 'sieg' && k.t - k.ende > 3.5) for (const f of figuren) f.kampfX = undefined;
    // Kreaturen bewegen, sterben, verschwinden im Riss
    for (let i = k.kreaturen.length - 1; i >= 0; i--) {
      const c = k.kreaturen[i];
      c.ein = Math.min(1, c.ein + dt * 2);
      if (c.tot) {
        c.sterben += dt;
        c.root.alpha = Math.max(0, 1 - c.sterben / 0.9); c.root.scale.set(1 - c.sterben * 0.3);
        if (c.sterben > 0.9) { c.root.destroy({ children: true }); k.kreaturen.splice(i, 1); continue; }
      } else {
        const d = c.zielX - c.x, v = c.boss ? 45 : 70;
        if (Math.abs(d) > 2) { c.x += Math.sign(d) * Math.min(Math.abs(d), v * dt); c.laufen = lerp(c.laufen, 1, Math.min(1, dt * 6)); c.richtung = k.phase === 'rueckzug' ? 1 : -1; }
        else { c.laufen = lerp(c.laufen, 0, Math.min(1, dt * 6)); if (k.phase === 'kampf') c.richtung = -1; }
        if (k.phase === 'rueckzug' && c.x >= RISS_X) { c.root.destroy({ children: true }); k.kreaturen.splice(i, 1); continue; }
        c.root.alpha = Math.min(c.ein, k.phase === 'rueckzug' ? Math.max(0, (RISS_X + 10 - c.x) / 40) : 1);
      }
      c.root.position.set(c.x, terrain.y);
      kreaturPose(c, dt);
      leisteZeichnen(c);
    }
    // Geschosse fliegen im Bogen
    for (let i = geschosse.length - 1; i >= 0; i--) {
      const g = geschosse[i];
      g.t += dt;
      const u = Math.min(1, g.t / g.dauer);
      g.s.position.set(lerp(g.x0, g.ziel.x, u), lerp(g.y0, terrain.y - g.ziel.h * 0.5, u) - Math.sin(u * Math.PI) * 50);
      if (u >= 1) { treffen(g.ziel, g.schaden, g.von, g.stark); g.s.destroy(); geschosse.splice(i, 1); }
    }
    if (k.phase === 'rueckzug' && !k.kreaturen.length) rissZiel = 0;
  }

  function schritt(dt) {
    wetterSchritt(dt);
    if (welt && hinten && !hinten.destroyed) {               // Parallax: Hintergrund wandert langsam und etwas gegen die Figuren
      const da = kaempfer(), mitte = TERRAIN.x + TERRAIN.breite / 2;
      const mx = da.length ? da.reduce((s, f) => s + f.x, 0) / da.length : mitte;
      hinten.x = lerp(hinten.x, -70 - (mx - mitte) * 0.05 + Math.sin(zeit() * 0.05) * 25, Math.min(1, dt * 0.8));
    }
    if (adern && !adern.destroyed) adern.alpha = 0.65 + 0.3 * Math.sin(zeit() * 2.1);
    rissOffen = lerp(rissOffen, rissZiel, Math.min(1, dt * 2.5));
    riss.visible = rissOffen > 0.02;
    riss.scale.set(Math.max(0.001, rissOffen), 0.6 + 0.4 * rissOffen);
    riss.position.set(RISS_X + 12, terrain.y);
    rissGlanz.alpha = 0.6 + 0.3 * Math.sin(zeit() * 4);
    if (EV.phase === 'aus') { if (kampf || geplant) aufraeumen(); return; }
    if (!kampf && geplant && EV.phase === 'aktiv' && EV.zeit > (KC.startNachSekunden ?? 4) && welt) starten();
    if (kampf) kampfSchritt(dt);
  }

  return {
    schritt, vorbereiten, befehl, eingabe, abbrechen, weltSetzen,
    laeuft: () => !!kampf || !!geplant,
    welt: () => welt,
    stand: () => (kampf ? { phase: kampf.phase, boss: kampf.boss, welt: welt && welt.id, offen: kampf.welle.length, besiegt: kampf.besiegt, teilnehmer: kampf.teilnehmer.size, t: Math.round(kampf.t),
      kreaturen: kampf.kreaturen.map((c) => ({ id: c.def.id, hp: Math.round(c.hp), max: c.max, tot: c.tot })) } : null),
  };
};
