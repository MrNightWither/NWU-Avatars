// Verbindung zum WebSocket-Server von Streamer.bot (läuft auf demselben PC).
// Das Overlay meldet darüber Spiel-Ergebnisse an die Aktion „NWU Spiel“, die den Ruhm beim Worker bucht.
// Das Secret bleibt in Streamer.bot – hier steht nichts Geheimes.
'use strict';

window.NWU_SB = (() => {
  let ws = null, url = '', offen = false, warten = 2000, nr = 0;
  const schlange = [];

  function verbinden(adresse) {
    url = adresse;
    if (!url) return;
    try { ws = new WebSocket(url); } catch (e) { return; }
    ws.onopen = () => { offen = true; warten = 2000; while (schlange.length) ws.send(schlange.shift()); };
    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.authentication) console.warn('Streamer.bot verlangt ein Passwort – im WebSocket-Server „Authentication“ ausschalten (nur 127.0.0.1).');
      } catch (err) { /* egal */ }
    };
    ws.onclose = () => { offen = false; setTimeout(() => verbinden(url), warten); warten = Math.min(60000, warten * 2); };
    ws.onerror = () => {};
  }

  // Aktion in Streamer.bot ausführen; args landen dort als args["name"]
  function aktion(name, args) {
    if (!url) return false;
    const text = JSON.stringify({ request: 'DoAction', id: 'nwu' + (++nr), action: { name }, args });
    if (offen) ws.send(text); else if (schlange.length < 20) schlange.push(text);
    return true;
  }

  return { verbinden, aktion, verbunden: () => offen };
})();
