// Meilensteinkarte: Pfad über die Karte, Krone an der aktuellen Stelle, Kamera folgt.
// Website: reise.html  ·  Stream-Szene: reise.html?szene=1  ·  Test: ?essenz=5200
'use strict';

(function () {
  const REISE = window.NWU_REISE, standVon = window.NWU_REISE_STAND, SEITE = window.NWU_SEITE || {};
  const $ = (id) => document.getElementById(id);
  const q = new URLSearchParams(location.search);
  const szene = q.get('szene') === '1';
  const api = (q.get('api') || SEITE.api || '').replace(/\/$/, '');
  const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  if (szene) document.body.classList.add('szene');

  const welt = $('welt'), karte = $('karte'), svg = $('pfad'), krone = $('krone');
  const zahl = (n) => n.toLocaleString('de-DE');
  let iw = 1408, ih = 768, segmente = [], orte = [], kamera = { x: 0.5, y: 0.5, z: 1 }, letzterIndex = null;

  // ---------- Kamera ----------
  function transform(k) {
    const W = window.innerWidth, H = window.innerHeight;
    const s = Math.max(W / iw, H / ih) * k.z;
    let tx = W / 2 - k.x * iw * s, ty = H / 2 - k.y * ih * s;
    tx = Math.min(0, Math.max(W - iw * s, tx));
    ty = Math.min(0, Math.max(H - ih * s, ty));
    return `translate3d(${tx}px, ${ty}px, 0) scale(${s})`;
  }
  function fahren(k, ms) {
    kamera = k;
    welt.style.transition = ruhig || !ms ? 'none' : `transform ${ms}ms cubic-bezier(.45,0,.25,1)`;
    welt.style.transform = transform(k);
    return new Promise((r) => setTimeout(r, ruhig ? 0 : ms));
  }
  window.addEventListener('resize', () => fahren(kamera, 0));

  // ---------- Pfad zeichnen (weiche Kurve durch alle Orte) ----------
  function el(name, attrs, eltern) {
    const e = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    (eltern || svg).appendChild(e);
    return e;
  }
  function aufbauen() {
    svg.setAttribute('width', iw); svg.setAttribute('height', ih); svg.setAttribute('viewBox', `0 0 ${iw} ${ih}`);
    const P = REISE.meilensteine.map((m) => ({ x: m.ort.x * iw, y: m.ort.y * ih }));
    const ebeneWeg = el('g', {}), ebeneFertig = el('g', {}), ebeneOrte = el('g', {});
    segmente = [];
    for (let i = 0; i + 1 < P.length; i++) {
      // Catmull-Rom → Bézier
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || P[i + 1];
      const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
      const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
      const d = `M${p1.x},${p1.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`;
      el('path', { d, class: 'weg' }, ebeneWeg);
      const fertig = el('path', { d, class: 'weg-fertig' }, ebeneFertig);
      const laenge = fertig.getTotalLength();
      fertig.style.strokeDasharray = `${laenge} ${laenge}`;
      fertig.style.strokeDashoffset = laenge;
      segmente.push({ pfad: fertig, laenge });
    }
    orte = REISE.meilensteine.map((m, i) => {
      const g = el('g', { class: 'ort zukunft' }, ebeneOrte);
      el('circle', { cx: P[i].x, cy: P[i].y, r: 7 }, g);
      const t = el('text', { x: P[i].x, y: P[i].y + 26 }, g);
      t.textContent = m.name;
      return g;
    });
  }

  // ---------- Stand anzeigen ----------
  function zeigen(essenz, mitFeier) {
    const st = standVon(essenz);
    segmente.forEach((s, i) => {
      const anteil = i < st.index ? 1 : i === st.index ? st.anteil : 0;
      s.pfad.style.transition = ruhig ? 'none' : 'stroke-dashoffset 2s ease';
      s.pfad.style.strokeDashoffset = s.laenge * (1 - anteil);
    });
    orte.forEach((g, i) => g.setAttribute('class', 'ort ' + (i <= st.index ? 'erreicht' : i === st.index + 1 ? 'naechster' : 'zukunft')));

    // Krone auf dem Pfad
    let pos;
    if (st.naechster && segmente[st.index]) {
      const s = segmente[st.index];
      pos = s.pfad.getPointAtLength(s.laenge * st.anteil);
    } else {
      const m = st.erreicht.ort; pos = { x: m.x * iw, y: m.y * ih };
    }
    krone.style.left = pos.x + 'px'; krone.style.top = pos.y + 'px';

    $('t-erreicht').textContent = `Erreicht: ${st.erreicht.name}`;
    if (st.naechster) {
      $('t-ziel').textContent = st.naechster.name;
      $('t-text').textContent = st.naechster.text;
      const fehlt = st.naechster.essenz - essenz;
      $('t-zahlen').textContent = `${zahl(essenz)} / ${zahl(st.naechster.essenz)} Schatten-Essenz · noch ${zahl(fehlt)}`;
    } else {
      $('t-ziel').textContent = 'Die Reise ist vollbracht';
      $('t-text').textContent = st.erreicht.text;
      $('t-zahlen').textContent = `${zahl(essenz)} Schatten-Essenz`;
    }
    $('fuellung').style.width = (st.anteil * 100).toFixed(1) + '%';
    $('balken').setAttribute('aria-valuenow', Math.round(st.anteil * 100));

    if (mitFeier && letzterIndex !== null && st.index > letzterIndex) feiern(st.erreicht.name);
    letzterIndex = st.index;
    return { x: pos.x / iw, y: pos.y / ih };
  }

  function feiern(name) {
    $('feier-name').textContent = name;
    $('feier').classList.add('an');
    setTimeout(() => $('feier').classList.remove('an'), 7000);
  }

  // ---------- Daten ----------
  async function essenzHolen() {
    if (q.has('essenz')) return Math.max(0, Number(q.get('essenz')) || 0);
    if (!api) return 3200;                          // Demo-Wert, solange kein Worker eingetragen ist
    try { const r = await fetch(api + '/reise', { credentials: 'omit', cache: 'no-store' }); return (await r.json()).essenz || 0; }
    catch (e) { return null; }
  }

  // ---------- Ablauf ----------
  async function start() {
    iw = karte.naturalWidth || iw; ih = karte.naturalHeight || ih;
    karte.width = iw; karte.height = ih;
    aufbauen();
    await fahren({ x: 0.5, y: 0.5, z: 1.02 }, 0);
    let essenz = await essenzHolen();
    let ziel = zeigen(essenz || 0, false);

    if (!szene) {
      // Website: ruhig zur aktuellen Stelle schweben
      await new Promise((r) => setTimeout(r, 900));
      fahren({ ...ziel, z: 1.6 }, 3500);
    } else {
      // Stream-Szene: Überblick ↔ aktuelle Stelle im Wechsel
      const schleife = async () => {
        await fahren({ ...ziel, z: 2.1 }, 4500);
        await new Promise((r) => setTimeout(r, 14000));
        await fahren({ x: 0.5, y: 0.5, z: 1.02 }, 4500);
        await new Promise((r) => setTimeout(r, 6000));
        schleife();
      };
      setTimeout(schleife, 2500);
      if (q.get('feier') === '1') setTimeout(() => feiern(standVon(essenz || 0).erreicht.name), 1500);
    }

    // Regelmäßig nachfragen, ob neue Essenz dazugekommen ist
    setInterval(async () => {
      const neu = await essenzHolen();
      if (neu === null || neu === essenz) return;
      essenz = neu;
      ziel = zeigen(essenz, szene);
    }, 30000);
  }

  karte.addEventListener('load', start, { once: true });
  karte.src = REISE.karte;
})();
