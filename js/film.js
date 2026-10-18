// Kamera und Szenen: Flug über die Karte, Eintauchen in die Gebiete.
// Die Karte ist ein großes Bild, die "Kamera" verschiebt und zoomt es per CSS-Transform.
'use strict';

(function () {
  const $ = (id) => document.getElementById(id);
  const warte = (ms) => new Promise((r) => setTimeout(r, ms));
  const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Orte auf der Karte (Anteil der Bildbreite/-höhe) und Zoomstufe
  const ORTE = {
    ueberblick: { x: 0.5, y: 0.47, z: 1.0 },
    zitadelle:  { x: 0.5, y: 0.43, z: 1.9 },
    haus1: { x: 0.50, y: 0.16, z: 2.5 },   // Mond, oben Mitte
    haus2: { x: 0.79, y: 0.20, z: 2.5 },   // Blut, oben rechts
    haus3: { x: 0.83, y: 0.58, z: 2.5 },   // Nebel, rechts
    haus4: { x: 0.50, y: 0.82, z: 2.5 },   // Flamme, unten Mitte
    haus5: { x: 0.15, y: 0.76, z: 2.5 },   // Dornen, unten links
    haus6: { x: 0.16, y: 0.22, z: 2.5 },   // Raben, oben links
  };
  // Reihenfolge der Gebiete während der Fragen (verrät nichts über das Ergebnis)
  const RUNDGANG = ['haus3', 'haus1', 'haus4', 'haus6', 'haus2', 'haus5'];

  const kamera = $('kamera'), karte = $('karte');
  let aktuell = ORTE.ueberblick, treiben = null;

  function transform(ort) {
    const W = window.innerWidth, H = window.innerHeight;
    const iw = karte.naturalWidth || 1408, ih = karte.naturalHeight || 768;
    const s = Math.max(W / iw, H / ih) * ort.z;
    let tx = W / 2 - ort.x * iw * s, ty = H / 2 - ort.y * ih * s;
    tx = Math.min(0, Math.max(W - iw * s, tx));   // nie über den Kartenrand hinaus
    ty = Math.min(0, Math.max(H - ih * s, ty));
    return `translate3d(${tx}px, ${ty}px, 0) scale(${s})`;
  }

  function fahren(ort, dauer, kurve) {
    aktuell = ort;
    if (ruhig) dauer = 0;
    karte.style.transition = dauer ? `transform ${dauer}ms ${kurve || 'cubic-bezier(.65,0,.35,1)'}` : 'none';
    karte.style.transform = transform(ort);
    return warte(dauer);
  }

  // Langsames Schweben über der Karte, solange nichts passiert
  function schweben(an) {
    clearInterval(treiben);
    if (!an || ruhig) return;
    const basis = aktuell;
    let i = 0;
    const schritt = () => {
      i++;
      fahren({ x: basis.x + Math.sin(i * 1.7) * 0.04, y: basis.y + Math.cos(i * 1.3) * 0.03, z: basis.z * 1.06 }, 14000, 'ease-in-out');
      aktuell = basis;
    };
    schritt();
    treiben = setInterval(schritt, 14000);
  }

  // ---------- Szenen (Nahaufnahmen der Gebiete) ----------
  const szenen = {};
  document.querySelectorAll('.szene').forEach((img) => { szenen[img.dataset.haus] = img; });
  let sichtbar = null;

  function szene(haus, dauer) {
    if (ruhig) dauer = 0;
    for (const [h, img] of Object.entries(szenen)) {
      img.style.transitionDuration = (dauer == null ? 900 : dauer) + 'ms';
      if (h === haus) {
        if (!img.getAttribute('src')) img.src = img.dataset.src;
        if (sichtbar !== haus) { img.classList.remove('an'); void img.offsetWidth; }   // Ken-Burns neu starten
        img.classList.add('an');
      } else {
        img.classList.remove('an');
      }
    }
    sichtbar = haus;
    return warte(dauer == null ? 900 : dauer);
  }

  function vorladen() {
    Object.values(szenen).forEach((img) => { if (!img.getAttribute('src')) img.src = img.dataset.src; });
  }

  function abdunkeln(stufe) { document.body.dataset.dunkel = String(stufe); }
  function unterwegs(an) { document.body.classList.toggle('unterwegs', an); }

  // ---------- Abläufe ----------
  async function start() {
    await fahren(ORTE.ueberblick, 0);
    abdunkeln(1);
    schweben(true);
  }

  async function frage(nr) {
    const ziel = RUNDGANG[nr % RUNDGANG.length];
    schweben(false);
    unterwegs(true);
    window.NWU_TON.wusch(1.3);
    if (sichtbar) {
      await fahren(ORTE[sichtbar], 0);
      await szene(null, 450);
    } else {
      await fahren(ORTE.zitadelle, 900);
    }
    await fahren(ORTE[ziel], 950);
    abdunkeln(2);
    szene(ziel, 650);
    await warte(300);
    unterwegs(false);
  }

  async function verkuenden(haus) {
    schweben(false);
    unterwegs(true);
    if (sichtbar) { await fahren(ORTE[sichtbar], 0); }
    window.NWU_TON.wusch(2);
    szene(null, 600);
    await fahren(ORTE.ueberblick, 1700);
    abdunkeln(1);
    const zwischen = $('zwischentitel');
    zwischen.textContent = 'Morrígan hat entschieden';
    zwischen.classList.add('an');
    window.NWU_TON.donner();
    await warte(ruhig ? 600 : 1800);
    zwischen.classList.remove('an');
    window.NWU_TON.wusch(2.2);
    await fahren(ORTE[haus], 2100, 'cubic-bezier(.7,0,.2,1)');
    document.body.classList.add('blitz');
    window.NWU_TON.glocke();
    abdunkeln(2);
    await szene(haus, 300);
    setTimeout(() => document.body.classList.remove('blitz'), 900);
    unterwegs(false);
  }

  // Direkt in einem Gebiet stehen (z. B. nach Neuladen)
  async function imGebiet(haus, dunkel) {
    schweben(false);
    await fahren(ORTE[haus], 0);
    abdunkeln(dunkel || 2);
    await szene(haus, 0);
  }

  window.addEventListener('resize', () => fahren(aktuell, 0));
  if (!karte.complete) karte.addEventListener('load', () => fahren(aktuell, 0));

  window.NWU_FILM = { gebietFuerFrage: (nr) => RUNDGANG[nr % RUNDGANG.length], start, frage, verkuenden, imGebiet, vorladen, abdunkeln };
})();
