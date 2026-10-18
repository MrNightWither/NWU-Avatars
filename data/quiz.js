// Fragenpool fürs Ritual (Plan 3). Pro Durchgang werden zufällig RUNDEN Fragen gezogen.
// Jede Antwort gibt versteckte Punkte an 1 bis 2 Häuser: 2 = passt stark, 1 = passt etwas.
// Kürzel: M = Mond (haus1), B = Blut (haus2), N = Nebel (haus3), F = Flamme (haus4)
// Jede Frage hat genau eine starke Antwort (2) pro Haus, dazu je Haus 5 Nebenpunkte (1) insgesamt.
// Dornen (haus5) und Raben (haus6) sind "verlorene Häuser" und kommen im Quiz erst später dazu.
// Der Worker rechnet das Ergebnis später mit derselben Datei nach, damit niemand schummeln kann.
(function () {
  const H = { M: 'haus1', B: 'haus2', N: 'haus3', F: 'haus4' };
  const roh = [
    ['q01', 'Die Nacht bricht herein. Was tust du zuerst?', [
      ['Ich schaue zum Mond und lausche der Stille.', 'M2'],
      ['Ich zünde ein Feuer an und rufe die anderen.', 'F2 B1'],
      ['Ich verschwinde zwischen den Gassen.', 'N2'],
      ['Ich suche meine Leute und zähle, ob alle da sind.', 'B2']]],
    ['q02', 'Ein Fremder bittet am Tor um Einlass.', [
      ['Er kommt erst rein, wenn er sich bewiesen hat.', 'F2'],
      ['Ich sehe ihm in die Augen. Lügen erkenne ich sofort.', 'M2'],
      ['Wer friert, bekommt einen Platz am Feuer.', 'B2 F1'],
      ['Ich beobachte ihn heimlich aus dem Schatten.', 'N2']]],
    ['q03', 'Welche Waffe liegt dir in der Hand?', [
      ['Eine Klinge, an der schon Blut klebt.', 'B2'],
      ['Ein Dolch, den niemand kommen sieht.', 'N2'],
      ['Eine Axt, geboren im Schmiedefeuer.', 'F2'],
      ['Ein Stab mit einem Stein aus Mondlicht.', 'M2 N1']]],
    ['q04', 'Was fürchtest du am meisten?', [
      ['Vergessen zu werden.', 'M2'],
      ['Verraten zu werden.', 'B2'],
      ['Dass das Feuer in mir erlischt.', 'F2'],
      ['Dass jemand sieht, wer ich wirklich bin.', 'N2 M1']]],
    ['q05', 'Ein Sturm zieht auf. Du …', [
      ['… tanzt im Regen und lachst den Blitzen entgegen.', 'F2'],
      ['… bringst deine Leute in Sicherheit.', 'B2'],
      ['… zählst die Sekunden zwischen Blitz und Donner.', 'M2'],
      ['… nutzt das Chaos, um zu verschwinden.', 'N2 F1']]],
    ['q06', 'Welcher Ort ruft nach dir?', [
      ['Ein stiller See unter dem Vollmond.', 'M2'],
      ['Ein Moor, über dem der Nebel nie verschwindet.', 'N2'],
      ['Eine Burg, in der meine ganze Familie wohnt.', 'B2'],
      ['Eine Schmiede, in der das Eisen glüht.', 'F2']]],
    ['q07', 'Deine Gefährten geraten in eine Falle.', [
      ['Ich werfe mich dazwischen, egal was es kostet.', 'B2'],
      ['Ich kannte die Falle längst. Und den Ausweg.', 'N2'],
      ['Ich brenne alles nieder, was uns festhält.', 'F2 B1'],
      ['Ich bleibe ruhig und finde die Schwachstelle.', 'M2']]],
    ['q08', 'Welches Tier begleitet dich?', [
      ['Eine weiße Eule.', 'M2'],
      ['Ein Wolf.', 'B2'],
      ['Eine Schlange.', 'N2'],
      ['Ein Feuersalamander.', 'F2']]],
    ['q09', 'Was zählt am Ende?', [
      ['Die Wahrheit, auch wenn sie wehtut.', 'M2'],
      ['Treue.', 'B2'],
      ['Freiheit.', 'F2 N1'],
      ['Geheimnisse, die nur ich kenne.', 'N2']]],
    ['q10', 'Man bietet dir verbotenes Wissen an. Gegen einen Preis.', [
      ['Ich zahle. Wissen ist jeden Preis wert.', 'M2'],
      ['Ich nehme es mir, ohne zu zahlen.', 'N2'],
      ['Ich brauche keine Bücher. Ich brauche Mut.', 'F2'],
      ['Ich frage erst, wer dafür bluten muss.', 'B2 M1']]],
    ['q11', 'Wie betrittst du einen Raum?', [
      ['Laut. Jeder soll wissen, dass ich da bin.', 'F2'],
      ['Leise. Keiner merkt, dass ich da bin.', 'N2'],
      ['Ruhig. Ich sehe mir erst alles an.', 'M2 N1'],
      ['An der Seite meiner Leute.', 'B2']]],
    ['q12', 'Was trägst du immer bei dir?', [
      ['Ein Notizbuch voller Geheimnisse.', 'N2'],
      ['Einen Talisman aus Mondstein.', 'M2'],
      ['Streichhölzer. Man weiß nie.', 'F2'],
      ['Ein Medaillon mit dem Bild meiner Liebsten.', 'B2']]],
    ['q13', 'Jemand beleidigt deinen Freund.', [
      ['Er wird es bereuen. Sofort.', 'F2 B1'],
      ['Ich merke mir sein Gesicht. Rache schmeckt kalt am besten.', 'N2'],
      ['Ich stelle mich schützend vor meinen Freund.', 'B2'],
      ['Ich lasse ihn reden. Worte verwehen.', 'M2']]],
    ['q14', 'Welche Stunde gehört dir?', [
      ['Mitternacht.', 'M2'],
      ['Die Dämmerung.', 'N2'],
      ['Der Sonnenuntergang, wenn der Himmel brennt.', 'F2'],
      ['Der Morgen, wenn alle wieder beisammen sind.', 'B2']]],
    ['q15', 'Du findest eine verschlossene Truhe.', [
      ['Ich breche sie auf.', 'F2'],
      ['Ich öffne das Schloss, ohne Spuren zu hinterlassen.', 'N2'],
      ['Ich lese erst die Runen auf dem Deckel.', 'M2'],
      ['Ich bringe sie zu meinen Leuten. Wir öffnen sie gemeinsam.', 'B2 F1']]],
    ['q16', 'Welche Gabe hättest du gerne?', [
      ['In die Träume anderer zu blicken.', 'M2 N1'],
      ['Wunden mit meinem Blut zu heilen.', 'B2'],
      ['Unsichtbar zu werden.', 'N2'],
      ['Feuer aus meinen Händen zu rufen.', 'F2']]],
    ['q17', 'Wie gehst du mit einer Niederlage um?', [
      ['Ich stehe wieder auf. Meine Leute fangen mich auf.', 'B2'],
      ['Ich ziehe mich zurück und denke nach.', 'M2'],
      ['Wut. Und dann ein zweiter Versuch.', 'F2'],
      ['Niemand wird je erfahren, dass ich verloren habe.', 'N2 M1']]],
    ['q18', 'Welche Farbe hat deine Seele?', [
      ['Silber.', 'M2'],
      ['Tiefrot.', 'B2 F1'],
      ['Grau wie Rauch.', 'N2'],
      ['Glühendes Orange.', 'F2']]],
    ['q19', 'Dein Haus ruft zum Kampf.', [
      ['Ich führe den Angriff an.', 'F2'],
      ['Ich überblicke das Feld und lenke die anderen.', 'M2'],
      ['Ich kämpfe Seite an Seite mit meinen Leuten.', 'B2'],
      ['Ich kenne die Pläne des Feindes, bevor es beginnt.', 'N2 M1']]],
    ['q20', 'Ein Versprechen ist für dich …', [
      ['… heilig. Mit Blut besiegelt.', 'B2'],
      ['… wie der Mond. Es kehrt immer wieder.', 'M2 B1'],
      ['… ein Funke. Hell, aber schnell vorbei.', 'F2'],
      ['… so flüchtig wie Nebel.', 'N2']]],
    ['q21', 'Was hörst du am liebsten?', [
      ['Das Knistern eines Feuers.', 'F2'],
      ['Flüstern hinter verschlossenen Türen.', 'N2'],
      ['Das Lachen meiner Leute.', 'B2 F1'],
      ['Absolute Stille.', 'M2']]],
    ['q22', 'Was würdest du opfern, um zu gewinnen?', [
      ['Mein eigenes Blut.', 'B2'],
      ['Meinen Schlaf. Die Nächte sind lang.', 'M2'],
      ['Meinen Namen. Niemand muss wissen, wer gewonnen hat.', 'N2 B1'],
      ['Alles. Was verbrennt, wächst neu.', 'F2']]],
    ['q23', 'Wie sieht dein Zuhause aus?', [
      ['Ein Turm mit Blick auf die Sterne.', 'M2'],
      ['Eine Halle voller Menschen, die ich liebe.', 'B2'],
      ['Ein Haus am Fuß eines Vulkans.', 'F2 M1'],
      ['Niemand weiß, wo ich wohne.', 'N2']]],
    ['q24', 'Was rettest du aus einem brennenden Haus?', [
      ['Den Spiegel, in dem man den Mond sieht.', 'M2'],
      ['Die Menschen.', 'B2'],
      ['Den Brief mit meinem größten Geheimnis.', 'N2'],
      ['Die Glut. Aus ihr baue ich alles neu.', 'F2 N1']]],
  ];

  const ziel = typeof window !== 'undefined' ? window : globalThis;   // Browser und Worker
  ziel.NWU_QUIZ = {
    runden: 12,
    // Liegen die besten Häuser so nah beieinander (Anteil 0–1), zählt die Belegung (Plan 3).
    knapp: 0.05,
    fragen: roh.map(([id, frage, antworten]) => ({
      id, frage,
      antworten: antworten.map(([text, code], i) => ({
        id: id + String.fromCharCode(97 + i),
        text,
        punkte: Object.fromEntries(code.split(' ').map((c) => [H[c[0]], Number(c.slice(1))])),
      })),
    })),
  };
})();
