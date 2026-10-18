// Twitch-Chat mitlesen – anonym, ohne Login und ohne Passwort (wie ein Zuschauer).
// Liefert Nachrichten, Raids und Subs an das Overlay.
'use strict';

(function () {
  const ADRESSE = 'wss://irc-ws.chat.twitch.tv:443';

  function tagsLesen(roh) {
    const tags = {};
    for (const teil of roh.split(';')) {
      const i = teil.indexOf('=');
      const wert = teil.slice(i + 1).replace(/\\s/g, ' ').replace(/\\:/g, ';').replace(/\\\\/g, '\\');
      tags[teil.slice(0, i)] = wert;
    }
    return tags;
  }

  function zeileLesen(zeile) {
    let rest = zeile, tags = {};
    if (rest.startsWith('@')) { const i = rest.indexOf(' '); tags = tagsLesen(rest.slice(1, i)); rest = rest.slice(i + 1); }
    let quelle = '';
    if (rest.startsWith(':')) { const i = rest.indexOf(' '); quelle = rest.slice(1, i); rest = rest.slice(i + 1); }
    const i = rest.indexOf(' :');
    const kopf = (i >= 0 ? rest.slice(0, i) : rest).split(' ');
    return { tags, quelle, befehl: kopf[0], ziel: kopf[1], text: i >= 0 ? rest.slice(i + 2) : '' };
  }

  function nutzer(tags, quelle) {
    const badges = tags.badges || '';
    return {
      id: tags['user-id'] || '',
      name: (tags.login || quelle.split('!')[0] || '').toLowerCase(),
      anzeige: tags['display-name'] || quelle.split('!')[0] || '',
      broadcaster: badges.includes('broadcaster/'),
      mod: tags.mod === '1' || badges.includes('moderator/'),
      vip: badges.includes('vip/'),
      sub: tags.subscriber === '1',
    };
  }

  function verbinden(kanal, h) {
    kanal = kanal.replace(/^#/, '').toLowerCase();
    let ws, warten = 1000, gestoppt = false;

    const start = () => {
      ws = new WebSocket(ADRESSE);
      ws.onopen = () => {
        warten = 1000;
        ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
        ws.send('PASS SCHMOOPIIE');
        ws.send('NICK justinfan' + Math.floor(10000 + Math.random() * 80000));
        ws.send('JOIN #' + kanal);
        h.status && h.status('verbunden');
      };
      ws.onmessage = (e) => {
        for (const zeile of String(e.data).split('\r\n')) {
          if (!zeile) continue;
          if (zeile.startsWith('PING')) { ws.send('PONG' + zeile.slice(4)); continue; }
          const m = zeileLesen(zeile);
          if (m.befehl === 'PRIVMSG') {
            h.nachricht && h.nachricht({ ...nutzer(m.tags, m.quelle), text: m.text });
          } else if (m.befehl === 'USERNOTICE') {
            const art = m.tags['msg-id'];
            const u = nutzer(m.tags, m.quelle);
            if (art === 'raid') h.raid && h.raid({ ...u, zuschauer: Number(m.tags['msg-param-viewerCount'] || 0) });
            else if (['sub', 'resub', 'subgift', 'submysterygift', 'anonsubgift'].includes(art)) h.sub && h.sub(u);
          }
        }
      };
      ws.onclose = () => {
        h.status && h.status('getrennt');
        if (!gestoppt) setTimeout(start, warten);
        warten = Math.min(30000, warten * 2);          // langsam neu versuchen
      };
    };
    start();
    return { stopp: () => { gestoppt = true; ws && ws.close(); } };
  }

  window.NWU_CHAT = { verbinden, _zeileLesen: zeileLesen };
})();
