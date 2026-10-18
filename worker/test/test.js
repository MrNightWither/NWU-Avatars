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
const { seit, ...ohneDatum } = r.daten;
assert.deepEqual({ ...ohneDatum }, { gefunden: true, name: 'mrnightwither', haus: 'haus1', rolle: null, figur: 'b', level: 1, ruhm: 0, aussehen: {}, hausName: 'Haus des Mondes', jahrestag: 0, platz: 1 });
assert.match(seit, /^\d{4}-\d{2}-\d{2}$/);
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

// Haarfarbe per !haare: erst ab Level 5, nur bekannte Farben
const haare = (body, secret = 'sb-geheim-123') => ruf('/avatare/aussehen', { method: 'POST', body: JSON.stringify(body), headers: { Authorization: 'Bearer ' + secret } });
assert.equal((await haare({ plattform: 'twitch', plattformId: '111', haare: 'rot' }, 'falsch')).status, 401);
r = await haare({ plattform: 'twitch', plattformId: '111', haare: 'rot' });
assert.equal(r.daten.grund, 'level'); assert.equal(r.daten.level, 5);
await level({ plattform: 'twitch', name: 'mrnightwither', anzahl: 4 });
assert.equal((await haare({ plattform: 'twitch', plattformId: '111', haare: 'regenbogen' })).daten.grund, 'farbe');
r = await haare({ plattform: 'twitch', plattformId: '111', haare: 'Grün' });
assert.equal(r.daten.grund, 'level', 'Grün ist selten'); assert.equal(r.daten.level, 25);
r = await haare({ plattform: 'twitch', plattformId: '111', haare: 'Blond' });
assert.equal(r.daten.ok, true); assert.equal(r.daten.haare, 'Blond');
await level({ plattform: 'twitch', name: 'mrnightwither', anzahl: 20 });
r = await haare({ plattform: 'twitch', plattformId: '111', haare: 'Grün' });
assert.equal(r.daten.ok, true); assert.equal(r.daten.haare, 'Grün');
assert.deepEqual({ ...(await ruf('/avatare/profil?plattform=twitch&id=111')).daten.aussehen }, { haare: 'gruen' });
await level({ plattform: 'twitch', name: 'mrnightwither', anzahl: -20 });
assert.equal((await haare({ plattform: 'twitch', plattformId: '999', haare: 'rot' })).daten.grund, 'unbekannt');
await level({ plattform: 'twitch', name: 'mrnightwither', anzahl: -10 });

// Ruhm: Anwesenheit für viele auf einmal, Wächter bekommen mehr, Ungebundene werden gezählt
const ruhm = (body, secret = 'sb-geheim-123') => ruf('/ruhm', { method: 'POST', body: JSON.stringify(body), headers: { Authorization: 'Bearer ' + secret } });
assert.equal((await ruhm({ plattform: 'twitch', quelle: 'anwesenheit', nutzer: ['111'] }, 'falsch')).status, 401);
assert.equal((await ruhm({ plattform: 'twitch', quelle: 'pruefung', nutzer: ['111'] })).status, 400, 'Prüfung nur intern');
assert.equal((await ruhm({ plattform: 'twitch', quelle: 'quatsch', nutzer: ['111'] })).status, 400);
r = await ruhm({ plattform: 'twitch', quelle: 'anwesenheit', nutzer: [{ id: '111' }, { id: 'fremd1' }, 'fremd2'] });
assert.equal(r.daten.gebunden, 1); assert.equal(r.daten.ungebunden, 2);
assert.equal((await ruf('/avatare/profil?plattform=twitch&id=111')).daten.ruhm, 15);
r = await ruhm({ plattform: 'twitch', quelle: 'anwesenheit', nutzer: [{ id: '111', waechter: true }] });
assert.equal((await ruf('/avatare/profil?plattform=twitch&id=111')).daten.ruhm, 15 + 23, 'Wächter ×1,5 (gerundet)');
r = await ruhm({ plattform: 'twitch', quelle: 'sub', nutzer: ['111'] });
assert.deepEqual(r.daten.aufstiege.map((a) => ({ ...a })), [{ name: 'mrnightwither', level: 2, haus: 'haus1' }], 'Aufstieg wird gemeldet');
r = await ruhm({ plattform: 'twitch', quelle: 'bits', nutzer: ['111'], anzahl: 1000 });
assert.equal((await ruf('/avatare/profil?plattform=twitch&id=111')).daten.ruhm, 15 + 23 + 200 + 300);

// !levelup behält den Fortschritt im Level
r = await level({ plattform: 'twitch', name: 'mrnightwither' });
assert.equal(r.daten.level, 4); assert.equal(r.daten.ruhm, 538 + 300);

// Haus-Pokal und Chronik
r = await ruf('/pokal');
assert.equal(r.daten.haeuser.haus1, 538, 'nur gesammelter Ruhm zählt, nicht !levelup'); assert.equal(r.daten.fuehrend, 'haus1');
assert.equal(r.daten.vormonat.sieger, null);
r = await ruf('/chronik');
assert.equal(r.daten.listen.haus1[0].name, 'mrnightwither'); assert.equal(r.daten.listen.haus1[0].ruhm, 838);
assert.equal(r.daten.listen.haus2.length, 0);
r = await level({ plattform: 'twitch', name: 'mrnightwither', anzahl: -10 });
assert.equal(r.daten.level, 1, 'herabsetzen landet wirklich auf dem Ziel-Level'); assert.ok(r.daten.ruhm < 100);

// Morrígans Prüfung
const sb = (pfad, body, secret = 'sb-geheim-123') => ruf(pfad, { method: 'POST', body: JSON.stringify(body || {}), headers: { Authorization: 'Bearer ' + secret } });
assert.equal((await sb('/pruefung/start', {}, 'falsch')).status, 401);
assert.equal((await sb('/pruefung/antwort', { plattform: 'twitch', plattformId: '111', antwort: 'a' })).daten.grund, 'keine');
r = await sb('/pruefung/start');
assert.equal(r.daten.ok, true); assert.equal(r.daten.antworten.length, 3); assert.equal(r.daten.sekunden, 45);
const pid = r.daten.id;
assert.equal((await sb('/pruefung/start')).daten.grund, 'laeuft', 'nur eine Prüfung gleichzeitig');
const richtig = env.DB.roh.prepare('SELECT richtig FROM pruefung WHERE id = ?').get(pid).richtig;
const falsch = 'abc'.split('').find((x) => x !== richtig);
assert.equal((await sb('/pruefung/antwort', { plattform: 'twitch', plattformId: 'fremd', antwort: richtig })).daten.grund, 'unbekannt');
const ruhmVorher = (await ruf('/avatare/profil?plattform=twitch&id=111')).daten.ruhm;
const pokalVorher = (await ruf('/pokal')).daten.haeuser.haus1;
r = await sb('/pruefung/antwort', { plattform: 'twitch', plattformId: '111', antwort: '!' + falsch.toUpperCase() });
assert.equal(r.daten.richtig, false);
assert.equal((await sb('/pruefung/antwort', { plattform: 'twitch', plattformId: '111', antwort: richtig })).daten.grund, 'schon', 'nur ein Versuch');
// zweite Person bindet sich und gewinnt
r = await anmeldung('Rätselfreund'.replace('ä', 'ae'), { ip: '7.7.7.7' });
await bestaetigen({ plattform: 'twitch', plattformId: '222', name: 'Raetselfreund', code: r.daten.code });
r = await sb('/pruefung/antwort', { plattform: 'twitch', plattformId: '222', antwort: richtig });
assert.equal(r.daten.gewinner, true); assert.equal(r.daten.name, 'Raetselfreund'); assert.equal(r.daten.haus, 'Haus des Mondes');
assert.deepEqual(r.daten.aufstiege.map((a) => a.level), [2], '100 Ruhm = Level 2');
assert.equal((await ruf('/avatare/profil?plattform=twitch&id=111')).daten.ruhm, ruhmVorher, 'Falsche Antwort gibt nichts');
assert.equal((await ruf('/pokal')).daten.haeuser.haus1, pokalVorher + 100, 'Prüfung zählt fürs Haus');
r = await sb('/pruefung/ende');
assert.equal(r.daten.richtig, richtig); assert.equal(r.daten.gewinner, 'Raetselfreund');
assert.equal((await sb('/pruefung/antwort', { plattform: 'twitch', plattformId: '222', antwort: richtig })).daten.grund, 'keine');
r = await sb('/pruefung/start');
assert.equal(r.daten.ok, true); assert.notEqual(r.daten.id, pid);
await sb('/pruefung/ende');

// Prophezeiung: mit Pokal-Daten werden die Platzhalter ersetzt
r = await sb('/prophezeiung');
assert.equal(r.daten.ok, true); assert.ok(r.daten.text.length > 10); assert.ok(!/\{[FZL]\}/.test(r.daten.text));
for (let i = 0; i < 30; i++) assert.ok(!/\{|undefined/.test((await sb('/prophezeiung')).daten.text));
assert.equal((await sb('/prophezeiung', {}, 'falsch')).status, 401);

// Jahrestag: Bindung genau vor einem Jahr
const vorEinemJahr = new Date(); vorEinemJahr.setUTCFullYear(vorEinemJahr.getUTCFullYear() - 1);
env.DB.roh.prepare("UPDATE profil SET erstellt_am = ? WHERE id = (SELECT profil_id FROM konto WHERE plattform_id = '111')").run(vorEinemJahr.toISOString());
assert.equal((await ruf('/avatare/profil?plattform=twitch&id=111')).daten.jahrestag, 1);
assert.equal((await ruf('/avatare/profil?plattform=twitch&id=222')).daten.jahrestag, 0);
const p111 = (await ruf('/avatare/profil?plattform=twitch&id=111')).daten, p222 = (await ruf('/avatare/profil?plattform=twitch&id=222')).daten;
assert.equal(p111.platz + p222.platz, 3, 'Plätze 1 und 2 im Haus des Mondes');

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

// Spiele im Overlay (über Streamer.bot) und Würfel der Morrígan
const stand = async () => (await ruf('/avatare/profil?plattform=twitch&id=111')).daten;
assert.equal((await sb('/spiel', { spiel: 'rabe', plattform: 'twitch', gewinner: '111' }, 'falsch')).status, 401);
assert.equal((await sb('/spiel', { spiel: 'quatsch', plattform: 'twitch', gewinner: '111' })).status, 400);
let vorher = await stand();
r = await sb('/spiel', { spiel: 'rabe', plattform: 'twitch', gewinner: '111,fremd9', ruhm: 99999 });
assert.equal(r.daten.ok, true); assert.deepEqual(r.daten.gewinner, ['mrnightwither'], 'nur 1 Gewinner beim Raben');
assert.equal((await stand()).ruhm, vorher.ruhm + 25, 'Menge kommt vom Worker, nicht vom Overlay');
assert.equal((await sb('/spiel', { spiel: 'rabe', plattform: 'twitch', gewinner: '111' })).daten.grund, 'zu_frueh', 'Pause gegen doppelte Meldungen');
// Schatzsuche: Abzug für Verlierer, aber nie unter den Beginn des Levels
vorher = await stand();
r = await sb('/spiel', { spiel: 'schatz', plattform: 'twitch', gewinner: [], verlierer: ['111'] });
assert.equal(r.daten.ok, true); assert.equal(r.daten.abzug, -20);
const nachAbzug = (await stand()).ruhm;
assert.equal(nachAbzug, Math.max(globalThis.NWU_RUHM.ruhmFuerLevel(vorher.level), vorher.ruhm - 20));
assert.equal((await stand()).level, vorher.level, 'niemand steigt durch ein Spiel ab');
env.DB.roh.exec('DELETE FROM spiel_log');
env.DB.roh.exec(`UPDATE profil SET ruhm = ${globalThis.NWU_RUHM.ruhmFuerLevel(vorher.level) + 5}`);
await sb('/spiel', { spiel: 'schatz', plattform: 'twitch', verlierer: '111' });
assert.equal((await stand()).ruhm, globalThis.NWU_RUHM.ruhmFuerLevel(vorher.level), 'Abzug stoppt am Level-Beginn');
env.DB.roh.exec('DELETE FROM spiel_log');
r = await sb('/spiel', { spiel: 'schatz', plattform: 'twitch', gewinner: ['111'], verlierer: ['111'] });
assert.deepEqual(r.daten.verlierer, [], 'wer gewinnt, verliert nicht gleichzeitig');
// Siegerhaus bekommt Pokal-Ruhm, auch ohne Mitspieler
const nebelVorher = (await ruf("/pokal")).daten.haeuser.haus3;
r = await sb('/spiel', { spiel: 'tauziehen', plattform: 'twitch', gewinner: '', haus: 'haus3' });
assert.equal(r.daten.ok, true); assert.equal(r.daten.hausRuhm, 100);
assert.equal((await ruf('/pokal')).daten.haeuser.haus3, nebelVorher + 100);
assert.equal((await sb('/spiel', { spiel: 'rennen', plattform: 'twitch', haus: 'haus5' })).daten.grund, 'leer', 'verborgene Häuser nicht');
assert.equal((await sb('/spiel', { spiel: 'rabe', plattform: 'twitch', haus: 'haus1' })).daten.grund, 'leer', 'Rabe ohne Hauspreis');
// Würfel: einmal pro Stream; 6 = doppelter Ruhm
assert.equal((await sb('/wurf', { plattform: 'twitch', plattformId: 'fremd9' })).daten.grund, 'unbekannt');
r = await sb('/wurf', { plattform: 'twitch', plattformId: '111' });
assert.equal(r.daten.ok, true); assert.ok(r.daten.wurf >= 1 && r.daten.wurf <= 6);
assert.equal((await sb('/wurf', { plattform: 'twitch', plattformId: '111' })).daten.grund, 'schon', 'nur einmal pro Stream');
env.DB.roh.exec(`UPDATE profil SET doppelt_bis = '${new Date(Date.now() + 3600000).toISOString()}'`);
vorher = await stand();
await ruhm({ plattform: 'twitch', quelle: 'anwesenheit', nutzer: ['111'] });
assert.equal((await stand()).ruhm, vorher.ruhm + 30, 'doppelter Ruhm nach einer 6');
env.DB.roh.exec(`UPDATE profil SET doppelt_bis = '${new Date(Date.now() - 1000).toISOString()}'`);
vorher = await stand();
await ruhm({ plattform: 'twitch', quelle: 'anwesenheit', nutzer: ['111'] });
assert.equal((await stand()).ruhm, vorher.ruhm + 15, 'danach wieder normal');
const wuerfe = new Set();
for (let i = 0; i < 60; i++) {
  env.DB.roh.exec('UPDATE profil SET wurf_am = NULL');
  const w = (await sb('/wurf', { plattform: 'twitch', plattformId: '111' })).daten;
  wuerfe.add(w.wurf);
  if (w.wurf > 1 && w.wurf < 6) assert.equal(w.ruhm, w.wurf * 10);
}
assert.equal(wuerfe.size, 6, 'alle Augenzahlen kommen vor');

// Unbekannter Pfad
assert.equal((await ruf('/gibtsnicht')).status, 404);

console.log('Alle Worker-Tests bestanden ✔');
