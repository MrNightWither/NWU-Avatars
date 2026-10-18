"""Teile-Bogen zerlegen: Hintergrund entfernen, jedes zusammenhängende Teil einzeln speichern.
Nutzung: python tools/teile.py teile-haus1-a.jpg ausgabe-ordner/
Schreibt teil-01.png, teil-02.png ... (von oben links nach unten rechts) und uebersicht.png mit Nummern.
"""
import sys, os, tempfile
from collections import deque
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(__file__))
from freistellen import freistellen

def teile(ein, ordner, farbe='gruen', mindest=0.002):
    os.makedirs(ordner, exist_ok=True)
    tmp = os.path.join(tempfile.gettempdir(), 'nwu-teile.png')
    freistellen(ein, tmp, farbe, rand=0)
    bild = Image.open(tmp).convert('RGBA')
    a = np.asarray(bild.getchannel('A'))
    # Teile auf halber Auflösung finden (schnell genug in reinem Python)
    k = 2
    maske = a[::k, ::k] > 40
    h, w = maske.shape
    marke = np.zeros((h, w), np.int32)
    n = 0
    for y in range(h):
        for x in range(w):
            if maske[y, x] and not marke[y, x]:
                n += 1
                q = deque([(y, x)]); marke[y, x] = n
                while q:
                    cy, cx = q.popleft()
                    for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                        if 0 <= ny < h and 0 <= nx < w and maske[ny, nx] and not marke[ny, nx]:
                            marke[ny, nx] = n; q.append((ny, nx))
    gross = np.kron(marke, np.ones((k, k), np.int32))[:a.shape[0], :a.shape[1]]
    flaechen = np.bincount(marke.ravel())
    teile = []
    for i in range(1, n + 1):
        if flaechen[i] < mindest * h * w:
            continue
        ys, xs = np.nonzero(gross == i)
        teile.append((i, xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    # Reihenfolge: Zeilen von oben nach unten, darin von links nach rechts
    teile.sort(key=lambda t: (round(t[2] / 120), t[1]))
    rgba = np.asarray(bild).copy()
    uebersicht = bild.copy()
    zeichnen = ImageDraw.Draw(uebersicht)
    for nr, (i, x0, y0, x1, y1) in enumerate(teile, 1):
        stueck = rgba[y0:y1, x0:x1].copy()
        stueck[..., 3] = np.where(gross[y0:y1, x0:x1] == i, stueck[..., 3], 0)
        Image.fromarray(stueck, 'RGBA').save(os.path.join(ordner, f'teil-{nr:02d}.png'))
        zeichnen.rectangle((x0, y0, x1, y1), outline=(255, 0, 0, 255), width=3)
        zeichnen.text((x0 + 6, y0 + 4), str(nr), fill=(255, 0, 0, 255))
        print(nr, (x0, y0, x1 - x0, y1 - y0))
    hinter = Image.new('RGBA', uebersicht.size, (40, 40, 40, 255))
    hinter.alpha_composite(uebersicht)
    hinter.convert('RGB').save(os.path.join(ordner, 'uebersicht.png'))

if __name__ == '__main__':
    teile(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else 'gruen')
