# Worker `nwu-avatare`

Eigener Cloudflare Worker für die Stream-Avatare. Dein bestehender Worker `nwu-anmeldung`
bleibt davon unberührt. Schnittstellen: [`../docs/DATENMODELL.md`](../docs/DATENMODELL.md).

## Einmalig einrichten (auf dem PC, braucht Node.js)

```powershell
cd NWU-Avatars\worker
npx wrangler login                       # im Browser bei Cloudflare anmelden
npx wrangler d1 create nwu-avatare       # Datenbank anlegen → angezeigte database_id in wrangler.toml eintragen
npx wrangler d1 execute nwu-avatare --remote --file=schema.sql
npx wrangler secret put STREAMERBOT_SECRET   # langes Zufallspasswort eingeben, für Streamer.bot
npx wrangler secret put ADMIN_SECRET         # zweites, anderes Zufallspasswort, für Rollen
npx wrangler deploy
```

Danach zeigt Wrangler die Adresse an, z. B. `https://nwu-avatare.DEIN-NAME.workers.dev`.
Diese Adresse eintragen in:
- `js/einstellungen.js` → `api: '…'` (dann ist die Website nicht mehr im Demo-Modus)
- `overlay/config.js` → `api: '…'` (dann zeigt das Overlay die echten Figuren der Chatter)

Zufallspasswort erzeugen (PowerShell):
`-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 40 | % {[char]$_})`

## Streamer.bot: Befehl `!bestätigen`

1. **Commands → Add:** Name `Bestätigen`, Commands `!bestätigen` und `!bestaetigen` (je eine Zeile), Location *Start*.
2. **Action** anlegen, Trigger = dieser Command.
3. **Global Variable** `nwuAvatarSecret` (persistiert) = dasselbe Passwort wie `STREAMERBOT_SECRET`.
4. Sub-Action **Core → C# → Execute C# Code**, diesen Code einfügen, Adresse anpassen,
   unter *References* `Newtonsoft.Json.dll` hinzufügen (liegt im Streamer.bot-Ordner), **Compile**:

```csharp
using System;
using System.Net.Http;
using System.Text;
using System.Text.RegularExpressions;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    static readonly HttpClient http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
    const string URL = "https://nwu-avatare.DEIN-NAME.workers.dev/avatare/bestaetigen";

    public bool Execute()
    {
        string eingabe = args.ContainsKey("input0") ? args["input0"].ToString() : "";
        string code = Regex.Match(eingabe, @"\d{4}").Value;
        string user = args["user"].ToString();
        if (code == "") { CPH.SendMessage($"@{user} Bitte so schreiben: !bestätigen 1234"); return true; }

        var daten = new JObject {
            ["plattform"] = "twitch",
            ["plattformId"] = args["userId"].ToString(),
            ["name"] = user,
            ["code"] = code
        };
        var req = new HttpRequestMessage(HttpMethod.Post, URL);
        req.Headers.Add("Authorization", "Bearer " + CPH.GetGlobalVar<string>("nwuAvatarSecret", true));
        req.Content = new StringContent(daten.ToString(), Encoding.UTF8, "application/json");

        try
        {
            var antwort = JObject.Parse(http.SendAsync(req).Result.Content.ReadAsStringAsync().Result);
            if ((bool?)antwort["ok"] == true)
                CPH.SendMessage($"🜏 Willkommen im {antwort["haus"]}, @{user}! Deine Gestalt ist jetzt gebunden.");
            else if ((string)antwort["grund"] == "abgelaufen")
                CPH.SendMessage($"@{user} Dein Code ist abgelaufen. Hol dir auf der Seite einen neuen.");
            else if ((string)antwort["grund"] == "schon_gebunden")
                CPH.SendMessage($"@{user} Du bist schon gebunden.");
            else
                CPH.SendMessage($"@{user} Der Code passt nicht. Schau nochmal auf der Seite nach.");
        }
        catch (Exception e)
        {
            CPH.LogWarn("NWU Avatare: " + e.Message);
            CPH.SendMessage($"@{user} Morrígan ist gerade nicht erreichbar. Versuch es gleich nochmal.");
        }
        return true;
    }
}
```

Für Kick/YouTube später: `"twitch"` durch die Plattform ersetzen und eine eigene Action anlegen.

## Streamer.bot: Befehl `!levelup @Name`

Nur du (nicht die Mods) gibst jemandem ein Level: `!levelup @Name` (1 Level) oder `!levelup @Name 5`.
Das Overlay zeigt den Effekt sofort (liest den Chat selbst mit), Streamer.bot speichert das Level im Worker.
Minus geht auch zum Korrigieren: `!levelup @Name -1`. Level bleibt immer zwischen 1 und 999.

1. **Commands → Add:** Name `Level Up`, Commands `!levelup`, `!lvlup` und `!lvl` (je eine Zeile), Location *Start*,
   **Permissions:** nur *Broadcaster* (Haken bei Moderators/VIPs/Subscribers/Everyone raus).
   Zusätzlich prüft der Code unten selbst, ob du es bist.
2. **Action** anlegen, Trigger = dieser Command, Sub-Action **Execute C# Code** (wie oben, mit `Newtonsoft.Json.dll`):

```csharp
using System;
using System.Net.Http;
using System.Text;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    static readonly HttpClient http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
    const string URL = "https://nwu-avatare.DEIN-NAME.workers.dev/avatare/level";

    public bool Execute()
    {
        string user = args["user"].ToString();
        if (args.ContainsKey("broadcastUser") && !user.Equals(args["broadcastUser"].ToString(), StringComparison.OrdinalIgnoreCase)) return true;   // nur der Streamer
        string ziel = args.ContainsKey("input0") ? args["input0"].ToString().TrimStart('@') : "";
        int anzahl = 1;
        if (args.ContainsKey("input1")) int.TryParse(args["input1"].ToString(), out anzahl);
        if (ziel == "" || anzahl == 0) { CPH.SendMessage($"@{user} So geht's: !levelup @Name oder !levelup @Name 5"); return true; }

        var daten = new JObject { ["plattform"] = "twitch", ["name"] = ziel, ["anzahl"] = anzahl };
        var req = new HttpRequestMessage(HttpMethod.Post, URL);
        req.Headers.Add("Authorization", "Bearer " + CPH.GetGlobalVar<string>("nwuAvatarSecret", true));
        req.Content = new StringContent(daten.ToString(), Encoding.UTF8, "application/json");
        try
        {
            var antwort = JObject.Parse(http.SendAsync(req).Result.Content.ReadAsStringAsync().Result);
            if ((bool?)antwort["ok"] == true)
                CPH.SendMessage($"✨ @{antwort["name"]} steigt auf: jetzt Level {antwort["level"]}!");
            else if ((string)antwort["grund"] == "unbekannt")
                CPH.SendMessage($"@{user} {ziel} hat noch keine Gestalt (erst das Ritual machen).");
            else
                CPH.SendMessage($"@{user} So geht's: !levelup @Name oder !levelup @Name 5 (höchstens 100)");
        }
        catch (Exception e) { CPH.LogWarn("NWU Level: " + e.Message); }
        return true;
    }
}
```

## Streamer.bot: Befehl `!haare <farbe>`

Jeder ändert seine eigene Haarfarbe, sobald das Level reicht (steht in `data/aussehen.js`):
ab Level 5 silber, weiss, schwarz, braun, blond, rot, kupfer · ab Level 25 auch blau, lila, gruen, rosa.

1. **Commands → Add:** Name `Haare`, Commands `!haare` und `!haarfarbe`, Location *Start*, Permissions: *Everyone*,
   Cooldown pro Nutzer z. B. 30 Sekunden.
2. **Action** mit **Execute C# Code**:

```csharp
using System;
using System.Net.Http;
using System.Text;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    static readonly HttpClient http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
    const string URL = "https://nwu-avatare.DEIN-NAME.workers.dev/avatare/aussehen";

    public bool Execute()
    {
        string user = args["user"].ToString();
        string farbe = args.ContainsKey("input0") ? args["input0"].ToString() : "";
        var daten = new JObject { ["plattform"] = "twitch", ["plattformId"] = args["userId"].ToString(), ["haare"] = farbe };
        var req = new HttpRequestMessage(HttpMethod.Post, URL);
        req.Headers.Add("Authorization", "Bearer " + CPH.GetGlobalVar<string>("nwuAvatarSecret", true));
        req.Content = new StringContent(daten.ToString(), Encoding.UTF8, "application/json");
        try
        {
            var antwort = JObject.Parse(http.SendAsync(req).Result.Content.ReadAsStringAsync().Result);
            string grund = (string)antwort["grund"];
            if ((bool?)antwort["ok"] == true) CPH.SendMessage($"@{user} Deine Haare sind jetzt {antwort["haare"]}. (Im Overlay nach spätestens einer Minute)");
            else if (grund == "level") CPH.SendMessage($"@{user} Haarfarbe gibt es ab Level {antwort["level"]}.");
            else if (grund == "unbekannt") CPH.SendMessage($"@{user} Du hast noch keine Gestalt. Erst das Ritual!");
            else CPH.SendMessage($"@{user} Farben: silber, weiss, schwarz, braun, blond, rot, kupfer, blau, lila, gruen, rosa");
        }
        catch (Exception e) { CPH.LogWarn("NWU Haare: " + e.Message); }
        return true;
    }
}
```

## Streamer.bot: Morrígans Hinweis für Ungebundene

Wer im Stream zum ersten Mal schreibt und noch kein Ritual gemacht hat, bekommt **einmal pro Stream** einen Hinweis.
Im Overlay läuft diese Person als Silhouette, bis sie gebunden ist.

1. **Trigger:** Twitch → Chat → **First Words** (feuert bei der ersten Nachricht jeder Person im Stream).
2. **Global Variable** `nwuRitualLink` = Adresse der Website (z. B. `https://mrnightwither.github.io/NWU-Avatars/`).
3. **Execute C# Code:**

```csharp
using System;
using System.Net.Http;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    static readonly HttpClient http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
    const string URL = "https://nwu-avatare.DEIN-NAME.workers.dev/avatare/profil?plattform=twitch&id=";

    public bool Execute()
    {
        string user = args["user"].ToString();
        try
        {
            var antwort = JObject.Parse(http.GetStringAsync(URL + Uri.EscapeDataString(args["userId"].ToString())).Result);
            if ((bool?)antwort["gefunden"] == false)
                CPH.SendMessage($"🜏 Morrígan: Ich sehe dich, @{user}, doch du gehörst noch keinem Haus an. Vollende das Ritual: {CPH.GetGlobalVar<string>("nwuRitualLink", true)}");
        }
        catch (Exception e) { CPH.LogWarn("NWU Hinweis: " + e.Message); }
        return true;
    }
}
```

## Streamer.bot: Ruhm (Erfahrung) automatisch

Eine Action **„NWU Ruhm“** mit dem Code unten, und mehrere Trigger, die sie auslösen. Bei jedem Trigger eine
Sub-Action **Set Argument** `nwuQuelle` (und bei Kick/YouTube `nwuPlattform`) davor setzen:

| Trigger | `nwuQuelle` | Hinweis |
|---|---|---|
| Twitch → **Present Viewers** (Intervall 10 Minuten) | `anwesenheit` | alle, die gerade zuschauen. Mods bekommen ×1,5 |
| Twitch → **Chat Message** | `chat` | der Code zählt pro Person höchstens einmal in 10 Minuten |
| Twitch → **Follow** | `follow` | |
| Twitch → **Subscription / Resubscription** | `sub` | |
| Twitch → **Gift Subscription / Gift Bomb** | `sub` | bei Gift Bomb zusätzlich `nwuAnzahl` = Anzahl der Gifts |
| Twitch → **Raid** | `raid` | Ruhm für den, der den Raid bringt |
| Twitch → **Cheer** | `bits` | Anzahl kommt automatisch aus `bits` |

Steigt jemand ein Level auf, schreibt der Bot `✨ @Name steigt auf: jetzt Level 6!` in den Chat –
das Overlay liest das mit und zeigt den Level-Up-Effekt an der Figur.

```csharp
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    static readonly HttpClient http = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };
    const string URL = "https://nwu-avatare.DEIN-NAME.workers.dev/ruhm";
    static readonly Dictionary<string, DateTime> letzterChat = new Dictionary<string, DateTime>();

    public bool Execute()
    {
        string quelle = args["nwuQuelle"].ToString();
        string plattform = args.ContainsKey("nwuPlattform") ? args["nwuPlattform"].ToString() : "twitch";
        var nutzer = new JArray();

        if (quelle == "anwesenheit")
        {
            // Present Viewers liefert eine Liste aller Zuschauer
            if (!args.ContainsKey("users")) return true;
            foreach (var u in (List<Dictionary<string, object>>)args["users"])
            {
                string id = u.ContainsKey("id") ? u["id"].ToString() : "";
                if (id == "") continue;
                bool mod = (u.ContainsKey("isModerator") && u["isModerator"] is bool b && b)
                        || (u.ContainsKey("role") && u["role"].ToString() == "3");
                nutzer.Add(new JObject { ["id"] = id, ["waechter"] = mod });
            }
        }
        else
        {
            string id = args.ContainsKey("userId") ? args["userId"].ToString() : "";
            if (id == "") return true;
            if (quelle == "chat")
            {
                if (letzterChat.TryGetValue(id, out var zuletzt) && (DateTime.UtcNow - zuletzt).TotalMinutes < 10) return true;
                letzterChat[id] = DateTime.UtcNow;
            }
            nutzer.Add(id);
        }
        if (nutzer.Count == 0) return true;

        var daten = new JObject { ["plattform"] = plattform, ["quelle"] = quelle, ["nutzer"] = nutzer };
        if (args.ContainsKey("nwuAnzahl")) daten["anzahl"] = args["nwuAnzahl"].ToString();
        else if (quelle == "bits" && args.ContainsKey("bits")) daten["anzahl"] = args["bits"].ToString();

        var req = new HttpRequestMessage(HttpMethod.Post, URL);
        req.Headers.Add("Authorization", "Bearer " + CPH.GetGlobalVar<string>("nwuAvatarSecret", true));
        req.Content = new StringContent(daten.ToString(), Encoding.UTF8, "application/json");
        try
        {
            var antwort = JObject.Parse(http.SendAsync(req).Result.Content.ReadAsStringAsync().Result);
            foreach (var a in antwort["aufstiege"] ?? new JArray())
                CPH.SendMessage($"✨ @{a["name"]} steigt auf: jetzt Level {a["level"]}!");
        }
        catch (Exception e) { CPH.LogWarn("NWU Ruhm: " + e.Message); }
        return true;
    }
}
```

Wie viel Ruhm es wofür gibt und ab wann welches Level erreicht ist: `data/ruhm.js`.

## Streamer.bot: Morrígans Prüfung

Morrígan stellt eine Frage zur Geschichte, drei Antworten, 45 Sekunden Zeit. Wer zuerst richtig antwortet,
bekommt 100 Ruhm für sich und sein Haus. Jede Person hat nur einen Versuch. Fragen: `data/pruefung.js`.
Das Overlay liest die Bot-Nachrichten mit und zeigt die Frage als Karte, der Gewinner jubelt.

**Action „NWU Prüfung“** – Trigger: Command `!pruefung` / `!prüfung` (nur Broadcaster) und/oder eine
**Timed Action** (z. B. alle 30 Minuten, nur wenn live):

```csharp
using System;
using System.Linq;
using System.Net.Http;
using System.Text;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    static readonly HttpClient http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
    const string BASIS = "https://nwu-avatare.DEIN-NAME.workers.dev";

    JObject Post(string pfad)
    {
        var req = new HttpRequestMessage(HttpMethod.Post, BASIS + pfad);
        req.Headers.Add("Authorization", "Bearer " + CPH.GetGlobalVar<string>("nwuAvatarSecret", true));
        req.Content = new StringContent("{}", Encoding.UTF8, "application/json");
        return JObject.Parse(http.SendAsync(req).Result.Content.ReadAsStringAsync().Result);
    }

    public bool Execute()
    {
        try
        {
            var p = Post("/pruefung/start");
            if ((bool?)p["ok"] != true) return true;
            string antworten = string.Join(" · ", p["antworten"].Select(a => $"{a["buchstabe"].ToString().ToUpper()}) {a["text"]}"));
            CPH.SendMessage($"🔮 Morrígans Prüfung: {p["frage"]} — {antworten} — Antworte mit !a, !b oder !c ({p["sekunden"]} Sekunden)");
            CPH.Wait(((int)p["sekunden"] + 1) * 1000);
            var e = Post("/pruefung/ende");
            if (e["gewinner"] == null || e["gewinner"].Type == JTokenType.Null)
                CPH.SendMessage($"🔮 Die Zeit ist um. Niemand hat Morrígans Prüfung bestanden. Richtig war {e["richtig"].ToString().ToUpper()}) {e["richtigText"]}.");
        }
        catch (Exception ex) { CPH.LogWarn("NWU Prüfung: " + ex.Message); }
        return true;
    }
}
```

**Action „NWU Prüfung Antwort“** – Trigger: Commands `!a`, `!b`, `!c`, `!d` (Everyone):

```csharp
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    static readonly HttpClient http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
    const string URL = "https://nwu-avatare.DEIN-NAME.workers.dev/pruefung/antwort";
    static readonly HashSet<string> schonErinnert = new HashSet<string>();

    public bool Execute()
    {
        string user = args["user"].ToString();
        var daten = new JObject { ["plattform"] = "twitch", ["plattformId"] = args["userId"].ToString(), ["antwort"] = args["command"].ToString() };
        var req = new HttpRequestMessage(HttpMethod.Post, URL);
        req.Headers.Add("Authorization", "Bearer " + CPH.GetGlobalVar<string>("nwuAvatarSecret", true));
        req.Content = new StringContent(daten.ToString(), Encoding.UTF8, "application/json");
        try
        {
            var a = JObject.Parse(http.SendAsync(req).Result.Content.ReadAsStringAsync().Result);
            if ((bool?)a["gewinner"] == true)
            {
                CPH.SendMessage($"🔮 @{a["name"]} hat Morrígans Prüfung bestanden! +{a["ruhm"]} Ruhm für sich und das {a["haus"]}.");
                foreach (var s in a["aufstiege"] ?? new JArray()) CPH.SendMessage($"✨ @{s["name"]} steigt auf: jetzt Level {s["level"]}!");
            }
            else if ((string)a["grund"] == "unbekannt" && schonErinnert.Add(user))
                CPH.SendMessage($"@{user} Nur wer einem Haus angehört, kann Morrígans Prüfung ablegen. Vollende zuerst das Ritual.");
        }
        catch (Exception e) { CPH.LogWarn("NWU Prüfung Antwort: " + e.Message); }
        return true;
    }
}
```

## Streamer.bot: Schatten-Essenz für die Meilensteinkarte

Jede Plattform hat ihren eigenen Pfad und ihre eigene Essenz. Eine Action **„NWU Essenz“** mit einer
C#-Sub-Action; andere Actions rufen sie auf und setzen vorher die Argumente `nwuPlattform`
(`twitch`, `youtube`, `kick`, `tiktok`), `nwuQuelle` und optional `nwuAnzahl`.

| Auslöser in Streamer.bot | `nwuQuelle` | `nwuAnzahl` |
|---|---|---|
| Follow (Twitch/Kick) · Abo (YouTube) · Follow (TikTok) | `follow` | – |
| Sub / Resub / Gift Sub · YouTube-Mitglied · Kick-Sub | `sub` | Anzahl (bei Gift Bomb) |
| Twitch Cheer · YouTube Super Chat · Kick-Kicks · TikTok-Geschenk | `bits` | Wert in „Bits“ umgerechnet |
| Raid / Host | `raid` | – |
| Timed Action alle 60 Min. (pro Plattform, auf der du live bist) | `stunde` | – |
| Timed Action alle 5 Min. (Chat-Paket) | `chat` | Zähler (siehe unten) |

**Chat zählen:** pro Plattform eine Action auf *Chat Message* mit *Global Variable → Increment*
`nwuChat_twitch` (bzw. `_youtube`, `_kick`). Die 5-Minuten-Action ruft „NWU Essenz“ je Plattform mit
`nwuQuelle = chat` und `nwuAnzahl` = Zählerstand auf und setzt den Zähler danach auf 0.
**TikTok (über Tikory)** hat eigene Regeln: Likes, Zuschauer, Follows und Stream-Stunden
(keine Subs, Bits oder Raids). Tikory löst dafür Streamer.bot-Actions aus:

| Tikory-Ereignis | was Streamer.bot macht | `nwuQuelle` | `nwuAnzahl` |
|---|---|---|---|
| Like | Zähler `nwuLikes_tiktok` um die Like-Anzahl erhöhen | – | – |
| alle 5 Minuten (Timed Action) | Likes-Paket senden, Zähler auf 0 | `likes` | Zählerstand |
| alle 5 Minuten (Timed Action) | aktuelle Zuschauerzahl senden | `zuschauer` | Zuschauerzahl |
| Follow | direkt senden | `follow` | – |
| alle 60 Minuten, solange live | direkt senden | `stunde` | – |

Immer mit `nwuPlattform = tiktok`. Likes und Zuschauer sind pro Paket gedeckelt
(`data/meilensteine.js` → TikTok-Pfad → `essenz`), damit Like-Spam die Reise nicht überrollt.

```csharp
using System;
using System.Net.Http;
using System.Text;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    static readonly HttpClient http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
    const string URL = "https://nwu-avatare.DEIN-NAME.workers.dev/reise/essenz";

    public bool Execute()
    {
        var daten = new JObject {
            ["plattform"] = args.ContainsKey("nwuPlattform") ? args["nwuPlattform"].ToString() : "twitch",
            ["quelle"] = args["nwuQuelle"].ToString()
        };
        if (args.ContainsKey("nwuAnzahl") && int.TryParse(args["nwuAnzahl"].ToString(), out int n)) daten["anzahl"] = n;
        var req = new HttpRequestMessage(HttpMethod.Post, URL);
        req.Headers.Add("Authorization", "Bearer " + CPH.GetGlobalVar<string>("nwuAvatarSecret", true));
        req.Content = new StringContent(daten.ToString(), Encoding.UTF8, "application/json");
        try
        {
            var antwort = JObject.Parse(http.SendAsync(req).Result.Content.ReadAsStringAsync().Result);
            foreach (var m in antwort["neu"] ?? new JArray())
            {
                CPH.SendMessage($"🗺️ Meilenstein auf dem {daten["plattform"]}-Pfad erreicht: {m["name"]}!");
                // Optional: hier auf die OBS-Szene mit der Reise-Karte umschalten
            }
            if ((bool?)antwort["zitadelleGeoeffnet"] == true)
                CPH.SendMessage("🏰 Alle vier Pfade sind angekommen. Die Tore der Zitadelle sind offen!");
        }
        catch (Exception e) { CPH.LogWarn("NWU Essenz: " + e.Message); }
        return true;
    }
}
```

**Von Hand** (z. B. nach einem Event), PowerShell:
```powershell
Invoke-RestMethod -Method Post -Uri "https://nwu-avatare.DEIN-NAME.workers.dev/reise/hand" `
  -Headers @{ Authorization = "Bearer DEIN_ADMIN_SECRET" } -ContentType "application/json" -Body '{"plattform": "twitch", "menge": 500}'
```
Negative Menge zieht ab. `plattform` ist Pflicht.

## Erfolgskarte: Follower und Unterstützer (echte Zahlen)

Eigene Karte `erfolge.html`, unabhängig von Avataren und Essenz. Pro Plattform eigene Zähler.

**1. Einmal deinen heutigen Stand eintragen** (PowerShell, je Plattform und Weg):
```powershell
$h = @{ Authorization = "Bearer DEIN_ADMIN_SECRET" }
$u = "https://nwu-avatare.DEIN-NAME.workers.dev/erfolge/setzen"
# Follower, Stand 18.10.2026
Invoke-RestMethod -Method Post -Uri $u -Headers $h -ContentType "application/json" -Body '{"weg":"follower","plattform":"tiktok","wert":782}'
Invoke-RestMethod -Method Post -Uri $u -Headers $h -ContentType "application/json" -Body '{"weg":"follower","plattform":"twitch","wert":91}'
Invoke-RestMethod -Method Post -Uri $u -Headers $h -ContentType "application/json" -Body '{"weg":"follower","plattform":"youtube","wert":16}'
Invoke-RestMethod -Method Post -Uri $u -Headers $h -ContentType "application/json" -Body '{"weg":"follower","plattform":"kick","wert":2}'
# Unterstützer: Zahlen vor dem Absenden anpassen
Invoke-RestMethod -Method Post -Uri $u -Headers $h -ContentType "application/json" -Body '{"weg":"unterstuetzer","plattform":"twitch","wert":0}'
```
Damit kannst du später auch korrigieren (z. B. wenn Leute entfolgen).

**2. Streamer.bot zählt automatisch weiter.** Eine Action „NWU Erfolg“ mit diesem C#-Code;
die Auslöser setzen vorher `nwuWeg` (`follower` oder `unterstuetzer`), `nwuPlattform` und bei
Gift-Bombs `nwuAnzahl`:

| Auslöser | `nwuWeg` | `nwuAnzahl` |
|---|---|---|
| Follow (Twitch, Kick) · Abo (YouTube) · Follow über Tikory (TikTok) | `follower` | – |
| Sub, Resub, Gift-Sub (Twitch, Kick) · Mitgliedschaft (YouTube) | `unterstuetzer` | – |
| Gift-Bomb | `unterstuetzer` | Anzahl der Gifts |

```csharp
using System;
using System.Net.Http;
using System.Text;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    static readonly HttpClient http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
    const string URL = "https://nwu-avatare.DEIN-NAME.workers.dev/erfolge/plus";

    public bool Execute()
    {
        var daten = new JObject {
            ["weg"] = args["nwuWeg"].ToString(),
            ["plattform"] = args.ContainsKey("nwuPlattform") ? args["nwuPlattform"].ToString() : "twitch"
        };
        if (args.ContainsKey("nwuAnzahl") && int.TryParse(args["nwuAnzahl"].ToString(), out int n)) daten["anzahl"] = n;
        var req = new HttpRequestMessage(HttpMethod.Post, URL);
        req.Headers.Add("Authorization", "Bearer " + CPH.GetGlobalVar<string>("nwuAvatarSecret", true));
        req.Content = new StringContent(daten.ToString(), Encoding.UTF8, "application/json");
        try
        {
            var antwort = JObject.Parse(http.SendAsync(req).Result.Content.ReadAsStringAsync().Result);
            foreach (var m in antwort["neu"] ?? new JArray())
                CPH.SendMessage($"🏆 {daten["plattform"]}: {m["wert"]} {(daten["weg"].ToString() == "follower" ? "Follower" : "Unterstützer")} erreicht – {m["name"]}!");
        }
        catch (Exception e) { CPH.LogWarn("NWU Erfolg: " + e.Message); }
        return true;
    }
}
```

## Testen

```bash
cd worker && npm test     # lokaler Test mit echter SQLite-Datenbank, braucht Node 22+
```
