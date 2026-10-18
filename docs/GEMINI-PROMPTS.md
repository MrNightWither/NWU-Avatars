# Bilder mit Gemini: Prompts

Stand: 18.10.2026. Für: Karte, Wappen, Charaktere und Teile-Bögen zum Zerlegen.
**Es gibt zum Start nur 4 Häuser: Mond, Blut, Nebel, Flamme** (= 16 Charaktere). Dornen und Raben
sind „verlorene Häuser“ und brauchen erst später Figuren.

## So gehst du vor

1. **Ein einziger Gemini-Chat für alles.** Dann bleibt der Stil gleich.
2. Als Erstes den **Stil-Block** (unten) schicken. Gemini soll nur antworten, dass es verstanden hat.
3. Dann die Bilder einzeln anfordern. Ist ein Bild gut, bei den nächsten dazuschreiben:
   *„Exactly the same art style as the previous image.“* Oder das gute Bild erneut hochladen.
4. Bilder speichern mit dem angegebenen **Dateinamen** und mir schicken (oder in den Ordner
   `assets/roh/` im Repo legen). Ich schneide sie zu und baue sie ein.
5. Gemini kann keine durchsichtigen Hintergründe. Deshalb fordern wir einen **einfarbigen
   Hintergrund** an (Grün bzw. Magenta), den ich danach entferne.

Die Prompts sind auf Englisch, weil Bild-KIs damit meist genauer arbeiten. Deutsch geht auch.
Häusernamen sind noch Arbeitstitel. Wenn du sie änderst, einfach im Prompt austauschen.

---

## 0. Stil-Block (immer zuerst)

```
For this whole conversation, all images follow one consistent art style:

NWU / NightWither Unity universe. Dark gothic fantasy, anime illustration style,
clean line art, cel shading with soft painted lighting. Mood: occult, mysterious,
elegant, night-time. Base palette: deep black, charcoal, with gold accents (#C9A84C)
as the signature color of the universe. Each house adds its own accent color.
No text, no letters, no logos, no watermarks, no UI elements in any image.
High detail but readable shapes, strong silhouettes.

Reply only with "Verstanden" and wait for my requests.
```

---

## 1. Die Karte des NWU-Universums

**Datei:** `karte.png` · Format **16:9**, so groß wie möglich

```
A top-down fantasy world map of the NWU universe, painted like an ancient dark
parchment map come to life, seen from high above at night.

In the center: a black citadel with golden spires, the seat of the Shadow King,
surrounded by a faint golden glow.

Around it, six distinct territories arranged in a ring, each clearly separated by
mountains, rivers or mist:
1. Moon territory (pale silver-blue): silent lakes, white stone towers, moonlit cliffs.
2. Blood territory (deep crimson): a fortified red-stone city, banners, a blood-red river.
3. Mist territory (grey): fog-covered marshes, half-hidden ruins, winding paths.
4. Flame territory (orange-red): volcanic forges, glowing lava cracks, ember sky.
5. Thorn territory (dark green): ancient overgrown forest, giant thorn walls, roots.
6. Raven territory (violet-black): crooked library towers, raven-filled cliffs, old tombs.

A golden dotted journey path winds from the outer edge through several landmarks
toward the citadel: a cursed swamp, ruined rune stones, a black forge, citadel gates.

Subtle fog drifting over the whole map, gold-ink decorative border, no text,
no labels, no compass letters.
```

Danach zusätzlich (für Kamerafahrten auf der Seite):

**Dateien:** `gebiet-haus1.png` … `gebiet-haus6.png` · Format **16:9**

```
A close-up view of the [Moon] territory from the map, same art style, seen from a
lower angle like a camera flying in. [moonlit lakes, white stone towers, silver mist].
Night, atmospheric, cinematic. No characters, no text.
```

Für jedes Haus die Klammern austauschen:

| Datei | [Gebiet] | [Details] |
|---|---|---|
| gebiet-haus1 | Moon | moonlit lakes, white stone towers, silver mist |
| gebiet-haus2 | Blood | red-stone fortress city, crimson banners, blood-red river |
| gebiet-haus3 | Mist | fog marshes, half-sunken ruins, lanterns in the fog |
| gebiet-haus4 | Flame | volcanic forges, lava cracks, ember-filled sky |
| gebiet-haus5 | Thorn | ancient forest, giant thorn walls, glowing roots |
| gebiet-haus6 | Raven | crooked library towers, ravens, old tombs on cliffs |

---

## 2. Die 6 Wappen

**Dateien:** `wappen-haus1.png` … `wappen-haus6.png` · Format **1:1**

```
A heraldic house crest for the [House of the Moon] in the NWU universe.
Shield shape: classic gothic heater shield, black enamel with an engraved gold border.
Central emblem: [a crescent moon over a still lake], rendered in [pale silver-blue].
Ornate but clean, centered, front view, perfectly symmetric shield.
Plain flat solid #00FF00 green background, nothing else in the image. No text.
```

| Datei | [Haus] | [Symbol] | [Farbe] |
|---|---|---|---|
| wappen-haus1 | House of the Moon | a crescent moon over a still lake | pale silver-blue |
| wappen-haus2 | House of Blood | a single blood drop pierced by a dagger | deep crimson |
| wappen-haus3 | House of Mist | a hooded eye half hidden in swirling mist | smoky grey |
| wappen-haus4 | House of the Flame | a rising flame shaped like a phoenix wing | burning orange |
| wappen-haus5 | House of Thorns | a thorny vine wrapped around a sword | dark green |
| wappen-haus6 | House of Ravens | a raven with spread wings above an open book | violet-black |

Beim **Haus der Dornen** statt `#00FF00 green` lieber `#FF00FF magenta` schreiben,
sonst verschwimmt das Grün mit dem Hintergrund.

---

## 3. Die 24 Charaktere – NEUER STIL (Stand 18.10.2026)

**Entscheidung:** Alle Figuren bekommen den Stil deines eigenen Avatars (Schattenkönig):
Cartoon-Sticker, dicker schwarzer Umriss, große klare Farbflächen, wenig Kleinkram.
So bleiben sie im Stream erkennbar und passen zur NWU-Marke.

**So geht's:** Dein Avatar-Bild in Gemini **hochladen** und dazu schreiben:

**a) Für die Website** · Datei `figur-haus1-a.png` … `figur-haus6-d.png` · Format **3:4**

```
Use the uploaded image ONLY as an art style reference. Do not copy the person,
the mask, the glasses or the crown.

Draw a NEW full-body character in exactly this art style: bold thick black outlines,
flat cel shading with few large color areas, glossy sticker / Twitch emote look,
expressive face, chibi proportions about 2.5 heads tall, minimal small details.

Character for the [House of the Moon] in a dark fantasy world.
Archetype: [Blade – a frontline fighter with a curved sword].
Look: [Character: a young woman with long silver hair] wearing [pale silver-blue
and black clothing with crescent moon motifs]. The house color must be clearly visible.
Standing pose, three-quarter view facing right, whole body visible including feet.
Plain flat solid #00FF00 green background, no shadow, no text, no letters.
```

**b) Für das Overlay** · Datei `seite-haus1-a.png` … · Format **1:1**
Das Bild aus a) hochladen und dazu:

```
Same character as in the uploaded image, exact same design, colors and art style.
Pure side view facing right, neutral standing pose, holding the weapon.
Plain flat solid #00FF00 green background, no shadow, no text.
```

**Abwechslung pro Haus:** Die Zeile `[Character: …]` bei jeder der 4 Figuren anders füllen, z. B.
`a young man with short messy black hair` · `a girl with a long braid` ·
`a tall guy with a scar and a calm face` · `a small energetic kid-like mage`.
Dann erkennt man die Figuren im Stream auch an Haaren und Größe.

Archetypen und Haus-Looks: siehe die Tabellen im alten Abschnitt unten.

**Dazu für dich selbst:** Schattenkönig als Ganzkörper-Figur fürs Overlay

```
Same person as in the uploaded image (crown, black hoodie, glasses, NWU face mask),
same art style. Full-body chibi version, about 2.5 heads tall, pure side view facing
right, neutral standing pose, whole body including feet.
Plain flat solid #00FF00 green background, no shadow, no extra text except the NWU on the mask.
```

---

## 3 (alt). Die 24 Charaktere – Anime-Stil (überholt, nur noch für die Tabellen)

**Wichtig vorab:** Die Figuren sind im Stream nur etwa 50 Pixel hoch. Damit man sie dort
erkennt, empfehle ich **leicht kindliche Proportionen (etwa 3 Köpfe groß)**. Auf der Seite
sieht das trotzdem edel aus. Wenn du lieber normale Anime-Proportionen willst, die Zeile
`chibi-leaning proportions …` ersetzen durch `normal anime proportions, about 6 heads tall`.

**Dateien:** `figur-haus1-a.png` … `figur-haus6-d.png` · Format **3:4**

```
Full-body character for the [House of the Moon] in the NWU universe.
Archetype: [Blade – a frontline fighter with a curved sword].
House look: [pale silver-blue and black clothing, crescent moon motifs, white hair accents].
Chibi-leaning proportions, about 3 heads tall, big expressive anime eyes, cute but dark.
Standing pose, three-quarter view facing right, whole body visible including feet.
Gold accents on clothing. Clear silhouette.
Plain flat solid #00FF00 green background, no shadow on the ground, no text.
```

**Archetypen** (gleich in allen Häusern):

| Buchstabe | [Archetyp] |
|---|---|
| a | Blade – a frontline fighter with a curved sword |
| b | Seer – a spellcaster with a tall hat and a staff with a glowing orb |
| c | Shadow – an agile scout with a hood, scarf and twin daggers |
| d | Warden – a protector with a heavy shield and armored shoulders |

**Haus-Look** (die zweite Klammer):

| Haus | [House look] |
|---|---|
| haus1 Mond | pale silver-blue and black clothing, crescent moon motifs, white hair accents |
| haus2 Blut | deep crimson and black clothing, blood-drop jewelry, dark red ribbons |
| haus3 Nebel | smoky grey layered cloth, misty translucent capes, silver masks |
| haus4 Flamme | burnt orange and black clothing, ember sparks, flame-shaped trims |
| haus5 Dornen | dark green and brown clothing, thorny vines, leaf and root details |
| haus6 Raben | violet-black clothing, raven feathers, small scrolls and quills |

Beim **Haus der Dornen** wieder `#FF00FF magenta` statt Grün als Hintergrund.

**Tipp:** Erst **alle 4 Figuren von Haus 1** machen und schauen, ob sie zusammenpassen.
Erst dann mit den anderen Häusern weitermachen.

---

## 4. Zerlegen fürs Overlay (Teile-Bögen) – Stand 18.10.2026

Nur für Stufe 2 (Arme und Beine bewegen sich einzeln). Stufe 1 läuft schon mit der Seitenansicht.
Wir testen das zuerst mit **einem Haus (Mond)**, erst danach die anderen.

**Immer seitlich, Blick nach rechts**, genau wie die Seitenansicht fürs Overlay.

Pro Figur **ein** Bild · Datei `teile-haus1-a.png` · Format **1:1**.
**Die Seitenansicht der Figur hochladen** (nicht die Vorderansicht) und dazu schreiben:

```
Use the uploaded character as exact reference: same design, colors, line art and art style.
Create a 2D puppet parts sheet of this character, pure side view facing right, same scale
as the reference.
Draw these 9 parts SEPARATELY, arranged in a loose grid with wide empty space between them,
no part touching another:
1. head with all hair attached (one piece)
2. torso with belt, without arms and without legs
3. front arm (upper arm, forearm and hand as one piece, hanging straight down)
4. back arm (same, one piece, hanging straight down)
5. front leg with boot (one piece, straight)
6. back leg with boot (one piece, straight)
7. cape or cloak alone (if the character has one, otherwise skip)
8. weapon or held item alone, without the hand
9. second weapon or item alone (only if the character has one)
Each part complete and fully drawn, including areas normally hidden behind other parts
(for example the shoulder under the hair, the top of the leg under the tunic).
Do NOT draw the assembled character. Do NOT add labels, numbers, arrows or text.
Thick dark outline on every part, but NO white sticker border around the parts.
Plain flat solid #00FF00 green background, no shadows, no gradients.
```

Wenn Gemini trotzdem die ganze Figur dazumalt oder Teile zusammenklebt: nochmal schreiben
**„Only the separate parts, no assembled character, more space between the parts.“**

Warum **kein weißer Sticker-Rand** bei den Teilen: Der Rand käme sonst an jedem Gelenk mitten
in die Figur. Den weißen Rand um die ganze Figur setze ich im Overlay selbst wieder drum.

Was ich danach mache:
- Hintergrund entfernen und jedes Teil ausschneiden
- Gelenkpunkte setzen (Hals, Schultern, Hüfte) und die Figur im Overlay zusammenbauen
- Laufen, Winken, Jubeln, Sitzen testen

**Ehrlich gesagt:** Gemini hält Details zwischen zwei Bildern nicht immer exakt gleich.
Wenn ein Teil nicht passt, lieber diesen einen Bogen neu machen lassen.

---

## 5. Später (noch nicht nötig)

- Schattenkönig und Morrígan als eigene Figuren
- Kosmetik-Items (Kopfteile, Umhänge, Begleiter) als Teile-Bögen
- Portal und Terrain-Streifen für das Overlay

---

## 6. Die Reise-Karte (Meilensteinkarte, vier Pfade)

**Datei:** `reise-karte.png` · Format **16:9**, so groß wie möglich

Vier Plattformen, vier Pfade, ein Ziel: Jeder Pfad kommt aus einer Ecke und führt zur Zitadelle
in der Mitte. Am besten deine Weltkarte (`karte.png`) **hochladen**, damit Stil und Gebiete passen, und dazu:

```
Same art style and world as the uploaded map, but a NEW map designed as a journey with
FOUR separate paths. In the exact center: a black citadel with golden spires on a hill,
with four gates facing the four corners.
Four winding paths, each starting in one corner of the map and ending at one gate:
- from the top-left corner, through raven cliffs and graveyards (violet tones),
- from the top-right corner, through a red-stone city and a blood-red river (crimson tones),
- from the bottom-left corner, through a thorny root forest (dark green tones),
- from the bottom-right corner, through misty marshes and sunken ruins (grey-cyan tones).
Each path has four clearly visible landmarks evenly spaced along it before reaching its gate.
The four paths never cross each other and are clearly readable as roads.
Night, atmospheric, dark gothic fantasy, gold accents. No text, no labels, no letters.
```

Danach setze ich die Orte genau auf die Landmarken. Namen, Texte und Essenz-Schwellen
stehen in `data/meilensteine.js` und lassen sich jederzeit ändern.

---

## 7. Erfolgs-Karte (Follower und Unterstützer)

**Datei:** `erfolge-karte.png` · Format **16:9**, so groß wie möglich

```
Same art style and world as the uploaded map. A NEW map with TWO long separate roads.
Road 1 (golden): starts small at the bottom-left as a humble dirt path and climbs in ten
clear stages up to a huge golden crown monument at the top-right. Each stage has a landmark
that grows grander: a campfire, a camp, a watchtower, a big gate, a stone bridge, a fortress,
a silver hall, a moon tower, a golden banner on a mountain, the crown monument.
Road 2 (blood red): starts at the bottom-right and winds through eight stages to a red
sanctum in the middle: an oath stone, a circle of torches, a blood altar, a barracks,
an honor guard hall, an oath temple, a great red hall, the red sanctum.
The two roads never cross and are clearly readable. Night, dark gothic fantasy, gold accents.
No text, no labels, no numbers, no letters.
```

---

## 8. Haus-Symbole zum Drübersetzen (Stand 18.10.2026)

Die Figuren aller Häuser sind umgefärbte Mond-Figuren, darauf sind noch Mond-Symbole. Ich setze
die Haus-Symbole **als eigene kleine Bilder darüber** (Gürtelschnalle, Schulter, Umhang, Schild).
Dafür pro Haus **ein Bogen** mit demselben Symbol in vier Formen.

Für jeden Bogen: neuen Chat, die **Seitenansicht der Klinge** hochladen (als Stil-Vorlage), dann:

```
Use the uploaded character only as STYLE reference (thick dark outline, flat cartoon shading,
sticker look). Do not draw the character.
Draw the emblem of a fantasy house as small metal badges, four separate versions with wide
empty space between them, nothing touching:
1. a small ROUND belt-buckle badge with the emblem in the middle
2. a small round shoulder stud with the emblem
3. a large flat SHIELD emblem (just the emblem shape, no shield around it)
4. the emblem as a flat fabric print for a cape (no metal, flat color)
The emblem: [EMBLEM]
Metal color: [FARBE]. Simple, bold, readable at very small size, no fine details.
Thick dark outline on every badge, NO white sticker border.
Plain flat solid #00FF00 green background, no shadows, no text, no letters.
```

Für `[EMBLEM]` und `[FARBE]` einsetzen:

| Haus | [EMBLEM] | [FARBE] |
|---|---|---|
| Blut | `a single drop of blood with a small thorn crown around it` | `dark crimson red and blackened silver` |
| Nebel | `a swirl of mist forming a spiral, like a closed eye of fog` | `smoky teal green and pale silver` |
| Flamme | `a single stylised flame with three tongues` | `bright bronze gold with orange glow` |
| Mond (optional, falls neu) | `a crescent moon` | `silver with pale blue` |

Datei-Namen: `symbole-haus2.png`, `symbole-haus3.png`, `symbole-haus4.png`.

---

## 9. Frisuren (für Haarschnitt-Freischaltungen)

Die Haare sind im Overlay schon eine eigene Ebene und lassen sich einfärben. Für **andere Frisuren**
brauche ich einen **Kopf ohne Haare** und dazu **mehrere Frisuren einzeln**, alle von der Seite.

### 9a) Kopf ohne Haare (einmal)

Neuer Chat, **Seitenansicht der Klinge** hochladen:

```
Use the uploaded character as exact reference: same face, same art style, same line art.
Draw ONLY her head in pure side view facing right, same size as in the reference,
but completely WITHOUT hair: smooth bald head with ears, neck stump at the bottom.
Then next to it, with wide space, the same bald head again but as a young man
(slightly stronger jaw, thicker eyebrows, same art style).
Thick dark outline, NO white sticker border.
Plain flat solid #00FF00 green background, no shadows, no text.
```

### 9b) Frisuren-Bögen (gern mehrmals, je 6 Frisuren)

**Im selben Chat** weiter (damit Größe und Kopfform gleich bleiben):

```
Now draw 6 different HAIRSTYLES that fit exactly on this bald head, pure side view facing
right, same scale. Draw ONLY the hair, no head, no face, each hairstyle as one separate piece,
arranged in a loose grid with wide empty space between them, nothing touching.
All hair in light neutral SILVER GREY (it will be recolored later).
Hairstyles: [LISTE]
Thick dark outline, NO white sticker border.
Plain flat solid #00FF00 green background, no shadows, no text.
```

Für `[LISTE]` nacheinander (jeweils ein Bogen):

1. `short pixie cut, chin-length bob, high ponytail, long single braid, messy shoulder-length, twin buns`
2. `short spiky hair, undercut with long top, slicked back, mohawk, long straight hair to the waist, curly afro`
3. `half-shaved side cut, wolf cut, hime cut with straight bangs, low tied ponytail, wild mane, top knot`

Datei-Namen: `frisuren-1.png`, `frisuren-2.png`, …  Der Kopf ohne Haare: `kopf-ohne-haare.png`.

---

## 10. Kopfschmuck (hohe Level)

Neuer Chat, **Seitenansicht der Klinge** hochladen:

```
Use the uploaded character only as STYLE reference. Draw 6 separate HEAD ACCESSORIES that fit on
her head in pure side view facing right, same scale as the reference head, without the head itself.
Wide empty space between them, nothing touching:
1. a thin silver circlet with a small gem
2. small curved demon horns
3. a dark iron crown with spikes
4. a hood of a dark cloak (just the hood)
5. a half mask covering the eyes
6. a floating halo ring of pale light
Thick dark outline, NO white sticker border, flat cartoon shading.
Plain flat solid #00FF00 green background, no shadows, no text.
```

Weitere Bögen später: `flower crown, feather headband, raven skull helmet, witch hat, eye patch, glowing antlers`.

---

## 11. Begleiter (laufen neben der Figur)

Neuer Chat, **Seitenansicht der Klinge** hochladen:

```
Use the uploaded character only as STYLE reference. Draw 6 small COMPANION creatures, each about
as tall as the character's knee, pure side view facing right, walking pose,
each separate with wide empty space between them:
1. a black raven (standing)
2. a small black cat
3. a wolf pup
4. a tiny floating ghost wisp
5. a little bat (flying)
6. a small fire salamander
Same thick dark outline, chibi cartoon style, NO white sticker border.
Plain flat solid #00FF00 green background, no shadows, no text.
```

---

## 12. Bilder für den Prolog „Die Spaltung“ (optional, `prolog.html`)

Der Prolog läuft schon mit der Karte. Diese Bilder würden ihn noch stärker machen. Format **16:9**,
**Weltkarte als Stil-Vorlage hochladen** (gleicher gemalter Stil wie Karte und Gebiete, nicht der Sticker-Stil).

**a) Morrígan mit der Kugel** · `prolog-morrigan.png`
```
Same painted dark fantasy style as the uploaded map. An ancient witch, Morrígan, seen from the side
in a dark stone chamber, hooded, long silver hair, wrinkled hands around a large glowing crystal orb
on a pedestal. Inside the orb a tiny golden citadel is visible. Pale blue light from the orb on her face,
everything else in deep shadow. Calm, mysterious, cinematic. No text.
```

**b) Die Zitadelle zur Zeit von Unity** · `prolog-unity.png`
```
Same painted dark fantasy style as the uploaded map. The black citadel with golden spires at its
height of glory: huge black-and-gold banners with a silver crescent moon, crowds of people in silver armor
in the courtyard, warm golden light, festive, united. Wide cinematic shot. No text.
```

**c) Die Nacht der Spaltung** · `prolog-spaltung.png`
```
Same painted dark fantasy style as the uploaded map. The same citadel at night during a storm,
a glowing crack splitting the great hall, the black-and-gold banner torn in half, four groups of
warriors walking away in four directions, each carrying a torch in a different color
(pale silver-blue, blood red, teal, orange flame). Dramatic, sad, cinematic. No text.
```

**d) Der Westen im Nebel** · `prolog-westen.png`
```
Same painted dark fantasy style as the uploaded map. A wall of dense grey fog over a dark land, faint
silhouettes of a raven tower and a thorn forest barely visible inside the fog, two pairs of glowing eyes
watching from the mist. Eerie, quiet, cinematic. No text.
```
