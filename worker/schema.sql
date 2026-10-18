-- NWU Avatare – Datenbank (Cloudflare D1 / SQLite)
-- Einspielen: npx wrangler d1 execute nwu-avatare --remote --file=schema.sql

-- Ein Mensch = ein Profil
CREATE TABLE IF NOT EXISTS profil (
  id            TEXT PRIMARY KEY,
  haus          TEXT,                       -- 'haus1' … 'haus6', NULL nur bei Rolle koenig/morrigan
  rolle         TEXT,                       -- NULL | waechter | koenigskreis | verbuendet | koenig | morrigan
  figur         TEXT NOT NULL,              -- 'a' | 'b' | 'c' | 'd'
  level         INTEGER NOT NULL DEFAULT 1,   -- folgt immer aus ruhm (data/ruhm.js)
  ruhm          INTEGER NOT NULL DEFAULT 0,
  aussehen      TEXT,                       -- JSON, z. B. { "haare": "rot" } (freigeschaltet nach Level)
  punkte        INTEGER NOT NULL DEFAULT 0,
  quiz          TEXT NOT NULL,              -- JSON { fragen, antworten }
  gesperrt      INTEGER NOT NULL DEFAULT 0,
  erstellt_am   TEXT NOT NULL
);

-- Plattform-Konto → Profil (ein Profil kann mehrere Konten haben)
CREATE TABLE IF NOT EXISTS konto (
  plattform     TEXT NOT NULL,              -- twitch | kick | youtube | tiktok
  plattform_id  TEXT NOT NULL,              -- feste ID der Plattform
  name          TEXT NOT NULL,              -- aktueller Anzeigename
  name_klein    TEXT NOT NULL,              -- für die Suche ohne Groß/Klein
  profil_id     TEXT NOT NULL REFERENCES profil(id),
  bestaetigt_am TEXT NOT NULL,
  PRIMARY KEY (plattform, plattform_id)
);
CREATE INDEX IF NOT EXISTS konto_name ON konto (plattform, name_klein);

-- Offene Anmeldungen von der Website (15 Minuten gültig)
CREATE TABLE IF NOT EXISTS anmeldung (
  id            TEXT PRIMARY KEY,
  plattform     TEXT NOT NULL,
  name          TEXT NOT NULL,
  name_klein    TEXT NOT NULL,
  code          TEXT NOT NULL,
  haus          TEXT NOT NULL,              -- vom Server berechnet
  figur         TEXT NOT NULL,
  quiz          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'offen',   -- offen | bestaetigt | abgelaufen
  ip_hash       TEXT NOT NULL,              -- nur für das Rate-Limit, kein Klartext
  gueltig_bis   TEXT NOT NULL,
  erstellt_am   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS anmeldung_suche ON anmeldung (plattform, name_klein, status);
CREATE INDEX IF NOT EXISTS anmeldung_ip ON anmeldung (ip_hash, erstellt_am);

-- Meilensteinkarte: gemeinsame Schatten-Essenz der Community
CREATE TABLE IF NOT EXISTS reise (
  schluessel    TEXT PRIMARY KEY,
  wert          INTEGER NOT NULL
);
-- eine Zeile pro Plattform-Pfad
INSERT OR IGNORE INTO reise (schluessel, wert) VALUES ('essenz:twitch', 0), ('essenz:youtube', 0), ('essenz:kick', 0), ('essenz:tiktok', 0);

-- Protokoll, woher die Essenz kam (zum Nachvollziehen)
CREATE TABLE IF NOT EXISTS essenz_log (
  zeit          TEXT NOT NULL,
  pfad          TEXT NOT NULL,
  quelle        TEXT NOT NULL,
  menge         INTEGER NOT NULL
);

-- Erfolgskarte: echte Zahlen pro Plattform (Schlüssel z. B. 'follower:twitch', 'unterstuetzer:kick')
CREATE TABLE IF NOT EXISTS erfolg (
  schluessel    TEXT PRIMARY KEY,
  wert          INTEGER NOT NULL,
  aktualisiert  TEXT NOT NULL
);

-- Haus-Pokal: Ruhm pro Haus und Monat ('2026-10')
CREATE TABLE IF NOT EXISTS haus_ruhm (
  monat         TEXT NOT NULL,
  haus          TEXT NOT NULL,
  ruhm          INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (monat, haus)
);
CREATE INDEX IF NOT EXISTS profil_ruhm ON profil (haus, ruhm);

-- Morrígans Prüfung: immer höchstens eine offene Frage
CREATE TABLE IF NOT EXISTS pruefung (
  id            TEXT PRIMARY KEY,
  frage_id      TEXT NOT NULL,
  reihenfolge   TEXT NOT NULL,              -- JSON: gemischte Antwort-Indizes, z. B. [2,0,1]
  richtig       TEXT NOT NULL,              -- Buchstabe der richtigen Antwort ('a' …)
  start         TEXT NOT NULL,
  ende          TEXT NOT NULL,
  geschlossen   INTEGER NOT NULL DEFAULT 0,
  gewinner_id   TEXT,                       -- profil.id
  gewinner_name TEXT,
  gewinner_haus TEXT
);
CREATE TABLE IF NOT EXISTS pruefung_antwort (
  pruefung_id   TEXT NOT NULL,
  profil_id     TEXT NOT NULL,
  PRIMARY KEY (pruefung_id, profil_id)      -- jede Person antwortet nur einmal
);
