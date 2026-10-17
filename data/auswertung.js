// Quiz-Auswertung – reine Funktion, damit Website und Worker exakt gleich rechnen.
// Im Browser: window.NWU_AUSWERTEN, im Worker per Import nutzbar.
(function (ziel) {
  /**
   * @param quiz      NWU_QUIZ
   * @param antworten Liste der gewählten Antwort-ids, z. B. ['q01a', 'q07c', …]
   * @param belegung  optional { haus1: 12, haus2: 30, … } – Mitglieder je Haus
   * @param zufall    optional Zufallsfunktion (für Tests)
   * @returns { haus, anteile: { haus1: 0.42, … }, knapp: bool }
   */
  function auswerten(quiz, antworten, belegung, zufall) {
    zufall = zufall || Math.random;
    const gewaehlt = new Set(antworten);
    const punkte = {}, moeglich = {};

    for (const frage of quiz.fragen) {
      const antwort = frage.antworten.find((a) => gewaehlt.has(a.id));
      if (!antwort) continue;
      // Höchstwert, den jedes Haus in dieser Frage hätte holen können
      const max = {};
      for (const a of frage.antworten) {
        for (const [h, p] of Object.entries(a.punkte)) max[h] = Math.max(max[h] || 0, p);
      }
      for (const [h, p] of Object.entries(max)) moeglich[h] = (moeglich[h] || 0) + p;
      for (const [h, p] of Object.entries(antwort.punkte)) punkte[h] = (punkte[h] || 0) + p;
    }

    // Anteil = erreichte / mögliche Punkte. So hat jedes Haus dieselbe Chance,
    // egal welche Zufallsfragen gezogen wurden.
    const anteile = {};
    for (const h of Object.keys(moeglich)) anteile[h] = (punkte[h] || 0) / moeglich[h];

    const sortiert = Object.keys(anteile).sort((a, b) => anteile[b] - anteile[a]);
    if (!sortiert.length) return { haus: null, anteile, knapp: false };
    const bester = anteile[sortiert[0]];
    const nah = sortiert.filter((h) => bester - anteile[h] <= quiz.knapp);

    // Nur bei knappem Ergebnis: das kleinere Haus bekommt den Vorzug (Plan 3)
    let haus = sortiert[0];
    if (nah.length > 1) {
      if (belegung) {
        const wenigste = Math.min(...nah.map((h) => belegung[h] || 0));
        const kandidaten = nah.filter((h) => (belegung[h] || 0) === wenigste);
        haus = kandidaten[Math.floor(zufall() * kandidaten.length)];
      } else {
        haus = nah[Math.floor(zufall() * nah.length)];
      }
    }
    return { haus, anteile, knapp: nah.length > 1 };
  }

  ziel.NWU_AUSWERTEN = auswerten;
})(typeof window !== 'undefined' ? window : globalThis);
