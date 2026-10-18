// Der ganze Stufenplan für die Website (stufen.html). Was schon funktioniert, verweist mit `id`
// auf NWU_FREISCHALTUNGEN in data/aussehen.js – dann gilt das Level von dort.
// Ohne `id` = geplant, wird auf der Seite als „bald“ gezeigt.
(function (ziel) {
  ziel.NWU_STUFENPLAN = [
    { level: 1,   name: 'Deine Gestalt',          text: 'Du trittst deinem Haus bei und erscheinst im Stream.', start: true },
    { level: 2,   name: 'Haus-Abzeichen',         text: 'Das Zeichen deines Hauses am Gürtel.' },
    { id: 'staub',                                text: 'Wo du gehst, wirbelt Staub auf.' },
    { id: 'haare',                                text: 'Silber, Schwarz, Braun, Blond, Rot, Kupfer, Weiß. Mit !haare <farbe>.' },
    { level: 8,   name: 'Frisur wählen',          text: 'Die ersten drei Frisuren.' },
    { id: 'funken',                               text: 'Funken in der Farbe deines Hauses folgen dir.' },
    { level: 12,  name: 'Gesten',                 text: 'Tanzen, verbeugen, schlafen legen – auf Befehl.' },
    { level: 15,  name: 'Umhangfarbe',            text: 'Dein Umhang in deiner Farbe.' },
    { level: 18,  name: 'Neue Frisuren',          text: 'Drei weitere Frisuren.' },
    { level: 20,  name: 'Erster Begleiter',       text: 'Ein Rabe oder eine Katze läuft mit dir.' },
    { id: 'haare_selten',                         text: 'Blau, Lila, Grün und Rosa.' },
    { level: 30,  name: 'Kopfschmuck I',          text: 'Ein silberner Reif oder eine Kapuze.' },
    { level: 35,  name: 'Alle Frisuren',          text: 'Jede Frisur aus dem zweiten Buch.' },
    { level: 40,  name: 'Aura',                   text: 'Ein Leuchten in deiner Hausfarbe umgibt dich.' },
    { level: 45,  name: 'Zweiter Begleiter',      text: 'Wolfswelpe oder Fledermaus.' },
    { level: 50,  name: 'Titel',                  text: 'Ein Titel über deinem Namen.' },
    { level: 55,  name: 'Leuchtende Waffe',       text: 'Deine Waffe glüht in Hausfarbe.' },
    { level: 60,  name: 'Kopfschmuck II',         text: 'Hörner oder eine Maske.' },
    { level: 65,  name: 'Spur deines Hauses',     text: 'Blutstropfen, Nebelschwaden, Flammen oder Mondstaub.' },
    { level: 70,  name: 'Seltene Begleiter',      text: 'Ein Geisterlicht oder ein Feuersalamander.' },
    { level: 75,  name: 'Eigene Rüstungsfarbe',   text: 'Ein Akzent nur für dich.' },
    { level: 80,  name: 'Kopfschmuck III',        text: 'Eisenkrone oder Heiligenschein.' },
    { level: 90,  name: 'Leuchtende Augen',       text: 'Man sieht dich auch im Dunkeln.' },
    { level: 100, name: 'Legende',                text: 'Goldener Umriss und dein eigenes Siegel, wenn du erscheinst.' },
    { level: 101, name: 'Aufstieg',               text: 'Zurück auf Level 1 – mit einem Stern, und alles bleibt freigeschaltet.', aufstieg: true },
  ].map((s) => {
    const f = s.id && (ziel.NWU_FREISCHALTUNGEN || []).find((x) => x.id === s.id);
    return f ? { ...s, level: f.level, name: s.name || f.name.replace(/\s*\(.*\)$/, ''), fertig: true } : { ...s, fertig: !!s.start };
  });
})(typeof window !== 'undefined' ? window : globalThis);
