// Fluchkammer → Avatare (20.10.2026): Wird der Streamer im Spiel verflucht, trifft es auch alle Figuren auf dem Rahmen.
//   🔥 brennen   – kleine Flammen an jeder Figur
//   🌫️ nebel     – eine graue Wolke über jedem Kopf
//   🐌 zeitlupe  – alle laufen halb so schnell
// Welcher Effekt: nach Stichwörtern im Fluch-Namen, sonst fest aus dem Namen gewählt (gleicher Fluch = gleicher Effekt).
// Prallt der Fluch am Schild ab (joker), passiert nichts. Am Ende: goldene Funken (überstanden), rotes Aufblitzen
// (gebrochen), weiße Funken (aufgehoben). Sicherheitsnetz: nach 30 Minuten endet der Effekt von selbst.
// Ereignisse kommen von Streamer.bot (Gruppe „NWU Belohnungen“, Custom-Events „fluch“ / „fluchEnde“, wie
// Overlays/einblendung-fluch-wuerfel.html). Hier steht nie ein Name – nur Effekte.
// Testen: Taste V schaltet brennen → nebel → zeitlupe → aus durch (nur im Browser, in OBS über „Interagieren“).
'use strict';

window.NWU_FLUCH = (() => {
  const MAX_MS = 30 * 60 * 1000;
  const ARTEN = ['brennen', 'nebel', 'zeitlupe'];
  const STICHWORT = [
    ['brennen', /feuer|brenn|flamm|glut|hitze|lava|heiß|heiss/i],
    ['nebel', /nebel|blind|dunkel|schwarz|sicht|rauch|schatten/i],
    ['zeitlupe', /lang|zeitlupe|träge|traege|lahm|schnecke|slow|gelähmt|gelaehmt|ohne sprint/i],
  ];
  let K = null;               // aus avatare.js: { app, S, CFG, figuren, effektEbene, versetzt, T }
  let art = '', bis = 0;
  let ebene = null;
  const teilchen = [];
  const wolken = new Map();    // Figur → Wolke
  const gebremst = new Set();  // Figuren, deren Tempo halbiert ist

  function artFuer(name) {
    const n = String(name || '');
    for (const [a, re] of STICHWORT) if (re.test(n)) return a;
    let h = 0;
    for (const c of n) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return ARTEN[h % ARTEN.length];
  }

  // nur Figuren, die wirklich zu sehen sind (nicht gerade im Portal / beim Ein- oder Ausblenden)
  const lebend = () => (K ? K.figuren.filter((f) => f.root && f.root.visible && f.root.alpha > 0.4 && !f.entfernen && !f.versteckt) : []);
  const kopf = (fi, hoch) => K.versetzt(fi.root.x, fi.root.y, fi.winkel || 0, (K.S.hoehe || 56) * hoch);

  function teilchenDazu(x, y, farbe, vx, vy, leben, groesse) {
    const max = K.S.sparmodus ? 40 : 160;
    if (teilchen.length >= max) return;
    const s = new PIXI.Sprite(K.T.punkt);
    s.anchor.set(0.5); s.tint = farbe; s.position.set(x, y); s.scale.set(groesse);
    ebene.addChild(s);
    teilchen.push({ s, vx, vy, leben, voll: leben });
  }

  function funkenRegen(farbe, je) {
    for (const fi of lebend()) {
      const p = kopf(fi, 0.5);
      for (let i = 0; i < je; i++) teilchenDazu(p.x, p.y, farbe, (Math.random() - 0.5) * 120, -40 - Math.random() * 120, 0.9 + Math.random() * 0.5, 0.35 + Math.random() * 0.3);
    }
  }

  function wolkeBauen() {
    const g = new PIXI.Graphics();
    g.circle(-9, 0, 8).circle(0, -5, 10).circle(10, 0, 8).circle(0, 3, 9).fill({ color: 0x9a9aa6, alpha: 0.75 });
    g.circle(-4, -7, 3).fill({ color: 0xffffff, alpha: 0.25 });
    g.scale.set((K.S.hoehe || 56) / 56);          // wächst mit der Figurengröße
    ebene.addChild(g);
    return g;
  }

  function aufraeumen() {
    for (const w of wolken.values()) w.destroy();
    wolken.clear();
    for (const fi of gebremst) if (typeof fi.fluchTempo === 'number') { fi.tempo = fi.fluchTempo; delete fi.fluchTempo; }
    gebremst.clear();
  }

  function setzen(neu) {
    aufraeumen();
    art = ARTEN.includes(neu) ? neu : '';
    bis = art ? Date.now() + MAX_MS : 0;
  }

  function ende(wie) {
    if (!art) return;
    setzen('');
    if (!K) return;
    if (wie === 'gebrochen') {
      funkenRegen(0xd0243f, K.S.sparmodus ? 1 : 3);
      const blitz = new PIXI.Graphics().rect(0, 0, K.app.screen.width, K.app.screen.height).fill({ color: 0xb3202f, alpha: 0.18 });
      ebene.addChild(blitz);
      teilchen.push({ s: blitz, vx: 0, vy: 0, leben: 0.5, voll: 0.5, flaeche: true });
    } else {
      funkenRegen(wie === 'aufgehoben' ? 0xffffff : 0xe8c96d, K.S.sparmodus ? 1 : 3);
    }
  }

  function schritt(tk) {
    const dt = Math.min(0.1, tk.deltaMS / 1000);
    if (art && Date.now() > bis) ende('ueberstanden');
    const figs = lebend();
    if (art === 'brennen') {
      const chance = (K.S.sparmodus ? 1.2 : 4) * dt;
      for (const fi of figs) {
        if (Math.random() > chance) continue;
        const p = kopf(fi, 0.15 + Math.random() * 0.6);
        teilchenDazu(p.x + (Math.random() - 0.5) * 14, p.y, Math.random() < 0.5 ? 0xff7a1a : 0xffc23d, (Math.random() - 0.5) * 20, -45 - Math.random() * 35, 0.6 + Math.random() * 0.4, 0.3 + Math.random() * 0.25);
      }
    }
    if (art === 'nebel') {
      for (const fi of figs) {
        if (!wolken.has(fi)) wolken.set(fi, wolkeBauen());
        const p = kopf(fi, 1.15);
        const w = wolken.get(fi);
        w.position.set(p.x, p.y + Math.sin(performance.now() / 400 + fi.root.x) * 2);
        w.alpha = fi.root.alpha;
      }
      for (const [fi, w] of wolken) if (!figs.includes(fi)) { w.destroy(); wolken.delete(fi); }
    }
    if (art === 'zeitlupe') {
      for (const fi of figs) if (!gebremst.has(fi) && typeof fi.tempo === 'number') { fi.fluchTempo = fi.tempo; fi.tempo *= 0.5; gebremst.add(fi); }
    }
    for (let i = teilchen.length - 1; i >= 0; i--) {
      const t = teilchen[i];
      t.leben -= dt;
      if (t.leben <= 0) { t.s.destroy(); teilchen.splice(i, 1); continue; }
      if (!t.flaeche) { t.s.x += t.vx * dt; t.s.y += t.vy * dt; t.vy += 30 * dt; }
      t.s.alpha = Math.min(1, t.leben / t.voll * 1.5);
    }
  }

  /* Streamer.bot: eigene, schlanke Verbindung nur für die beiden Fluch-Ereignisse */
  function hoeren(url) {
    if (!url) return;
    let warten = 2000;
    const los = () => {
      let ws;
      try { ws = new WebSocket(url); } catch (e) { return; }
      ws.onopen = () => { warten = 2000; ws.send(JSON.stringify({ request: 'Subscribe', id: 'nwu-fluch', events: { General: ['Custom'] } })); };
      ws.onmessage = (e) => {
        let d; try { d = JSON.parse(e.data); } catch (err) { return; }
        let x = d && d.data;
        while (x && x.data && !x.customType) x = x.data;          // Streamer.bot verpackt Custom-Events eine Ebene tiefer
        if (!x || !x.customType) return;
        if (x.customType === 'fluch') { if (String(x.joker) !== 'true') setzen(artFuer(x.fluch)); }
        else if (x.customType === 'fluchEnde') ende(String(x.art || ''));
      };
      ws.onclose = () => { setTimeout(los, warten); warten = Math.min(60000, warten * 2); };
      ws.onerror = () => {};
    };
    los();
  }

  function anbinden(kontext) {
    K = kontext;
    ebene = new PIXI.Container();
    K.effektEbene.addChild(ebene);
    K.app.ticker.add(schritt);
    const q = new URLSearchParams(location.search);
    hoeren(q.get('sb') ?? K.CFG.streamerbot ?? '');
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() !== 'v' || e.repeat) return;
      const i = ARTEN.indexOf(art);
      if (i === ARTEN.length - 1) ende('ueberstanden'); else setzen(ARTEN[i + 1]);
    });
  }

  return { anbinden, artFuer, zustand: () => ({ art, bis }), test: (a) => (a ? setzen(a) : ende('ueberstanden')) };
})();
