// Stufen-Seite: alle Freischaltungen bis Level 100 und der eigene Stand.
// Testen ohne Worker: stufen.html?level=12&haus=haus2&figur=c
'use strict';

(function () {
  const PLAN = window.NWU_STUFENPLAN, HAEUSER = window.NWU_HAEUSER, SEITE = window.NWU_SEITE || {};
  const $ = (id) => document.getElementById(id);
  const q = new URLSearchParams(location.search);
  const api = (q.get('api') || SEITE.api || '').replace(/\/$/, '');

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

  function standZeigen(level, hausId, figur) {
    const haus = HAEUSER.find((h) => h.id === hausId);
    if (haus) document.body.style.setProperty('--haus', haus.css);
    eintraege.forEach(({ s, li }) => li.classList.toggle('erreicht', !s.aufstieg && level >= s.level));
    const naechste = PLAN.find((s) => !s.aufstieg && s.level > level);
    const vorige = [...PLAN].reverse().find((s) => s.level <= level) || PLAN[0];
    $('s-haus').textContent = haus ? haus.name : '';
    $('s-level').textContent = level;
    $('s-naechstes').textContent = naechste ? `Nächste Stufe: Level ${naechste.level} · ${naechste.name}` : 'Du bist eine Legende.';
    const anteil = naechste ? (level - vorige.level) / (naechste.level - vorige.level) : 1;
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
      standZeigen(d.level || 1, d.haus, d.figur);
    } catch (err) {
      hinweis.textContent = 'Morrígan ist gerade nicht erreichbar. Versuch es später nochmal.';
    }
  });

  // Vorschau ohne Server: ?level=12&haus=haus2&figur=c
  if (q.has('level')) standZeigen(Math.max(1, parseInt(q.get('level'), 10) || 1), q.get('haus') || 'haus1', q.get('figur') || 'a');
})();
