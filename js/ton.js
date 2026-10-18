// Ton der Website – komplett im Browser erzeugt (Web Audio), keine Dateien nötig.
// Startet erst nach dem ersten Klick (Browser-Regel). Stumm-Knopf merkt sich die Wahl.
// Später können echte Musik/Geräusche die Synth-Klänge ersetzen.
'use strict';

(function () {
  const SPEICHER = 'nwu-ton-aus';
  let ctx = null, master = null;
  let stumm = false;
  try { stumm = localStorage.getItem(SPEICHER) === '1'; } catch (e) { /* egal */ }

  function rauschen(sek) {
    const b = ctx.createBuffer(1, ctx.sampleRate * sek, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  // Dunkler Klangteppich: tiefe, leicht verstimmte Töne + Wind
  function teppich() {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 380; filter.Q.value = 3;
    const lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
    lfo.frequency.value = 0.05; lfoGain.gain.value = 160;
    lfo.connect(lfoGain).connect(filter.frequency); lfo.start();

    const g = ctx.createGain(); g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 4);
    filter.connect(g).connect(master);
    [55, 55.4, 82.4, 110.3].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i < 2 ? 'sawtooth' : 'triangle';
      o.frequency.value = f;
      o.connect(filter); o.start();
    });

    const wind = ctx.createBufferSource(); wind.buffer = rauschen(4); wind.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 0.7;
    const wg = ctx.createGain(); wg.gain.value = 0.018;
    const wl = ctx.createOscillator(), wlg = ctx.createGain();
    wl.frequency.value = 0.08; wlg.gain.value = 250;
    wl.connect(wlg).connect(bp.frequency); wl.start();
    wind.connect(bp).connect(wg).connect(master); wind.start();
  }

  function start() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = stumm ? 0 : 0.9;
    master.connect(ctx.destination);
    teppich();
  }

  // Luftzug bei Kamerafahrten
  function wusch(sek) {
    if (!ctx) return;
    const t = ctx.currentTime, n = ctx.createBufferSource();
    n.buffer = rauschen(sek + 0.2);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(250, t);
    bp.frequency.exponentialRampToValueAtTime(1800, t + sek * 0.5);
    bp.frequency.exponentialRampToValueAtTime(300, t + sek);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.12, t + sek * 0.45);
    g.gain.linearRampToValueAtTime(0, t + sek);
    n.connect(bp).connect(g).connect(master); n.start(t); n.stop(t + sek + 0.2);
  }

  // Tiefer Schlag vor der Verkündung
  function donner() {
    if (!ctx) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(32, t + 1.6);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.45, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    o.connect(g).connect(master); o.start(t); o.stop(t + 2.3);
  }

  // Heller Glockenklang bei der Enthüllung des Hauses
  function glocke() {
    if (!ctx) return;
    const t = ctx.currentTime;
    [[220, 0.16], [330, 0.1], [440, 0.08], [587, 0.05], [880, 0.03]].forEach(([f, v]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 4);
      o.connect(g).connect(master); o.start(t); o.stop(t + 4.1);
    });
  }

  // Leises Ticken bei einer Antwort
  function klick() {
    if (!ctx) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = 660;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.connect(g).connect(master); o.start(t); o.stop(t + 0.3);
  }

  function stummSchalten() {
    stumm = !stumm;
    try { localStorage.setItem(SPEICHER, stumm ? '1' : '0'); } catch (e) { /* egal */ }
    if (master) master.gain.setTargetAtTime(stumm ? 0 : 0.9, ctx.currentTime, 0.15);
    return stumm;
  }

  window.NWU_TON = { start, wusch, donner, glocke, klick, stummSchalten, istStumm: () => stumm };
})();
