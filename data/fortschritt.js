// Der ganze Stufenplan für die Website (stufen.html). Was schon funktioniert, verweist mit `id`
// auf NWU_FREISCHALTUNGEN in data/aussehen.js – dann gilt das Level von dort.
// Ohne `id` = geplant, wird auf der Seite als „bald“ gezeigt.
(function (ziel) {
  ziel.NWU_STUFENPLAN = [
    { level: 1,   name: 'Deine Gestalt',          text: 'Du trittst deinem Haus bei und erscheinst im Stream.', start: true },
    { id: 'abzeichen', name: 'Haus-Abzeichen',      text: 'Das Zeichen deines Hauses am Gürtel.' },
    { id: 'staub',                                text: 'Wo du gehst, wirbelt Staub auf.' },
    { id: 'haare',                                text: 'Silber, Schwarz, Braun, Blond, Rot, Kupfer, Weiß. Mit !haare <farbe>.' },
    { id: 'frisur',    name: 'Frisur wählen',       text: 'Seitenscheitel, Pferdeschwanz, Bob oder Glatze. Mit !frisur <name>.' },
    { id: 'funken',                               text: 'Funken in der Farbe deines Hauses folgen dir.' },
    { level: 12,  name: 'Gesten',                 text: 'Tanzen, verbeugen, schlafen legen – auf Befehl.' },
    { level: 15,  name: 'Umhangfarbe',            text: 'Dein Umhang in deiner Farbe.' },
    { id: 'frisuren2', name: 'Neue Frisuren',       text: 'Tolle, Dutt und Flechtzopf.' },
    { id: 'begleiter', name: 'Erster Begleiter',    text: 'Ein Rabe oder eine Katze läuft mit dir. Mit !begleiter <name>.' },
    { id: 'haare_selten',                         text: 'Blau, Lila, Grün und Rosa.' },
    { id: 'kopfschmuck', name: 'Kopfschmuck I',     text: 'Silberreif, Kapuze, Blumenkranz oder Federn. Mit !kopf <name>.' },
    { id: 'frisuren_alle', name: 'Alle Frisuren',   text: 'Alle 24 Frisuren, von Irokese bis Zwei Knoten.' },
    { level: 40,  name: 'Aura',                   text: 'Ein Leuchten in deiner Hausfarbe umgibt dich.' },
    { id: 'begleiter2', name: 'Zweiter Begleiter',  text: 'Wolfswelpe oder Fledermaus.' },
    { level: 50,  name: 'Titel',                  text: 'Ein Titel über deinem Namen.' },
    { level: 55,  name: 'Leuchtende Waffe',       text: 'Deine Waffe glüht in Hausfarbe.' },
    { id: 'kopfschmuck2', name: 'Kopfschmuck II',   text: 'Hörner, Maske, Augenklappe, Hexenhut oder Vogelschädel.' },
    { level: 65,  name: 'Spur deines Hauses',     text: 'Blutstropfen, Nebelschwaden, Flammen oder Mondstaub.' },
    { id: 'begleiter_selten', name: 'Seltene Begleiter', text: 'Ein Geisterlicht oder ein Feuersalamander.' },
    { level: 75,  name: 'Eigene Rüstungsfarbe',   text: 'Ein Akzent nur für dich.' },
    { id: 'kopfschmuck3', name: 'Kopfschmuck III',  text: 'Eisenkrone, Heiligenschein oder geisterhafte Geweihe.' },
    { level: 90,  name: 'Leuchtende Augen',       text: 'Man sieht dich auch im Dunkeln.' },
    { level: 100, name: 'Legende',                text: 'Goldener Umriss und dein eigenes Siegel, wenn du erscheinst.' },
    { level: 101, name: 'Aufstieg',               text: 'Zurück auf Level 1 – mit einem Stern, und alles bleibt freigeschaltet.', aufstieg: true },
  ].map((s) => {
    const f = s.id && (ziel.NWU_FREISCHALTUNGEN || []).find((x) => x.id === s.id);
    return f ? { ...s, level: f.level, name: s.name || f.name.replace(/\s*\(.*\)$/, ''), fertig: true } : { ...s, fertig: !!s.start };
  });
})(typeof window !== 'undefined' ? window : globalThis);
