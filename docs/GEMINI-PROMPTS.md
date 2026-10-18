# Bilder mit Gemini: Prompts

Stand: 18.10.2026. Für: Karte, 6 Wappen, 24 Charaktere und Teile-Bögen zum Zerlegen.

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

## 4. Zerlegen fürs Overlay (Teile-Bögen)

Damit eine Figur im Stream laufen, klettern und kämpfen kann, braucht sie **getrennte Teile**.
Ein normales Bild kann man zwar ausschneiden, aber was hinter dem Arm liegt, fehlt dann.
Deshalb lassen wir Gemini die Teile **einzeln nebeneinander** zeichnen.

Pro Figur zwei Bilder. Dafür das fertige Charakter-Bild aus Schritt 3 **hochladen** und dazu schreiben:

**a) Seitenansicht** · Datei `seite-haus1-a.png` · Format **1:1**

```
Same character as in the uploaded image, exact same design, colors and art style.
Pure side view, facing right, neutral standing pose, arms hanging down slightly away
from the body, legs slightly apart so nothing overlaps.
Plain flat solid #00FF00 green background, no shadow, no text.
```

**b) Teile-Bogen** · Datei `teile-haus1-a.png` · Format **1:1**

```
Same character as in the uploaded image, exact same design, colors and art style.
Create a 2D animation parts sheet for a puppet rig, side view facing right.
Draw each body part SEPARATELY with clear space between them, nothing overlapping:
head (without hair), hair (front and back as two pieces), torso, front upper arm,
front forearm with hand, back upper arm, back forearm with hand, front thigh,
front lower leg with foot, back thigh, back lower leg with foot, cape/cloak,
weapon or held item.
Each part complete, including the areas that are normally hidden by other parts.
Plain flat solid #00FF00 green background, no labels, no text.
```

Was ich danach mache:
- Hintergrund entfernen und jedes Teil ausschneiden
- Teile an das gemeinsame Skelett anpassen (Gelenkpunkte für Schulter, Hüfte, Knie usw.)
- In OBS testen

**Ehrlich gesagt:** Gemini hält Details zwischen zwei Bildern nicht immer exakt gleich.
Bei manchen Teilen wird man nachbessern müssen. Plane das ein, oder lass am Ende die
wichtigsten Figuren von einem Zeichner sauber zerlegen.

---

## 5. Später (noch nicht nötig)

- Schattenkönig und Morrígan als eigene Figuren
- Kosmetik-Items (Kopfteile, Umhänge, Begleiter) als Teile-Bögen
- Portal und Terrain-Streifen für das Overlay

---

## 6. Die Reise-Karte (Meilensteinkarte)

**Datei:** `reise-karte.png` · Format **16:9**, so groß wie möglich

Am besten deine Weltkarte (`karte.png`) **hochladen**, damit Stil und Gebiete passen, und dazu:

```
Same art style and world as the uploaded map, but a NEW map designed as a journey.
A long winding golden path leads from the bottom-left corner across the whole map
to a black citadel with golden spires at the top-right.
Along the path, nine clearly visible landmarks in this order, evenly spaced:
1. ruined stone arch at the start (bottom-left)
2. a cursed foggy swamp with dead trees
3. a circle of ancient glowing rune stones
4. a narrow path through thick grey mist
5. a stone bridge over a chasm, with ravens on it
6. a black forge glowing with lava
7. a river ford with blood-red water
8. a silver moonlit lake with towers
9. the gates of the black citadel (end, top-right)
The path must be clearly readable and never cross itself.
Night, atmospheric, dark gothic fantasy, gold accents. No text, no labels, no letters.
```

Danach setze ich die 9 Orte genau auf die Landmarken. Namen, Texte und Essenz-Schwellen
stehen in `data/meilensteine.js` und lassen sich jederzeit ändern.
