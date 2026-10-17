# Animations-Engine: Prüfung (Plan 15.5)

Stand: 17.10.2026. Ziel laut Plan: Anime-Stil, gezeichnet, Puppet-/Knochen-Animation
mit Ebenen, sauberer Lauf, ein gemeinsamer Bilderatlas, läuft als OBS-Browserquelle
auf einem PC neben dem Spiel.

## Ergebnis in einem Satz

**PixiJS 8 als Renderer ist gesetzt.** Für die Knochen-Animation ist **Spine** die
beste Wahl, wenn die Lizenz ins Budget passt. Sonst geht es mit einem **eigenen
Knochen-System in PixiJS** los. Paket 0 nutzt genau dieses eigene System, ein
späterer Umstieg auf Spine ist möglich, weil die Zeichnungen sowieso in Ebenen geliefert werden.

## Vergleich

| | PixiJS + eigenes Rig | PixiJS + Spine | PixiJS + DragonBones | Live2D |
|---|---|---|---|---|
| Kosten | kostenlos (MIT) | Editor-Lizenz nötig, auch für die Runtime | kostenlos | Lizenz, je nach Nutzung |
| Qualität der Animation | gut bei starren Teilen | sehr gut, weiche Verformung (Meshes) für Umhang/Haare | gut | sehr gut, aber für Frontal-Ansicht |
| Laufen, Klettern, Kopfüber | ja | ja | ja | ungeeignet (gemacht für VTuber-Köpfe) |
| Weiterentwicklung | liegt bei uns | aktiv, offizielle Runtime für PixiJS 8 (`@esotericsoftware/spine-pixi-v8`) | seit Jahren praktisch eingestellt, keine offizielle PixiJS-8-Runtime | aktiv |
| Wer animiert? | Bewegungen per Code/JSON | Animator im Spine-Editor | Animator im Editor | Rigger im Live2D-Editor |
| Bilderatlas | ja | ja (Spine packt selbst) | ja | eigenes Format |

**DragonBones** fällt raus (keine Pflege mehr). **Live2D** passt nicht zu laufenden Ganzkörper-Figuren.

## Hinweise zu Spine

- Die Spine-Runtimes dürfen nur mit gültiger Spine-Editor-Lizenz genutzt werden.
- Es gibt eine günstigere und eine teurere Editor-Stufe. Weiche Verformung (Meshes),
  die für flatternde Umhänge und Haare im Anime-Stil schön aussieht, gibt es nur in der teureren.
  **Aktuelle Preise und Funktionsumfang vor dem Kauf auf esotericsoftware.com prüfen.**
- Wer die Figuren animiert (du selbst oder ein Artist), sollte mit Spine arbeiten können.

## Was so oder so gilt (wichtig für den Zeichner)

1. **Ein gemeinsames Skelett** für alle 24 Startfiguren, feste Ankerpunkte für Kopf, Rücken, Hand.
2. Jede Figur als **getrennte Ebenen**: Beine, Arme (vorne/hinten), Körper, Kopf, Haare,
   Kopfteil, Umhang, Begleiter, Aura. Jede Ebene als eigenes PNG mit transparentem Hintergrund.
3. Einheitliche Größe und Blickrichtung (Seitenansicht, Blick nach rechts).
4. Kosmetik-Teile auf dieselben Ankerpunkte zeichnen, dann passt jedes Item an jede Figur.
5. Größe auf dem Stream: Figuren sind bei 1080p etwa 40 bis 60 Pixel hoch. Zeichnen in
   2- bis 4-facher Größe, damit es scharf bleibt.

Mit diesen Regeln sind die Zeichnungen für ein eigenes Rig **und** für Spine nutzbar.

## Empfehlung für die Reihenfolge

1. Paket 0 mit den Platzhaltern auf deinem PC messen (siehe `PAKET-0.md`).
2. Eine erste echte Figur in Ebenen zeichnen lassen.
3. Diese Figur einmal im eigenen Rig und einmal in Spine (Testversion des Editors) animieren
   und in OBS vergleichen. Dann entscheiden.
