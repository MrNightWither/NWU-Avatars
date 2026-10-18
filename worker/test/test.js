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

// Abgelaufener Code
r = await anmeldung('SpaeterLeser', { ip: '5.5.5.5' });
env.DB.roh.prepare("UPDATE anmeldung SET gueltig_bis = '2000-01-01T00:00:00.000Z' WHERE id = ?").run(r.daten.id);
assert.equal((await bestaetigen({ plattform: 'twitch', plattformId: '333', name: 'SpaeterLeser', code: r.daten.code })).daten.grund, 'abgelaufen');
assert.equal((await ruf('/avatare/anmeldung/' + r.daten.id)).daten.status, 'abgelaufen');

// Rate-Limit: 5 pro Stunde und IP
for (let i = 0; i < 5; i++) await anmeldung('Spammer' + i, { ip: '9.9.9.9' });
assert.equal((await anmeldung('Spammer9', { ip: '9.9.9.9' })).status, 429);

// Unbekannter Pfad
assert.equal((await ruf('/gibtsnicht')).status, 404);

console.log('Alle Worker-Tests bestanden ✔');
