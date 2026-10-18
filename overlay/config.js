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

  // Twitch-Kanal, dessen Chat mitgelesen wird (leer = Demo-Figuren). Auch per ?kanal=… möglich.
  kanal: '',
  // Adresse des Workers nwu-avatare (leer = Chatter bekommen eine zufällige Figur).
  api: '',

  // Anwesenheit (Plan 6): so lange bleibt eine Figur nach der letzten Nachricht / !lurk
  anwesenheitMinuten: 15,
  // Mods (Wächter) bleiben länger; mit !wache bis zum Ende
  waechterMinuten: 120,

  // Großes Portal: automatisch alle X Minuten (0 = nur per Taste P), Dauer auf dem Terrain
  portal: { alleMinuten: 20, dauerSekunden: 150 },

  // Figuren (Seitenansicht, Blick nach rechts), Größe im Stream in Pixeln.
  // bild = Stufe 1 (ein Bild). rig = Stufe 2 (Teile mit Gelenken aus rigs.js), wenn vorhanden.
  // Mit ?stufe1 in der Adresse laufen alle als Einzelbild.
  figurHoehe: 56,
  figuren: [
    { haus: 'haus1', typ: 'a', bild: 'figuren/haus1-a.webp', rig: 'haus1-a' },
    { haus: 'haus1', typ: 'b', bild: 'figuren/haus1-b.webp', rig: 'haus1-b' },
    { haus: 'haus1', typ: 'c', bild: 'figuren/haus1-c.webp', rig: 'haus1-c' },
    { haus: 'haus1', typ: 'd', bild: 'figuren/haus1-d.webp', rig: 'haus1-d' },
  ],

  // Die 6 Häuser kommen aus data/haeuser.js (eine Quelle für Website und Overlay).
  haeuser: window.NWU_HAEUSER,
};
