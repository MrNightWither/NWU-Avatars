// Fragenpool fürs Ritual (Plan 3). Pro Durchgang werden zufällig RUNDEN Fragen gezogen.
// Jede Antwort gibt versteckte Punkte an 1 bis 2 Häuser: 2 = passt stark, 1 = passt etwas.
// Kürzel: M = Mond (haus1), B = Blut (haus2), N = Nebel (haus3),
//         F = Flamme (haus4), D = Dornen (haus5), R = Raben (haus6)
// Der Worker rechnet das Ergebnis später mit derselben Datei nach, damit niemand schummeln kann.
(function () {
  const H = { M: 'haus1', B: 'haus2', N: 'haus3', F: 'haus4', D: 'haus5', R: 'haus6' };
  const roh = [
    ['q01', 'Die Nacht bricht herein. Was tust du zuerst?', [
      ['Ich schaue zum Mond und lausche der Stille.', 'M2'],
      ['Ich zünde ein Feuer an und rufe die anderen.', 'F2 B1'],
      ['Ich verschwinde zwischen den Gassen.', 'N2'],
      ['Ich lese die Zeichen am Himmel.', 'R2 M1']]],
    ['q02', 'Ein Fremder bittet am Tor um Einlass.', [
      ['Er kommt erst rein, wenn er sich bewiesen hat.', 'D2'],
      ['Ich frage ihn aus, bis ich alles über ihn weiß.', 'R2'],
      ['Wer friert, bekommt einen Platz am Feuer.', 'B2 F1'],
      ['Ich beobachte ihn heimlich aus dem Schatten.', 'N2 M1']]],
    ['q03', 'Welche Waffe liegt dir in der Hand?', [
      ['Eine Klinge, an der schon Blut klebt.', 'B2'],
      ['Ein Dolch, den niemand kommen sieht.', 'N2'],
      ['Ein Stab aus altem Dornenholz.', 'D2'],
      ['Ein Buch voller verbotener Worte.', 'R2']]],
    ['q04', 'Was fürchtest du am meisten?', [
      ['Vergessen zu werden.', 'R2'],
      ['Verraten zu werden.', 'B2 D1'],
      ['Dass das Feuer in mir erlischt.', 'F2'],
      ['Dass jemand sieht, wer ich wirklich bin.', 'N2']]],
    ['q05', 'Ein Sturm zieht auf. Du …', [
      ['… tanzt im Regen und lachst den Blitzen entgegen.', 'F2'],
      ['… suchst Schutz und hältst die Stellung.', 'D2'],
      ['… zählst die Sekunden zwischen Blitz und Donner.', 'M2 R1'],
      ['… nutzt das Chaos, um zu verschwinden.', 'N2']]],
    ['q06', 'Welcher Ort ruft nach dir?', [
      ['Ein stiller See unter dem Vollmond.', 'M2'],
      ['Eine Bibliothek, die seit Jahrhunderten niemand betreten hat.', 'R2'],
      ['Ein Wald voller Dornen und alter Wurzeln.', 'D2'],
      ['Eine Schmiede, in der das Eisen glüht.', 'F2']]],
    ['q07', 'Deine Gefährten geraten in eine Falle.', [
      ['Ich werfe mich dazwischen, egal was es kostet.', 'B2'],
      ['Ich kannte die Falle längst. Und den Ausweg.', 'N2 R1'],
      ['Ich brenne alles nieder, was uns festhält.', 'F2'],
      ['Ich halte den Feind auf, bis alle draußen sind.', 'D2 B1']]],
    ['q08', 'Welches Tier begleitet dich?', [
      ['Ein Rabe.', 'R2'],
      ['Eine weiße Eule.', 'M2'],
      ['Ein Wolf.', 'B2'],
      ['Eine Schlange.', 'N2 D1']]],
    ['q09', 'Was zählt am Ende?', [
      ['Die Wahrheit, auch wenn sie wehtut.', 'M2'],
      ['Treue.', 'B2'],
      ['Freiheit.', 'F2 N1'],
      ['Dass etwas bleibt.', 'D2']]],
    ['q10', 'Man bietet dir verbotenes Wissen an. Gegen einen Preis.', [
      ['Ich zahle. Wissen ist jeden Preis wert.', 'R2'],
      ['Ich nehme es mir, ohne zu zahlen.', 'N2'],
      ['Ich lehne ab. Manche Türen bleiben besser zu.', 'D2 M1'],
      ['Ich frage erst, wer dafür bluten muss.', 'B2']]],
    ['q11', 'Wie betrittst du einen Raum?', [
      ['Laut. Jeder soll wissen, dass ich da bin.', 'F2'],
      ['Leise. Keiner merkt, dass ich da bin.', 'N2'],
      ['Ruhig. Ich sehe mir erst alles an.', 'M2'],
      ['An der Seite meiner Leute.', 'B2']]],
    ['q12', 'Was trägst du immer bei dir?', [
      ['Ein Notizbuch voller Beobachtungen.', 'R2 N1'],
      ['Einen Talisman aus Mondstein.', 'M2'],
      ['Streichhölzer. Man weiß nie.', 'F2'],
      ['Ein Samenkorn aus meiner Heimat.', 'D2']]],
    ['q13', 'Jemand beleidigt deinen Freund.', [
      ['Er wird es bereuen. Sofort.', 'F2 B1'],
      ['Ich merke mir sein Gesicht. Rache schmeckt kalt am besten.', 'N2'],
      ['Ich stelle mich schützend vor meinen Freund.', 'D2'],
      ['Ich lasse ihn reden. Worte verwehen.', 'M2']]],
    ['q14', 'Welche Stunde gehört dir?', [
      ['Mitternacht.', 'M2'],
      ['Die Dämmerung.', 'N2'],
      ['Der Sonnenuntergang, wenn der Himmel brennt.', 'F2'],
      ['Die Stunde vor Sonnenaufgang, wenn die Raben erwachen.', 'R2']]],
    ['q15', 'Du findest eine verschlossene Truhe.', [
      ['Ich breche sie auf.', 'F2'],
      ['Ich öffne das Schloss, ohne Spuren zu hinterlassen.', 'N2'],
      ['Ich lese erst die Runen auf dem Deckel.', 'R2'],
      ['Ich bringe sie zu meinen Leuten. Wir öffnen sie gemeinsam.', 'B2']]],
    ['q16', 'Welche Gabe hättest du gerne?', [
      ['In die Träume anderer zu blicken.', 'M2'],
      ['Wunden mit meinem Blut zu heilen.', 'B2'],
      ['Pflanzen nach meinem Willen wachsen zu lassen.', 'D2'],
      ['Mit den Toten zu sprechen.', 'R2']]],
    ['q17', 'Wie gehst du mit einer Niederlage um?', [
      ['Ich stehe wieder auf. Wurzeln brechen nicht.', 'D2'],
      ['Ich ziehe mich zurück und denke nach.', 'M2'],
      ['Wut. Und dann ein zweiter Versuch.', 'F2'],
      ['Niemand wird je erfahren, dass ich verloren habe.', 'N2']]],
    ['q18', 'Welche Farbe hat deine Seele?', [
      ['Silber.', 'M2'],
      ['Tiefrot.', 'B2 F1'],
      ['Grau wie Rauch.', 'N2'],
      ['Schwarz wie Federn.', 'R2']]],
    ['q19', 'Dein Haus ruft zum Kampf.', [
      ['Ich führe den Angriff an.', 'F2'],
      ['Ich verteidige unsere Mauern.', 'D2'],
      ['Ich kämpfe Seite an Seite mit meinen Leuten.', 'B2'],
      ['Ich kenne die Pläne des Feindes, bevor es beginnt.', 'R2 N1']]],
    ['q20', 'Ein Versprechen ist für dich …', [
      ['… heilig. Mit Blut besiegelt.', 'B2'],
      ['… wie ein Same. Es wächst mit der Zeit.', 'D2'],
      ['… ein Funke. Hell, aber schnell vorbei.', 'F2'],
      ['… so flüchtig wie Nebel.', 'N2']]],
    ['q21', 'Was hörst du am liebsten?', [
      ['Das Knistern eines Feuers.', 'F2'],
      ['Den Wind in den Bäumen.', 'D2'],
      ['Das Krächzen der Raben.', 'R2'],
      ['Absolute Stille.', 'M2']]],
    ['q22', 'Was würdest du opfern, um zu gewinnen?', [
      ['Mein eigenes Blut.', 'B2'],
      ['Meinen Schlaf. Die Nächte sind lang.', 'M2'],
      ['Meine Erinnerungen. Ich schreibe neue.', 'R2'],
      ['Alles. Was verbrennt, wächst neu.', 'F2 D1']]],
    ['q23', 'Wie sieht dein Zuhause aus?', [
      ['Ein Turm mit Blick auf die Sterne.', 'M2 R1'],
      ['Eine Halle voller Menschen, die ich liebe.', 'B2 F1'],
      ['Eine Hütte hinter dichten Dornenhecken.', 'D2'],
      ['Niemand weiß, wo ich wohne.', 'N2']]],
    ['q24', 'Was rettest du aus einem brennenden Haus?', [
      ['Die Bücher.', 'R2'],
      ['Die Menschen.', 'B2'],
      ['Den alten Baum im Hof.', 'D2'],
      ['Den Spiegel, in dem man den Mond sieht.', 'M2']]],
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
