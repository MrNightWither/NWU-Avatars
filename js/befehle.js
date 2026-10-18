// Befehlsseite: alle Chat-Befehle aus data/befehle.js
'use strict';

(function () {
  const WER = { waechter: 'Nur Mods', koenig: 'Nur der Streamer' };
  const liste = document.getElementById('liste');
  for (const g of window.NWU_BEFEHLE) {
    const karte = document.createElement('section');
    karte.className = 'karte';
    const h = document.createElement('h2');
    h.textContent = g.gruppe;
    if (g.wer) { const m = document.createElement('span'); m.className = 'marke'; m.textContent = WER[g.wer]; h.append(' ', m); }
    const dl = document.createElement('dl');
    dl.className = 'befehle';
    for (const b of g.befehle) {
      const dt = document.createElement('dt');
      const code = document.createElement('code'); code.textContent = b.befehl;
      dt.append(code);
      const dd = document.createElement('dd');
      dd.textContent = b.text;
      if (b.z) { const z = document.createElement('span'); z.className = 'beispiel'; z.textContent = ' Beispiel: ' + b.z; dd.append(z); }
      dl.append(dt, dd);
    }
    karte.append(h, dl);
    liste.append(karte);
  }
})();
