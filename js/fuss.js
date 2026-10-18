// Fußzeile mit Impressum und Datenschutz (Adressen in js/einstellungen.js). Fehlen sie, bleibt die Zeile leer.
'use strict';

(function () {
  const S = window.NWU_SEITE || {};
  const links = [['Impressum', S.impressum], ['Datenschutz', S.datenschutz]].filter(([, url]) => /^https:\/\//.test(url || ''));
  if (!links.length || new URLSearchParams(location.search).has('szene')) return;   // nicht in OBS-Szenen
  const fuss = document.createElement('footer');
  fuss.className = 'fuss-links';
  Object.assign(fuss.style, { textAlign: 'center', padding: '24px 16px 32px', fontSize: '0.8rem', position: 'relative', zIndex: '1' });
  links.forEach(([name, url], i) => {
    if (i) fuss.append(' · ');
    const a = document.createElement('a');
    a.href = url; a.textContent = name; a.rel = 'noopener';
    Object.assign(a.style, { color: '#8f8a80', textDecoration: 'none' });
    fuss.append(a);
  });
  const ziel = () => {
    // Seiten ohne Scrollen (Ritual-Film): klein unten rechts festhalten, sonst normal am Seitenende
    if (document.documentElement.scrollHeight <= innerHeight + 2) {
      Object.assign(fuss.style, { position: 'fixed', right: '12px', bottom: '8px', padding: '0', zIndex: '5' });
    }
    document.body.append(fuss);
  };
  if (document.body) ziel(); else document.addEventListener('DOMContentLoaded', ziel);
})();
