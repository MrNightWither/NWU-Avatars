"""Kopfschmuck-Bögen zerlegen: pro Teil nur der Schmuck (ohne den Vorlagen-Kopf), ausgerichtet im selben
Bezugsrahmen wie die Frisuren (tools/frisuren.py), damit er auf jede Figur passt. Dazu die Begleiter.
Nutzung: python tools/kopfschmuck.py
"""
import os, sys, tempfile
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(__file__))
from teile import teile
from frisuren import masken, BREITE, HOEHE, NASE

# Größe der Vorlagen-Köpfe auf den Kopfschmuck-Bögen im Verhältnis zum Bezugsrahmen (eingepasst an der Glatze)
FAKTOR, VERSATZ = 0.98, (0, -5)
TEILE = {
    1: {1: 'federn', 2: 'vogelschaedel', 3: 'blumenkranz', 4: 'hexenhut', 5: 'geweih', 6: 'augenklappe'},
    2: {1: 'reif', 2: 'hoerner', 3: 'dornenkrone', 4: 'kapuze', 5: 'maske'},
}

def schmuck(stueck):
    rgba = np.asarray(stueck.convert('RGBA')).copy()
    a, haut, _ = masken(rgba)
    r, g, b = [rgba[..., i].astype(int) for i in range(3)]
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
    farbig = a & ~haut & (mx > 45) & ~(mn > 235)
    farbig = ndimage.binary_opening(farbig, iterations=1)
    teil = ndimage.binary_dilation(farbig, iterations=4) & a & ~haut
    # kleine Löcher im Schmuck schließen (hautfarbene Stellen im Vogelschädel)
    loch, n = ndimage.label(ndimage.binary_fill_holes(teil) & ~teil)
    if n:
        groesse = ndimage.sum(np.ones_like(loch), loch, range(1, n + 1))
        teil |= np.isin(loch, [i + 1 for i, g in enumerate(groesse) if g < 2500])
    # Nase nur an großen Hautstücken suchen (Blüten oder Federn können hautfarben sein)
    flecken, n = ndimage.label(haut)
    if n > 1:
        groesse = ndimage.sum(np.ones_like(flecken), flecken, range(1, n + 1))
        haut = np.isin(flecken, [i + 1 for i, g in enumerate(groesse) if g >= 0.15 * max(groesse)])
    ys, xs = np.nonzero(haut)
    oben = ys < ys.min() + (ys.max() - ys.min()) * 0.75
    i = np.argmax(np.where(oben, xs, -1))
    return rgba, teil, (int(xs[i]), int(ys[i]))

def einsetzen(rgba, maske, nase):
    bild = rgba.copy(); bild[..., 3] = np.where(maske, bild[..., 3], 0)
    im = Image.fromarray(bild, 'RGBA')
    im = im.resize((round(im.width * FAKTOR), round(im.height * FAKTOR)), Image.LANCZOS)
    rahmen = Image.new('RGBA', (BREITE, HOEHE))
    rahmen.alpha_composite(im, (round(NASE[0] - nase[0] * FAKTOR + VERSATZ[0]), round(NASE[1] - nase[1] * FAKTOR + VERSATZ[1])))
    return rahmen

if __name__ == '__main__':
    tmp = tempfile.mkdtemp()
    os.makedirs('overlay/kopfschmuck', exist_ok=True)
    for bogen, namen in TEILE.items():
        ordner = os.path.join(tmp, f'k{bogen}')
        teile(f'assets/roh/kopfschmuck-{bogen}.jpg', ordner)
        for nr, name in namen.items():
            rgba, maske, nase = schmuck(Image.open(os.path.join(ordner, f'teil-{nr:02d}.png')))
            einsetzen(rgba, maske, nase).save(f'overlay/kopfschmuck/{name}.webp', quality=92)
    # Heiligenschein: ohne Kopf gezeichnet, über den Scheitel des Bezugsrahmens setzen
    hs = Image.open(os.path.join(tmp, 'k2', 'teil-07.png')).convert('RGBA')
    hs = hs.resize((round(hs.width * FAKTOR * 0.95), round(hs.height * FAKTOR * 0.95)), Image.LANCZOS)
    rahmen = Image.new('RGBA', (BREITE, HOEHE))
    rahmen.alpha_composite(hs, (round(NASE[0] - 60 - hs.width / 2), 22))
    rahmen.save('overlay/kopfschmuck/heiligenschein.webp', quality=92)
    # Begleiter: ausschneiden, auf 160 px Höhe
    os.makedirs('overlay/begleiter', exist_ok=True)
    teile('assets/roh/begleiter-2.jpg', os.path.join(tmp, 'b2'))
    for nr, name in enumerate(['rabe', 'katze', 'wolf', 'geist', 'fledermaus', 'salamander'], 1):
        im = Image.open(os.path.join(tmp, 'b2', f'teil-{nr:02d}.png')).convert('RGBA')
        im = im.crop(im.getbbox())
        im.thumbnail((240, 160), Image.LANCZOS)
        im.save(f'overlay/begleiter/{name}.webp', quality=92)
