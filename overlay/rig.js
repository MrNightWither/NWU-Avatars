// NWU Avatare – Stufe 2: Figuren aus Teilen (Kopf, Rumpf, Arme, Beine, Umhang, Waffe).
// Die Teile kommen aus den Gemini-Teile-Bögen (tools/teile.py), die Gelenke stehen in rigs.js.
// bauen() setzt eine Figur zusammen, pose() bewegt sie (Laufen, Atmen, Sitzen, Jubeln, Winken).
'use strict';

(function () {
  const DUNKEL = 0xb4b4c0;          // hintere Arme und Beine etwas dunkler, damit man vorne/hinten unterscheidet

  // def = Eintrag aus NWU_RIGS, tex = { name: PIXI.Texture }
  function bauen(def, tex) {
    const koerper = new PIXI.Container();
    const teile = {};
    for (const t of def.teile) {
      const tx = tex[t.bild];
      const s = new PIXI.Sprite(tx);
      s.anchor.set(t.anker[0] / tx.width, t.anker[1] / tx.height);
      if (t.dunkel) s.tint = DUNKEL;
      if (t.s) s.scale.set(t.s);
      teile[t.id] = { def: t, sprite: s, dreh: t.dreh || 0 };
      if (t.an) {
        teile[t.an].sprite.addChild(s);   // hängt an der Hand: Position in Pixeln des Eltern-Teils
        s.position.set(t.pos[0], t.pos[1]);
        s.rotation = t.dreh || 0;
      } else {
        koerper.addChild(s);
      }
    }
    return { koerper, teile, def };
  }

  // p: laufen, idle, sitzen, schlafen (0–1, weich überblendet), phase (Schrittzyklus), t (Zeit),
  //    jubel (0–1), winken (0–1), schlag (0–1, Duell)
  function pose(r, p) {
    const { teile, def } = r;
    const sw = Math.sin(p.phase), hock = p.sitzen + p.schlafen;
    const atmen = Math.sin(p.t * (p.schlafen > 0.5 ? 1.4 : 2.3));
    const jub = p.jubel || 0, wink = p.winken || 0, schlag = p.schlag || 0;
    const winkel = {
      beinV: -sw * 0.5 * p.laufen - hock * 1.45,
      beinH: sw * 0.5 * p.laufen - hock * 1.3,
      armV: sw * 0.45 * p.laufen + p.idle * 0.04 * atmen - hock * 0.45
        - jub * (2.6 + 0.12 * Math.sin(p.t * 9)) - wink * (2.4 + 0.35 * Math.sin(p.t * 11)) - schlag * 1.9,
      armH: -sw * 0.45 * p.laufen - p.idle * 0.03 * atmen - hock * 0.3
        - jub * (2.4 + 0.12 * Math.sin(p.t * 9 + 1.2)),
      kopf: p.idle * 0.03 * atmen + p.schlafen * 0.35 + p.laufen * 0.04 * Math.sin(p.phase * 2) - jub * 0.12 + wink * 0.05,
      umhang: p.laufen * (0.32 + 0.06 * Math.sin(p.phase * 2)) + 0.05 * Math.sin(p.t * 1.6) + hock * 0.15,
      rumpf: 0,
    };
    const neigung = p.laufen * 0.06 + p.schlafen * 0.14 - jub * 0.04 + schlag * 0.12;
    const [hx, hy] = def.huefte;
    const c = Math.cos(neigung), s = Math.sin(neigung);
    for (const id in teile) {
      const t = teile[id], d = t.def;
      if (d.an) continue;
      let x = d.pos[0], y = d.pos[1], rot = t.dreh + (winkel[d.art] || 0);
      if (d.oben) {                           // Oberkörper kippt um die Hüfte
        const dx = x - hx, dy = y - hy;
        x = hx + dx * c - dy * s; y = hy + dx * s + dy * c;
        rot += neigung;
      }
      t.sprite.position.set(x, y);
      t.sprite.rotation = rot;
    }
    // Hängende Teile (Morgenstern an der Kette) zeigen immer nach unten und pendeln etwas nach,
    // senkrechte Teile (Stab) bleiben aufrecht
    for (const id in teile) {
      const t = teile[id];
      if (!t.def.haengt && !t.def.senkrecht) continue;
      const eltern = teile[t.def.an].sprite;
      const pendeln = t.def.haengt ? 0.25 * p.laufen * Math.sin(p.phase - 0.8) + 0.04 * Math.sin(p.t * 2) : 0.05 * p.laufen * Math.sin(p.phase);
      t.sprite.rotation = -eltern.rotation - neigung + pendeln;
    }
    // Sitzen: Hüfte sinkt fast auf den Boden, die Beine zeigen nach vorne
    r.koerper.pivot.y = hy * 0.62 * hock;
    // Mitläufer (Frisur, Kopfhaut, Kopfschmuck) folgen ihrem Teil, liegen aber davor oder dahinter
    for (const f of r.folger || []) { f.sprite.position.copyFrom(f.ziel.position); f.sprite.rotation = f.ziel.rotation; }
  }

  window.NWU_RIG = { bauen, pose };
})();
