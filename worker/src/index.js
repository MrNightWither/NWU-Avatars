// NWU Avatare – eigener Cloudflare Worker (getrennt von nwu-anmeldung)
// Schnittstellen: siehe docs/DATENMODELL.md
//
// Bindings (wrangler.toml / Dashboard):
//   DB                  D1-Datenbank (schema.sql)
//   ERLAUBTE_HERKUNFT   Komma-Liste erlaubter Website-Adressen für CORS
//   STREAMERBOT_SECRET  Secret für /avatare/bestaetigen (nie in den Code!)
//   ADMIN_SECRET        Secret für /avatare/rolle
//   (STREAMERBOT_SECRET gilt auch für /avatare/level, /avatare/aussehen, /reise/essenz, /erfolge/plus)

import '../../data/haeuser.js';
import '../../data/quiz.js';
import '../../data/auswertung.js';
import '../../data/meilensteine.js';
import '../../data/erfolge.js';
import '../../data/aussehen.js';

const HAEUSER = globalThis.NWU_HAEUSER;
const QUIZ = globalThis.NWU_QUIZ;
const auswerten = globalThis.NWU_AUSWERTEN;
const REISE = globalThis.NWU_REISE;
const reiseStand = globalThis.NWU_REISE_STAND;

const PLATTFORMEN = ['twitch', 'kick', 'youtube', 'tiktok'];
const FIGUREN = ['a', 'b', 'c', 'd'];
const ROLLEN = ['waechter', 'koenigskreis', 'verbuendet', 'koenig', 'morrigan'];
const CODE_MINUTEN = 15;
const ANMELDUNGEN_PRO_STUNDE = 5;

// ---------- Hilfen ----------
const jetzt = () => new Date().toISOString();
const zufallsId = (bytes = 18) => {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const zufallsCode = () => String(1000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 9000));

async function sha256(text) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

// Vergleich in konstanter Zeit, damit Secrets nicht über Laufzeit erraten werden können
function gleich(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function nameGueltig(plattform, name) {
  if (typeof name !== 'string') return false;
  if (plattform === 'twitch' || plattform === 'kick') return /^[A-Za-z0-9_]{3,25}$/.test(name);
  if (plattform === 'tiktok') return /^[A-Za-z0-9_.]{2,24}$/.test(name);
  return name.length >= 2 && name.length <= 40 && !/[<>]/.test(name);
}

function corsKopf(req, env) {
  const herkunft = req.headers.get('Origin');
  const erlaubt = (env.ERLAUBTE_HERKUNFT || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!herkunft || !erlaubt.includes(herkunft)) return {};
  return {
    'Access-Control-Allow-Origin': herkunft,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

const antwort = (daten, status, extra) => new Response(JSON.stringify(daten), {
  status: status || 200,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...(extra || {}) },
});
const fehler = (text, status, extra) => antwort({ fehler: text }, status, extra);

async function jsonLesen(req) {
  if (Number(req.headers.get('Content-Length') || 0) > 8000) return null;
  try { return await req.json(); } catch (e) { return null; }
}

// ---------- Quiz prüfen und Haus berechnen ----------
function quizPruefen(fragen, antworten) {
  if (!Array.isArray(fragen) || !Array.isArray(antworten)) return false;
  if (fragen.length !== QUIZ.runden || antworten.length !== QUIZ.runden) return false;
  if (new Set(fragen).size !== fragen.length) return false;
  for (let i = 0; i < fragen.length; i++) {
    const f = QUIZ.fragen.find((x) => x.id === fragen[i]);
    if (!f || !f.antworten.some((a) => a.id === antworten[i])) return false;
  }
  return true;
}

async function belegung(env) {
  const { results } = await env.DB.prepare('SELECT haus, COUNT(*) AS n FROM profil WHERE haus IS NOT NULL GROUP BY haus').all();
  const b = Object.fromEntries(globalThis.NWU_AKTIVE_HAEUSER.map((h) => [h.id, 0]));
  for (const r of results) b[r.haus] = r.n;
  return b;
}

// ---------- Endpunkte ----------
async function anmeldungAnlegen(req, env, cors) {
  const d = await jsonLesen(req);
  if (!d) return fehler('Ungültige Anfrage', 400, cors);
  const plattform = d.plattform, name = typeof d.name === 'string' ? d.name.trim().replace(/^@/, '') : '';
  if (!PLATTFORMEN.includes(plattform)) return fehler('Unbekannte Plattform', 400, cors);
  if (!nameGueltig(plattform, name)) return fehler('Ungültiger Name', 400, cors);
  if (!FIGUREN.includes(d.figur)) return fehler('Ungültige Figur', 400, cors);
  if (!quizPruefen(d.fragen, d.antworten)) return fehler('Ungültiges Quiz', 400, cors);

  const klein = name.toLowerCase();
  const gebunden = await env.DB.prepare('SELECT 1 FROM konto WHERE plattform = ? AND name_klein = ?').bind(plattform, klein).first();
  if (gebunden) return fehler('Name ist schon gebunden', 409, cors);

  const ipHash = await sha256((req.headers.get('CF-Connecting-IP') || 'unbekannt') + '|nwu');
  const vorEinerStunde = new Date(Date.now() - 3600e3).toISOString();
  const anzahl = await env.DB.prepare('SELECT COUNT(*) AS n FROM anmeldung WHERE ip_hash = ? AND erstellt_am > ?').bind(ipHash, vorEinerStunde).first();
  if (anzahl.n >= ANMELDUNGEN_PRO_STUNDE) return fehler('Zu viele Versuche, bitte später erneut', 429, cors);

  // Haus rechnet der Server selbst – was der Browser zeigt, ist nur Vorschau
  const haus = auswerten(QUIZ, d.antworten, await belegung(env)).haus;
  const id = zufallsId(), code = zufallsCode();
  const bis = new Date(Date.now() + CODE_MINUTEN * 60e3).toISOString();

  await env.DB.batch([
    // Ältere offene Anmeldungen für denselben Namen verfallen lassen
    env.DB.prepare("UPDATE anmeldung SET status = 'abgelaufen' WHERE plattform = ? AND name_klein = ? AND status = 'offen'").bind(plattform, klein),
    env.DB.prepare(`INSERT INTO anmeldung (id, plattform, name, name_klein, code, haus, figur, quiz, status, ip_hash, gueltig_bis, erstellt_am)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'offen', ?, ?, ?)`)
      .bind(id, plattform, name, klein, code, haus, d.figur, JSON.stringify({ fragen: d.fragen, antworten: d.antworten }), ipHash, bis, jetzt()),
  ]);
  return antwort({ id, code, haus, gueltigBis: bis }, 200, cors);
}

async function anmeldungStatus(id, env, cors) {
  if (!/^[A-Za-z0-9_-]{10,40}$/.test(id)) return fehler('Nicht gefunden', 404, cors);
  const a = await env.DB.prepare('SELECT status, gueltig_bis FROM anmeldung WHERE id = ?').bind(id).first();
  if (!a) return fehler('Nicht gefunden', 404, cors);
  const status = a.status === 'offen' && a.gueltig_bis < jetzt() ? 'abgelaufen' : a.status;
  return antwort({ status }, 200, cors);
}

// Von Streamer.bot: Chat-Befehl !bestätigen <code>
async function bestaetigen(req, env) {
  const auth = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!env.STREAMERBOT_SECRET || !gleich(auth, env.STREAMERBOT_SECRET)) return fehler('Nicht erlaubt', 401);
  const d = await jsonLesen(req);
  if (!d || !PLATTFORMEN.includes(d.plattform) || typeof d.plattformId !== 'string' || !d.plattformId
      || typeof d.name !== 'string' || !/^\d{4}$/.test(String(d.code))) return antwort({ ok: false, grund: 'ungueltig' }, 400);

  const klein = d.name.trim().replace(/^@/, '').toLowerCase();
  const schon = await env.DB.prepare('SELECT profil_id FROM konto WHERE plattform = ? AND plattform_id = ?').bind(d.plattform, d.plattformId).first();
  if (schon) return antwort({ ok: false, grund: 'schon_gebunden' });

  const a = await env.DB.prepare("SELECT * FROM anmeldung WHERE plattform = ? AND name_klein = ? AND status = 'offen' ORDER BY erstellt_am DESC LIMIT 1")
    .bind(d.plattform, klein).first();
  if (!a || !gleich(a.code, String(d.code))) return antwort({ ok: false, grund: 'kein_code' });
  if (a.gueltig_bis < jetzt()) {
    await env.DB.prepare("UPDATE anmeldung SET status = 'abgelaufen' WHERE id = ?").bind(a.id).run();
    return antwort({ ok: false, grund: 'abgelaufen' });
  }

  const profilId = crypto.randomUUID(), t = jetzt();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO profil (id, haus, rolle, figur, quiz, erstellt_am) VALUES (?, ?, NULL, ?, ?, ?)').bind(profilId, a.haus, a.figur, a.quiz, t),
    env.DB.prepare('INSERT INTO konto (plattform, plattform_id, name, name_klein, profil_id, bestaetigt_am) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(d.plattform, d.plattformId, d.name.trim(), klein, profilId, t),
    env.DB.prepare("UPDATE anmeldung SET status = 'bestaetigt' WHERE id = ?").bind(a.id),
  ]);
  const haus = HAEUSER.find((h) => h.id === a.haus);
  return antwort({ ok: true, haus: haus ? haus.name : a.haus });
}

// Für das Overlay: Aussehen eines Chatters (nur öffentliche Spiel-Daten)
async function profil(url, env, cors) {
  const plattform = url.searchParams.get('plattform');
  const id = url.searchParams.get('id');
  const name = (url.searchParams.get('name') || '').toLowerCase();
  if (!PLATTFORMEN.includes(plattform) || (!id && !name)) return fehler('Ungültige Anfrage', 400, cors);
  const sql = `SELECT p.haus, p.rolle, p.figur, p.level, p.aussehen FROM konto k JOIN profil p ON p.id = k.profil_id
               WHERE k.plattform = ? AND ${id ? 'k.plattform_id = ?' : 'k.name_klein = ?'} AND p.gesperrt = 0`;
  const p = await env.DB.prepare(sql).bind(plattform, id || name).first();
  if (!p) return antwort({ gefunden: false }, 200, { ...cors, 'Cache-Control': 'max-age=60' });
  let aussehen = {};
  try { aussehen = p.aussehen ? JSON.parse(p.aussehen) : {}; } catch (e) { /* kaputt = Standard */ }
  return antwort({ gefunden: true, ...p, aussehen }, 200, { ...cors, 'Cache-Control': 'max-age=60' });
}

// Admin: Rolle setzen (z. B. aus Streamer.bot-Gruppen oder per Hand)
async function rolleSetzen(req, env) {
  const auth = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!env.ADMIN_SECRET || !gleich(auth, env.ADMIN_SECRET)) return fehler('Nicht erlaubt', 401);
  const d = await jsonLesen(req);
  if (!d || !PLATTFORMEN.includes(d.plattform) || typeof d.plattformId !== 'string') return fehler('Ungültige Anfrage', 400);
  if (d.rolle !== null && !ROLLEN.includes(d.rolle)) return fehler('Unbekannte Rolle', 400);
  const r = await env.DB.prepare('UPDATE profil SET rolle = ? WHERE id = (SELECT profil_id FROM konto WHERE plattform = ? AND plattform_id = ?)')
    .bind(d.rolle, d.plattform, d.plattformId).run();
  return antwort({ ok: r.meta.changes > 0 });
}

// Von Streamer.bot: Chat-Befehl !levelup @Name [Anzahl] (nur der Streamer, prüft Streamer.bot)
async function levelAendern(req, env) {
  const auth = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!env.STREAMERBOT_SECRET || !gleich(auth, env.STREAMERBOT_SECRET)) return fehler('Nicht erlaubt', 401);
  const d = await jsonLesen(req);
  const name = typeof d?.name === 'string' ? d.name.trim().replace(/^@/, '').toLowerCase() : '';
  const anzahl = d?.anzahl === undefined ? 1 : Number(d.anzahl);
  if (!d || !PLATTFORMEN.includes(d.plattform) || (!name && typeof d.plattformId !== 'string')
      || !Number.isInteger(anzahl) || anzahl === 0 || Math.abs(anzahl) > 100) return antwort({ ok: false, grund: 'ungueltig' }, 400);
  const k = await env.DB.prepare(`SELECT profil_id, name FROM konto WHERE plattform = ? AND ${name ? 'name_klein' : 'plattform_id'} = ?`)
    .bind(d.plattform, name || d.plattformId).first();
  if (!k) return antwort({ ok: false, grund: 'unbekannt' });
  const p = await env.DB.prepare('UPDATE profil SET level = MAX(1, MIN(999, level + ?)) WHERE id = ? RETURNING level')
    .bind(anzahl, k.profil_id).first();
  return antwort({ ok: true, name: k.name, level: p.level });
}

// Von Streamer.bot: Chat-Befehl !haare <farbe> – jeder für sich selbst, erst ab dem freigeschalteten Level
async function aussehenSetzen(req, env) {
  const auth = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!env.STREAMERBOT_SECRET || !gleich(auth, env.STREAMERBOT_SECRET)) return fehler('Nicht erlaubt', 401);
  const d = await jsonLesen(req);
  if (!d || !PLATTFORMEN.includes(d.plattform) || typeof d.plattformId !== 'string' || !d.plattformId) return antwort({ ok: false, grund: 'ungueltig' }, 400);
  const haare = typeof d.haare === 'string' ? d.haare.trim().toLowerCase().replace('ü', 'ue').replace('ß', 'ss') : '';
  if (!globalThis.NWU_HAARFARBEN[haare]) return antwort({ ok: false, grund: 'farbe', farben: Object.keys(globalThis.NWU_HAARFARBEN) });
  const p = await env.DB.prepare('SELECT p.id, p.level, p.aussehen FROM konto k JOIN profil p ON p.id = k.profil_id WHERE k.plattform = ? AND k.plattform_id = ?')
    .bind(d.plattform, d.plattformId).first();
  if (!p) return antwort({ ok: false, grund: 'unbekannt' });
  const frei = globalThis.NWU_FREISCHALTUNGEN.find((f) => f.id === 'haare');
  if (!globalThis.NWU_FREI(p.level, 'haare')) return antwort({ ok: false, grund: 'level', level: frei.level });
  if (!globalThis.NWU_HAARFARBE_FREI(p.level, haare)) {
    const selten = globalThis.NWU_FREISCHALTUNGEN.find((f) => f.id === 'haare_selten');
    return antwort({ ok: false, grund: 'level', level: selten.level });
  }
  let aussehen = {};
  try { aussehen = p.aussehen ? JSON.parse(p.aussehen) : {}; } catch (e) { /* neu anfangen */ }
  aussehen.haare = haare;
  await env.DB.prepare('UPDATE profil SET aussehen = ? WHERE id = ?').bind(JSON.stringify(aussehen), p.id).run();
  return antwort({ ok: true, haare: globalThis.NWU_HAARFARBEN[haare].name });
}

// ---------- Meilensteinkarte (vier Pfade, einer pro Plattform) ----------
const PFADE = REISE.pfade.map((p) => p.id);

async function reiseStaende(env) {
  const { results } = await env.DB.prepare("SELECT schluessel, wert FROM reise WHERE schluessel LIKE 'essenz:%'").all();
  const werte = Object.fromEntries(results.map((r) => [r.schluessel.slice(7), r.wert]));
  const pfade = {};
  for (const id of PFADE) {
    const st = reiseStand(werte[id] || 0, id);
    pfade[id] = { essenz: st.essenz, erreicht: st.erreicht.id, naechster: st.naechster ? st.naechster.id : null, anteil: st.anteil, angekommen: st.angekommen };
  }
  return { pfade, zitadelleOffen: PFADE.every((id) => pfade[id].angekommen) };
}

async function reiseLesen(env, cors) {
  return antwort(await reiseStaende(env), 200, { ...cors, 'Cache-Control': 'max-age=15' });
}

async function essenzAddieren(env, pfad, menge, quelle) {
  const vorher = await reiseStaende(env);
  const alt = vorher.pfade[pfad].essenz;
  await env.DB.batch([
    env.DB.prepare('INSERT INTO reise (schluessel, wert) VALUES (?, MAX(0, ?)) ON CONFLICT(schluessel) DO UPDATE SET wert = MAX(0, wert + ?)')
      .bind('essenz:' + pfad, menge, menge),
    env.DB.prepare('INSERT INTO essenz_log (zeit, pfad, quelle, menge) VALUES (?, ?, ?, ?)').bind(jetzt(), pfad, quelle, menge),
  ]);
  const neuWert = Math.max(0, alt + menge);
  const ms = REISE.pfade.find((p) => p.id === pfad).meilensteine;
  const neu = ms.filter((m) => m.essenz > alt && m.essenz <= neuWert).map((m) => ({ id: m.id, name: m.name }));
  const nachher = await reiseStaende(env);
  return { ok: true, pfad, essenz: neuWert, neu, zitadelleGeoeffnet: !vorher.zitadelleOffen && nachher.zitadelleOffen };
}

// Von Streamer.bot: Ereignisse in Essenz umrechnen
async function essenzMelden(req, env) {
  const auth = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!env.STREAMERBOT_SECRET || !gleich(auth, env.STREAMERBOT_SECRET)) return fehler('Nicht erlaubt', 401);
  const d = await jsonLesen(req);
  const pfad = (d && d.plattform) || 'twitch';
  if (!PFADE.includes(pfad)) return fehler('Unbekannte Plattform', 400);
  const menge = globalThis.NWU_ESSENZ_FUER(pfad, d && d.quelle, d && d.anzahl);
  if (menge === null) return fehler('Diese Quelle gibt es auf dieser Plattform nicht', 400);
  return antwort(await essenzAddieren(env, pfad, menge, d.quelle));
}

// Von Hand (Admin): beliebig dazugeben oder abziehen
async function essenzHand(req, env) {
  const auth = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!env.ADMIN_SECRET || !gleich(auth, env.ADMIN_SECRET)) return fehler('Nicht erlaubt', 401);
  const d = await jsonLesen(req);
  if (!d || !PFADE.includes(d.plattform)) return fehler('Unbekannte Plattform', 400);
  const menge = Math.trunc(Number(d.menge));
  if (!Number.isFinite(menge) || Math.abs(menge) > 1000000) return fehler('Ungültige Menge', 400);
  return antwort(await essenzAddieren(env, d.plattform, menge, 'hand'));
}

// ---------- Erfolgskarte (Follower und Unterstützer, echte Zahlen) ----------
const ERFOLGE = globalThis.NWU_ERFOLGE;
const erfolgStand = globalThis.NWU_ERFOLG_STAND;
const wegErlaubt = (weg, plattform) => {
  const w = ERFOLGE.wege.find((x) => x.id === weg);
  return !!w && w.plattformen.includes(plattform);
};

async function erfolgeLesen(env, cors) {
  const { results } = await env.DB.prepare('SELECT schluessel, wert FROM erfolg').all();
  const werte = Object.fromEntries(results.map((r) => [r.schluessel, r.wert]));
  const daten = {};
  for (const w of ERFOLGE.wege) {
    daten[w.id] = {};
    for (const p of w.plattformen) daten[w.id][p] = werte[w.id + ':' + p] || 0;
  }
  return antwort(daten, 200, { ...cors, 'Cache-Control': 'max-age=15' });
}

async function erfolgAendern(env, weg, plattform, neuWert) {
  const schluessel = weg + ':' + plattform;
  const alt = (await env.DB.prepare('SELECT wert FROM erfolg WHERE schluessel = ?').bind(schluessel).first() || { wert: 0 }).wert;
  const wert = Math.max(0, neuWert(alt));
  await env.DB.prepare('INSERT INTO erfolg (schluessel, wert, aktualisiert) VALUES (?, ?, ?) ON CONFLICT(schluessel) DO UPDATE SET wert = excluded.wert, aktualisiert = excluded.aktualisiert')
    .bind(schluessel, wert, jetzt()).run();
  const stufen = ERFOLGE.wege.find((w) => w.id === weg).stufen;
  const neu = stufen.filter((s) => s.wert > alt && s.wert <= wert).map((s) => ({ wert: s.wert, name: s.name }));
  return { ok: true, weg, plattform, wert, neu };
}

// Von Streamer.bot: ein Follow / Sub dazu (Gift-Bomb: anzahl)
async function erfolgPlus(req, env) {
  const auth = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!env.STREAMERBOT_SECRET || !gleich(auth, env.STREAMERBOT_SECRET)) return fehler('Nicht erlaubt', 401);
  const d = await jsonLesen(req);
  if (!d || !wegErlaubt(d.weg, d.plattform)) return fehler('Unbekannter Weg oder Plattform', 400);
  const anzahl = Math.min(1000, Math.max(1, Math.floor(Number(d.anzahl) || 1)));
  return antwort(await erfolgAendern(env, d.weg, d.plattform, (alt) => alt + anzahl));
}

// Von Hand (Admin): Startwert eintragen oder korrigieren
async function erfolgSetzen(req, env) {
  const auth = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!env.ADMIN_SECRET || !gleich(auth, env.ADMIN_SECRET)) return fehler('Nicht erlaubt', 401);
  const d = await jsonLesen(req);
  if (!d || !wegErlaubt(d.weg, d.plattform)) return fehler('Unbekannter Weg oder Plattform', 400);
  const wert = Math.trunc(Number(d.wert));
  if (!Number.isFinite(wert) || wert < 0 || wert > 100000000) return fehler('Ungültiger Wert', 400);
  return antwort(await erfolgAendern(env, d.weg, d.plattform, () => wert));
}

// ---------- Router ----------
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const cors = corsKopf(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    try {
      if (req.method === 'GET' && url.pathname === '/avatare/belegung') return antwort(await belegung(env), 200, cors);
      if (req.method === 'POST' && url.pathname === '/avatare/anmeldung') return await anmeldungAnlegen(req, env, cors);
      const m = url.pathname.match(/^\/avatare\/anmeldung\/([^/]+)$/);
      if (req.method === 'GET' && m) return await anmeldungStatus(decodeURIComponent(m[1]), env, cors);
      if (req.method === 'POST' && url.pathname === '/avatare/bestaetigen') return await bestaetigen(req, env);
      if (req.method === 'GET' && url.pathname === '/avatare/profil') return await profil(url, env, cors);
      if (req.method === 'POST' && url.pathname === '/avatare/rolle') return await rolleSetzen(req, env);
      if (req.method === 'POST' && url.pathname === '/avatare/level') return await levelAendern(req, env);
      if (req.method === 'POST' && url.pathname === '/avatare/aussehen') return await aussehenSetzen(req, env);
      if (req.method === 'GET' && url.pathname === '/reise') return await reiseLesen(env, cors);
      if (req.method === 'POST' && url.pathname === '/reise/essenz') return await essenzMelden(req, env);
      if (req.method === 'POST' && url.pathname === '/reise/hand') return await essenzHand(req, env);
      if (req.method === 'GET' && url.pathname === '/erfolge') return await erfolgeLesen(env, cors);
      if (req.method === 'POST' && url.pathname === '/erfolge/plus') return await erfolgPlus(req, env);
      if (req.method === 'POST' && url.pathname === '/erfolge/setzen') return await erfolgSetzen(req, env);
      return fehler('Nicht gefunden', 404, cors);
    } catch (e) {
      console.error(e);
      return fehler('Serverfehler', 500, cors);
    }
  },
};
