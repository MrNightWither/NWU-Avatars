// Ritual-Seite: Quiz → Haus → Gestalt → Bindung per Chat-Code (Plan 3, 5, 11)
'use strict';

(function () {
  const HAEUSER = window.NWU_HAEUSER, FIGUREN = window.NWU_FIGUREN, QUIZ = window.NWU_QUIZ;
  const SEITE = window.NWU_SEITE, GRAFIK = window.NWU_GRAFIK;
  const FILM = window.NWU_FILM, TON = window.NWU_TON;
  const warte = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (id) => document.getElementById(id);
  const SPEICHER = 'nwu-ritual-v1';

  // ---------- Fortschritt merken (überlebt Neuladen, z. B. beim Wechsel in den Chat) ----------
  let st = laden() || {};
  function laden() {
    try { return JSON.parse(localStorage.getItem(SPEICHER)); } catch (e) { return null; }
  }
  function sichern() {
    try { localStorage.setItem(SPEICHER, JSON.stringify(st)); } catch (e) { /* privat-Modus: egal */ }
  }

  const haus = () => HAEUSER.find((h) => h.id === st.haus);
  const mischen = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function zeige(id) {
    document.querySelectorAll('.schritt').forEach((s) => { s.hidden = s.id !== id; });
    const fokus = document.querySelector('#' + id + ' [tabindex="-1"]');
    if (fokus) fokus.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function hausfarbeSetzen() {
    const h = haus();
    document.documentElement.style.setProperty('--haus', h ? h.css : '#c9a84c');
  }

  async function api(pfad, optionen) {
    const res = await fetch(SEITE.api.replace(/\/$/, '') + pfad, {
      ...optionen,
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
    });
    const daten = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(daten.fehler || 'Serverfehler'), { status: res.status });
    return daten;
  }

  // ---------- 1. Start ----------
  $('b-start').addEventListener('click', () => {
    st = { fragen: mischen(QUIZ.fragen).slice(0, QUIZ.runden).map((f) => f.id), antworten: [] };
    sichern();
    FILM.vorladen();
    frageZeigen(true);
  });

  // ---------- Ton: startet beim ersten Klick, Knopf oben rechts ----------
  const tonKnopf = $('ton');
  tonKnopf.hidden = false;
  const tonAnzeigen = () => {
    tonKnopf.setAttribute('aria-pressed', String(TON.istStumm()));
    tonKnopf.setAttribute('aria-label', TON.istStumm() ? 'Ton an' : 'Ton aus');
  };
  tonAnzeigen();
  document.addEventListener('pointerdown', () => TON.start(), { once: true });
  document.addEventListener('keydown', () => TON.start(), { once: true });
  tonKnopf.addEventListener('click', () => { TON.start(); TON.stummSchalten(); tonAnzeigen(); });

  // ---------- 2. Fragen ----------
  async function frageZeigen(mitFilm) {
    const nr = st.antworten.length;
    const flug = mitFilm ? FILM.frage(nr) : FILM.imGebiet(FILM.gebietFuerFrage(nr), 2);
    if (mitFilm) await warte(470);          // Oberfläche ist ausgeblendet, jetzt Inhalt tauschen
    const frage = QUIZ.fragen.find((f) => f.id === st.fragen[nr]);
    $('zaehler').textContent = `Frage ${nr + 1} von ${st.fragen.length}`;
    $('balken').style.width = (100 * nr / st.fragen.length) + '%';
    $('t-frage').textContent = frage.frage;

    const box = $('antworten');
    box.classList.remove('gesperrt');
    box.replaceChildren(...mischen(frage.antworten).map((a) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'antwort';
      b.textContent = a.text;
      b.addEventListener('click', () => antworten(a.id, b));
      return b;
    }));
    zeige('s-quiz');
    await flug;
    $('t-frage').focus({ preventScroll: true });
  }

  async function antworten(antwortId, knopf) {
    $('antworten').classList.add('gesperrt');
    knopf.classList.add('gewaehlt');
    TON.klick();
    st.antworten.push(antwortId);
    sichern();
    await new Promise((r) => setTimeout(r, 380));
    if (st.antworten.length < st.fragen.length) { frageZeigen(true); return; }
    $('balken').style.width = '100%';
    await verkuenden();
  }

  // ---------- 3. Verkündung ----------
  async function verkuenden() {
    let belegung = null;
    if (SEITE.api) {
      try { belegung = await api('/avatare/belegung'); } catch (e) { /* ohne Belegung weiter */ }
    }
    st.haus = window.NWU_AUSWERTEN(QUIZ, st.antworten, belegung).haus;
    st.spruch = Math.floor(Math.random() * 3);
    sichern();
    await hausZeigen(true);
  }

  async function hausZeigen(mitFilm) {
    const h = haus();
    hausfarbeSetzen();
    if (mitFilm) await FILM.verkuenden(h.id); else await FILM.imGebiet(h.id, 2);
    $('wappen').replaceChildren(GRAFIK.wappen(h));
    $('t-haus').textContent = h.name;
    $('wesen').textContent = h.wesen;
    $('spruch').textContent = h.sprueche[st.spruch % h.sprueche.length];
    zeige('s-haus');
  }

  $('b-zur-figur').addEventListener('click', () => { FILM.abdunkeln(3); figurenZeigen(); zeige('s-figur'); });

  // ---------- 4. Gestalt ----------
  function figurenZeigen() {
    const h = haus();
    $('figur-haus').textContent = h.name;
    $('figuren').replaceChildren(...FIGUREN.map((f) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'figur';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(st.figur === f.id));
      const bild = document.createElement('div');
      bild.append(GRAFIK.figur(h, f.id));
      const name = document.createElement('b'); name.textContent = f.typ;
      const text = document.createElement('small'); text.textContent = f.text;
      b.append(bild, name, text);
      b.addEventListener('click', () => {
        st.figur = f.id; sichern();
        document.querySelectorAll('.figur').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
        $('b-zur-bindung').disabled = false;
      });
      return b;
    }));
    $('b-zur-bindung').disabled = !st.figur;
  }

  $('b-zur-bindung').addEventListener('click', () => { bindungZeigen(); zeige('s-bindung'); });

  // ---------- 5. Bindung ----------
  function bindungZeigen() {
    const sel = $('plattform');
    if (!sel.options.length) {
      for (const p of SEITE.plattformen) sel.add(new Option(p.name, p.id));
    }
    if (st.plattform) sel.value = st.plattform;
    if (st.name) $('name').value = st.name;
    $('name-fehler').textContent = '';
  }

  $('name').addEventListener('input', () => { $('name-fehler').textContent = ''; });

  function nameGueltig(plattform, name) {
    if (plattform === 'twitch' || plattform === 'kick') return /^[A-Za-z0-9_]{3,25}$/.test(name);
    if (plattform === 'tiktok') return /^[A-Za-z0-9_.]{2,24}$/.test(name);
    return name.length >= 2 && name.length <= 40 && !/[<>]/.test(name);
  }

  $('b-code').addEventListener('click', async () => {
    const plattform = $('plattform').value;
    const name = $('name').value.trim().replace(/^@/, '');
    if (!nameGueltig(plattform, name)) {
      $('name-fehler').textContent = 'Bitte gib deinen Namen genau so ein, wie er im Chat steht.';
      $('name').focus();
      return;
    }
    st.plattform = plattform; st.name = name; sichern();

    const knopf = $('b-code');
    knopf.disabled = true;
    try {
      if (SEITE.api) {
        const d = await api('/avatare/anmeldung', {
          method: 'POST',
          body: JSON.stringify({ plattform, name, figur: st.figur, fragen: st.fragen, antworten: st.antworten }),
        });
        st.anmeldung = { id: d.id, code: d.code, bis: Date.parse(d.gueltigBis) };
        // Der Server rechnet das Haus selbst nach – sein Ergebnis gilt.
        if (d.haus && d.haus !== st.haus) { st.haus = d.haus; hausfarbeSetzen(); }
      } else {
        st.anmeldung = { id: null, code: String(1000 + Math.floor(Math.random() * 9000)), bis: Date.now() + SEITE.codeGueltig * 60000 };
      }
      sichern();
      codeZeigen();
    } catch (e) {
      $('name-fehler').textContent = e.status === 409
        ? 'Dieser Name ist schon an eine Gestalt gebunden.'
        : 'Das hat nicht geklappt. Versuch es gleich noch einmal.';
    } finally {
      knopf.disabled = false;
    }
  });

  // ---------- 6. Code ----------
  let uhr = null, abfrage = null;
  function codeZeigen() {
    const a = st.anmeldung;
    const befehl = `${SEITE.befehl} ${a.code}`;
    $('befehl').textContent = befehl;
    $('code-text').textContent =
      `Schreibe diesen Befehl als ${st.name} im ${SEITE.plattformen.find((p) => p.id === st.plattform).name}-Chat. ` +
      `Ohne Umlaut geht auch: ${SEITE.befehlOhneUmlaut} ${a.code}`;
    $('demo').hidden = !!SEITE.api;
    $('b-neu-code').hidden = true;
    $('kopiert').textContent = '';
    zeige('s-code');

    clearInterval(uhr);
    const ticken = () => {
      const rest = Math.max(0, a.bis - Date.now());
      if (rest === 0) {
        $('frist').textContent = 'Der Code ist abgelaufen.';
        $('b-neu-code').hidden = false;
        clearInterval(uhr); clearInterval(abfrage);
        return;
      }
      const m = Math.floor(rest / 60000), s = Math.floor(rest / 1000) % 60;
      $('frist').textContent = `Gültig noch ${m}:${String(s).padStart(2, '0')} Minuten. Diese Seite merkt automatisch, wenn es geklappt hat.`;
    };
    ticken();
    uhr = setInterval(ticken, 1000);

    clearInterval(abfrage);
    if (SEITE.api && a.id) {
      abfrage = setInterval(async () => {
        try {
          const d = await api('/avatare/anmeldung/' + encodeURIComponent(a.id));
          if (d.status === 'bestaetigt') { clearInterval(abfrage); clearInterval(uhr); st.fertig = true; sichern(); fertigZeigen(); }
          if (d.status === 'abgelaufen') { st.anmeldung.bis = 0; }
        } catch (e) { /* nächster Versuch */ }
      }, 4000);
    }
  }

  $('befehl').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('befehl').textContent);
      $('kopiert').textContent = 'Kopiert. Jetzt im Chat einfügen.';
    } catch (e) {
      $('kopiert').textContent = 'Kopieren ging nicht. Bitte abtippen.';
    }
  });

  $('b-neu-code').addEventListener('click', () => { st.anmeldung = null; sichern(); bindungZeigen(); zeige('s-bindung'); });

  // ---------- 7. Fertig ----------
  function fertigZeigen() {
    const h = haus();
    hausfarbeSetzen();
    $('wappen-fertig').replaceChildren(GRAFIK.wappen(h));
    $('t-fertig').textContent = 'Willkommen';
    $('fertig-text').textContent = `${st.name}, du gehörst jetzt zum ${h.name}.`;
    $('figur-fertig').replaceChildren(GRAFIK.figur(h, st.figur));
    zeige('s-fertig');
  }

  // ---------- Wiedereinstieg ----------
  const imHaus = () => { hausfarbeSetzen(); FILM.imGebiet(st.haus, 3); };
  if (st.fertig && st.haus) { imHaus(); fertigZeigen(); }
  else if (st.anmeldung && st.anmeldung.bis > Date.now()) { imHaus(); codeZeigen(); }
  else if (st.figur && st.haus) { imHaus(); bindungZeigen(); zeige('s-bindung'); }
  else if (st.haus) hausZeigen(false);
  else if (st.fragen && st.antworten && st.antworten.length < st.fragen.length) frageZeigen(false);
  else FILM.start();
})();
