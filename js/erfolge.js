// Erfolgskarte: zwei Wege (Follower, Unterstützer), jede Plattform läuft als eigener Marker.
// Website: erfolge.html  ·  Stream-Szene: erfolge.html?szene=1
// Testen ohne Worker: erfolge.html?f_twitch=640&f_tiktok=3200&u_twitch=13
'use strict';

(function () {
  const E = window.NWU_ERFOLGE, standVon = window.NWU_ERFOLG_STAND, SEITE = window.NWU_SEITE || {};
  const $ = (id) => document.getElementById(id);
  const q = new URLSearchParams(location.search);
  const szene = q.get('szene') === '1';
  const api = (q.get('api') || SEITE.api || '').replace(/\/$/, '');
  const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const KURZ = { follower: 'f', unterstuetzer: 'u' };
  // Stand vom 18.10.2026 – wird angezeigt, solange kein Worker eingetragen ist
  const DEMO = { follower: { twitch: 91, youtube: 16, kick: 2, tiktok: 782 }, unterstuetzer: { twitch: 0, youtube: 0, kick: 0 } };
  if (szene) document.body.classList.add('szene');

  const welt = $('welt'), karte = $('karte'), svg = $('pfad');
  const zahl = (n) => n.toLocaleString('de-DE');
  const warte = (ms) => new Promise((r) => setTimeout(r, ruhig ? 0 : ms));
  const plattform = (id) => E.plattformen.find((p) => p.id === id);
  let iw = 1408, ih = 768, kamera = { x: 0.5, y: 0.5, z: 1 };
  const W = {};            // je Weg: Segmente, Stufen-Elemente, Marker, Mitte
  const letzte = {};       // für die Feier: letzter Index je Weg+Plattform

  // ---------- Kamera ----------
  function transform(k) {
    const B = window.innerWidth, H = window.innerHeight;
    const s = Math.max(B / iw, H / ih) * k.z;
    let tx = B / 2 - k.x * iw * s, ty = H / 2 - k.y * ih * s;
    tx = Math.min(0, Math.max(B - iw * s, tx));
    ty = Math.min(0, Math.max(H - ih * s, ty));
    return `translate3d(${tx}px, ${ty}px, 0) scale(${s})`;
  }
  function fahren(k, ms) {
    kamera = k;
    welt.style.transition = ruhig || !ms ? 'none' : `transform ${ms}ms cubic-bezier(.45,0,.25,1)`;
    welt.style.transform = transform(k);
    return warte(ms || 0);
  }
  window.addEventListener('resize', () => fahren(kamera, 0));

  // ---------- Zeichnen ----------
  function el(name, attrs, eltern) {
    const e = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    (eltern || svg).appendChild(e);
    return e;
  }
  function kurve(p, i) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p[i + 1];
    return `M${p1.x},${p1.y} C${p1.x + (p2.x - p0.x) / 6},${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6},${p2.y - (p3.y - p1.y) / 6} ${p2.x},${p2.y}`;
  }

  function aufbauen() {
    svg.setAttribute('width', iw); svg.setAttribute('height', ih); svg.setAttribute('viewBox', `0 0 ${iw} ${ih}`);
    const ebeneLinie = el('g', {}), ebeneStufen = el('g', {}), ebeneMarker = el('g', {});
    for (const weg of E.wege) {
      const punkte = weg.stufen.map((s) => ({ x: s.ort.x * iw, y: s.ort.y * ih }));
      // Startpunkt vor der ersten Stufe (für Werte unter der ersten Schwelle)
      const start = { x: punkte[0].x - (punkte[1].x - punkte[0].x) * 0.6, y: punkte[0].y - (punkte[1].y - punkte[0].y) * 0.6 };
      const alle = [start, ...punkte];
      const segmente = [];
      for (let i = 0; i + 1 < alle.length; i++) {
        const p = el('path', { d: kurve(alle, i), class: 'weg-linie', stroke: weg.farbe }, ebeneLinie);
        segmente.push({ pfad: p, laenge: p.getTotalLength() });
      }
      const stufen = weg.stufen.map((s, i) => {
        const g = el('g', { class: 'stufe' }, ebeneStufen);
        g.style.setProperty('--wegfarbe', weg.farbe);
        el('circle', { cx: punkte[i].x, cy: punkte[i].y, r: 7 }, g);
        el('text', { x: punkte[i].x, y: punkte[i].y - 13, class: 'wert' }, g).textContent = zahl(s.wert);
        el('text', { x: punkte[i].x, y: punkte[i].y + 21, class: 'titel' }, g).textContent = s.name;
        return g;
      });
      const mitte = punkte.reduce((a, p) => ({ x: a.x + p.x / punkte.length, y: a.y + p.y / punkte.length }), { x: 0, y: 0 });
      const marker = {};
      weg.plattformen.forEach((pid) => {
        const pl = plattform(pid);
        const m = el('g', { class: 'marker' }, ebeneMarker);
        el('circle', { r: 12, fill: pl.farbe, class: 'marker-glanz' }, m);
        el('circle', { r: 9, fill: '#0b0b0e', stroke: pl.farbe, 'stroke-width': 3 }, m);
        el('text', { class: 'marker-text', fill: pl.farbe, y: 4.5 }, m).textContent = pl.kuerzel;
        marker[pid] = m;
      });
      W[weg.id] = { weg, segmente, stufen, marker, mitte: { x: mitte.x / iw, y: mitte.y / ih } };
    }
  }

  function tafelBauen() {
    $('wege').replaceChildren(...E.wege.map((weg) => {
      const block = document.createElement('div');
      block.className = 'weg-block'; block.style.setProperty('--wegfarbe', weg.farbe);
      const h = document.createElement('h3'); h.textContent = weg.name; block.append(h);
      W[weg.id].zeilen = {};
      for (const pid of weg.plattformen) {
        const pl = plattform(pid);
        const z = document.createElement('div');
        z.className = 'e-zeile'; z.style.setProperty('--farbe', pl.farbe);
        z.innerHTML = '<b></b><span class="e-zahl"></span><div class="balken"><span></span></div><span class="e-ziel"></span>';
        z.querySelector('b').textContent = pl.name;
        block.append(z);
        W[weg.id].zeilen[pid] = z;
      }
      return block;
    }));
  }

  // ---------- Stand ----------
  function zeigen(daten, mitFeier) {
    let feier = null;
    for (const weg of E.wege) {
      const w = W[weg.id];
      let weitester = -1;
      weg.plattformen.forEach((pid, nr) => {
        const st = standVon(weg.id, (daten[weg.id] || {})[pid] || 0);
        weitester = Math.max(weitester, st.index);
        // Position: Segment (index + 1), damit Werte unter der 1. Stufe vor ihr stehen
        const seg = w.segmente[Math.min(st.index + 1, w.segmente.length - 1)];
        const pos = st.fertig ? seg.pfad.getPointAtLength(seg.laenge) : seg.pfad.getPointAtLength(seg.laenge * st.anteil);
        const versatz = (nr - (weg.plattformen.length - 1) / 2) * 9;      // Marker nicht übereinander
        w.marker[pid].setAttribute('transform', `translate(${pos.x + versatz} ${pos.y - Math.abs(versatz) * 0.4})`);

        const z = w.zeilen[pid];
        z.querySelector('.e-zahl').textContent = `${zahl(st.wert)} ${weg.einheit}`;
        z.querySelector('.balken span').style.width = (st.anteil * 100).toFixed(1) + '%';
        z.querySelector('.e-ziel').textContent = st.fertig ? 'Ziel erreicht!' : `nächstes Ziel: ${zahl(st.naechste.wert)} · ${st.naechste.name}`;

        const schl = weg.id + ':' + pid;
        if (mitFeier && letzte[schl] !== undefined && st.index > letzte[schl]) feier = { klein: `${plattform(pid).name} · ${zahl(st.erreicht.wert)} ${weg.einheit}`, name: st.erreicht.name };
        letzte[schl] = st.index;
      });
      w.stufen.forEach((g, i) => g.setAttribute('class', 'stufe' + (i <= weitester ? ' erreicht' : '')));
    }
    if (feier) feiern(feier);
  }

  function feiern(f) {
    $('feier-klein').textContent = f.klein;
    $('feier-name').textContent = f.name;
    $('feier').classList.add('an');
    setTimeout(() => $('feier').classList.remove('an'), 7000);
  }

  // ---------- Daten ----------
  async function holen() {
    const test = [...q.keys()].some((k) => /^[fu]_/.test(k));
    if (test) {
      const d = {};
      for (const weg of E.wege) { d[weg.id] = {}; for (const p of weg.plattformen) d[weg.id][p] = Number(q.get(KURZ[weg.id] + '_' + p)) || 0; }
      return d;
    }
    if (!api) return DEMO;
    try { return await (await fetch(api + '/erfolge', { credentials: 'omit', cache: 'no-store' })).json(); }
    catch (e) { return null; }
  }

  async function start() {
    iw = karte.naturalWidth || iw; ih = karte.naturalHeight || ih;
    karte.width = iw; karte.height = ih;
    aufbauen(); tafelBauen();
    await fahren({ x: 0.5, y: 0.47, z: 1.02 }, 0);
    let daten = (await holen()) || DEMO;
    zeigen(daten, false);

    if (szene) {
      const schleife = async () => {
        for (const weg of E.wege) {
          document.body.dataset.fokus = weg.id;
          await fahren({ ...W[weg.id].mitte, z: 1.6 }, 3800);
          await warte(10000);
        }
        document.body.dataset.fokus = '';
        await fahren({ x: 0.5, y: 0.47, z: 1.02 }, 3800);
        await warte(8000);
        schleife();
      };
      setTimeout(schleife, 3000);
      if (q.get('feier') === '1') setTimeout(() => feiern({ klein: 'Twitch · 500 Follower', name: 'Der Wachturm' }), 1500);
    }

    setInterval(async () => {
      const neu = await holen();
      if (!neu || JSON.stringify(neu) === JSON.stringify(daten)) return;
      daten = neu;
      zeigen(daten, szene);
    }, 30000);
  }

  karte.addEventListener('load', start, { once: true });
  karte.src = E.karte;
})();
