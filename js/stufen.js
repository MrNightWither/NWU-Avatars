// Stufen-Seite: alle Freischaltungen bis Level 100 und der eigene Stand.
// Testen ohne Worker: stufen.html?level=12&haus=haus2&figur=c
'use strict';

(function () {
  const PLAN = window.NWU_STUFENPLAN, HAEUSER = window.NWU_HAEUSER, SEITE = window.NWU_SEITE || {};
  const $ = (id) => document.getElementById(id);
  const q = new URLSearchParams(location.search);
  const api = (q.get('api') || SEITE.api || '').replace(/\/$/, '');

  // ---------- So steigst du auf ----------
  const RUHM = window.NWU_RUHM;
  const zahl = (n) => n.toLocaleString('de-DE');
  $('wie').replaceChildren(...Object.values(RUHM.quellen).map((q) => {
    const li = document.createElement('li');
    const b = document.createElement('b');
    b.textContent = q.ruhmPro100 ? `${q.ruhmPro100} Ruhm` : `${q.ruhm} Ruhm`;
    li.append(b, ' · ' + q.name);
    return li;
  }), ...Object.values(RUHM.spiele || {}).map((sp) => {
    const li = document.createElement('li');
    const b = document.createElement('b');
    b.textContent = `${sp.gewinner} Ruhm`;
    li.append(b, ' · ' + sp.name + (sp.verlierer ? ` (falsch geraten: ${String(sp.verlierer).replace('-', '−')} Ruhm)` : ''));
    return li;
  }), (() => {
    const li = document.createElement('li');
    const b = document.createElement('b'); b.textContent = 'Würfel der Morrígan';
    li.append(b, ` (!wurf, einmal pro Stream): 6 = doppelter Ruhm für ${RUHM.doppeltStunden} Stunden, 2–5 = Augenzahl × ${RUHM.wurfRuhm}, 1 = du verlierst kurz deine Gestalt`);
    return li;
  })(), (() => {
    const li = document.createElement('li');
    const b = document.createElement('b'); b.textContent = 'Der Schattenkönig';
    li.append(b, ' kann dich jederzeit selbst erheben.');
    return li;
  })());

  // ---------- Der Weg ----------
  const weg = $('weg');
  const eintraege = PLAN.map((s) => {
    const li = document.createElement('li');
    li.className = 'stufe' + (s.fertig ? '' : ' bald') + (s.level >= 100 ? ' gross' : '');
    const nr = document.createElement('span');
    nr.className = 'nr';
    nr.textContent = s.aufstieg ? '★' : s.level;
    const text = document.createElement('div');
    const h = document.createElement('h3'); h.textContent = s.name;
    const p = document.createElement('p'); p.textContent = s.text;
    text.append(h, p);
    if (!s.fertig) {
      const m = document.createElement('span'); m.className = 'marke'; m.textContent = 'bald';
      h.append(' ', m);
    }
    li.append(nr, text);
    weg.append(li);
    return { s, li };
  });

  function standZeigen(level, hausId, figur, ruhm) {
    const haus = HAEUSER.find((h) => h.id === hausId);
    if (haus) document.body.style.setProperty('--haus', haus.css);
    eintraege.forEach(({ s, li }) => li.classList.toggle('erreicht', !s.aufstieg && level >= s.level));
    const naechste = PLAN.find((s) => !s.aufstieg && s.level > level);
    const vorige = [...PLAN].reverse().find((s) => s.level <= level) || PLAN[0];
    $('s-haus').textContent = haus ? haus.name : '';
    $('s-level').textContent = level;
    $('s-naechstes').textContent = naechste ? `Nächste Stufe: Level ${naechste.level} · ${naechste.name}` : 'Du bist eine Legende.';
    // Fortschritt: mit Ruhm genau bis zum nächsten Level, sonst grob bis zur nächsten Stufe
    let anteil = naechste ? (level - vorige.level) / (naechste.level - vorige.level) : 1;
    if (typeof ruhm === 'number') {
      const von = RUHM.ruhmFuerLevel(level), bis = RUHM.ruhmFuerLevel(level + 1);
      anteil = level >= RUHM.maxLevel ? 1 : (ruhm - von) / (bis - von);
      $('s-ruhm').textContent = level >= RUHM.maxLevel ? `${zahl(ruhm)} Ruhm` : `${zahl(ruhm)} Ruhm · noch ${zahl(bis - ruhm)} bis Level ${level + 1}`;
    } else $('s-ruhm').textContent = '';
    $('s-balken').style.width = Math.round(Math.max(0.04, anteil) * 100) + '%';
    const bild = $('figur');
    if (haus && figur) { bild.src = `assets/figur-${haus.id}-${figur}.webp`; bild.hidden = false; } else bild.hidden = true;
    $('stand').hidden = false;
    // zur nächsten Stufe scrollen, damit man sieht, was als Nächstes kommt
    const ziel = eintraege.find((e) => e.s === naechste);
    if (ziel && !q.has('still')) ziel.li.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ---------- Suche ----------
  const sel = $('plattform');
  for (const p of SEITE.plattformen || [{ id: 'twitch', name: 'Twitch' }]) sel.add(new Option(p.name, p.id));

  $('suche').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('name').value.trim().replace(/^@/, '');
    const hinweis = $('hinweis');
    if (!name) { hinweis.textContent = 'Gib deinen Namen aus dem Chat ein.'; return; }
    if (!api) { hinweis.textContent = 'Noch nicht verbunden. Sobald der Server läuft, siehst du hier deinen Stand.'; return; }
    hinweis.textContent = 'Morrígan sucht dich …';
    try {
      const r = await fetch(`${api}/avatare/profil?plattform=${encodeURIComponent(sel.value)}&name=${encodeURIComponent(name)}`, { credentials: 'omit' });
      const d = await r.json();
      if (!d.gefunden) { hinweis.textContent = 'Unter diesem Namen ist noch niemand gebunden. Mach zuerst das Ritual.'; $('stand').hidden = true; return; }
      hinweis.textContent = '';
      standZeigen(d.level || 1, d.haus, d.figur, d.ruhm);
      $('s-mehr').href = `figur.html?p=${encodeURIComponent(sel.value)}&n=${encodeURIComponent(d.name || name)}`;
      $('s-mehr').hidden = false;
    } catch (err) {
      hinweis.textContent = 'Morrígan ist gerade nicht erreichbar. Versuch es später nochmal.';
    }
  });

  // Vorschau ohne Server: ?level=12&haus=haus2&figur=c
  if (q.has('level')) {
    const lv = Math.max(1, parseInt(q.get('level'), 10) || 1);
    standZeigen(lv, q.get('haus') || 'haus1', q.get('figur') || 'a', q.has('ruhm') ? Number(q.get('ruhm')) : RUHM.ruhmFuerLevel(lv) + 120);
  }
})();
