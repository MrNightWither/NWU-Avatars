// Fragenpool fürs Ritual (Plan 3). Pro Durchgang werden zufällig RUNDEN Fragen gezogen.
// Jede Antwort gibt versteckte Punkte an 1 bis 2 Häuser: 2 = passt stark, 1 = passt etwas.
// Kürzel: M = Mond (haus1), B = Blut (haus2), N = Nebel (haus3), F = Flamme (haus4)
// Jede Frage hat genau eine starke Antwort (2) pro Haus, dazu 8–9 Nebenpunkte (1) je Haus.
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
    ['q25', 'Ein Fest in der Zitadelle. Wo findet man dich?', [
      ['Mitten auf der Tanzfläche.', 'F2 B1'],
      ['Am Tisch bei meinen Freunden.', 'B2'],
      ['Auf dem Balkon, allein mit dem Himmel.', 'M2'],
      ['Ich höre, was in den Ecken geflüstert wird.', 'N2']]],
    ['q26', 'Was würdest du nie verzeihen?', [
      ['Verrat an der Familie.', 'B2'],
      ['Eine Lüge, die mir ins Gesicht gesagt wird.', 'M2 F1'],
      ['Dass man mich unterschätzt.', 'F2'],
      ['Dass jemand mein Geheimnis verrät.', 'N2']]],
    ['q27', 'Du darfst ein Zeichen auf deinen Umhang sticken.', [
      ['Eine Mondsichel.', 'M2'],
      ['Ein Tropfen Blut.', 'B2'],
      ['Eine Spirale aus Rauch.', 'N2'],
      ['Eine Flamme.', 'F2']]],
    ['q28', 'Was ist die größte Stärke?', [
      ['Geduld.', 'M2'],
      ['Zusammenhalt.', 'B2'],
      ['Nicht gesehen zu werden.', 'N2 M1'],
      ['Mut.', 'F2']]],
    ['q29', 'Ein Freund bittet dich mitten in der Nacht um Hilfe.', [
      ['Ich bin sofort da. Keine Fragen.', 'B2 F1'],
      ['Ich komme, aber erst will ich wissen, was los ist.', 'M2'],
      ['Ich helfe, ohne dass jemand erfährt, dass ich es war.', 'N2'],
      ['Ich renne los, bevor er fertig gesprochen hat.', 'F2']]],
    ['q30', 'Welches Wetter magst du am liebsten?', [
      ['Eine klare, kalte Sternennacht.', 'M2'],
      ['Nebel, der alles verschluckt.', 'N2'],
      ['Gewitterhitze im Sommer.', 'F2'],
      ['Regen, wenn man drinnen beisammensitzt.', 'B2 N1']]],
    ['q31', 'Wie löst du einen Streit?', [
      ['Ich höre beiden zu und urteile dann.', 'M2'],
      ['Ich stelle mich auf die Seite meiner Leute.', 'B2'],
      ['Ich sorge dafür, dass er sich von selbst erledigt.', 'N2'],
      ['Laut, ehrlich und dann ist es vorbei.', 'F2 B1']]],
    ['q32', 'Was liegt unter deinem Kissen?', [
      ['Ein Brief von jemandem, den ich liebe.', 'B2'],
      ['Ein Messer. Man weiß nie.', 'N2'],
      ['Ein Stück Mondstein.', 'M2'],
      ['Nichts. Ich schlafe sowieso kaum.', 'F2 M1']]],
    ['q33', 'Du stehst vor einer Brücke, die gleich einstürzt.', [
      ['Ich renne einfach rüber.', 'F2'],
      ['Ich prüfe jeden Schritt, bevor ich gehe.', 'M2'],
      ['Ich gehe erst, wenn alle anderen drüben sind.', 'B2'],
      ['Ich finde einen Weg, den sonst niemand kennt.', 'N2 F1']]],
    ['q34', 'Wie willst du in Erinnerung bleiben?', [
      ['Als jemand, der immer da war.', 'B2'],
      ['Als jemand, der die Welt gesehen hat, wie sie ist.', 'M2'],
      ['Als Legende, von der man nicht weiß, ob es sie gab.', 'N2'],
      ['Als jemand, der alles gegeben hat.', 'F2 B1']]],
    ['q35', 'Welches Geschenk würde dich am meisten freuen?', [
      ['Ein altes Fernrohr.', 'M2 N1'],
      ['Ein Ring, den auch meine Liebsten tragen.', 'B2'],
      ['Eine Karte mit geheimen Wegen.', 'N2'],
      ['Ein Schwert, frisch aus der Schmiede.', 'F2']]],
    ['q36', 'Was machst du, wenn du wütend bist?', [
      ['Ich werde ganz still.', 'M2'],
      ['Ich suche meine Leute.', 'B2'],
      ['Ich verschwinde, bis es vorbei ist.', 'N2'],
      ['Ich lasse es raus. Sofort.', 'F2 N1']]],
    ['q37', 'Ein Rätsel wird dir gestellt. Du …', [
      ['… denke lange nach und finde die Lösung.', 'M2'],
      ['… löse es mit meinen Freunden zusammen.', 'B2 F1'],
      ['… finde heraus, wer die Lösung schon kennt.', 'N2'],
      ['… rate einfach mutig drauflos.', 'F2']]],
    ['q38', 'Was hörst du, wenn du die Augen schließt?', [
      ['Das leise Rauschen eines Sees.', 'M2'],
      ['Stimmen, die meinen Namen rufen.', 'B2'],
      ['Schritte, die niemand sonst hört.', 'N2'],
      ['Mein eigenes Herz, laut und schnell.', 'F2 M1']]],
    ['q39', 'Welche Tageszeit ist die gefährlichste?', [
      ['Die Stunde, in der alle schlafen.', 'N2 B1'],
      ['Der Mittag, wenn alle unvorsichtig sind.', 'F2'],
      ['Der Moment, in dem der Mond verschwindet.', 'M2'],
      ['Wenn man allein ist.', 'B2']]],
    ['q40', 'Morrígan fragt dich: Was willst du wirklich?', [
      ['Verstehen.', 'M2'],
      ['Dazugehören.', 'B2 N1'],
      ['Frei sein.', 'N2'],
      ['Brennen.', 'F2']]],
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
