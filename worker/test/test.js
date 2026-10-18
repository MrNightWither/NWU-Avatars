// Testet den Worker lokal mit einer echten SQLite-Datenbank (D1-Nachbau). Start: npm test
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

// Minimaler D1-Nachbau über node:sqlite
function d1() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    first: async () => db.prepare(sql).get(...args) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    run: async () => { const r = db.prepare(sql).run(...args); return { meta: { changes: r.changes } }; },
  });
  return {
    prepare: (sql) => stmt(sql),
    batch: async (liste) => { db.exec('BEGIN'); try { for (const s of liste) await s.run(); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } },
    roh: db,
  };
}

const env = { DB: d1(), ERLAUBTE_HERKUNFT: 'https://ritual.example', STREAMERBOT_SECRET: 'sb-geheim-123', ADMIN_SECRET: 'admin-geheim-456' };
const ruf = async (pfad, opt = {}) => {
  const res = await worker.fetch(new Request('https://w.example' + pfad, {
    ...opt, headers: { 'Content-Type': 'application/json', Origin: 'https://ritual.example', 'CF-Connecting-IP': opt.ip || '1.2.3.4', ...(opt.headers || {}) },
  }), env);
  return { status: res.status, kopf: res.headers, daten: await res.json().catch(() => null) };
};

const QUIZ = globalThis.NWU_QUIZ;
const fragen = QUIZ.fragen.slice(0, 12).map((f) => f.id);
const monde = QUIZ.fragen.slice(0, 12).map((f) => (f.antworten.find((a) => a.punkte.haus1 === 2) || f.antworten[0]).id);
const anmeldung = (name, extra = {}) => ruf('/avatare/anmeldung', { method: 'POST', body: JSON.stringify({ plattform: 'twitch', name, figur: 'b', fragen, antworten: monde, ...extra }), ip: extra.ip });
const bestaetigen = (body, secret = 'sb-geheim-123') => ruf('/avatare/bestaetigen', { method: 'POST', body: JSON.stringify(body), headers: { Authorization: 'Bearer ' + secret } });

let r;
// Belegung leer
r = await ruf('/avatare/belegung');
assert.equal(r.status, 200); assert.equal(r.daten.haus1, 0);
assert.equal(r.kopf.get('access-control-allow-origin'), 'https://ritual.example', 'CORS für erlaubte Seite');
r = await worker.fetch(new Request('https://w.example/avatare/belegung', { headers: { Origin: 'https://boese.example' } }), env);
assert.equal(r.headers.get('access-control-allow-origin'), null, 'kein CORS für fremde Seiten');

// Anmeldung: Server rechnet das Haus selbst (Mond-Antworten → haus1)
r = await anmeldung('MrNightWither');
assert.equal(r.status, 200); assert.match(r.daten.code, /^\d{4}$/); assert.equal(r.daten.haus, 'haus1');
const { id, code } = r.daten;
assert.equal((await ruf('/avatare/anmeldung/' + id)).daten.status, 'offen');

// Ungültige Eingaben
assert.equal((await anmeldung('x!')).status, 400, 'ungültiger Name');
assert.equal((await anmeldung('Gueltig', { figur: 'z' })).status, 400, 'ungültige Figur');
assert.equal((await anmeldung('Gueltig', { antworten: monde.slice(0, 11) })).status, 400, 'zu wenige Antworten');
assert.equal((await anmeldung('Gueltig', { antworten: [...monde.slice(0, 11), 'q99a'] })).status, 400, 'erfundene Antwort');
assert.equal((await anmeldung('Gueltig', { fragen: [...fragen.slice(0, 11), fragen[0]] })).status, 400, 'doppelte Frage');

// Bestätigung: falsches Secret, falscher Code, falscher Name
assert.equal((await bestaetigen({ plattform: 'twitch', plattformId: '111', name: 'MrNightWither', code }, 'falsch')).status, 401);
assert.equal((await bestaetigen({ plattform: 'twitch', plattformId: '111', name: 'MrNightWither', code: code === '1234' ? '4321' : '1234' })).daten.grund, 'kein_code');
assert.equal((await bestaetigen({ plattform: 'twitch', plattformId: '222', name: 'JemandAnders', code })).daten.grund, 'kein_code', 'fremder Name kann nicht bestätigen');

// Richtige Bestätigung (Groß/Klein egal)
r = await bestaetigen({ plattform: 'twitch', plattformId: '111', name: 'mrnightwither', code });
assert.equal(r.daten.ok, true); assert.equal(r.daten.haus, 'Haus des Mondes');
assert.equal((await ruf('/avatare/anmeldung/' + id)).daten.status, 'bestaetigt');
assert.equal((await ruf('/avatare/belegung')).daten.haus1, 1);

// Doppelt geht nicht
assert.equal((await bestaetigen({ plattform: 'twitch', plattformId: '111', name: 'mrnightwither', code })).daten.grund, 'schon_gebunden');
assert.equal((await anmeldung('MrNightWither')).status, 409, 'Name schon gebunden');

// Profil für das Overlay
r = await ruf('/avatare/profil?plattform=twitch&id=111');
assert.deepEqual({ ...r.daten }, { gefunden: true, haus: 'haus1', rolle: null, figur: 'b', level: 1 });
assert.equal((await ruf('/avatare/profil?plattform=twitch&name=MRNIGHTWITHER')).daten.gefunden, true);
assert.equal((await ruf('/avatare/profil?plattform=twitch&name=niemand')).daten.gefunden, false);

// Rolle setzen (nur Admin)
assert.equal((await ruf('/avatare/rolle', { method: 'POST', body: JSON.stringify({ plattform: 'twitch', plattformId: '111', rolle: 'koenig' }), headers: { Authorization: 'Bearer falsch' } })).status, 401);
r = await ruf('/avatare/rolle', { method: 'POST', body: JSON.stringify({ plattform: 'twitch', plattformId: '111', rolle: 'koenig' }), headers: { Authorization: 'Bearer admin-geheim-456' } });
assert.equal(r.daten.ok, true);
assert.equal((await ruf('/avatare/profil?plattform=twitch&id=111')).daten.rolle, 'koenig');

// Level-Up per Befehl (Streamer.bot): über den Namen, Groß/Klein und @ egal
const level = (body, secret = 'sb-geheim-123') => ruf('/avatare/level', { method: 'POST', body: JSON.stringify(body), headers: { Authorization: 'Bearer ' + secret } });
assert.equal((await level({ plattform: 'twitch', name: 'mrnightwither' }, 'falsch')).status, 401);
r = await level({ plattform: 'twitch', name: '@MrNightWither' });
assert.equal(r.daten.ok, true); assert.equal(r.daten.level, 2); assert.equal(r.daten.name, 'mrnightwither');
assert.equal((await level({ plattform: 'twitch', plattformId: '111', anzahl: 5 })).daten.level, 7);
assert.equal((await level({ plattform: 'twitch', name: 'mrnightwither', anzahl: -50 })).daten.level, 1, 'nie unter Level 1');
assert.equal((await level({ plattform: 'twitch', name: 'niemand' })).daten.grund, 'unbekannt');
assert.equal((await level({ plattform: 'twitch', name: 'mrnightwither', anzahl: 500 })).status, 400);
assert.equal((await ruf('/avatare/profil?plattform=twitch&id=111')).daten.level, 1);

// Abgelaufener Code
r = await anmeldung('SpaeterLeser', { ip: '5.5.5.5' });
env.DB.roh.prepare("UPDATE anmeldung SET gueltig_bis = '2000-01-01T00:00:00.000Z' WHERE id = ?").run(r.daten.id);
assert.equal((await bestaetigen({ plattform: 'twitch', plattformId: '333', name: 'SpaeterLeser', code: r.daten.code })).daten.grund, 'abgelaufen');
assert.equal((await ruf('/avatare/anmeldung/' + r.daten.id)).daten.status, 'abgelaufen');

// Rate-Limit: 5 pro Stunde und IP
for (let i = 0; i < 5; i++) await anmeldung('Spammer' + i, { ip: '9.9.9.9' });
assert.equal((await anmeldung('Spammer9', { ip: '9.9.9.9' })).status, 429);

// Meilensteinkarte: vier Pfade
r = await ruf('/reise');
assert.deepEqual(Object.keys(r.daten.pfade).sort(), ['kick', 'tiktok', 'twitch', 'youtube']);
assert.equal(r.daten.pfade.twitch.erreicht, 'tw1'); assert.equal(r.daten.zitadelleOffen, false);
const essenz = (body, secret = 'sb-geheim-123') => ruf('/reise/essenz', { method: 'POST', body: JSON.stringify(body), headers: { Authorization: 'Bearer ' + secret } });
assert.equal((await essenz({ quelle: 'sub' }, 'falsch')).status, 401);
assert.equal((await essenz({ quelle: 'quatsch' })).status, 400);
assert.equal((await essenz({ quelle: 'sub', plattform: 'myspace' })).status, 400);
r = await essenz({ quelle: 'chat', anzahl: 500 });                         // ohne Plattform = twitch, gedeckelt auf 120
assert.equal(r.daten.pfad, 'twitch'); assert.equal(r.daten.essenz, 120);
r = await essenz({ quelle: 'bits', anzahl: 250, plattform: 'twitch' });   // + 2 × 10
assert.equal(r.daten.essenz, 140);
const gemeldet = [];
for (let i = 0; i < 22; i++) { r = await essenz({ quelle: 'sub', plattform: 'twitch' }); gemeldet.push(...r.daten.neu.map((m) => m.id)); }   // + 1320 = 1460
assert.equal(r.daten.essenz, 1460);
assert.deepEqual(gemeldet, ['tw2'], 'erster Meilenstein (500) wird genau einmal gemeldet');
r = await essenz({ quelle: 'follow', plattform: 'twitch' });             // 1475
r = await essenz({ quelle: 'raid', plattform: 'twitch' });               // 1555
assert.deepEqual(r.daten.neu, []);
r = await essenz({ quelle: 'stunde', plattform: 'kick' });               // Kick getrennt
assert.equal(r.daten.essenz, 100);
// TikTok hat eigene Regeln: Likes, Zuschauer, Follows, Stunden – aber keine Subs/Bits/Raids
assert.equal((await essenz({ quelle: 'sub', plattform: 'tiktok' })).status, 400, 'keine Subs auf TikTok');
assert.equal((await essenz({ quelle: 'raid', plattform: 'tiktok' })).status, 400, 'keine Raids auf TikTok');
assert.equal((await essenz({ quelle: 'likes', plattform: 'twitch' })).status, 400, 'keine Likes auf Twitch');
r = await essenz({ quelle: 'likes', anzahl: 1250, plattform: 'tiktok' });     // 12 × 3 = 36
assert.equal(r.daten.essenz, 36);
r = await essenz({ quelle: 'likes', anzahl: 999999, plattform: 'tiktok' });   // gedeckelt 60 → 96
assert.equal(r.daten.essenz, 96);
r = await essenz({ quelle: 'zuschauer', anzahl: 25, plattform: 'tiktok' });   // 25 → 121
assert.equal(r.daten.essenz, 121);
r = await essenz({ quelle: 'zuschauer', anzahl: 500, plattform: 'tiktok' });  // gedeckelt 40 → 161
r = await essenz({ quelle: 'follow', plattform: 'tiktok' });                  // 15 → 176
assert.equal(r.daten.essenz, 176);
await ruf('/reise/hand', { method: 'POST', body: JSON.stringify({ plattform: 'tiktok', menge: -176 }), headers: { Authorization: 'Bearer admin-geheim-456' } });
r = await ruf('/reise');
assert.equal(r.daten.pfade.twitch.erreicht, 'tw2'); assert.equal(r.daten.pfade.kick.essenz, 100); assert.equal(r.daten.pfade.youtube.essenz, 0);
const hand = (plattform, menge, secret = 'admin-geheim-456') => ruf('/reise/hand', { method: 'POST', body: JSON.stringify({ plattform, menge }), headers: { Authorization: 'Bearer ' + secret } });
assert.equal((await hand('twitch', 5000, 'sb-geheim-123')).status, 401, 'Streamer.bot-Secret darf nicht von Hand setzen');
assert.equal((await hand(undefined, 5000)).status, 400, 'Plattform ist Pflicht');
r = await hand('youtube', 9000); assert.deepEqual(r.daten.neu.map((m) => m.id), ['yt2', 'yt3', 'yt4']);
// Zitadelle öffnet sich erst, wenn alle vier angekommen sind
await hand('twitch', 20000); await hand('youtube', 20000); r = await hand('kick', 20000);
assert.equal(r.daten.zitadelleGeoeffnet, false);
r = await hand('tiktok', 20000);
assert.equal(r.daten.zitadelleGeoeffnet, true);
assert.equal((await ruf('/reise')).daten.zitadelleOffen, true);
r = await hand('kick', -999999); assert.equal(r.daten.essenz, 0, 'nie unter 0');
assert.equal((await ruf('/reise')).daten.zitadelleOffen, false);
assert.ok(env.DB.roh.prepare("SELECT COUNT(*) AS n FROM essenz_log WHERE pfad = 'kick'").get().n === 3);

// Erfolgskarte: Follower und Unterstützer pro Plattform
r = await ruf('/erfolge');
assert.deepEqual(r.daten.follower, { twitch: 0, youtube: 0, kick: 0, tiktok: 0 });
assert.deepEqual(Object.keys(r.daten.unterstuetzer).sort(), ['kick', 'twitch', 'youtube'], 'TikTok ohne Unterstützer');
const setzen = (body, secret = 'admin-geheim-456') => ruf('/erfolge/setzen', { method: 'POST', body: JSON.stringify(body), headers: { Authorization: 'Bearer ' + secret } });
const plus = (body, secret = 'sb-geheim-123') => ruf('/erfolge/plus', { method: 'POST', body: JSON.stringify(body), headers: { Authorization: 'Bearer ' + secret } });
assert.equal((await setzen({ weg: 'follower', plattform: 'twitch', wert: 640 }, 'sb-geheim-123')).status, 401, 'Startwert nur mit Admin');
assert.equal((await setzen({ weg: 'unterstuetzer', plattform: 'tiktok', wert: 5 })).status, 400, 'kein TikTok-Unterstützer');
assert.equal((await setzen({ weg: 'follower', plattform: 'twitch', wert: -3 })).status, 400);
r = await setzen({ weg: 'follower', plattform: 'twitch', wert: 640 });     // Startwert: heutiger Stand
assert.deepEqual(r.daten.neu.map((x) => x.wert), [100, 250, 500]);
r = await plus({ weg: 'follower', plattform: 'twitch' });
assert.equal(r.daten.wert, 641); assert.deepEqual(r.daten.neu, []);
assert.equal((await plus({ weg: 'follower', plattform: 'twitch' }, 'falsch')).status, 401);
r = await setzen({ weg: 'unterstuetzer', plattform: 'twitch', wert: 8 });
r = await plus({ weg: 'unterstuetzer', plattform: 'twitch', anzahl: 5 });   // Gift-Bomb
assert.equal(r.daten.wert, 13); assert.deepEqual(r.daten.neu.map((x) => x.name), ['Der erste Schwur']);
r = await plus({ weg: 'unterstuetzer', plattform: 'kick', anzahl: 99999 }); // gedeckelt auf 1000 pro Meldung
assert.equal(r.daten.wert, 1000);
r = await ruf('/erfolge');
assert.equal(r.daten.follower.twitch, 641); assert.equal(r.daten.unterstuetzer.twitch, 13); assert.equal(r.daten.follower.youtube, 0);

// Unbekannter Pfad
assert.equal((await ruf('/gibtsnicht')).status, 404);

console.log('Alle Worker-Tests bestanden ✔');
