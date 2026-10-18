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

## Testen

```bash
cd worker && npm test     # lokaler Test mit echter SQLite-Datenbank, braucht Node 22+
```
