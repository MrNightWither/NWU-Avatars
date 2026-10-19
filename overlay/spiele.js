// Spiele im Overlay: Fang den Raben, Wettrennen, Tauziehen, Letzter steht, Schatzsuche und Würfel der Morrígan.
// Das Overlay entscheidet die Spiele und meldet das Ergebnis an Streamer.bot (Aktion „NWU Spiel“), das den Ruhm beim
// Worker bucht. Den Würfel wirft der Worker, das Overlay zeigt nur, was Streamer.bot im Chat meldet.
// avatare.js ruft NWU_SPIELE(K) auf und übergibt in K, was die Spiele vom Overlay brauchen.
'use strict';

window.NWU_SPIELE = function (K) {
  const { CFG, S, q, W, H, R, umfang, aufPfad, versetzt, lerp, figuren, effekt, funken, T, textur, effektEbene, figurenEbene, terrainEbene,
    karte, karteZeigen, karteFuss, karteListe, karteHalten, laufende, leuchten, huepfen, figurErzeugen, vorlageFuer, rabeBauen } = K;

  const SP = CFG.spiele || {};
  const RUHM_SP = (window.NWU_RUHM && window.NWU_RUHM.spiele) || {};
  const AKTIV = (window.NWU_AKTIVE_HAEUSER || []).map((h) => h.id);
  const HAUS = Object.fromEntries((window.NWU_HAEUSER || []).map((h) => [h.id, h]));
  const demoChat = !S.kanal;                       // ohne Chat spielen die Demo-Figuren (Taste 1/2/3) selbst mit
  const sbUrl = q.get('sb') ?? CFG.streamerbot ?? '';
  if (window.NWU_SB && sbUrl) window.NWU_SB.verbinden(sbUrl);
  let spiel = null, letzteMeldung = null;
  const spielFrei = () => !spiel && !K.duellLaeuft() && K.EV.phase === 'aus';
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
    f.modus = 'spiel'; f.lurker = false; f.zielS = f.s; f.spielBlick = 0; f.spielTempo = 200; f.spielFrei = false; f.spielEile = 0; f.letzte = K.zeit();
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
        faenger = fi; fi.letzte = K.zeit();
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
              faenger.jubelBis = K.zeit() + 3; huepfen(faenger); faenger.puls = 1;
              ueberFigur(faenger, `+${plus('rabe')} Ruhm`);
              karteFuss('✦ Der Rabe ist gefangen ✦', 5);
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
        if (!l || (sperre.get(k) || 0) > K.zeit()) return false;
        sperre.set(k, K.zeit() + 1);                              // höchstens ein Schub pro Sekunde und Person
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
            f.s = l.start + l.weg; f.richtung = 1; f.zustand = 'laufen'; f.spielEile = 1 + v / 30; f.letzte = K.zeit();
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
              .forEach((f, i) => setTimeout(() => { f.jubelBis = K.zeit() + 3; huepfen(f); }, i * 80));
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
    const zieher = [new Set(), new Set()], zuege = [0, 0], sperre = new Map();
    const DAUER = SP.tauziehenSekunden || 60;
    let phase = 'aufstellen', versatz = 0, listeZeit = 0, ende = 0;
    const liste = () => [`${HAUS[ha].kurz} ${zuege[0]}`, `${HAUS[hb].kurz} ${zuege[1]}`];
    karteZeigen(`${HAUS[ha].name} gegen ${HAUS[hb].name}`, liste(), 'Gleich geht es los …', 0, 'Tauziehen');
    karteHalten();
    const ziehen = (i, fi) => {
      zuege[i]++; if (fi) zieher[i].add(fi);
      const f = zufall(i ? B : A); f.schlagBis = K.zeit() + 0.25; f.puls = 0.4;
    };
    spiel = {
      art: 'tauziehen', t: 0,
      eingabe(fi, text) {
        if (phase !== 'ziehen' || !text.startsWith('!zieh') || fi.ungebunden) return false;
        const i = fi.vorlage.haus === ha ? 0 : fi.vorlage.haus === hb ? 1 : -1;
        const k = fi.id || fi;
        if (i < 0 || (sperre.get(k) || 0) > K.zeit()) return i >= 0;
        sperre.set(k, K.zeit() + 0.5);                        // höchstens 2 Züge pro Sekunde und Person (gegen Skripte)
        ziehen(i, fi); fi.letzte = K.zeit();
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
              (s ? B : A).forEach((f) => { f.jubelBis = K.zeit() + 3; huepfen(f); });
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
          f.spielTempo = phase === 'aufstellen' ? 220 : 90; f.letzte = K.zeit();
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
        dabei.add(fi); fi.letzte = K.zeit(); leuchten(fi);
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
          kaempfer.forEach((f) => { f.letzte = K.zeit(); });
          if (lebend.length <= 1) {
            phase = 'ende'; phaseStart = t;
            const s = lebend[0];
            if (s) {
              s.jubelBis = K.zeit() + 4; huepfen(s); s.puls = 1;
              const p = ueberKopf(s, 0.6); funken(p.x, p.y, 0xe8c96d, 24); funken(p.x, p.y, s.farbe, 12);
              ansage('DER LETZTE STEHT', 3.2);
              ueberFigur(s, `+${plus('letzter')} Ruhm`);
              karteFuss('✦ Einer steht als Letzter ✦', 7);
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
        tipps.set(fi, i); zahl[i]++; fi.letzte = K.zeit();
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
            gewinner.filter((f) => f.root && !f.entfernen).forEach((f) => { f.jubelBis = K.zeit() + 3; huepfen(f); ueberFigur(f, `+${plus('schatz')} Ruhm`); });
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
      fi.jubelBis = K.zeit() + 3; huepfen(fi); fi.puls = 1;
      funken(p.x, p.y, 0xe8c96d, 22);
      ueberFigur(fi, 'Doppelter Ruhm!');
      if (!fi.doppeltGlanz) {
        const g = new PIXI.Sprite(T.glanz);
        g.anchor.set(0.5); g.tint = 0xe8c96d; g.alpha = 0.45; g.blendMode = 'add';
        g.scale.set(S.hoehe / 34, S.hoehe / 24); g.y = -S.hoehe * 0.5;
        fi.root.addChildAt(g, 1); fi.doppeltGlanz = g;
      }
    } else if (zahl === 1) {
      abdunkeln(fi); fi.dunkelBis = K.zeit() + (SP.wurfSchattenMinuten ?? 5) * 60;
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

  return {
    schritt: spielSchritt,
    befehl: spielBefehl,
    darfStarten,
    eingabe: (fi, text, u) => !!spiel && spiel.eingabe(fi, text, u),
    laeuft: () => spiel,
    wurfNachricht, wurfZeigen, aufhellen,
    rabe: rabeStarten, rennen: rennenStarten, tauziehen: tauziehenStarten, letzter: letzterStarten, schatz: schatzStarten,
    letzteMeldung: () => letzteMeldung,
  };
};
