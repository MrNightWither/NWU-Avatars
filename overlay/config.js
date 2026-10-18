// Zentrale Einstellungen fürs Overlay (Plan Abschnitt 12: "Einstellungen zentral").
// Alles hier lässt sich zusätzlich per URL überschreiben, z. B. perf-test.html?n=25&fps=30
window.NWU_CONFIG = {
  // Bildrate des Overlays. 30 reicht laut Plan und spart Leistung.
  fps: 30,

  // Obergrenze sichtbarer Figuren im normalen Betrieb.
  maxFiguren: 30,

  // Partikel (Auren, Funken). Budget = maximale Anzahl gleichzeitig.
  partikel: true,
  partikelMax: 400,

  // Sparmodus (Hotkey S): weniger Figuren, keine Partikel, einfaches Portal.
  sparmodus: { maxFiguren: 10, partikel: false },

  // Kamera-Rahmen pro OBS-Szene, als Anteil von 1920x1080 (x, y, Breite, Höhe).
  // Die Figuren laufen auf diesem Rechteck entlang.
  szenen: {
    standard: { x: 0.70, y: 0.06, w: 0.27, h: 0.30 },
    gross:    { x: 0.55, y: 0.05, w: 0.42, h: 0.45 },
    unten:    { x: 0.03, y: 0.62, w: 0.25, h: 0.30 },
  },

  // Stufe 1: fertige Figurenbilder (Seitenansicht, Blick nach rechts), Größe im Stream in Pixeln
  figurHoehe: 56,
  figuren: [
    { haus: 'haus1', typ: 'a', bild: 'figuren/haus1-a.webp' },
    { haus: 'haus1', typ: 'b', bild: 'figuren/haus1-b.webp' },
    { haus: 'haus1', typ: 'c', bild: 'figuren/haus1-c.webp' },
    { haus: 'haus1', typ: 'd', bild: 'figuren/haus1-d.webp' },
  ],

  // Die 6 Häuser kommen aus data/haeuser.js (eine Quelle für Website und Overlay).
  haeuser: window.NWU_HAEUSER,
};
