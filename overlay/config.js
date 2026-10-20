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
    // 20.10.2026 aus den Overlays ausgerechnet (1920x1080): Cam-Rahmen 500x220
    gaming:   { x: 0.0208, y: 0.7593, w: 0.2604, h: 0.2037 },   // overlay-gaming-cam-unten-links: links 40, unten 40
    shooter:  { x: 0.7188, y: 0.3981, w: 0.2604, h: 0.2037 },   // overlay-gaming-cam-rechts-mitte: rechts 40, Mitte
    // ohne Cam: aufrecht am Boden über der Fußleiste/dem Befehle-Feld (bis vor die Figur rechts unten),
    // ab und zu per Portal kopfüber an der goldenen Linie unter „MRNIGHTWITHER“ (Wunsch 20.10.2026)
    nocam:    { linien: [ { x0: 0.010, x1: 0.815, y: 0.974 }, { x0: 0.812, x1: 0.979, y: 0.131, kopf: true } ] },
  },
  // OBS-Szene → Laufweg. Eine Browserquelle in allen drei Szenen; bei Szenenwechsel springt der Laufweg um.
  obsSzenen: { Gaming: 'gaming', Shooter: 'shooter', NoCam: 'nocam' },

  // Twitch-Kanal, dessen Chat mitgelesen wird (leer = Demo-Figuren). Auch per ?kanal=… möglich.
  kanal: 'mrnightwither',
  // Adresse des Workers nwu-avatare (leer = Chatter bekommen eine zufällige Figur).
  api: 'https://nwu-avatare.nwu-brand.workers.dev',
  // Name(n) des Bot-Kontos, über das Streamer.bot schreibt (klein geschrieben), z. B. ['nwu_bot'].
  // Deren Nachrichten erzeugen keine Figur, „✨ @Name steigt auf …“ löst den Level-Up-Effekt aus.
  botNamen: ['nwu_morrigan'],

  // Anwesenheit (Plan 6): so lange bleibt eine Figur nach der letzten Nachricht / !lurk
  anwesenheitMinuten: 15,
  // Mods (Wächter) bleiben länger; mit !wache bis zum Ende
  waechterMinuten: 120,

  // Flüstern aus dem Westen: ungefähr alle X Minuten (zufällig ±40 %), 0 = aus. Taste W zum Testen.
  fluesternMinuten: 25,

  // Spiele im Overlay. Start per Chat: !rennen, !tauziehen [haus] [haus], !letzter, !schatz, !rabe
  // starter: 'mods' = Streamer und Mods dürfen starten, 'streamer' = nur der Streamer. Tasten zum Testen siehe Anzeige.
  spiele: {
    starter: 'mods',
    zufallMinuten: 30,          // Rennen, Tauziehen, Letzter steht oder Schatzsuche starten ungefähr alle X Minuten von allein, 0 = nur per Befehl
    zufallAb: 3,                // … aber nur, wenn mindestens so viele Figuren da sind
    rabeMinuten: 15,            // Fang den Raben kommt von allein ungefähr alle X Minuten (±40 %), 0 = nur per Befehl
    rabeSekunden: 14,           // so lange fliegt er durchs Bild
    rennenSekunden: 120,        // spätestens dann gewinnt, wer vorne liegt
    tauziehenSekunden: 60,
    letzterAnmeldung: 45,       // Sekunden für !dabei
    schatzSekunden: 60,
    wurfSchattenMinuten: 5,     // Würfel: bei einer 1 so lange ohne Gestalt
    aktion: 'NWU Spiel',        // Name der Aktion in Streamer.bot, die den Ruhm bucht
  },
  // WebSocket-Server von Streamer.bot (Servers/Clients → WebSocket Server, Autostart, ohne Passwort, nur 127.0.0.1),
  // z. B. 'ws://127.0.0.1:8080/'. Leer = Spiele laufen nur zum Spaß, ohne Ruhm. Auch per ?sb=… möglich.
  streamerbot: 'ws://127.0.0.1:8080/',

  // Großes Portal: automatisch alle X Minuten (0 = nur per Taste P), Dauer auf dem Terrain
  portal: { alleMinuten: 20, dauerSekunden: 150 },

  // Figuren (Seitenansicht, Blick nach rechts), Größe im Stream in Pixeln.
  // bild = Stufe 1 (ein Bild). rig = Stufe 2 (Teile mit Gelenken aus rigs.js), wenn vorhanden.
  // Mit ?stufe1 in der Adresse laufen alle als Einzelbild.
  figurHoehe: 56,
  // Besucher: Figuren für alle, die (noch) kein Ritual gemacht haben – Reisemantel, keine Waffe.
  // Mehrere Einträge = jede Person bekommt fest eine davon. Leere Liste = Silhouette.
  besucher: [
    { bild: 'figuren/besucher.webp', rig: 'besucher' },
    { bild: 'figuren/besucherin.webp', rig: 'besucherin' },
  ],
  // Alle 4 Häuser nutzen dieselben 4 Grundfiguren, umgefärbt (tools/umfaerben.py).
  figuren: ['haus1', 'haus2', 'haus3', 'haus4'].flatMap((haus) => ['a', 'b', 'c', 'd'].map((typ) => (
    { haus, typ, bild: `figuren/${haus}-${typ}.webp`, rig: `${haus}-${typ}` }))),

  // Die 6 Häuser kommen aus data/haeuser.js (eine Quelle für Website und Overlay).
  haeuser: window.NWU_HAEUSER,
};
