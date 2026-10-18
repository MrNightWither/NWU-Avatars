// Kamera und Szenen: ruhige Überblendungen, eine große Kamerafahrt bei der Verkündung.
// Die Karte ist ein großes Bild, die "Kamera" verschiebt und zoomt es per CSS-Transform.
'use strict';

(function () {
  const $ = (id) => document.getElementById(id);
  const warte = (ms) => new Promise((r) => setTimeout(r, ms));
  const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SANFT = 'cubic-bezier(.45,0,.25,1)';

  // Zeiten an einer Stelle – hier lässt sich das Tempo des ganzen Films einstellen (ms)
  const TEMPO = {
    vorspannAufklaren: 3200,   // Karte wird beim Start klar
    vorspannFlug: 4200,        // langsamer Flug zur Zitadelle
    szeneBlende: 2000,         // Überblendung zwischen zwei Gebieten
    ruckblende: 2400,          // zurück zur Karte vor der Verkündung
    titelHalten: 2600,         // "Morrígan hat entschieden" stehen lassen
    verkuendungFlug: 4600,     // Kamerafahrt zum Haus
    hausBlende: 2600,          // Überblendung ins Hausgebiet
  };
  const FRAGEN_PRO_GEBIET = 3;

  // Orte auf der Karte (Anteil der Bildbreite/-höhe) und Zoomstufe
  const ORTE = {
    vorspann:   { x: 0.5, y: 0.46, z: 1.25 },
    ueberblick: { x: 0.5, y: 0.47, z: 1.08 },   // leicht gezoomt, damit der Kartenrand nicht stört
    zitadelle:  { x: 0.5, y: 0.43, z: 1.7 },
    haus1: { x: 0.50, y: 0.16, z: 2.3 },   // Mond, oben Mitte
    haus2: { x: 0.79, y: 0.20, z: 2.3 },   // Blut, oben rechts
    haus3: { x: 0.83, y: 0.58, z: 2.3 },   // Nebel, rechts
    haus4: { x: 0.50, y: 0.82, z: 2.3 },   // Flamme, unten Mitte
    // haus5 (Dornen) und haus6 (Raben) liegen im Westen im Nebel – verlorene Häuser
  };
  // Reihenfolge der Gebiete während der Fragen (verrät nichts über das Ergebnis)
  const RUNDGANG = ['haus3', 'haus1', 'haus4', 'haus2'];
  const gebietFuerFrage = (nr) => RUNDGANG[Math.floor(nr / FRAGEN_PRO_GEBIET) % RUNDGANG.length];

  const karte = $('karte');
  // Große Karte nur für große Bildschirme, Handys bekommen die kleine (spart Speicher und Daten)
  const pixel = Math.max(screen.width, screen.height) * (window.devicePixelRatio || 1);
  karte.src = pixel > 2200 ? karte.dataset.gross : karte.dataset.klein;
  let aktuell = ORTE.vorspann, treiben = null;

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
    karte.style.transition = dauer ? `transform ${dauer}ms ${kurve || SANFT}` : 'none';
    karte.style.transform = transform(ort);
    return warte(dauer);
  }

  // Ganz langsames Schweben, solange man auf der Karte steht
  function schweben(an) {
    clearInterval(treiben);
    if (!an || ruhig) return;
    const basis = aktuell;
    let i = 0;
    const schritt = () => {
      i++;
      karte.style.transition = `transform 22000ms ease-in-out`;
      karte.style.transform = transform({ x: basis.x + Math.sin(i * 1.7) * 0.025, y: basis.y + Math.cos(i * 1.3) * 0.02, z: basis.z * 1.04 });
    };
    schritt();
    treiben = setInterval(schritt, 22000);
  }

  // ---------- Szenen (Nahaufnahmen der Gebiete) ----------
  const szenen = {};
  document.querySelectorAll('.szene').forEach((img) => { szenen[img.dataset.haus] = img; });
  let sichtbar = null;

  function szene(haus, dauer) {
    if (ruhig) dauer = Math.min(dauer, 400);
    for (const [h, img] of Object.entries(szenen)) {
      img.style.transitionDuration = dauer + 'ms';
      if (h === haus) {
        if (!img.getAttribute('src')) img.src = img.dataset.src;
        if (sichtbar !== haus) { img.classList.remove('an'); void img.offsetWidth; }   // Ken-Burns neu starten
        img.classList.add('an');
      } else {
        img.classList.remove('an');
      }
    }
    sichtbar = haus;
    return warte(dauer);
  }

  function vorladen() {
    Object.values(szenen).forEach((img) => { if (!img.getAttribute('src')) img.src = img.dataset.src; });
  }

  function abdunkeln(stufe) { document.body.dataset.dunkel = String(stufe); }
  function unterwegs(an) { document.body.classList.toggle('unterwegs', an); }
  function vorspann(an) { document.body.classList.toggle('vorspann', an); }

  // ---------- Abläufe ----------

  // Startbild: Dunkelheit und Nebel, die Karte nur als Ahnung im Hintergrund
  async function start() {
    vorspann(true);
    abdunkeln(1);
    await fahren(ORTE.vorspann, 0);
    schweben(true);
  }

  // Erste Frage: Karte klart auf, langsamer Flug zur Zitadelle, Überblendung ins erste Gebiet
  async function aufbruch() {
    schweben(false);
    unterwegs(true);
    vorladen();
    window.NWU_TON.wusch(4);
    vorspann(false);
    await fahren(ORTE.zitadelle, TEMPO.vorspannFlug);
    abdunkeln(2);
    await szene(gebietFuerFrage(0), TEMPO.szeneBlende);
    unterwegs(false);
  }

  // Jede weitere Frage: nur weiche Überblendung, und nur wenn das Gebiet wechselt
  async function frage(nr) {
    const ziel = gebietFuerFrage(nr);
    if (ziel === sichtbar) return;
    await szene(ziel, TEMPO.szeneBlende);
  }

  async function verkuenden(haus) {
    schweben(false);
    unterwegs(true);
    await fahren(ORTE.ueberblick, 0);
    abdunkeln(1);
    await szene(null, TEMPO.ruckblende);

    const zwischen = $('zwischentitel');
    zwischen.textContent = 'Morrígan hat entschieden';
    zwischen.classList.add('an');
    window.NWU_TON.donner();
    await warte(ruhig ? 800 : TEMPO.titelHalten);
    zwischen.classList.remove('an');
    await warte(900);

    window.NWU_TON.wusch(TEMPO.verkuendungFlug / 1000);
    await fahren(ORTE[haus], TEMPO.verkuendungFlug);
    document.body.classList.add('glimmen');
    window.NWU_TON.glocke();
    abdunkeln(2);
    await szene(haus, TEMPO.hausBlende);
    setTimeout(() => document.body.classList.remove('glimmen'), 2500);
    unterwegs(false);
  }

  // Direkt in einem Gebiet stehen (z. B. nach Neuladen)
  async function imGebiet(haus, dunkel) {
    schweben(false);
    vorspann(false);
    await fahren(ORTE[haus], 0);
    abdunkeln(dunkel || 2);
    await szene(haus, 0);
  }

  window.addEventListener('resize', () => fahren(aktuell, 0));
  if (!karte.complete) karte.addEventListener('load', () => fahren(aktuell, 0));

  window.NWU_FILM = { gebietFuerFrage, start, aufbruch, frage, verkuenden, imGebiet, vorladen, abdunkeln };
})();
