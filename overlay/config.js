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

  // Platzhalter für die 6 Häuser. Namen, Wappen und Farben kommen später (Plan 15.1).
  haeuser: [
    { id: 'haus1', name: 'Haus 1 (Mond)',   farbe: 0x8fa8d8 },
    { id: 'haus2', name: 'Haus 2 (Blut)',   farbe: 0xb3122e },
    { id: 'haus3', name: 'Haus 3 (Nebel)',  farbe: 0x8a8f99 },
    { id: 'haus4', name: 'Haus 4 (Flamme)', farbe: 0xe0672b },
    { id: 'haus5', name: 'Haus 5 (Dornen)', farbe: 0x4f8a3c },
    { id: 'haus6', name: 'Haus 6 (Raben)',  farbe: 0x5b4b8a },
  ],
};
