"""Färbt die Mond-Figuren für die anderen Häuser um und trennt die Haare ab.

Silberne/blaugraue Rüstung und Umhang → Hausfarbe. Haut, Schwarz und Umrisse bleiben.
Haare (neutrales Silber) bekommen eine eigene Farbe oder werden als eigene Ebene gespeichert,
damit das Overlay sie pro Person einfärben kann.

Nutzung: python tools/umfaerben.py          (erzeugt alles für haus2–haus4 neu)
"""
import os
import numpy as np
from PIL import Image, ImageFilter

# Rüstungsfarbe je Haus: dunkel, mittel, hell (Hell = Glanzlichter)
HAEUSER = {
    'haus2': {'name': 'Blut',   'ruestung': [(48, 8, 14), (150, 28, 40), (238, 170, 170)], 'haare': (60, 52, 56)},
    'haus3': {'name': 'Nebel',  'ruestung': [(16, 30, 32), (64, 108, 104), (186, 224, 214)], 'haare': (236, 236, 240)},
    'haus4': {'name': 'Flamme', 'ruestung': [(54, 22, 6), (196, 112, 40), (255, 220, 150)], 'haare': (168, 40, 30)},
}
FIGUREN = 'abcd'


def kanaele(bild):
    a = np.asarray(bild.convert('RGBA')).astype(np.float32) / 255
    return a[..., :3], a[..., 3]


def helligkeit(rgb):
    return rgb @ np.array([0.299, 0.587, 0.114], np.float32)


def haut(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return (r - b > 0.08) & (r > 0.45)


def gesicht(rgb, alpha):
    """Bereich zwischen der linkesten und rechtesten Haut je Zeile (Augen, Mund gehören dazu)."""
    h = haut(rgb) & (alpha > 0.5)
    m = np.zeros_like(h)
    for y in np.nonzero(h.any(axis=1))[0]:
        xs = np.nonzero(h[y])[0]
        m[y, xs.min():xs.max() + 1] = True
    return m


def glaetten(maske, radius):
    """Mehrheit in der Nachbarschaft: einzelne Ausreißer-Pixel verschwinden."""
    m = Image.fromarray((maske * 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(radius))
    return np.asarray(m).astype(np.float32) / 255


def weiss(rgb):
    """Weißer Sticker-Rand und reine Glanzlichter bleiben weiß."""
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    return (helligkeit(rgb) > 0.9) & (mx - mn < 0.08)


def maske_haare(rgb, alpha):
    r, b = rgb[..., 0], rgb[..., 2]
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    L = helligkeit(rgb)
    kandidat = (alpha > 0.05) & (mx - mn < 0.2) & (L > 0.3) & ~gesicht(rgb, alpha) & ~haut(rgb) & ~weiss(rgb)
    neutral = kandidat & (b - r < 0.075) & (b - r > -0.04)
    # Haare sind große zusammenhängende Flächen: zählt, was in der Umgebung überwiegend neutral ist
    anteil = glaetten(neutral, 8) / np.maximum(glaetten(kandidat, 8), 1e-3)
    return kandidat & (anteil > 0.42)


def maske_ruestung(rgb, alpha):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    satt = (mx - mn) / np.maximum(mx, 1e-3)
    L = helligkeit(rgb)
    augen = gesicht(rgb, alpha) & (L > 0.4)          # Augen und Augenweiß im Gesicht behalten ihre Farbe
    return (alpha > 0.05) & (satt < 0.5) & (b >= r - 0.02) & (L > 0.16) & ~haut(rgb) & ~weiss(rgb) & ~augen


def verlauf(L, farben):
    """Helligkeit 0–1 → Farbe aus drei Stufen (dunkel, mittel, hell)."""
    d, m, h = (np.array(f, np.float32) / 255 for f in farben)
    L = L[..., None]
    unten = d + (m - d) * np.clip(L / 0.55, 0, 1)
    oben = m + (h - m) * np.clip((L - 0.55) / 0.4, 0, 1)
    return np.where(L < 0.55, unten, oben)


def einfaerben(rgb, maske, farbe):
    """Haare: Helligkeit behalten, Farbe übernehmen (wie Multiplizieren auf Silber)."""
    L = helligkeit(rgb)[..., None]
    f = np.array(farbe, np.float32) / 255
    neu = np.clip(f * (L / 0.62), 0, 1)
    neu = neu + (1 - neu) * np.clip((L - 0.85) / 0.15, 0, 1) * 0.6        # Glanz bleibt hell
    return np.where(maske[..., None], neu, rgb)


def speichern(rgb, alpha, pfad):
    a = np.dstack([rgb, alpha])
    Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8), 'RGBA').save(pfad, 'WEBP', quality=92, method=6)


def ganze_figur(ein, aus, haus, haare_auch=True):
    rgb, alpha = kanaele(Image.open(ein))
    ha = maske_haare(rgb, alpha) if haare_auch else np.zeros_like(alpha, bool)
    ru = maske_ruestung(rgb, alpha) & ~ha
    neu = np.where(ru[..., None], verlauf(helligkeit(rgb), haus['ruestung']), rgb)
    if haare_auch:
        neu = einfaerben(neu, ha, haus['haare'])
    speichern(neu, alpha, aus)


def kopf_teilen(ein, aus_kopf, aus_haare, haus=None):
    """Kopf-Teil: Haare als eigene, silberne Ebene (zum Einfärben im Overlay), Rest umgefärbt."""
    rgb, alpha = kanaele(Image.open(ein))
    ha = maske_haare(rgb, alpha)
    rest = rgb
    if haus:
        ru = maske_ruestung(rgb, alpha) & ~ha
        rest = np.where(ru[..., None], verlauf(helligkeit(rgb), haus['ruestung']), rgb)
    speichern(rest, np.where(ha, 0, alpha), aus_kopf)
    # Haare leicht aufhellen, damit das Einfärben (Multiplizieren) kräftige Farben ergibt
    hell = np.clip(rgb / 0.82, 0, 1)
    speichern(hell, np.where(ha, alpha, 0), aus_haare)


def main():
    quelle = 'overlay/figuren'
    for typ in FIGUREN:
        # Mond selbst: nur die Haare abtrennen
        o = f'{quelle}/haus1-{typ}'
        if os.path.exists(f'{o}/kopf-original.webp') is False:
            os.replace(f'{o}/kopf.webp', f'{o}/kopf-original.webp')
        kopf_teilen(f'{o}/kopf-original.webp', f'{o}/kopf.webp', f'{o}/haare.webp')
    for hid, haus in HAEUSER.items():
        for typ in FIGUREN:
            src, ziel = f'{quelle}/haus1-{typ}', f'{quelle}/{hid}-{typ}'
            os.makedirs(ziel, exist_ok=True)
            for datei in os.listdir(src):
                if not datei.endswith('.webp') or datei in ('kopf.webp', 'haare.webp'):
                    continue
                if datei == 'kopf-original.webp':
                    kopf_teilen(f'{src}/{datei}', f'{ziel}/kopf.webp', f'{ziel}/haare.webp', haus)
                else:
                    ganze_figur(f'{src}/{datei}', f'{ziel}/{datei}', haus, haare_auch=False)
            # Einzelbild fürs Overlay (Stufe 1), Seitenansicht und Website-Bild
            ganze_figur(f'{quelle}/haus1-{typ}.webp', f'{quelle}/{hid}-{typ}.webp', haus)
            ganze_figur(f'assets/seite-haus1-{typ}.webp', f'assets/seite-{hid}-{typ}.webp', haus)
            ganze_figur(f'assets/figur-haus1-{typ}.webp', f'assets/figur-{hid}-{typ}.webp', haus)
        print('fertig:', haus['name'])


if __name__ == '__main__':
    main()
