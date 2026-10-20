// Goldene Rüstung im Kreaturen-Kampf (20.10.2026): Schattenkönig, Königin und Wächter (Mods) tragen beim Kampf hinter
// dem großen Portal die goldene Rüstung mit Mond-Umhang und Säbel. Der eigene Kopf (Gesicht, Frisur, Krone, Diadem)
// bleibt – nur Rumpf, Arme, Beine, Umhang und Waffe werden getauscht. Nach dem Kampf kommt die eigene Kleidung zurück.
// Teile: figuren/ruestung/*.webp (aus assets/roh/teile-ruestung.jpg, tools/teile.py, halbe Größe).
// Jedes Rüstungsteil wird so groß gezogen wie das Teil, das es ersetzt (gleiche Länge vom Gelenk aus).
// Testen im Browser: ?ruestung=alle (alle gebundenen Figuren) oder ?ruestung=immer (auch ohne Kampf).
'use strict';

window.NWU_RUESTUNG = (() => {
  const ORDNER = 'figuren/ruestung/';
  // anker = Gelenk im Rüstungsbild, laenge = Pixel vom Gelenk bis zum Ende (Hüfte → Schulter beim Rumpf)
  const TEILE = {
    rumpf: { bild: 'rumpf', anker: [75, 112], laenge: 112, nachOben: true },
    armV: { bild: 'armV', anker: [27, 15], laenge: 140 },
    armH: { bild: 'armH', anker: [27, 15], laenge: 140 },
    beinV: { bild: 'beinV', anker: [27, 5], laenge: 147 },
    beinH: { bild: 'beinH', anker: [27, 5], laenge: 147 },
    umhang: { bild: 'umhang', anker: [115, 8], laenge: 292 },
  };
  const WAFFE = { bild: 'waffe', anker: [25, 50], hand: [3, 127], s: 0.72 };   // Griff im Säbelbild, Griff-Punkt in der Rüstungshand, Größe
  const WAFFEN_IDS = ['waffeV', 'stab'];
  const BERECHTIGT = ['koenig', 'koenigin', 'waechter'];

  let K = null, tex = null;
  const q = new URLSearchParams(location.search);
  const testAlle = q.get('ruestung') === 'alle' || q.get('ruestung') === 'immer';
  const testImmer = q.get('ruestung') === 'immer';

  const darf = (fi) => fi.rig && !fi.ungebunden && (testAlle || fi.mod || BERECHTIGT.includes(fi.rolle));
  // in der Portal-Welt: schon beim Heraustreten (noch unsichtbar) anziehen, bis zum Heimweg anbehalten
  const PORTAL_MODI = ['austreten', 'terrain', 'heim'];
  const imKampf = (fi) => testImmer || (K.kampf.laeuft() && PORTAL_MODI.includes(fi.modus));

  // Länge des Original-Teils vom Gelenk aus (Rumpf: Hüfte unten → nach oben, sonst nach unten)
  function originalLaenge(teil, nachOben) {
    const t = teil.sprite.texture, ay = teil.sprite.anchor.y * t.height;
    return nachOben ? ay : t.height - ay;
  }

  function merken(sp) {
    return { sp, texture: sp.texture, ax: sp.anchor.x, ay: sp.anchor.y, sx: sp.scale.x, sy: sp.scale.y, x: sp.x, y: sp.y,
      sichtbar: sp.visible, kinder: sp.children.map((c) => [c, c.visible]) };
  }
  function zurueck(m) {
    const { sp } = m;
    if (sp.destroyed) return;
    sp.texture = m.texture; sp.anchor.set(m.ax, m.ay); sp.scale.set(m.sx, m.sy); sp.position.set(m.x, m.y); sp.visible = m.sichtbar;
    for (const [c, v] of m.kinder) if (!c.destroyed) c.visible = v;
  }

  function anlegen(fi) {
    const teile = fi.rig.teile, alt = [];
    const faktor = {};
    const istWaffe = (c) => WAFFEN_IDS.some((w) => teile[w] && teile[w].sprite === c);
    for (const [id, r] of Object.entries(TEILE)) {
      const teil = teile[id];
      if (!teil || !tex[r.bild]) continue;
      const sp = teil.sprite, t = tex[r.bild];
      alt.push(merken(sp));
      const f = (originalLaenge(teil, r.nachOben) * Math.abs(sp.scale.y)) / r.laenge;
      faktor[id] = f;
      sp.texture = t;
      sp.anchor.set(r.anker[0] / t.width, r.anker[1] / t.height);
      sp.scale.set(f);
      for (const c of sp.children) if (!istWaffe(c)) c.visible = false;     // Haus-Abzeichen o. ä. passt nicht auf die Rüstung
    }
    // Waffe: Säbel in die vordere Hand, zweite Waffe (Dolch hinten) weg
    const waffe = WAFFEN_IDS.map((w) => teile[w]).find(Boolean);
    if (waffe && tex.waffe && faktor.armV) {
      const sp = waffe.sprite, t = tex.waffe;
      alt.push(merken(sp));
      sp.texture = t;
      sp.anchor.set(WAFFE.anker[0] / t.width, WAFFE.anker[1] / t.height);
      if (waffe.def.an === 'armV') { sp.position.set(WAFFE.hand[0], WAFFE.hand[1]); sp.scale.set(WAFFE.s); }
      else sp.scale.set(faktor.armV * WAFFE.s);
    }
    if (teile.waffeH) { alt.push(merken(teile.waffeH.sprite)); teile.waffeH.sprite.visible = false; }
    fi.ruestung = alt;
    glanz(fi);
  }

  function ablegen(fi) {
    for (const m of fi.ruestung || []) zurueck(m);
    fi.ruestung = null;
    if (fi.root && !fi.root.destroyed) glanz(fi);
  }

  function glanz(fi) {
    if (!K || !K.funken || !fi.root) return;
    K.funken(fi.root.x, fi.root.y - (K.S.hoehe || 56) * 0.5, 0xe8c96d, K.S.sparmodus ? 4 : 10);
  }

  function schritt() {
    if (!tex) return;
    for (const fi of K.figuren) {
      if (!fi.root || fi.root.destroyed) continue;
      const soll = darf(fi) && !fi.entfernen && imKampf(fi);
      if (soll && !fi.ruestung) anlegen(fi);
      else if (!soll && fi.ruestung) ablegen(fi);
    }
  }

  async function bilderLaden(texHolen) {
    const namen = [...new Set([...Object.values(TEILE).map((r) => r.bild), WAFFE.bild])];
    const geladen = await Promise.all(namen.map((n) => texHolen(ORDNER + n + '.webp')));
    if (geladen.some((t) => !t)) { console.warn('Rüstung: Bilder fehlen'); return false; }
    tex = Object.fromEntries(namen.map((n, i) => [n, geladen[i]]));
    return true;
  }

  async function anbinden(kontext) {
    K = kontext;
    if (await bilderLaden(K.texHolen)) K.app.ticker.add(schritt);
  }

  // rig-test.html: Rüstung direkt auf eine gebaute Figur legen (ohne Overlay)
  return { anbinden, bilderLaden,
    anlegen: (rig) => { const fi = { rig }; anlegen(fi); return () => ablegen(fi); },     // gibt „wieder ablegen“ zurück
    stand: () => (K ? { kampf: K.kampf.laeuft(), figuren: K.figuren.map((f) => ({ modus: f.modus, darf: !!darf(f), an: !!f.ruestung })) } : null) };
})();
