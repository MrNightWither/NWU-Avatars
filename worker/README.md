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

Danach zeigt Wrangler die Adresse an, z. B. `https://nwu-avatare.nwu-brand.workers.dev`.
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
    const string URL = "https://nwu-avatare.nwu-brand.workers.dev/avatare/bestaetigen";

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

Das Ritual geht nur über Twitch. Kick und YouTube werden danach unter „Mein Profil“ verknüpft (siehe unten, `!verknüpfen`).

## Streamer.bot: Profil-Befehle `!anmelden`, `!anonym`, `!löschen`, `!verknüpfen`

Alle vier nutzen dieselbe Vorlage. **Eine Action pro Befehl**, Trigger = Command (Everyone), Code einfügen und
oben `PFAD` und die Texte anpassen. Die Plattform kommt aus `commandSource` (Twitch/Kick/YouTube) – bei `!anmelden`
nur Twitch, bei `!verknüpfen` nur Kick und YouTube (im Command die Plattformen entsprechend anhaken).

| Befehl | Commands | Was passiert |
|---|---|---|
| `!anmelden 1234` | `!anmelden` | Anmelden auf der Website (ich.html). Nur für die Website – im Chat ist man immer erkannt. |
| `!anonym` | `!anonym` | Name in Chronik/Rangliste verbergen, nochmal = wieder zeigen |
| `!löschen` / `!löschen ja` | `!löschen`, `!loeschen` | ohne „ja“ nur Rückfrage, mit „ja“ ist das Profil sofort gelöscht |
| `!verknüpfen 1234` | `!verknüpfen`, `!verknuepfen` | im Kick- oder YouTube-Chat: Konto mit dem Profil verbinden (Code von ich.html) |

```csharp
using System;
using System.Net.Http;
using System.Text;
using System.Text.RegularExpressions;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    static readonly HttpClient http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
    const string BASIS = "https://nwu-avatare.nwu-brand.workers.dev";

    JObject Post(string pfad, JObject daten)
    {
        var req = new HttpRequestMessage(HttpMethod.Post, BASIS + pfad);
        req.Headers.Add("Authorization", "Bearer " + CPH.GetGlobalVar<string>("nwuAvatarSecret", true));
        req.Content = new StringContent(daten.ToString(), Encoding.UTF8, "application/json");
        return JObject.Parse(http.SendAsync(req).Result.Content.ReadAsStringAsync().Result);
    }

    public bool Execute()
    {
        string befehl = args["command"].ToString().ToLower();
        string eingabe = args.ContainsKey("rawInput") ? args["rawInput"].ToString().Trim().ToLower() : "";
        string user = args["user"].ToString();
        // Plattform: twitch, kick oder youtube (in deiner Streamer.bot-Version ggf. prüfen, wie das Argument heißt)
        string plattform = args.ContainsKey("commandSource") ? args["commandSource"].ToString().ToLower() : "twitch";
        string code = Regex.Match(eingabe, @"\d{4}").Value;
        var daten = new JObject { ["plattform"] = plattform, ["plattformId"] = args["userId"].ToString(), ["name"] = user };
        try
        {
            if (befehl.StartsWith("!anmelden"))
            {
                if (plattform != "twitch") return true;
                if (code == "") { CPH.SendMessage($"@{user} So meldest du dich auf der Website an: Code unter „Mein Profil“ holen, dann !anmelden 1234."); return true; }
                daten["code"] = code;
                var a = Post("/sitzung/bestaetigen", daten);
                if ((bool?)a["ok"] == true) CPH.SendMessage($"🔮 @{user} Morrígan hat dich erkannt. Die Seite meldet dich jetzt an.");
                else if ((string)a["grund"] == "unbekannt") CPH.SendMessage($"@{user} Du gehörst noch keinem Haus an. Vollende zuerst das Ritual.");
                else CPH.SendMessage($"@{user} Der Code passt nicht oder ist abgelaufen. Hol dir auf der Seite einen neuen.");
            }
            else if (befehl.StartsWith("!anonym"))
            {
                var a = Post("/avatare/anonym", daten);
                if ((string)a["grund"] == "unbekannt") CPH.SendMessage($"@{user} Du gehörst noch keinem Haus an.");
                else if ((bool?)a["anonym"] == true) CPH.SendMessage($"@{user} Du bist jetzt eine unbekannte Seele. In der Chronik steht dein Name nicht mehr. (Nochmal !anonym = wieder sichtbar)");
                else CPH.SendMessage($"@{user} Dein Name steht wieder in der Chronik.");
            }
            else if (befehl.StartsWith("!l"))   // !löschen / !loeschen
            {
                if (eingabe != "ja") { CPH.SendMessage($"@{user} Damit löschst du deine Figur, dein Level und deinen Ruhm für immer. Wirklich? Dann schreib: !löschen ja"); return true; }
                var a = Post("/avatare/loeschen", daten);
                if ((bool?)a["ok"] == true) CPH.SendMessage($"@{user} Morrígan hat dich vergessen. Dein Profil ist gelöscht.");
                else CPH.SendMessage($"@{user} Zu dir gibt es kein Profil.");
            }
            else if (befehl.StartsWith("!verkn"))
            {
                if (plattform == "twitch") { CPH.SendMessage($"@{user} !verknüpfen schreibst du im Kick- oder YouTube-Chat. Den Code gibt es unter „Mein Profil“."); return true; }
                if (code == "") return true;
                daten["code"] = code;
                var a = Post("/verknuepfen/bestaetigen", daten);
                if ((bool?)a["ok"] == true) CPH.SendMessage($"@{user} Verknüpft! Dein Ruhm von hier zählt jetzt für deine Figur.");
                else if ((string)a["grund"] == "schon_gebunden") CPH.SendMessage($"@{user} Dieses Konto ist schon verknüpft.");
                else CPH.SendMessage($"@{user} Der Code passt nicht oder ist abgelaufen.");
            }
        }
        catch (Exception e) { CPH.LogWarn("NWU Profil: " + e.Message); }
        return true;
    }
}
```

**Wichtig bei `!anmelden`:** Morrígan sagt nie „schreib mal diesen Code“ von sich aus. Wer einen Code von jemand
anderem eintippt, meldet diese Person auf ihrem Gerät mit dem eigenen Profil an – deshalb steht auf der Website
„Schreib das als <dein Name>“.

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
    const string URL = "https://nwu-avatare.nwu-brand.workers.dev/avatare/level";

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

## Streamer.bot: Aussehen `!haare`, `!frisur`, `!kopf`, `!begleiter`

Jeder ändert sein eigenes Aussehen, sobald das Level reicht (alles steht in `data/aussehen.js`):
Haarfarbe ab Level 5 (seltene ab 25), Frisur ab 8 (mehr ab 18 und 35), Begleiter ab 20 (45, 70),
Kopfschmuck ab 30 (60, 80). Name oder `keine` zum Ablegen, z. B. `!frisur pferdeschwanz`, `!kopf keine`.
Dasselbe geht auf der Website unter „Mein Profil“ (`ich.html`).

1. **Commands → Add:** Name `Aussehen`, Commands `!haare`, `!haarfarbe`, `!frisur`, `!kopf`, `!kopfschmuck`, `!begleiter`
   (je eine Zeile), Location *Start*, Permissions: *Everyone*, Cooldown pro Nutzer z. B. 20 Sekunden.
2. **Action** mit **Execute C# Code**. Die Antwort beginnt mit „🪞 @Name“ – daran erkennt das Overlay, dass sich die
   Figur sofort neu einkleiden soll (diesen Anfang nicht ändern):

```csharp
using System;
using System.Linq;
using System.Net.Http;
using System.Text;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    static readonly HttpClient http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
    const string URL = "https://nwu-avatare.nwu-brand.workers.dev/avatare/aussehen";

    public bool Execute()
    {
        string user = args["user"].ToString();
        string befehl = args["command"].ToString().ToLower();
        string wunsch = args.ContainsKey("rawInput") ? args["rawInput"].ToString().Trim() : "";
        string art = befehl.StartsWith("!haar") ? "haare" : befehl.StartsWith("!frisur") ? "frisur" : befehl.StartsWith("!kopf") ? "kopf" : "begleiter";
        string wort = art == "haare" ? "Haarfarbe" : art == "frisur" ? "Frisur" : art == "kopf" ? "Kopfschmuck" : "Begleiter";
        var daten = new JObject { ["plattform"] = "twitch", ["plattformId"] = args["userId"].ToString(), [art] = wunsch };
        var req = new HttpRequestMessage(HttpMethod.Post, URL);
        req.Headers.Add("Authorization", "Bearer " + CPH.GetGlobalVar<string>("nwuAvatarSecret", true));
        req.Content = new StringContent(daten.ToString(), Encoding.UTF8, "application/json");
        try
        {
            var a = JObject.Parse(http.SendAsync(req).Result.Content.ReadAsStringAsync().Result);
            string grund = (string)a["grund"];
            string frei = a["frei"] != null ? string.Join(", ", a["frei"].Select(x => x.ToString())) : "";
            if ((bool?)a["ok"] == true && art == "haare") CPH.SendMessage($"🪞 @{user} Deine Haare sind jetzt {a["haare"]}.");
            else if ((bool?)a["ok"] == true) CPH.SendMessage(a["name"].Type == JTokenType.Null ? $"🪞 @{user} {wort} abgelegt." : $"🪞 @{user} {wort}: {a["name"]}.");
            else if (grund == "unbekannt") CPH.SendMessage($"@{user} Du hast noch keine Gestalt. Erst das Ritual!");
            else if (grund == "level") CPH.SendMessage($"@{user} {(a["name"] != null ? a["name"] + " gibt" : wort + " gibt")} es ab Level {a["level"]}." + (frei != "" ? $" Für dich frei: {frei}" : ""));
            else if (art == "haare") CPH.SendMessage($"@{user} Farben: silber, weiss, schwarz, braun, blond, rot, kupfer, blau, lila, gruen, rosa");
            else CPH.SendMessage(frei != "" ? $"@{user} {wort} für dich: {frei} (oder keine)" : $"@{user} {wort} gibt es erst mit höherem Level. Alles unter „Mein Profil“.");
        }
        catch (Exception e) { CPH.LogWarn("NWU Aussehen: " + e.Message); }
        return true;
    }
}
```

Hast du die alte Aktion „Haare“ schon angelegt: einfach durch diese ersetzen.

## Rollen: Wächter und Königin (von Hand, PowerShell)

Mods werden im Overlay automatisch über das Mod-Abzeichen im Chat erkannt (goldener Ring, mehr Ruhm fürs
Dabeisein). Für deine Partnerin die Rolle **koenigin** setzen (Diadem, violetter Schimmer, Wächter-Rechte),
nachdem sie das Ritual gemacht hat. Ihre Twitch-ID findest du z. B. in Streamer.bot unter Users.

```powershell
$h = @{ Authorization = "Bearer DEIN_ADMIN_SECRET" }
Invoke-RestMethod -Method Post -Uri "https://nwu-avatare.nwu-brand.workers.dev/avatare/rolle" -Headers $h `
  -ContentType "application/json" -Body '{"plattform": "twitch", "plattformId": "IHRE_TWITCH_ID", "rolle": "koenigin"}'
```

Mögliche Rollen: `waechter`, `koenigin`, `koenigskreis`, `verbuendet` (oder `null` zum Entfernen).

## Streamer.bot: Morrígans Hinweis für Ungebundene und Jahrestag

Wer im Stream zum ersten Mal schreibt und noch kein Ritual gemacht hat, bekommt **einmal pro Stream** einen Hinweis.
Im Overlay läuft diese Person als Silhouette, bis sie gebunden ist. Hat jemand heute **Jahrestag der Bindung**,
gratuliert Morrígan (im Overlay leuchtet die Figur an diesem Tag golden).

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
    const string URL = "https://nwu-avatare.nwu-brand.workers.dev/avatare/profil?plattform=twitch&id=";

    public bool Execute()
    {
        string user = args["user"].ToString();
        try
        {
            var antwort = JObject.Parse(http.GetStringAsync(URL + Uri.EscapeDataString(args["userId"].ToString())).Result);
            if ((bool?)antwort["gefunden"] == false)
                CPH.SendMessage($"🜏 Morrígan: Ich sehe dich, @{user}, doch du gehörst noch keinem Haus an. Vollende das Ritual: {CPH.GetGlobalVar<string>("nwuRitualLink", true)}");
            else if ((int?)antwort["jahrestag"] > 0)
            {
                int j = (int)antwort["jahrestag"];
                CPH.SendMessage($"🜏 Morrígan: Heute vor {j} {(j == 1 ? "Jahr" : "Jahren")} hast du dich dem {antwort["hausName"]} angeschlossen, @{user}. Die Zitadelle erinnert sich.");
            }
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
    const string URL = "https://nwu-avatare.nwu-brand.workers.dev/ruhm";
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
    const string BASIS = "https://nwu-avatare.nwu-brand.workers.dev";

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
    const string URL = "https://nwu-avatare.nwu-brand.workers.dev/pruefung/antwort";
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

## Streamer.bot: Morrígans Prophezeiung

Einmal pro Stream ein rätselhafter Satz, teils mit dem echten Stand im Haus-Pokal (Sätze: `data/prophezeiungen.js`).
Das Overlay zeigt ihn als Karte. Trigger z. B. **Stream Online** mit einer **Delay**-Sub-Action davor
(30–60 Minuten), oder ein Command `!prophezeiung` nur für dich.

```csharp
using System;
using System.Net.Http;
using System.Text;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    static readonly HttpClient http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
    const string URL = "https://nwu-avatare.nwu-brand.workers.dev/prophezeiung";

    public bool Execute()
    {
        var req = new HttpRequestMessage(HttpMethod.Post, URL);
        req.Headers.Add("Authorization", "Bearer " + CPH.GetGlobalVar<string>("nwuAvatarSecret", true));
        req.Content = new StringContent("{}", Encoding.UTF8, "application/json");
        try
        {
            var a = JObject.Parse(http.SendAsync(req).Result.Content.ReadAsStringAsync().Result);
            if ((bool?)a["ok"] == true) CPH.SendMessage($"🔮 Morrígan prophezeit: {a["text"]}");
        }
        catch (Exception e) { CPH.LogWarn("NWU Prophezeiung: " + e.Message); }
        return true;
    }
}
```

## Streamer.bot: `!nwu` (Links zum Ritual und zu den Befehlen)

Ohne Worker, nur eine Chat-Antwort. **Action „NWU Info“** – Trigger: Command `!nwu` (Everyone, Cooldown z. B. 30 Sekunden):

```csharp
public class CPHInline
{
    public bool Execute()
    {
        const string SEITE = "https://mrnightwither.github.io/NWU-Avatars/";
        CPH.SendMessage($"🔮 Morrígan: Dein Haus findest du im Ritual: {SEITE} · Alle Befehle: {SEITE}befehle.html");
        return true;
    }
}
```

## Streamer.bot: Spiele im Overlay (Ruhm buchen)

Das Overlay entscheidet Fang den Raben, Wettrennen, Tauziehen, Letzter steht und Schatzsuche selbst und meldet das
Ergebnis über den **WebSocket-Server von Streamer.bot** an die Aktion „NWU Spiel“. Die bucht den Ruhm beim Worker.
Wie viel Ruhm es gibt, steht fest in `data/ruhm.js` (`spiele`) – das Overlay sagt nur, wer gewonnen oder verloren hat.
Der Worker nimmt pro Spiel höchstens eine Meldung pro paar Minuten an (falls das Overlay doppelt offen ist).

Einrichten:
1. Streamer.bot → **Servers/Clients → WebSocket Server**: Address `127.0.0.1`, Port `8080`, **Auto Start** an,
   **Authentication aus** (er ist nur auf dem eigenen PC erreichbar). Starten.
2. In `overlay/config.js`: `streamerbot: 'ws://127.0.0.1:8080/'`.
3. Aktion **„NWU Spiel“** anlegen (genau dieser Name, ohne Trigger – das Overlay ruft sie auf):

```csharp
using System;
using System.Linq;
using System.Net.Http;
using System.Text;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    static readonly HttpClient http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
    const string URL = "https://nwu-avatare.nwu-brand.workers.dev/spiel";

    public bool Execute()
    {
        var daten = new JObject
        {
            ["spiel"] = args.ContainsKey("spiel") ? args["spiel"].ToString() : "",
            ["plattform"] = "twitch",
            ["gewinner"] = args.ContainsKey("gewinner") ? args["gewinner"].ToString() : "",
            ["verlierer"] = args.ContainsKey("verlierer") ? args["verlierer"].ToString() : "",
        };
        var req = new HttpRequestMessage(HttpMethod.Post, URL);
        req.Headers.Add("Authorization", "Bearer " + CPH.GetGlobalVar<string>("nwuAvatarSecret", true));
        req.Content = new StringContent(daten.ToString(), Encoding.UTF8, "application/json");
        try
        {
            var a = JObject.Parse(http.SendAsync(req).Result.Content.ReadAsStringAsync().Result);
            if ((bool?)a["ok"] != true) return true;
            var g = a["gewinner"] as JArray;
            string namen = string.Join(", ", g.Select(n => "@" + n));
            string spiel = daten["spiel"].ToString();
            if (g.Count > 0 && spiel == "rabe") CPH.SendMessage($"🐦‍⬛ {namen} hat den Raben gefangen! +{a["ruhm"]} Ruhm.");
            else if (g.Count > 0 && spiel == "letzter") CPH.SendMessage($"⚡ {namen} steht als Letzter! +{a["ruhm"]} Ruhm.");
            else if (spiel == "schatz") CPH.SendMessage($"💰 Schatzsuche: {g.Count} haben die Truhe gefunden (+{a["ruhm"]} Ruhm), {((JArray)a["verlierer"]).Count} gingen leer aus ({a["abzug"]} Ruhm).");
            else if (a["haus"] != null && a["haus"].Type != JTokenType.Null)
            {
                string mit = g.Count > 0 ? $", +{a["ruhm"]} für {g.Count}, die mitgemacht haben." : ".";
                CPH.SendMessage($"🏆 {a["spiel"]}: Das {a["haus"]} gewinnt! +{a["hausRuhm"]} Ruhm für den Hauspokal{mit}");
            }
            foreach (var s in a["aufstiege"] ?? new JArray()) CPH.SendMessage($"✨ @{s["name"]} steigt auf: jetzt Level {s["level"]}!");
        }
        catch (Exception e) { CPH.LogWarn("NWU Spiel: " + e.Message); }
        return true;
    }
}
```

Gestartet werden die Spiele im Chat: `!rennen`, `!tauziehen` (oder `!tauziehen mond blut`), `!letzter`, `!schatz`,
`!rabe` – vom Streamer und, wenn `spiele.starter` in `overlay/config.js` auf `'mods'` steht, auch von Mods.
Der Rabe kommt außerdem von allein (`rabeMinuten`), die anderen vier Spiele ungefähr alle `zufallMinuten` (wenn mindestens
`zufallAb` Figuren da sind). Beim Rennen und Tauziehen bekommt das Siegerhaus zusätzlich 100 Ruhm im Hauspokal. Dafür braucht Streamer.bot keine eigenen Befehle: das Overlay
liest den Chat mit (`!fang`, `!zieh`, `!dabei`, `!grab oben`).

## Streamer.bot: Würfel der Morrígan (`!wurf`)

Einmal pro Stream (10 Stunden Sperre): **6** = doppelter Ruhm für 4 Stunden, **1** = die Figur verliert für
5 Minuten ihre Gestalt, **2–5** = Augenzahl × 10 Ruhm. Der Worker würfelt, das Overlay zeigt den Würfel über der Figur.

**Action „NWU Würfel“** – Trigger: Command `!wurf` (Everyone):

```csharp
using System;
using System.Net.Http;
using System.Text;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    static readonly HttpClient http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
    const string URL = "https://nwu-avatare.nwu-brand.workers.dev/wurf";

    public bool Execute()
    {
        string user = args["user"].ToString();
        var daten = new JObject { ["plattform"] = "twitch", ["plattformId"] = args["userId"].ToString() };
        var req = new HttpRequestMessage(HttpMethod.Post, URL);
        req.Headers.Add("Authorization", "Bearer " + CPH.GetGlobalVar<string>("nwuAvatarSecret", true));
        req.Content = new StringContent(daten.ToString(), Encoding.UTF8, "application/json");
        try
        {
            var a = JObject.Parse(http.SendAsync(req).Result.Content.ReadAsStringAsync().Result);
            string grund = (string)a["grund"];
            if (grund == "unbekannt") { CPH.SendMessage($"@{user} Morrígans Würfel rollen nur für die, die einem Haus angehören."); return true; }
            if (grund == "schon") { CPH.SendMessage($"@{user} Du hast in diesem Stream schon gewürfelt."); return true; }
            if ((bool?)a["ok"] != true) return true;
            int w = (int)a["wurf"];
            // Das Overlay erkennt „@Name würfelt eine N“ – diesen Teil nicht ändern
            if (w == 6) CPH.SendMessage($"🎲 @{a["name"]} würfelt eine 6! Morrígan lächelt: doppelter Ruhm für die nächsten 4 Stunden.");
            else if (w == 1) CPH.SendMessage($"🎲 @{a["name"]} würfelt eine 1 … Morrígan nimmt dir für 5 Minuten deine Gestalt.");
            else CPH.SendMessage($"🎲 @{a["name"]} würfelt eine {w}: +{a["ruhm"]} Ruhm.");
            foreach (var s in a["aufstiege"] ?? new JArray()) CPH.SendMessage($"✨ @{s["name"]} steigt auf: jetzt Level {s["level"]}!");
        }
        catch (Exception e) { CPH.LogWarn("NWU Würfel: " + e.Message); }
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
    const string URL = "https://nwu-avatare.nwu-brand.workers.dev/reise/essenz";

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
Invoke-RestMethod -Method Post -Uri "https://nwu-avatare.nwu-brand.workers.dev/reise/hand" `
  -Headers @{ Authorization = "Bearer DEIN_ADMIN_SECRET" } -ContentType "application/json" -Body '{"plattform": "twitch", "menge": 500}'
```
Negative Menge zieht ab. `plattform` ist Pflicht.

## Erfolgskarte: Follower und Unterstützer (echte Zahlen)

Eigene Karte `erfolge.html`, unabhängig von Avataren und Essenz. Pro Plattform eigene Zähler.

**1. Einmal deinen heutigen Stand eintragen** (PowerShell, je Plattform und Weg):
```powershell
$h = @{ Authorization = "Bearer DEIN_ADMIN_SECRET" }
$u = "https://nwu-avatare.nwu-brand.workers.dev/erfolge/setzen"
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
    const string URL = "https://nwu-avatare.nwu-brand.workers.dev/erfolge/plus";

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

## Auskunft und Löschung (Datenschutz)

Wenn jemand wissen will, was gespeichert ist, oder gelöscht werden möchte (Text für die Datenschutzerklärung:
`docs/DATENSCHUTZ-BAUSTEIN.html`). `NAME` = Benutzername klein geschrieben:

```bash
# Auskunft
npx wrangler d1 execute nwu-avatare --remote --command "SELECT k.plattform, k.plattform_id, k.name, p.* FROM konto k JOIN profil p ON p.id = k.profil_id WHERE k.name_klein = 'NAME'"
# Löschen: erst bei der Auskunft die Spalte id ablesen (= PROFIL_ID), dann alles zu diesem Profil löschen
npx wrangler d1 execute nwu-avatare --remote --command "DELETE FROM konto WHERE profil_id = 'PROFIL_ID'; DELETE FROM pruefung_antwort WHERE profil_id = 'PROFIL_ID'; UPDATE pruefung SET gewinner_id = NULL, gewinner_name = NULL WHERE gewinner_id = 'PROFIL_ID'; DELETE FROM profil WHERE id = 'PROFIL_ID'; DELETE FROM anmeldung WHERE name_klein = 'NAME'"
```

Anmeldungen (mit IP-Hash) löscht der Worker nach 7 Tagen von selbst.

## Testen

```bash
cd worker && npm test     # lokaler Test mit echter SQLite-Datenbank, braucht Node 22+
```
