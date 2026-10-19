// Mein Profil: anmelden per Code im Twitch-Chat (!anmelden 1234), dann Haarfarbe, Anonym, Kick/YouTube verknüpfen,
// Profil löschen. Der Spielstand liegt im Worker; im Browser liegt nur der Schlüssel für 30 Tage.
// Testen ohne Worker: ich.html?beispiel=1
'use strict';

(function () {
  const HAEUSER = window.NWU_HAEUSER, RUHM = window.NWU_RUHM, FARBEN = window.NWU_HAARFARBEN, SEITE = window.NWU_SEITE || {};
  const $ = (id) => document.getElementById(id);
  const q = new URLSearchParams(location.search);
  const api = (q.get('api') || SEITE.api || '').replace(/\/$/, '');
  const beispiel = !api && q.has('beispiel');
  const SPEICHER = 'nwu-ich';
  const PLATTFORM_NAME = { twitch: 'Twitch', kick: 'Kick', youtube: 'YouTube' };
  // Die Haare sind silbern und werden eingefärbt – für die Farbpunkte die sichtbare Farbe nehmen
  const ANZEIGE = { silber: '#c3c8d4', weiss: '#f2f0ea', schwarz: '#26232b' };
  const zahl = (n) => Number(n || 0).toLocaleString('de-DE');

  let schluessel = null;
  try { const s = JSON.parse(localStorage.getItem(SPEICHER)); if (s && s.bis > new Date().toISOString()) schluessel = s.token; } catch (e) { /* kein Speicher */ }
  const merken = (token, bis) => { schluessel = token; try { localStorage.setItem(SPEICHER, JSON.stringify({ token, bis })); } catch (e) { /* nur für diese Sitzung */ } };
  const vergessen = () => { schluessel = null; try { localStorage.removeItem(SPEICHER); } catch (e) { /* egal */ } };

  async function rufen(pfad, body) {
    const opt = { credentials: 'omit', headers: { Authorization: 'Bearer ' + schluessel } };
    if (body !== undefined) { opt.method = 'POST'; opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
    const r = await fetch(api + pfad, opt);
    if (r.status === 401) { vergessen(); abgemeldet('Deine Anmeldung ist abgelaufen. Melde dich neu an.'); throw new Error('abgemeldet'); }
    return r.json();
  }

  const KARTEN = ['stand', 'k-haare', 'k-anonym', 'k-konten', 'k-loeschen', 'abmelden-zeile'];
  function abgemeldet(text) {
    KARTEN.forEach((id) => { $(id).hidden = true; });
    $('warten').hidden = true; $('anmelden').hidden = false;
    $('a-hinweis').textContent = text || '';
    $('t-name').textContent = 'Mein Profil'; $('t-unter').textContent = 'Morrígan erkennt die Ihren';
  }

  // ---------- Anmelden ----------
  let warteTimer = null;
  $('f-anmelden').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('a-name').value.trim().replace(/^@/, '');
    if (!/^[A-Za-z0-9_]{3,25}$/.test(name)) { $('a-hinweis').textContent = 'Das sieht nicht wie ein Twitch-Name aus.'; return; }
    if (!api) { $('a-hinweis').textContent = 'Noch nicht verbunden. Sobald der Server läuft, kannst du dich hier anmelden.'; return; }
    $('a-hinweis').textContent = 'Morrígan sucht dich …';
    try {
      const r = await fetch(`${api}/sitzung/start`, { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      const d = await r.json();
      if (!r.ok) { $('a-hinweis').textContent = d.fehler || 'Das hat nicht geklappt.'; return; }
      $('a-hinweis').textContent = '';
      $('w-befehl').textContent = `!anmelden ${d.code}`; $('w-name').textContent = name; $('w-hinweis').textContent = 'Morrígan wartet …';
      $('anmelden').hidden = true; $('warten').hidden = false;
      const ende = Date.now() + 15 * 60e3;
      clearInterval(warteTimer);
      warteTimer = setInterval(async () => {
        if (Date.now() > ende) { clearInterval(warteTimer); abgemeldet('Der Code ist abgelaufen. Hol dir einen neuen.'); return; }
        try {
          const s = await (await fetch(`${api}/sitzung/${encodeURIComponent(d.id)}`, { credentials: 'omit' })).json();
          if (s.status === 'bestaetigt' && s.token) { clearInterval(warteTimer); merken(s.token, s.gueltigBis); laden(); }
          else if (s.status === 'abgelaufen') { clearInterval(warteTimer); abgemeldet('Der Code ist abgelaufen. Hol dir einen neuen.'); }
        } catch (err) { /* nächster Versuch */ }
      }, 3000);
    } catch (err) { $('a-hinweis').textContent = 'Morrígan ist gerade nicht erreichbar.'; }
  });
  $('w-abbrechen').addEventListener('click', () => { clearInterval(warteTimer); abgemeldet(''); });

  // ---------- Angemeldet ----------
  let ich = null;
  function zeigen(d) {
    ich = d;
    const haus = HAEUSER.find((h) => h.id === d.haus);
    if (haus) {
      document.body.style.setProperty('--haus', haus.css);
      $('hintergrund').style.backgroundImage = `linear-gradient(rgba(5,5,7,0.78), rgba(5,5,7,0.95)), url('assets/gebiet-${haus.id}.webp')`;
    }
    const twitch = (d.konten.find((k) => k.plattform === 'twitch') || d.konten[0] || {}).name || '';
    $('t-name').textContent = twitch || 'Mein Profil';
    $('t-unter').textContent = haus ? haus.name : '';
    $('s-bild').src = haus ? `assets/figur-${haus.id}-${d.figur}.webp` : '';
    $('s-haus').textContent = haus ? haus.name : '';
    const level = d.level || 1, ruhm = d.ruhm || 0, von = RUHM.ruhmFuerLevel(level), bis = RUHM.ruhmFuerLevel(level + 1);
    $('s-level').textContent = level;
    $('s-ruhm').textContent = level >= RUHM.maxLevel ? `${zahl(ruhm)} Ruhm` : `${zahl(ruhm)} Ruhm · noch ${zahl(bis - ruhm)} bis Level ${level + 1}`;
    $('s-balken').style.width = (level >= RUHM.maxLevel ? 100 : Math.max(4, (ruhm - von) / (bis - von) * 100)).toFixed(1) + '%';
    $('s-figurenseite').href = `figur.html?p=twitch&n=${encodeURIComponent(twitch)}`;
    $('s-figurenseite').parentElement.hidden = !!d.anonym;

    // Haarfarben: freigeschaltete wählbar, die anderen mit Level-Hinweis
    const ab = (window.NWU_FREISCHALTUNGEN.find((f) => f.id === 'haare') || {}).level;
    const abSelten = (window.NWU_FREISCHALTUNGEN.find((f) => f.id === 'haare_selten') || {}).level;
    const jetzt = window.NWU_HAARFARBE_FREI(level, d.aussehen && d.aussehen.haare) ? d.aussehen.haare : (window.NWU_HAARE_STANDARD || {})[d.haus];
    $('haare-text').textContent = level < ab ? `Ab Level ${ab} kannst du die Haarfarbe deiner Figur wählen.` : `Seltene Farben gibt es ab Level ${abSelten}. Im Chat geht das auch mit !haare <Farbe>.`;
    $('farben').replaceChildren(...Object.entries(FARBEN).map(([id, f]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'farbe';
      const punkt = document.createElement('i'); punkt.style.background = ANZEIGE[id] || '#' + f.farbe.toString(16).padStart(6, '0');
      const frei = window.NWU_HAARFARBE_FREI(level, id) && window.NWU_FREI(level, 'haare');
      b.append(punkt, f.name + (frei ? '' : ` · Lv ${f.selten ? abSelten : ab}`));
      b.disabled = !frei; b.setAttribute('aria-pressed', String(id === jetzt));
      b.addEventListener('click', () => haareWaehlen(id));
      return b;
    }));
    $('anonym').checked = !!d.anonym;

    // Konten
    $('konten').replaceChildren(...d.konten.map((k) => {
      const li = document.createElement('li');
      const s = document.createElement('span');
      const b = document.createElement('b'); b.textContent = PLATTFORM_NAME[k.plattform] || k.plattform;
      s.append(b, k.name);
      li.append(s);
      if (k.plattform !== 'twitch') {
        const t = document.createElement('button'); t.type = 'button'; t.textContent = 'trennen';
        t.addEventListener('click', () => trennen(k.plattform));
        li.append(t);
      }
      return li;
    }));
    const sel = $('v-plattform');
    sel.replaceChildren(...(d.verknuepfbar || ['kick', 'youtube']).map((p) => new Option(PLATTFORM_NAME[p] || p, p)));

    $('anmelden').hidden = true; $('warten').hidden = true;
    KARTEN.forEach((id) => { $(id).hidden = false; });
    $('sicher').hidden = true;
  }

  async function laden() {
    if (beispiel) {
      $('beispiel').hidden = false;
      zeigen({ haus: 'haus3', figur: 'b', level: 12, ruhm: RUHM.ruhmFuerLevel(12) + 300, aussehen: { haare: 'kupfer' }, anonym: false,
        konten: [{ plattform: 'twitch', name: 'Nachtfalke' }, { plattform: 'kick', name: 'nachtfalke_kick' }], verknuepfbar: ['kick', 'youtube'] });
      return;
    }
    if (!api || !schluessel) { abgemeldet(''); return; }
    try { zeigen(await rufen('/ich')); } catch (e) { if (e.message !== 'abgemeldet') abgemeldet('Morrígan ist gerade nicht erreichbar.'); }
  }

  async function haareWaehlen(id) {
    if (beispiel) { ich.aussehen = { haare: id }; zeigen(ich); $('haare-hinweis').textContent = `Haarfarbe: ${FARBEN[id].name} (Beispiel)`; return; }
    try {
      const d = await rufen('/ich/aussehen', { haare: id });
      $('haare-hinweis').textContent = d.ok ? `Haarfarbe: ${d.haare}. Im Stream sieht man sie, sobald du das nächste Mal schreibst.` : 'Diese Farbe ist noch nicht freigeschaltet.';
      if (d.ok) { ich.aussehen = { haare: id }; zeigen(ich); }
    } catch (e) { /* abgemeldet */ }
  }

  $('anonym').addEventListener('change', async () => {
    const an = $('anonym').checked;
    if (beispiel) { ich.anonym = an; zeigen(ich); return; }
    try {
      const d = await rufen('/ich/anonym', { an });
      ich.anonym = d.anonym; zeigen(ich);
      $('anonym-hinweis').textContent = an ? 'Du bist jetzt eine unbekannte Seele.' : 'Dein Name steht wieder in der Chronik.';
    } catch (e) { /* abgemeldet */ }
  });

  $('f-verknuepfen').addEventListener('submit', async (e) => {
    e.preventDefault();
    const plattform = $('v-plattform').value, name = $('v-name').value.trim().replace(/^@/, '');
    if (!name) { $('v-hinweis').textContent = 'Gib deinen Namen auf der Plattform ein.'; return; }
    if (beispiel) { $('v-hinweis').textContent = `Schreib im ${PLATTFORM_NAME[plattform]}-Chat: !verknüpfen 1234 (Beispiel)`; return; }
    try {
      const d = await rufen('/ich/verknuepfen', { plattform, name });
      $('v-hinweis').className = 'hinweis gut';
      $('v-hinweis').textContent = d.ok ? `Schreib jetzt als ${name} im ${PLATTFORM_NAME[plattform]}-Chat: !verknüpfen ${d.code} (15 Minuten gültig). Danach diese Seite neu laden.`
        : (d.fehler || 'Das hat nicht geklappt.');
    } catch (err) { /* abgemeldet */ }
  });

  async function trennen(plattform) {
    if (beispiel) { ich.konten = ich.konten.filter((k) => k.plattform !== plattform); zeigen(ich); return; }
    try { await rufen('/ich/trennen', { plattform }); zeigen(await rufen('/ich')); } catch (e) { /* abgemeldet */ }
  }

  $('b-loeschen').addEventListener('click', () => { $('sicher').hidden = false; $('b-wirklich').focus(); });
  $('b-doch-nicht').addEventListener('click', () => { $('sicher').hidden = true; });
  $('b-wirklich').addEventListener('click', async () => {
    if (beispiel) { $('l-hinweis').textContent = 'Im Beispiel wird nichts gelöscht.'; $('sicher').hidden = true; return; }
    try {
      const d = await rufen('/ich/loeschen', { bestaetigen: true });
      if (d.ok) { vergessen(); abgemeldet('Dein Profil ist gelöscht. Morrígan vergisst dich. Du kannst das Ritual jederzeit neu beginnen.'); }
    } catch (e) { /* abgemeldet */ }
  });

  $('b-abmelden').addEventListener('click', async () => {
    if (!beispiel && api && schluessel) { try { await rufen('/ich/abmelden', {}); } catch (e) { /* egal */ } }
    vergessen(); abgemeldet('Du bist abgemeldet.');
  });

  laden();
})();
