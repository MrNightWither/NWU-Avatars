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
    { level: 3,  id: 'staub',         name: 'Staubspur beim Laufen' },
    { level: 5,  id: 'haare',         name: 'Haarfarbe wählen (!haare <farbe>)' },
    { level: 10, id: 'funken',        name: 'Funkenspur in Hausfarbe' },
    { level: 25, id: 'haare_selten',  name: 'Seltene Haarfarben (Blau, Lila, Grün, Rosa)' },
  ];
  ziel.NWU_FREI = (level, id) => {
    const f = ziel.NWU_FREISCHALTUNGEN.find((x) => x.id === id);
    return !!f && (level || 1) >= f.level;
  };
  // Darf jemand mit diesem Level diese Haarfarbe tragen?
  ziel.NWU_HAARFARBE_FREI = (level, farbe) => {
    const f = ziel.NWU_HAARFARBEN[farbe];
    return !!f && ziel.NWU_FREI(level, 'haare') && (!f.selten || ziel.NWU_FREI(level, 'haare_selten'));
  };
})(typeof window !== 'undefined' ? window : globalThis);
