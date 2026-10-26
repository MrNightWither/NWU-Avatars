// Aussehen der Figuren: Haarfarben und was mit welchem Level freigeschaltet wird.
// Eine Quelle für Overlay und Worker.
// Die Haare sind im Overlay eine eigene silberne Ebene und werden mit der Farbe eingefärbt (multipliziert).
(function (ziel) {
  ziel.NWU_HAARFARBEN = {
    silber:  { name: 'Silber',  farbe: 0xffffff },
    weiss:   { name: 'Weiß',    farbe: 0xffffff, hell: true },
    schwarz: { name: 'Schwarz', farbe: 0x55505a },
    braun:   { name: 'Braun',   farbe: 0xb07a52 },
    blond:   { name: 'Blond',   farbe: 0xffe39a },
    rot:     { name: 'Rot',     farbe: 0xe0573f },
    kupfer:  { name: 'Kupfer',  farbe: 0xf08a3c },
    blau:    { name: 'Blau',    farbe: 0x7fa6ff, selten: true },
    lila:    { name: 'Lila',    farbe: 0xb88cff, selten: true },
    gruen:   { name: 'Grün',    farbe: 0x8fd18a, selten: true },
    rosa:    { name: 'Rosa',    farbe: 0xff9cc8, selten: true },
  };

  // Standard-Haarfarbe je Haus (solange jemand noch keine eigene gewählt hat)
  ziel.NWU_HAARE_STANDARD = { haus1: 'silber', haus2: 'schwarz', haus3: 'weiss', haus4: 'rot' };

  // Freischaltungen nach Level. Der ganze Plan bis Level 100 steht in docs/FORTSCHRITT.md,
  // hier stehen nur die, die schon funktionieren.
  ziel.NWU_FREISCHALTUNGEN = [
    { level: 2,  id: 'abzeichen',        name: 'Haus-Abzeichen' },
    { level: 3,  id: 'staub',            name: 'Staubspur beim Laufen' },
    { level: 5,  id: 'haare',            name: 'Haarfarbe wählen (!nwu haare <farbe>)' },
    { level: 8,  id: 'frisur',           name: 'Frisur wählen (!nwu frisur <name>)' },
    { level: 10, id: 'funken',           name: 'Funkenspur in Hausfarbe' },
    { level: 18, id: 'frisuren2',        name: 'Neue Frisuren' },
    { level: 20, id: 'begleiter',        name: 'Erster Begleiter (!nwu begleiter <name>)' },
    { level: 25, id: 'haare_selten',     name: 'Seltene Haarfarben (Blau, Lila, Grün, Rosa)' },
    { level: 30, id: 'kopfschmuck',      name: 'Kopfschmuck I (!nwu kopf <name>)' },
    { level: 35, id: 'frisuren_alle',    name: 'Alle Frisuren' },
    { level: 45, id: 'begleiter2',       name: 'Zweiter Begleiter' },
    { level: 60, id: 'kopfschmuck2',     name: 'Kopfschmuck II' },
    { level: 70, id: 'begleiter_selten', name: 'Seltene Begleiter' },
    { level: 80, id: 'kopfschmuck3',     name: 'Kopfschmuck III' },
  ];

  // Frisuren (Bilder: overlay/frisuren/<id>.webp, eingefärbt mit der Haarfarbe), Kopfschmuck und Begleiter.
  // ab = welche Freischaltung sie braucht. Beim Schatten (Kapuze) bleibt die Frisur verborgen.
  ziel.NWU_FRISUREN = {
    f01: { name: 'Seitenscheitel', ab: 'frisur' },   f10: { name: 'Pferdeschwanz', ab: 'frisur' },
    f20: { name: 'Bob', ab: 'frisur' },              glatze: { name: 'Glatze', ab: 'frisur' },
    f05: { name: 'Tolle', ab: 'frisuren2' },         f12: { name: 'Dutt', ab: 'frisuren2' },
    f22: { name: 'Flechtzopf', ab: 'frisuren2' },
    f02: { name: 'Kurze Locken', ab: 'frisuren_alle' }, f03: { name: 'Lang und glatt', ab: 'frisuren_alle' },
    f04: { name: 'Wuschelkopf', ab: 'frisuren_alle' },  f06: { name: 'Undercut', ab: 'frisuren_alle' },
    f07: { name: 'Sidecut', ab: 'frisuren_alle' },      f08: { name: 'Wolfsschnitt', ab: 'frisuren_alle' },
    f09: { name: 'Langer Pony', ab: 'frisuren_alle' },  f11: { name: 'Wilde Locken', ab: 'frisuren_alle' },
    f13: { name: 'Stacheln', ab: 'frisuren_alle' },     f14: { name: 'Undercut-Tolle', ab: 'frisuren_alle' },
    f15: { name: 'Seitenpony', ab: 'frisuren_alle' },   f16: { name: 'Irokese', ab: 'frisuren_alle' },
    f17: { name: 'Sehr lang', ab: 'frisuren_alle' },    f18: { name: 'Afro', ab: 'frisuren_alle' },
    f19: { name: 'Kurz und fransig', ab: 'frisuren_alle' }, f21: { name: 'Hoher Zopf', ab: 'frisuren_alle' },
    f23: { name: 'Stufenschnitt', ab: 'frisuren_alle' }, f24: { name: 'Zwei Knoten', ab: 'frisuren_alle' },
  };
  ziel.NWU_KOPFSCHMUCK = {
    reif: { name: 'Silberreif', ab: 'kopfschmuck' },        kapuze: { name: 'Kapuze', ab: 'kopfschmuck' },
    blumenkranz: { name: 'Blumenkranz', ab: 'kopfschmuck' }, federn: { name: 'Federschmuck', ab: 'kopfschmuck' },
    hoerner: { name: 'Hörner', ab: 'kopfschmuck2' },        maske: { name: 'Maske', ab: 'kopfschmuck2' },
    augenklappe: { name: 'Augenklappe', ab: 'kopfschmuck2' }, hexenhut: { name: 'Hexenhut', ab: 'kopfschmuck2', event: 'halloween' },
    vogelschaedel: { name: 'Vogelschädel', ab: 'kopfschmuck2' },
    // 🎃 Halloween-Kostüm: am Event-Tag für alle mit Figur, egal welches Level. Den Kürbis gibt es nur dann –
    // wer ihn am Event-Tag aufsetzt, darf ihn behalten (aussehen.behalten). Der Hexenhut ist danach wieder ab Level 60.
    kuerbis: { name: 'Kürbiskopf', ab: 'kopfschmuck', event: 'halloween', nurEvent: true },
    dornenkrone: { name: 'Eisenkrone', ab: 'kopfschmuck3' }, heiligenschein: { name: 'Heiligenschein', ab: 'kopfschmuck3' },
    geweih: { name: 'Geisterhafte Geweihe', ab: 'kopfschmuck3' },
  };
  ziel.NWU_BEGLEITER = {
    rabe: { name: 'Rabe', ab: 'begleiter', fliegt: true },     katze: { name: 'Katze', ab: 'begleiter' },
    wolf: { name: 'Wolfswelpe', ab: 'begleiter2' },            fledermaus: { name: 'Fledermaus', ab: 'begleiter2', fliegt: true },
    geist: { name: 'Geisterlicht', ab: 'begleiter_selten', fliegt: true, leuchtet: true },
    salamander: { name: 'Feuersalamander', ab: 'begleiter_selten' },
  };
  ziel.NWU_FREI = (level, id) => {
    const f = ziel.NWU_FREISCHALTUNGEN.find((x) => x.id === id);
    return !!f && (level || 1) >= f.level;
  };
  // Läuft gerade ein Event? Deutsche Zeit, damit Overlay (PC) und Worker (Cloudflare, UTC) gleich rechnen.
  // halloween: 31.10. ganztags bis 1.11. 6 Uhr (der Stream am Abend darf über Mitternacht gehen).
  ziel.NWU_EVENT_AKTIV = (name, jetzt = new Date()) => {
    if (name !== 'halloween') return false;
    const t = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', month: 'numeric', day: 'numeric', hour: 'numeric', hourCycle: 'h23' })
      .formatToParts(jetzt).forEach((p) => { t[p.type] = Number(p.value); });
    return (t.month === 10 && t.day === 31) || (t.month === 11 && t.day === 1 && t.hour < 6);
  };
  // Darf jemand mit diesem Level diese Frisur / diesen Kopfschmuck / diesen Begleiter tragen? (art: frisur | kopf | begleiter)
  // aus = das gespeicherte Aussehen (optional): was in aus.behalten steht, bleibt frei (Event-Stücke).
  ziel.NWU_WAHL_FREI = (level, art, id, aus) => {
    const liste = { frisur: ziel.NWU_FRISUREN, kopf: ziel.NWU_KOPFSCHMUCK, begleiter: ziel.NWU_BEGLEITER }[art];
    const e = liste && Object.prototype.hasOwnProperty.call(liste, id) && liste[id];
    if (!e) return false;
    if (e.event && ziel.NWU_EVENT_AKTIV(e.event)) return true;
    if (aus && Array.isArray(aus.behalten) && aus.behalten.includes(id)) return true;
    return !e.nurEvent && ziel.NWU_FREI(level, e.ab);
  };
  // Darf jemand mit diesem Level diese Haarfarbe tragen?
  ziel.NWU_HAARFARBE_FREI = (level, farbe) => {
    const f = ziel.NWU_HAARFARBEN[farbe];
    return !!f && ziel.NWU_FREI(level, 'haare') && (!f.selten || ziel.NWU_FREI(level, 'haare_selten'));
  };
})(typeof window !== 'undefined' ? window : globalThis);
