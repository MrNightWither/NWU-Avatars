// Einstellungen der Ritual-Seite.
window.NWU_SEITE = {
  // Adresse des Cloudflare Workers, z. B. 'https://nwu-anmeldung.nwu-brand.workers.dev'.
  // Leer = Demo-Modus: Die Seite funktioniert, speichert aber nichts und kann nicht bestätigt werden.
  api: 'https://nwu-avatare.nwu-brand.workers.dev',

  // Chat-Befehl zum Bestätigen (Plan 5). Streamer.bot sollte beide Schreibweisen annehmen.
  befehl: '!bestätigen',
  befehlOhneUmlaut: '!bestaetigen',

  // So lange ist ein Code gültig (Minuten).
  codeGueltig: 15,

  // Links zu Impressum und Datenschutz (auf deiner Hauptseite), erscheinen unten auf jeder Seite. Leer = keine Links.
  impressum: 'https://impressum.nightwither.de',
  datenschutz: 'https://datenschutz.nightwither.de',

  // Ritual und Anmelden nur über Twitch. Kick und YouTube verknüpft man danach unter „Mein Profil“ (ich.html).
  // TikTok nie (dort gibt es keine Figuren, nur Zahlen für die Reise-Karte).
  plattformen: [
    { id: 'twitch',  name: 'Twitch' },
  ],
};
