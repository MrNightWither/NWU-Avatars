// Chronik: Haus-Pokal (Ruhm pro Haus diesen Monat) und die zehn Ruhmreichsten jedes Hauses.
// Ohne Worker werden Beispiel-Daten gezeigt (deutlich markiert).
'use strict';

(function () {
  const HAEUSER = window.NWU_AKTIVE_HAEUSER, SEITE = window.NWU_SEITE || {};
  const $ = (id) => document.getElementById(id);
  const q = new URLSearchParams(location.search);
  const api = (q.get('api') || SEITE.api || '').replace(/\/$/, '');
  const zahl = (n) => Number(n || 0).toLocaleString('de-DE');
  const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const monatName = (m) => { const [j, mm] = (m || '').split('-'); return mm ? `${MONATE[Number(mm) - 1]} ${j}` : ''; };
  const haus = (id) => HAEUSER.find((h) => h.id === id);

  function beispiel() {
    const namen = ['Nachtfalke', 'luna_lurkt', 'Ascheherz', 'Rabenkind', 'Silberklinge', 'ember_fox', 'Schattentanz', 'Mondwache', 'Nebelgeist', 'Glutfee'];
    const listen = {};
    HAEUSER.forEach((h, i) => {
      listen[h.id] = namen.slice(0, 7 - i).map((n, k) => ({ name: n + (i ? '_' + i : ''), figur: 'abcd'[(k + i) % 4], level: 18 - k * 2 - i, ruhm: 15300 - k * 2100 - i * 900 }));
    });
    const m = new Date().toISOString().slice(0, 7);
    return { pokal: { monat: m, haeuser: { haus1: 8420, haus2: 9130, haus3: 6210, haus4: 7780 }, fuehrend: 'haus2',
      vormonat: { monat: '', haeuser: {}, sieger: 'haus4' } }, listen };
  }

  function zeigen(d) {
    const p = d.pokal, max = Math.max(1, ...Object.values(p.haeuser));
    const fuehrend = haus(p.fuehrend);
    $('banner-text').textContent = fuehrend
      ? `${monatName(p.monat)}: Das ${fuehrend.name} führt. Wer am Monatsende vorne liegt, hisst sein Banner über der Zitadelle.`
      : `${monatName(p.monat)}: Noch hat kein Haus Ruhm gesammelt. Wer am Monatsende vorne liegt, hisst sein Banner über der Zitadelle.`;
    $('pokal').replaceChildren(...[...HAEUSER].sort((a, b) => (p.haeuser[b.id] || 0) - (p.haeuser[a.id] || 0)).map((h) => {
      const z = document.createElement('div');
      z.className = 'pokal-zeile' + (h.id === p.fuehrend ? ' vorne' : '');
      z.style.setProperty('--haus', h.css);
      const bild = document.createElement('img'); bild.src = h.wappenBild; bild.alt = '';
      const name = document.createElement('b'); name.textContent = h.kurz;
      const balken = document.createElement('div'); balken.className = 'balken';
      const span = document.createElement('span'); span.style.width = ((p.haeuser[h.id] || 0) / max * 100).toFixed(1) + '%';
      balken.append(span);
      const wert = document.createElement('span'); wert.className = 'wert'; wert.textContent = zahl(p.haeuser[h.id]);
      z.append(bild, name, balken, wert);
      return z;
    }));
    const sieger = haus(p.vormonat && p.vormonat.sieger);
    $('vormonat').textContent = sieger ? `Das Banner über der Zitadelle trägt das ${sieger.name} – Sieger des letzten Monats. Seine Mitglieder tragen im Stream eine Krone.` : '';

    $('listen').replaceChildren(...HAEUSER.map((h) => {
      const k = document.createElement('section');
      k.className = 'karte liste';
      k.style.setProperty('--haus', h.css);
      const t = document.createElement('h3'); t.textContent = h.name;
      const ol = document.createElement('ol');
      const eintraege = d.listen[h.id] || [];
      if (!eintraege.length) {
        const leer = document.createElement('p'); leer.className = 'leer'; leer.textContent = 'Noch keine Namen in der Chronik.';
        k.append(t, leer); return k;
      }
      eintraege.forEach((e, i) => {
        const li = document.createElement('li');
        const nr = document.createElement('span'); nr.className = 'platz'; nr.textContent = i + 1;
        const img = document.createElement('img'); img.src = `assets/figur-${h.id}-${e.figur}.webp`; img.alt = ''; img.loading = 'lazy';
        const name = document.createElement('span'); name.className = 'name'; name.textContent = e.name;
        const lv = document.createElement('span'); lv.className = 'lv'; lv.textContent = 'Lv ' + e.level;
        li.append(nr, img, name, lv);
        li.title = zahl(e.ruhm) + ' Ruhm';
        ol.append(li);
      });
      k.append(t, ol);
      return k;
    }));
  }

  async function laden() {
    if (!api) { $('beispiel').hidden = false; zeigen(beispiel()); return; }
    try {
      zeigen(await (await fetch(api + '/chronik', { credentials: 'omit' })).json());
    } catch (e) {
      $('banner-text').textContent = 'Morrígan ist gerade nicht erreichbar. Versuch es später nochmal.';
    }
  }
  laden();
})();
