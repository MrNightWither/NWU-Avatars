# Datenmodell und Schnittstellen (Paket 1, Entwurf)

Stand: 17.10.2026. Grundlage: Plan Abschnitte 4, 5, 8 und 12.
Die Website (Paket 2) spricht bereits genau diese Schnittstellen an. Solange in
`js/einstellungen.js` keine `api` eingetragen ist, läuft sie im Demo-Modus.

Speicherort: **eigener Cloudflare Worker `nwu-avatare` + D1** (Code in `worker/`, Einrichtung in `worker/README.md`).
Der bestehende Worker `nwu-anmeldung` bleibt unberührt. Ob Echtzeit-Teile
(Anwesenheit, Kampf, Overlay-Zustand) später dort oder auf einem Server laufen, ist offen.

## Grundsätze

- Jedes Profil hat eine **interne Profil-ID**. Plattform und Name hängen nur als Verknüpfung daran.
  So lassen sich Konten zusammenführen und später ein Twitch-Login ergänzen.
- **Haus ist Pflicht** (außer Schattenkönig und Morrígan), **Rolle ist ein eigenes Feld** daneben.
- **Haus und Startfigur sind nach der Bestätigung fest.**
- Der Server **rechnet das Quiz selbst nach** (`data/quiz.js` + `data/auswertung.js`).
  Was der Browser als Haus anzeigt, gilt nur als Vorschau.
- Gespeichert werden nur Name und Plattform-ID (Datenschutz, Plan 12).

## Tabellen (D1 / SQLite)

```sql
-- Ein Mensch = ein Profil
CREATE TABLE profil (
  id            TEXT PRIMARY KEY,          -- z. B. UUID
  haus          TEXT,                      -- 'haus1' … 'haus6', NULL nur bei Rolle koenig/morrigan
  rolle         TEXT,                      -- NULL | 'waechter' | 'koenigskreis' | 'verbuendet' | 'koenig' | 'morrigan'
  figur         TEXT NOT NULL,             -- 'a' | 'b' | 'c' | 'd' (Startfigur im Haus)
  level         INTEGER NOT NULL DEFAULT 1,
  punkte        INTEGER NOT NULL DEFAULT 0,
  quiz          TEXT NOT NULL,             -- JSON: { fragen: [...], antworten: [...] } zum Nachvollziehen
  gesperrt      INTEGER NOT NULL DEFAULT 0,-- 1 = vom Admin gesperrt
  erstellt_am   TEXT NOT NULL
);

-- Verknüpfung Plattform-Konto → Profil (ein Profil kann mehrere haben)
CREATE TABLE konto (
  plattform     TEXT NOT NULL,             -- 'twitch' | 'kick' | 'youtube' | 'tiktok'
  plattform_id  TEXT NOT NULL,             -- feste ID der Plattform (nicht der Anzeigename)
  name          TEXT NOT NULL,             -- aktueller Anzeigename, wird bei jeder Nachricht aktualisiert
  profil_id     TEXT NOT NULL REFERENCES profil(id),
  bestaetigt_am TEXT NOT NULL,
  PRIMARY KEY (plattform, plattform_id)
);
CREATE INDEX konto_name ON konto (plattform, lower(name));

-- Offene Anmeldungen von der Website (laufen nach 15 Minuten ab)
CREATE TABLE anmeldung (
  id            TEXT PRIMARY KEY,          -- zufällig, lang, nicht erratbar
  plattform     TEXT NOT NULL,
  name          TEXT NOT NULL,             -- wie auf der Website eingegeben
  code          TEXT NOT NULL,             -- 4 Ziffern
  haus          TEXT NOT NULL,             -- vom Server berechnet
  figur         TEXT NOT NULL,
  quiz          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'offen',  -- 'offen' | 'bestaetigt' | 'abgelaufen'
  gueltig_bis   TEXT NOT NULL,
  erstellt_am   TEXT NOT NULL
);
CREATE INDEX anmeldung_suche ON anmeldung (plattform, lower(name), code);
```

Items, Slots, Punkte-Verlauf und Anwesenheit kommen in Paket 1 bzw. 4 dazu.

## Schnittstellen

Alle Antworten sind JSON. Fehler haben die Form `{ "fehler": "Text" }`.

### `GET /avatare/belegung` (öffentlich)

Mitglieder je Haus, damit bei knappen Quiz-Ergebnissen das kleinere Haus gewinnt.

```json
{ "haus1": 12, "haus2": 30, "haus3": 8, "haus4": 21, "haus5": 15, "haus6": 9 }
```

### `POST /avatare/anmeldung` (öffentlich, von der Website)

```json
{ "plattform": "twitch", "name": "MrNightWither", "figur": "b",
  "fragen": ["q03", "q17", …], "antworten": ["q03b", "q17a", …] }
```

Der Worker prüft:
- Plattform bekannt, Name gültig, Figur `a`–`d`
- `fragen` sind 12 verschiedene, existierende Fragen, `antworten` gehören genau zu diesen Fragen
- Name auf dieser Plattform ist **noch nicht** an ein Profil gebunden, sonst `409`
- Rate-Limit pro IP (z. B. 5 Anmeldungen pro Stunde), sonst `429`

Dann berechnet er das Haus selbst, legt die Anmeldung an und antwortet:

```json
{ "id": "k3J…", "code": "4821", "haus": "haus1", "gueltigBis": "2026-10-17T19:15:00Z" }
```

### `GET /avatare/anmeldung/:id` (öffentlich, die Website fragt alle 4 Sekunden)

```json
{ "status": "offen" }          // oder "bestaetigt" / "abgelaufen"
```

### `GET /avatare/profil?plattform=twitch&id=…` (öffentlich, für das Overlay)

Alternativ `&name=…`. Antwort: `{ "gefunden": true, "haus": "haus1", "rolle": null, "figur": "b", "level": 1 }`
oder `{ "gefunden": false }`. Wird 60 Sekunden zwischengespeichert.

### `POST /avatare/rolle` (nur mit `ADMIN_SECRET`)

`{ "plattform": "twitch", "plattformId": "…", "rolle": "waechter" }` – `rolle: null` entfernt die Rolle.

### `POST /avatare/bestaetigen` (nur Streamer.bot, mit Secret)

Header `Authorization: Bearer <STREAMERBOT_SECRET>` (als Secret im Worker, nie im Code).

```json
{ "plattform": "twitch", "plattformId": "123456789", "name": "MrNightWither", "code": "4821" }
```

Der Worker sucht eine offene, gültige Anmeldung mit **gleicher Plattform, gleichem Namen
(ohne Groß/Klein) und gleichem Code**. Passt alles: Profil + Konto anlegen, Anmeldung auf
`bestaetigt`. Antwort für Streamer.bot, damit es im Chat antworten kann:

```json
{ "ok": true, "haus": "Haus des Mondes" }
```

oder `{ "ok": false, "grund": "kein_code" | "abgelaufen" | "schon_gebunden" }`.

Warum das sicher ist: Nur wer **als dieser Name im Chat schreibt**, kann den Code bestätigen.
Wer einen fremden Namen auf der Website eingibt, kommt nicht weiter.

## Streamer.bot (Ablauf)

1. Befehl `!bestätigen` und `!bestaetigen` anlegen, Parameter = Code.
2. Aktion: HTTP-POST an `/avatare/bestaetigen` mit Plattform, User-ID, Name und Code.
3. Antwort auswerten und im Chat schreiben, z. B. „Willkommen im Haus des Mondes, @Name!“
   oder „Der Code passt nicht. Hol dir auf der Seite einen neuen.“

## CORS

Die Website läuft später auf einer eigenen Subdomain. Der Worker muss für die
öffentlichen Endpunkte genau diese Herkunft erlauben (`Access-Control-Allow-Origin`),
nicht `*`. `/avatare/bestaetigen` braucht kein CORS (nur Streamer.bot ruft es auf).
