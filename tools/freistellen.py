"""Entfernt einen einfarbigen Grün- oder Magenta-Hintergrund (Gemini-Bilder) und schneidet zu.
Nutzung: python tools/freistellen.py eingabe.jpg ausgabe.webp [gruen|magenta]
"""
import sys
import numpy as np
from PIL import Image

def freistellen(ein, aus, farbe='gruen', rand=10):
    im = np.asarray(Image.open(ein).convert('RGB')).astype(np.float32)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    if farbe == 'gruen':
        staerke = g - np.maximum(r, b)          # wie "grün" ein Pixel ist
    else:
        staerke = np.minimum(r, b) - g          # wie "magenta" ein Pixel ist
    # Hintergrundstärke an den Bildrändern messen, damit auch dunkleres Grün sauber verschwindet
    rand_px = np.concatenate([staerke[:8].ravel(), staerke[-8:].ravel(), staerke[:, :8].ravel(), staerke[:, -8:].ravel()])
    bg = max(60.0, float(np.median(rand_px)))
    voll, weg = 0.30 * bg, 0.75 * bg       # darunter deckend, darüber durchsichtig
    alpha = np.clip(1 - (staerke - voll) / (weg - voll), 0, 1)
    # Farbsaum an den Kanten entfernen (Despill)
    halb = (alpha < 1) & (staerke > 0)
    if farbe == 'gruen':
        g[halb] = np.maximum(r, b)[halb]
    else:
        m = np.minimum(r, b)
        r[halb] = np.minimum(r[halb], g[halb] + (r[halb] - m[halb]))
        b[halb] = np.minimum(b[halb], g[halb] + (b[halb] - m[halb]))
    rgba = np.dstack([r, g, b, alpha * 255]).clip(0, 255).astype(np.uint8)
    bild = Image.fromarray(rgba, 'RGBA')
    box = bild.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox()
    x0, y0, x1, y1 = box
    bild = bild.crop((max(0, x0 - rand), max(0, y0 - rand), min(bild.width, x1 + rand), min(bild.height, y1 + rand)))
    bild.save(aus, 'WEBP', quality=90, method=6)
    return bild.size

if __name__ == '__main__':
    print(freistellen(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else 'gruen'))
