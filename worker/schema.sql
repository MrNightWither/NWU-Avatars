-- NWU Avatare – Datenbank (Cloudflare D1 / SQLite)
-- Einspielen: npx wrangler d1 execute nwu-avatare --remote --file=schema.sql

-- Ein Mensch = ein Profil
CREATE TABLE IF NOT EXISTS profil (
  id            TEXT PRIMARY KEY,
  haus          TEXT,                       -- 'haus1' … 'haus6', NULL nur bei Rolle koenig/morrigan
  rolle         TEXT,                       -- NULL | waechter | koenigskreis | verbuendet | koenig | morrigan
  figur         TEXT NOT NULL,              -- 'a' | 'b' | 'c' | 'd'
  level         INTEGER NOT NULL DEFAULT 1,
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
