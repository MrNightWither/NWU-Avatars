// Meilensteinkarte: vier Pfade (Twitch, YouTube, Kick, TikTok) führen zur Zitadelle.
// Website: reise.html  ·  Stream-Szene: reise.html?szene=1
// Testen ohne Worker: reise.html?twitch=5200&youtube=900&kick=13000&tiktok=2500
'use strict';

(function () {
  const REISE = window.NWU_REISE, standVon = window.NWU_REISE_STAND, SEITE = window.NWU_SEITE || {};
  const $ = (id) => document.getElementById(id);
  const q = new URLSearchParams(location.search);
  const szene = q.get('szene') === '1';
  const api = (q.get('api') || SEITE.api || '').replace(/\/$/, '');
  const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const KUERZEL = { twitch: 'T', youtube: 'Y', kick: 'K', tiktok: '♪' };
  const DEMO = { twitch: 5200, youtube: 2100, kick: 9400, tiktok: 600 };
  if (szene) document.body.classList.add('szene');

  const welt = $('welt'), karte = $('karte'), svg = $('pfad');
  const zahl = (n) => n.toLocaleString('de-DE');
  const warte = (ms) => new Promise((r) => setTimeout(r, ruhig ? 0 : ms));
  let iw = 1408, ih = 768, kamera = { x: 0.5, y: 0.5, z: 1 };
  const P = {};                       // je Pfad: Segmente, Orte, Marker, letzter Index, Position
  let zitadelle = null, zitadelleWarOffen = null;

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
  const px = (o) => ({ x: o.x * iw, y: o.y * ih });

  function kurve(punkte, i) {      // Catmull-Rom-Segment i → i+1 als Bézier
    const p0 = punkte[i - 1] || punkte[i], p1 = punkte[i], p2 = punkte[i + 1], p3 = punkte[i + 2] || punkte[i + 1];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    return `M${p1.x},${p1.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`;
  }

  function aufbauen() {
    svg.setAttribute('width', iw); svg.setAttribute('height', ih); svg.setAttribute('viewBox', `0 0 ${iw} ${ih}`);
    const ebeneWeg = el('g', {}), ebeneFertig = el('g', {}), ebeneOrte = el('g', {}), ebeneMarker = el('g', {});
    const zp = px(REISE.zitadelle.ort);

    for (const pfad of REISE.pfade) {
      const punkte = [...pfad.meilensteine.map((m) => px(m.ort)), zp];
      const segmente = [];
      for (let i = 0; i + 1 < punkte.length; i++) {
        const d = kurve(punkte, i);
        el('path', { d, class: 'weg', stroke: pfad.farbe }, ebeneWeg);
        const fertig = el('path', { d, class: 'weg-fertig', stroke: pfad.farbe }, ebeneFertig);
        fertig.style.color = pfad.farbe;              // für das Leuchten (currentColor)
        const laenge = fertig.getTotalLength();
        fertig.style.strokeDasharray = `${laenge} ${laenge}`;
        fertig.style.strokeDashoffset = laenge;
        segmente.push({ pfad: fertig, laenge });
      }
      const orte = pfad.meilensteine.map((m, i) => {
        const g = el('g', { class: 'ort zukunft' }, ebeneOrte);
        g.style.setProperty('--farbe', pfad.farbe);
        el('circle', { cx: punkte[i].x, cy: punkte[i].y, r: 6 }, g);
        const t = el('text', { x: punkte[i].x, y: punkte[i].y + 22 }, g);
        t.textContent = m.name;
        return g;
      });
      const marker = el('g', { class: 'marker' }, ebeneMarker);
      el('circle', { r: 13, fill: pfad.farbe, class: 'marker-glanz' }, marker);
      el('circle', { r: 10, fill: '#0b0b0e', stroke: pfad.farbe, 'stroke-width': 3 }, marker);
      const kt = el('text', { class: 'marker-text', fill: pfad.farbe, y: 4.5 }, marker);
      kt.textContent = KUERZEL[pfad.id];
      P[pfad.id] = { pfad, segmente, orte, marker, letzterIndex: null, pos: { x: 0.5, y: 0.5 } };
    }

    zitadelle = el('g', { class: 'zitadelle' }, ebeneOrte);
    el('circle', { cx: zp.x, cy: zp.y, r: 14 }, zitadelle);
    const zt = el('text', { x: zp.x, y: zp.y + 34 }, zitadelle);
    zt.textContent = REISE.zitadelle.name;
  }

  // ---------- Tafel ----------
  function tafelBauen() {
    const liste = $('pfade');
    liste.replaceChildren(...REISE.pfade.map((pfad) => {
      const z = document.createElement('div');
      z.className = 'zeile'; z.style.setProperty('--farbe', pfad.farbe);
      z.innerHTML = '<div class="z-kopf"><b></b><span class="z-ziel"></span></div>'
        + '<div class="balken"><span></span></div><div class="z-zahlen"></div>';
      z.querySelector('b').textContent = pfad.plattform;
      P[pfad.id].zeile = z;
      return z;
    }));
  }

  // ---------- Stand anzeigen ----------
  function zeigen(werte, mitFeier) {
    const feiern = [];
    let alleDa = true;
    for (const pfad of REISE.pfade) {
      const p = P[pfad.id], st = standVon(werte[pfad.id] || 0, pfad.id);
      alleDa = alleDa && st.angekommen;
      // Segmente: zwischen Meilensteinen, das letzte führt vom letzten Meilenstein zur Zitadelle
      p.segmente.forEach((s, i) => {
        const anteil = st.angekommen || i < st.index ? 1 : i === st.index ? st.anteil : 0;
        s.pfad.style.transition = ruhig ? 'none' : 'stroke-dashoffset 2s ease';
        s.pfad.style.strokeDashoffset = s.laenge * (1 - anteil);
      });
      p.orte.forEach((g, i) => g.setAttribute('class', 'ort ' + (i <= st.index ? 'erreicht' : i === st.index + 1 ? 'naechster' : 'zukunft')));

      let pos;
      if (!st.angekommen && p.segmente[st.index]) { const s = p.segmente[st.index]; pos = s.pfad.getPointAtLength(s.laenge * st.anteil); }
      else pos = px(st.erreicht.ort);
      p.marker.setAttribute('transform', `translate(${pos.x} ${pos.y})`);
      p.pos = { x: pos.x / iw, y: pos.y / ih };

      const z = p.zeile;
      z.querySelector('.z-ziel').textContent = st.angekommen ? 'angekommen' : '→ ' + st.naechster.name;
      z.querySelector('.balken span').style.width = (st.anteil * 100).toFixed(1) + '%';
      z.querySelector('.z-zahlen').textContent = st.angekommen
        ? `${zahl(st.essenz)} Essenz`
        : `${zahl(st.essenz)} / ${zahl(st.naechster.essenz)} Essenz`;

      if (mitFeier && p.letzterIndex !== null && st.index > p.letzterIndex) feiern.push(`${pfad.plattform}: ${st.erreicht.name}`);
      p.letzterIndex = st.index;
    }
    zitadelle.setAttribute('class', 'zitadelle' + (alleDa ? ' offen' : ''));
    $('t-zitadelle').textContent = alleDa ? 'Die Tore der Zitadelle sind offen!' : REISE.zitadelle.text;
    if (mitFeier && zitadelleWarOffen === false && alleDa) feiern.push('Die Zitadelle ist offen!');
    zitadelleWarOffen = alleDa;
    if (feiern.length) feier(feiern[feiern.length - 1]);
  }

  function feier(text) {
    $('feier-name').textContent = text;
    $('feier').classList.add('an');
    setTimeout(() => $('feier').classList.remove('an'), 7000);
  }

  // ---------- Daten ----------
  async function werteHolen() {
    const ids = REISE.pfade.map((p) => p.id);
    if (ids.some((id) => q.has(id))) return Object.fromEntries(ids.map((id) => [id, Math.max(0, Number(q.get(id)) || 0)]));
    if (!api) return DEMO;
    try {
      const d = await (await fetch(api + '/reise', { credentials: 'omit', cache: 'no-store' })).json();
      return Object.fromEntries(ids.map((id) => [id, (d.pfade[id] || {}).essenz || 0]));
    } catch (e) { return null; }
  }

  // ---------- Ablauf ----------
  async function start() {
    iw = karte.naturalWidth || iw; ih = karte.naturalHeight || ih;
    karte.width = iw; karte.height = ih;
    aufbauen(); tafelBauen();
    await fahren({ x: 0.5, y: 0.47, z: 1.02 }, 0);
    let werte = (await werteHolen()) || DEMO;
    zeigen(werte, false);

    if (szene) {
      // Stream: Überblick, dann jeden Pfad an seiner aktuellen Stelle zeigen
      const schleife = async () => {
        for (const pfad of REISE.pfade) {
          const p = P[pfad.id];
          document.body.dataset.fokus = pfad.id;
          await fahren({ ...p.pos, z: 2 }, 3800);
          await warte(7000);
        }
        document.body.dataset.fokus = '';
        await fahren({ x: 0.5, y: 0.47, z: 1.02 }, 3800);
        await warte(9000);
        schleife();
      };
      setTimeout(schleife, 4000);
      if (q.get('feier') === '1') setTimeout(() => feier('Twitch: ' + standVon(werte.twitch, 'twitch').erreicht.name), 1500);
    }

    setInterval(async () => {
      const neu = await werteHolen();
      if (!neu || JSON.stringify(neu) === JSON.stringify(werte)) return;
      werte = neu;
      zeigen(werte, szene);
    }, 30000);
  }

  karte.addEventListener('load', start, { once: true });
  karte.src = REISE.karte;
})();
