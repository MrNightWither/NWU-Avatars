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
    nebelWarten: 1800,         // so lange liegt beim Start alles im Nebel
    nebelZiehen: 9000,         // Nebel zieht sich vom Mond im Uhrzeigersinn bis zur Flamme zurück
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

  const karte = $('karte'), welt = $('weltbild');
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
    welt.style.transition = dauer ? `transform ${dauer}ms ${kurve || SANFT}` : 'none';
    welt.style.transform = transform(ort);
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
      welt.style.transition = `transform 22000ms ease-in-out`;
      welt.style.transform = transform({ x: basis.x + Math.sin(i * 1.7) * 0.025, y: basis.y + Math.cos(i * 1.3) * 0.02, z: basis.z * 1.04 });
    };
    schritt();
    treiben = setInterval(schritt, 22000);
  }

  // ---------- Nebel über der Karte ----------
  // Beim Start liegt alles im Nebel außer der Zitadelle. Dann zieht er sich vom Mondland (oben)
  // im Uhrzeigersinn über Blut und Nebel bis zur Flamme (unten) zurück. Der Westen mit den
  // verlorenen Häusern (Dornen, Raben) bleibt im Nebel.
  const nebel = (() => {
    const leinwand = $('kartennebel'), ctx = leinwand.getContext('2d');
    const B = 640, MITTE = { x: 0.5, y: 0.47 };
    const VON = -Math.PI / 2 - 0.42, BIS = Math.PI / 2 + 0.42;     // etwas links von oben bis etwas links von unten
    let HH = 349, wolken = null, frei = 0, letzt = 0, zug = null;
    const konisch = typeof ctx.createConicGradient === 'function';

    function wolkenMalen() {
      HH = Math.round(B * (karte.naturalHeight || 768) / (karte.naturalWidth || 1408));
      leinwand.width = B; leinwand.height = HH;
      wolken = document.createElement('canvas');
      wolken.width = B * 2; wolken.height = HH;                     // doppelt breit, damit er ziehen kann
      const w = wolken.getContext('2d');
      let saat = 11;
      const zufall = () => { saat = (saat * 16807) % 2147483647; return saat / 2147483647; };
      w.fillStyle = 'rgba(22,23,30,0.70)'; w.fillRect(0, 0, B * 2, HH);
      for (let i = 0; i < 180; i++) {
        const x = zufall() * B * 2, y = zufall() * HH, r = 30 + zufall() * 90, hell = 135 + zufall() * 60;
        const g = w.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${hell},${hell},${hell + 12},${0.12 + zufall() * 0.14})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        w.fillStyle = g; w.fillRect(x - r, y - r, r * 2, r * 2);
      }
    }

    function zeichnen(t) {
      if (!wolken) wolkenMalen();
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, B, HH);
      const versatz = (t / 1000 * 4) % B;                            // langsames Ziehen nach rechts
      ctx.drawImage(wolken, -B + versatz, 0); ctx.drawImage(wolken, versatz, 0);

      ctx.globalCompositeOperation = 'destination-out';
      const mx = MITTE.x * B, my = MITTE.y * HH;
      // Zitadelle ist immer frei
      const kreis = ctx.createRadialGradient(mx, my, B * 0.05, mx, my, B * 0.15);
      kreis.addColorStop(0, 'rgba(0,0,0,1)'); kreis.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = kreis; ctx.fillRect(0, 0, B, HH);
      // Der freie Bogen um die Zitadelle
      if (frei > 0) {
        if (konisch) {
          const voll = (BIS - VON) / (Math.PI * 2), kante = 0.035;
          const stand = voll * frei;
          const g = ctx.createConicGradient(VON, mx, my);
          g.addColorStop(0, 'rgba(0,0,0,0)');
          g.addColorStop(Math.min(kante, stand), 'rgba(0,0,0,1)');
          g.addColorStop(Math.max(Math.min(kante, stand), stand - 0.001), 'rgba(0,0,0,1)');
          g.addColorStop(Math.min(1, stand + kante), 'rgba(0,0,0,0)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g; ctx.fillRect(0, 0, B, HH);
        } else {
          // ältere Browser: rechte Hälfte einfach weich aufhellen
          const g = ctx.createLinearGradient(B * 0.36, 0, B * 0.48, 0);
          g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${frei})`);
          ctx.fillStyle = g; ctx.fillRect(0, 0, B, HH);
        }
      }
    }

    function schleife(t) {
      requestAnimationFrame(schleife);
      if (t - letzt < 50) return;                                   // 20 Bilder pro Sekunde reichen für Nebel
      letzt = t;
      if (zug) {
        const u = Math.min(1, (t - zug.start) / zug.dauer);
        frei = u < 0 ? 0 : u * u * (3 - 2 * u);
        if (u >= 1) zug = null;
      }
      zeichnen(ruhig ? 0 : t);
    }
    requestAnimationFrame(schleife);
    if (!karte.complete) karte.addEventListener('load', () => { wolken = null; });

    return {
      voll() { zug = null; frei = 0; },
      zurueckziehen(warten) {
        if (ruhig) { frei = 1; return; }
        zug = { start: performance.now() + (warten || 0), dauer: TEMPO.nebelZiehen };
      },
      fertig() { zug = null; frei = 1; },
    };
  })();

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
    nebel.voll();
    await fahren(ORTE.vorspann, 0);
    schweben(true);
    nebel.zurueckziehen(TEMPO.nebelWarten);
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
    nebel.fertig();
    vorspann(false);
    await fahren(ORTE[haus], 0);
    abdunkeln(dunkel || 2);
    await szene(haus, 0);
  }

  window.addEventListener('resize', () => fahren(aktuell, 0));
  if (!karte.complete) karte.addEventListener('load', () => fahren(aktuell, 0));

  window.NWU_FILM = { gebietFuerFrage, start, aufbruch, frage, verkuenden, imGebiet, vorladen, abdunkeln };
})();
