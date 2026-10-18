// Hausseite: haus.html?h=haus1 … haus4 (verborgene Häuser haus5/haus6 zeigen nur ihre Legende)
'use strict';

(function () {
  const HAEUSER = window.NWU_HAEUSER, AKTIV = window.NWU_AKTIVE_HAEUSER, FIGUREN = window.NWU_FIGUREN, SEITE = window.NWU_SEITE || {};
  const $ = (id) => document.getElementById(id);
  const q = new URLSearchParams(location.search);
  const api = (q.get('api') || SEITE.api || '').replace(/\/$/, '');
  const zahl = (n) => Number(n || 0).toLocaleString('de-DE');
  const haus = HAEUSER.find((h) => h.id === q.get('h')) || AKTIV[0];

  document.title = `${haus.name} — NightWither Unity`;
  document.body.style.setProperty('--haus', haus.css);
  $('hintergrund').style.backgroundImage = `linear-gradient(rgba(5,5,7,0.72), rgba(5,5,7,0.96)), url('assets/gebiet-${haus.id}.webp')`;
  $('h-wappen').src = haus.wappenBild;
  $('h-name').textContent = haus.name;
  $('h-reiter').textContent = haus.verloren ? 'Verborgen im Westen' : 'Ein Haus von NightWither Unity';
  $('h-wesen').textContent = haus.wesen;
  $('h-geschichte').textContent = haus.geschichte || '';
  $('h-sprueche').replaceChildren(...haus.sprueche.map((s) => { const li = document.createElement('li'); li.textContent = `„${s}“`; return li; }));

  // Links zu den anderen Häusern
  $('h-andere').replaceChildren(...AKTIV.filter((h) => h.id !== haus.id).flatMap((h, i) => {
    const a = document.createElement('a'); a.href = `haus.html?h=${h.id}`; a.textContent = h.name;
    return i ? [' · ', a] : [a];
  }), ' · ', Object.assign(document.createElement('a'), { href: 'chronik.html', textContent: 'Die Chronik →' }));

  if (haus.verloren) {
    // Verborgene Häuser: nur Legende, keine Gestalten, keine Zahlen
    for (const id of ['h-zahlen', 'gestalten-karte', 'liste-karte']) $(id).hidden = true;
    const p = document.createElement('p'); p.className = 'verborgen'; p.textContent = 'Dieses Haus ist noch nicht erwacht.';
    $('h-geschichte').after(p);
    return;
  }

  $('h-gestalten').replaceChildren(...FIGUREN.map((f) => {
    const d = document.createElement('div');
    const img = document.createElement('img'); img.src = `assets/figur-${haus.id}-${f.id}.webp`; img.alt = `${f.typ} des ${haus.kurz}`; img.loading = 'lazy';
    const b = document.createElement('b'); b.textContent = f.typ;
    const s = document.createElement('span'); s.textContent = f.text;
    d.append(img, b, s);
    return d;
  }));

  function zahlenZeigen(mitglieder, pokal, liste) {
    const rang = Object.entries(pokal.haeuser).sort((a, b) => b[1] - a[1]).map((e) => e[0]);
    $('z-mitglieder').textContent = zahl(mitglieder);
    $('z-ruhm').textContent = zahl(pokal.haeuser[haus.id]);
    $('z-platz').textContent = pokal.haeuser[haus.id] ? `${rang.indexOf(haus.id) + 1}.` : '–';
    const ol = $('h-liste');
    if (!liste.length) { const p = document.createElement('p'); p.className = 'leer'; p.textContent = 'Noch keine Namen in der Chronik.'; ol.replaceWith(p); return; }
    ol.replaceChildren(...liste.map((e, i) => {
      const li = document.createElement('li');
      const nr = document.createElement('span'); nr.className = 'platz'; nr.textContent = i + 1;
      const img = document.createElement('img'); img.src = `assets/figur-${haus.id}-${e.figur}.webp`; img.alt = ''; img.loading = 'lazy';
      const a = document.createElement('a'); a.className = 'name'; a.href = `figur.html?p=twitch&n=${encodeURIComponent(e.name)}`; a.textContent = e.name;
      const lv = document.createElement('span'); lv.className = 'lv'; lv.textContent = 'Lv ' + e.level;
      li.append(nr, img, a, lv);
      return li;
    }));
  }

  (async () => {
    if (!api) {
      $('beispiel').hidden = false;
      const namen = ['Nachtfalke', 'luna_lurkt', 'Ascheherz', 'Silberklinge', 'Mondwache'];
      zahlenZeigen(42, { haeuser: { haus1: 8420, haus2: 9130, haus3: 6210, haus4: 7780 } },
        namen.map((n, k) => ({ name: n, figur: 'abcd'[k % 4], level: 18 - k * 3 })));
      return;
    }
    try {
      const [beleg, chronik] = await Promise.all([
        fetch(api + '/avatare/belegung', { credentials: 'omit' }).then((r) => r.json()),
        fetch(api + '/chronik', { credentials: 'omit' }).then((r) => r.json()),
      ]);
      zahlenZeigen(beleg[haus.id] || 0, chronik.pokal, chronik.listen[haus.id] || []);
    } catch (e) { $('h-zahlen').hidden = true; }
  })();
})();
