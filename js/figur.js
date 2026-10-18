// Figurenseite: figur.html?n=<name>&p=<plattform> zeigt eine Gestalt mit Haus, Level, Ruhm,
// Platz im Haus und Freischaltungen. Ohne Worker: Beispiel. Test: figur.html?beispiel=1
'use strict';

(function () {
  const HAEUSER = window.NWU_HAEUSER, FIGUREN = window.NWU_FIGUREN, RUHM = window.NWU_RUHM, PLAN = window.NWU_STUFENPLAN;
  const FARBEN = window.NWU_HAARFARBEN, SEITE = window.NWU_SEITE || {};
  const $ = (id) => document.getElementById(id);
  const q = new URLSearchParams(location.search);
  const api = (q.get('api') || SEITE.api || '').replace(/\/$/, '');
  const zahl = (n) => Number(n || 0).toLocaleString('de-DE');
  const ROLLEN = { waechter: 'Wächter der Zitadelle', koenigin: 'Königin der Zitadelle', koenigskreis: 'Kreis des Königs', verbuendet: 'Verbündet' };

  function zeigen(d, plattform) {
    const haus = HAEUSER.find((h) => h.id === d.haus);
    const figur = FIGUREN.find((f) => f.id === d.figur);
    if (haus) {
      document.body.style.setProperty('--haus', haus.css);
      $('hintergrund').style.backgroundImage = `linear-gradient(rgba(5,5,7,0.78), rgba(5,5,7,0.95)), url('assets/gebiet-${haus.id}.webp')`;
    }
    document.title = `${d.name} — NightWither Unity`;
    $('t-name').textContent = d.name;
    $('t-unter').textContent = haus ? haus.name : '';
    $('g-bild').src = haus ? `assets/figur-${haus.id}-${d.figur}.webp` : '';
    $('g-haus').textContent = haus ? haus.name : '';
    $('g-haus').href = haus ? `haus.html?h=${haus.id}` : '#';
    $('g-typ').textContent = figur ? `${figur.typ} · ${figur.text}` : '';
    const abz = [];
    if (ROLLEN[d.rolle]) abz.push(ROLLEN[d.rolle]);
    if (d.jahrestag > 0) abz.push(`Heute ${d.jahrestag} ${d.jahrestag === 1 ? 'Jahr' : 'Jahre'} gebunden`);
    $('g-abzeichen').replaceChildren(...abz.map((t) => { const s = document.createElement('span'); s.className = 'marke'; s.textContent = t; return s; }));
    const level = d.level || 1, ruhm = d.ruhm || 0;
    $('g-level').textContent = level;
    const von = RUHM.ruhmFuerLevel(level), bis = RUHM.ruhmFuerLevel(level + 1);
    $('g-ruhm').textContent = level >= RUHM.maxLevel ? `${zahl(ruhm)} Ruhm` : `${zahl(ruhm)} Ruhm · noch ${zahl(bis - ruhm)} bis Level ${level + 1}`;
    $('g-balken').style.width = (level >= RUHM.maxLevel ? 100 : Math.max(4, (ruhm - von) / (bis - von) * 100)).toFixed(1) + '%';
    $('g-platz').textContent = d.platz ? `${d.platz}.` : '–';
    $('g-seit').textContent = d.seit ? new Date(d.seit + 'T12:00:00Z').toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }) : '–';
    const haarId = window.NWU_HAARFARBE_FREI(level, d.aussehen && d.aussehen.haare) ? d.aussehen.haare : (window.NWU_HAARE_STANDARD || {})[d.haus];
    $('g-haare').textContent = FARBEN[haarId] ? FARBEN[haarId].name : '–';

    const erreicht = PLAN.filter((s) => s.fertig && !s.aufstieg && s.level <= level);
    $('g-frei').replaceChildren(...erreicht.map((s) => {
      const li = document.createElement('li');
      const b = document.createElement('b'); b.textContent = `Lv ${s.level}`;
      li.append(b, ' ' + s.name);
      return li;
    }));
    const naechste = PLAN.find((s) => !s.aufstieg && s.level > level);
    $('g-naechstes').textContent = naechste ? `Als Nächstes: Level ${naechste.level} · ${naechste.name}${naechste.fertig ? '' : ' (bald)'}` : 'Alles freigeschaltet. Eine Legende.';
    $('gestalt').hidden = false; $('frei-karte').hidden = false;

    const link = new URL(location.href);
    link.search = `?p=${encodeURIComponent(plattform)}&n=${encodeURIComponent(d.name)}`;
    $('g-teilen').onclick = async () => {
      try { await navigator.clipboard.writeText(link.href); $('g-kopiert').textContent = 'Kopiert!'; } catch (e) { $('g-kopiert').textContent = link.href; }
    };
  }

  async function laden(plattform, name) {
    if (!api) {
      $('beispiel').hidden = false;
      zeigen({ name: name || 'Nachtfalke', haus: 'haus2', figur: 'a', level: 27, ruhm: RUHM.ruhmFuerLevel(27) + 900, platz: 3, rolle: 'waechter',
        seit: '2026-10-18', aussehen: { haare: 'blau' }, jahrestag: 0 }, plattform);
      return;
    }
    $('hinweis').textContent = 'Morrígan sucht …';
    try {
      const d = await (await fetch(`${api}/avatare/profil?plattform=${encodeURIComponent(plattform)}&name=${encodeURIComponent(name)}`, { credentials: 'omit' })).json();
      if (!d.gefunden) { $('hinweis').textContent = 'Unter diesem Namen steht niemand im Buch der Zitadelle.'; $('suche-karte').hidden = false; return; }
      $('hinweis').textContent = '';
      zeigen(d, plattform);
    } catch (e) {
      $('hinweis').textContent = 'Morrígan ist gerade nicht erreichbar.'; $('suche-karte').hidden = false;
    }
  }

  const sel = $('plattform');
  for (const p of SEITE.plattformen || [{ id: 'twitch', name: 'Twitch' }]) sel.add(new Option(p.name, p.id));
  $('suche').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('name').value.trim().replace(/^@/, '');
    if (!name) return;
    history.replaceState(null, '', `?p=${encodeURIComponent(sel.value)}&n=${encodeURIComponent(name)}`);
    laden(sel.value, name);
  });

  const name = q.get('n'), plattform = q.get('p') || 'twitch';
  if (name || q.has('beispiel')) laden(plattform, name);
  else $('suche-karte').hidden = false;
})();
