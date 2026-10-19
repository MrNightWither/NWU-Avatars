"""Frisuren-Bögen zerlegen: pro Frisur die Haare (ohne Kopf) und die Kopfform als eigene Bilder.
Nutzung: python tools/frisuren.py   (liest assets/roh/frisuren-1..4.jpg, schreibt overlay/frisuren/)
Jede Frisur wird so gespeichert, dass Nasenspitze und Halsende der Vorlage an festen Stellen liegen
(Bezugsrahmen BREITE × HOEHE, Nase bei NASE, Halsende bei HALS) – damit passt jede Frisur gleich auf jede Figur.
"""
import os, sys, json, tempfile
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(__file__))
from teile import teile

BREITE, HOEHE = 420, 520          # Bezugsrahmen
NASE = (300, 230)                 # Nasenspitze der Vorlage
HALS_ABSTAND = 120                # Abstand Nasenspitze → Halsende (senkrecht) im Bezugsrahmen

def masken(rgba):
    a = rgba[..., 3] > 40
    r, g, b = [rgba[..., i].astype(int) for i in range(3)]
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
    haut = a & (r - b > 35) & (r > 150)
    grau = a & (mx - mn < 32) & (mx > 95)
    return a, haut, grau

def zerlegen(stueck):
    rgba = np.asarray(stueck.convert('RGBA')).copy()
    a, haut, grau = masken(rgba)
    grau = ndimage.binary_opening(grau, iterations=1)
    # Haare: graue Flächen plus ihre Umrisse (bis 4 px daneben), aber keine Haut
    haare = ndimage.binary_dilation(grau, iterations=4) & a & ~haut
    # Kopf: Haut plus Umriss daneben, ohne Haare
    kopf = ndimage.binary_dilation(haut, iterations=4) & a & ~(grau)
    ys, xs = np.nonzero(haut)
    # Nasenspitze: am weitesten rechts liegender Hautpunkt in der oberen Hälfte der Haut
    oben = ys < ys.min() + (ys.max() - ys.min()) * 0.75
    i = np.argmax(np.where(oben, xs, -1))
    nase = (int(xs[i]), int(ys[i]))
    hals = int(ys.max())
    return rgba, haare, kopf, nase, hals

def ausrichten(rgba, maske, nase, hals):
    s = HALS_ABSTAND / max(20, hals - nase[1])
    bild = rgba.copy(); bild[..., 3] = np.where(maske, bild[..., 3], 0)
    im = Image.fromarray(bild, 'RGBA')
    im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    rahmen = Image.new('RGBA', (BREITE, HOEHE))
    rahmen.alpha_composite(im, (round(NASE[0] - nase[0] * s), round(NASE[1] - nase[1] * s)))
    return rahmen

if __name__ == '__main__':
    aus = 'overlay/frisuren'; os.makedirs(aus, exist_ok=True)
    tmp = tempfile.mkdtemp()
    nr = 0
    for bogen in range(1, 5):
        ordner = os.path.join(tmp, f'b{bogen}')
        teile(f'assets/roh/frisuren-{bogen}.jpg', ordner)
        for k in range(1, 7):
            nr += 1
            rgba, haare, kopf, nase, hals = zerlegen(Image.open(os.path.join(ordner, f'teil-{k:02d}.png')))
            ausrichten(rgba, haare, nase, hals).save(f'{aus}/f{nr:02d}.webp', quality=92)
            if nr == 1:                       # Kopfform (für die Glatze/Kopfhaut) einmal aus der ersten Vorlage
                ausrichten(rgba, kopf, nase, hals).save(f'{aus}/kopfform.webp', quality=92)
            print(nr, 'nase', nase, 'hals', hals)


def kopf_frei(pfad_ein, pfad_aus, abstand=5, dunkel_bis=80):
    """Kopf ohne Haare säubern: Reste der alten Haar-Umrisse (schwarze Linie, weißer Rand) entfernen.
    Behalten wird nur, was Farbe hat (Gesicht, Ohr, Hut, Kapuze, Maske) plus Umriss direkt daneben."""
    rgba = np.asarray(Image.open(pfad_ein).convert('RGBA')).copy()
    a = rgba[..., 3] > 40
    r, g, b = [rgba[..., i].astype(int) for i in range(3)]
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
    dunkel, weiss = mx < dunkel_bis, mn > 225
    inhalt = a & ~dunkel & ~weiss
    inhalt = ndimage.binary_opening(inhalt, iterations=1)
    behalten = ndimage.binary_dilation(inhalt, iterations=abstand) & a
    behalten = ndimage.binary_fill_holes(behalten) & a
    rgba[..., 3] = np.where(behalten, rgba[..., 3], 0)
    Image.fromarray(rgba, 'RGBA').save(pfad_aus, quality=95)
