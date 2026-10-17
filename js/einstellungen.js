// Einstellungen der Ritual-Seite.
window.NWU_SEITE = {
  // Adresse des Cloudflare Workers, z. B. 'https://nwu-anmeldung.nwu-brand.workers.dev'.
  // Leer = Demo-Modus: Die Seite funktioniert, speichert aber nichts und kann nicht bestätigt werden.
  api: '',

  // Chat-Befehl zum Bestätigen (Plan 5). Streamer.bot sollte beide Schreibweisen annehmen.
  befehl: '!bestätigen',
  befehlOhneUmlaut: '!bestaetigen',

  // So lange ist ein Code gültig (Minuten).
  codeGueltig: 15,

  plattformen: [
    { id: 'twitch',  name: 'Twitch' },
    { id: 'kick',    name: 'Kick' },
    { id: 'youtube', name: 'YouTube' },
    { id: 'tiktok',  name: 'TikTok' },
  ],
};
