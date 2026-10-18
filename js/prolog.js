// Prolog „Die Spaltung“: Morrígan erzählt, wie aus NightWither Unity vier Häuser wurden.
// Alles aus vorhandenen Bildern: Karte (ohne Nebel), Wappen, Kamerafahrten, Risse, Nebel, Klang.
// Texte und Zeiten stehen unten in SZENEN und lassen sich einfach ändern.
'use strict';

(function () {
  const $ = (id) => document.getElementById(id);
  const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HAEUSER = window.NWU_HAEUSER || [];
  const TON = window.NWU_TON;
  const body = document.body, welt = $('welt'), karte = $('karte'), risse = $('risse');
  let lauf = 0;                                   // zählt Durchläufe, damit „Nochmal“ den alten abbricht
  const warte = (ms) => new Promise((r) => setTimeout(r, ruhig ? Math.min(ms, 1200) : ms));

  // Orte auf der Karte (wie js/film.js)
  const ORT = {
    weit:     { x: 0.5, y: 0.47, z: 1.05 },
    zitadelle:{ x: 0.5, y: 0.43, z: 2.1 },
    haus1:    { x: 0.50, y: 0.18, z: 1.9 },
    haus2:    { x: 0.79, y: 0.22, z: 1.9 },
    haus3:    { x: 0.83, y: 0.58, z: 1.9 },
    haus4:    { x: 0.50, y: 0.80, z: 1.9 },
    westen:   { x: 0.2, y: 0.5, z: 1.5 },
  };

  // ---------- Kamera ----------
  let aktuell = ORT.weit;
  function transform(o) {
    const W = window.innerWidth, H = window.innerHeight;
    const iw = karte.naturalWidth || 2000, ih = karte.naturalHeight || 1091;
    const s = Math.max(W / iw, H / ih) * o.z;
    let tx = W / 2 - o.x * iw * s, ty = H / 2 - o.y * ih * s;
    tx = Math.min(0, Math.max(W - iw * s, tx)); ty = Math.min(0, Math.max(H - ih * s, ty));
    return `translate3d(${tx}px, ${ty}px, 0) scale(${s})`;
  }
  function fahren(o, ms) {
    aktuell = o;
    welt.style.transition = ms && !ruhig ? `transform ${ms}ms cubic-bezier(.45,0,.25,1)` : 'none';
    welt.style.transform = transform(o);
    if (ms) TON.wusch(Math.min(5, ms / 1000));
    return warte(ms || 0);
  }
  window.addEventListener('resize', () => fahren(aktuell, 0));

  // ---------- Risse von der Zitadelle in die vier Länder und nach Westen ----------
  function risseZeichnen() {
    const iw = karte.naturalWidth || 2000, ih = karte.naturalHeight || 1091;
    risse.setAttribute('viewBox', `0 0 ${iw} ${ih}`);
    const m = { x: 0.5 * iw, y: 0.45 * ih };
    const ziele = [[0.5, 0.2], [0.76, 0.24], [0.8, 0.58], [0.5, 0.78], [0.2, 0.3], [0.18, 0.7]];
    let saat = 3;
    const zufall = () => { saat = (saat * 16807) % 2147483647; return saat / 2147483647 - 0.5; };
    risse.replaceChildren(...ziele.map(([zx, zy]) => {
      const e = { x: zx * iw, y: zy * ih };
      let d = `M${m.x},${m.y}`;
      for (let i = 1; i <= 7; i++) {
        const t = i / 7;
        d += ` L${m.x + (e.x - m.x) * t + zufall() * 60},${m.y + (e.y - m.y) * t + zufall() * 60}`;
      }
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', d);
      return p;
    }));
    risse.querySelectorAll('path').forEach((p) => {
      const l = p.getTotalLength();
      p.style.strokeDasharray = l; p.style.strokeDashoffset = l;
    });
  }

  // ---------- Erzählung ----------
  const text = $('erzaehlung'), wappen = $('wappen');
  async function sag(satz, ms) {
    text.textContent = satz; text.classList.add('an');
    await warte(ms);
    text.classList.remove('an');
    await warte(1400);
  }
  function wappenZeigen(id) {
    const h = HAEUSER.find((x) => x.id === id);
    if (h && h.wappenBild) { wappen.src = h.wappenBild; wappen.classList.add('an'); }
  }

  // ---------- Ablauf ----------
  async function film() {
    const nr = ++lauf;
    const weiter = () => nr === lauf;
    body.className = '';
    $('ende').hidden = true; $('ueberspringen').hidden = false;
    risseZeichnen();
    await fahren(ORT.weit, 0);

    body.classList.add('kugel');
    await warte(1800); if (!weiter()) return;
    await sag('Hör zu. Ich bin Morrígan. In der Kugel des Königs habe ich alles gesehen, was in jener Nacht geschah.', 6500);
    if (!weiter()) return;

    body.classList.add('offen');
    TON.glocke();
    await warte(3200); if (!weiter()) return;
    await sag('Einst gab es nur ein Haus: NightWither Unity.', 5200);
    if (!weiter()) return;

    await fahren(ORT.zitadelle, 4500); if (!weiter()) return;
    await sag('In der Zitadelle herrschte der Schattenkönig. Sein Banner war schwarz und gold, und der Mond war sein Zeichen.', 7000);
    if (!weiter()) return;
    body.classList.add('dunkel');
    await sag('Doch Stolz und Misstrauen wuchsen in den Hallen. Und eines Nachts wurde ein Schwur gebrochen.', 6500);
    if (!weiter()) return;

    // Die Spaltung
    await fahren(ORT.weit, 3500); if (!weiter()) return;
    TON.donner();
    body.classList.add('blitzt', 'bebt', 'reisst');
    body.classList.remove('dunkel');
    await warte(900);
    body.classList.add('gespalten');
    await warte(2200); if (!weiter()) return;
    body.classList.remove('blitzt', 'bebt');
    await sag('In jener Nacht zerbrach Unity.', 4200);
    body.classList.add('verglueht');
    if (!weiter()) return;

    const reise = [
      ['haus1', 'Der Mond zog nach Norden, zu den stillen Seen. Wachsam, und nie wieder ganz im Licht.'],
      ['haus2', 'Das Blut nahm die rote Stadt. Treu bis in den Tod – aber nur noch sich selbst.'],
      ['haus3', 'Der Nebel verschwand in den Sümpfen des Ostens. Niemand weiß, wie viele sie sind.'],
      ['haus4', 'Die Flamme ging in die Vulkane des Südens. Laut, wild, und unaufhaltsam.'],
    ];
    for (const [id, satz] of reise) {
      await fahren(ORT[id], 3800); if (!weiter()) return;
      wappenZeigen(id);
      await sag(satz, 6000);
      wappen.classList.remove('an');
      if (!weiter()) return;
    }

    await fahren(ORT.westen, 4200); if (!weiter()) return;
    body.classList.add('westen');
    await sag('Zwei Häuser – die Raben und die Dornen – verschwanden in jener Nacht im Westen. Seitdem liegt dort Nebel.', 7000);
    if (!weiter()) return;
    await sag('Man sagt, sie sind nicht tot. Man sagt, sie warten.', 5000);
    if (!weiter()) return;

    await fahren(ORT.weit, 4500); if (!weiter()) return;
    await sag('Ihr tragt noch immer den Mond von Unity. Ihr seid Geschwister, keine Feinde. Und vielleicht … eines Tages wieder eins.', 7500);
    if (!weiter()) return;
    body.classList.add('endet');
    text.textContent = 'Doch zuerst musst du wissen, wohin du gehörst.';
    text.classList.add('an');
    TON.glocke();
    $('ende').hidden = false; $('ueberspringen').hidden = true;
  }

  // ---------- Start (Ton braucht einen Klick) ----------
  $('b-start').addEventListener('click', () => {
    TON.start();
    $('vorhang').classList.add('weg');
    const ton = $('ton');
    ton.hidden = false;
    ton.setAttribute('aria-pressed', String(TON.istStumm()));
    film();
  });
  $('ton').addEventListener('click', () => {
    TON.stummSchalten();
    $('ton').setAttribute('aria-pressed', String(TON.istStumm()));
  });
  $('b-nochmal').addEventListener('click', () => { text.classList.remove('an'); film(); });
  if (karte.complete) fahren(ORT.weit, 0); else karte.addEventListener('load', () => fahren(ORT.weit, 0), { once: true });
})();
