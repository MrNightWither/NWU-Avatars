"""Legt die verlorenen Häuser (Westen der Karte: Raben, Dornen) in Dunkelheit und Nebel.
Nutzung: python tools/nebel.py   (liest assets/roh/karte.jpg, schreibt assets/karte.webp und karte-klein.webp)
"""
import numpy as np
from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = None
VOLL, FREI = 0.27, 0.41        # bis hier ganz im Nebel, ab hier ganz frei (Anteil der Breite)

def nebel(ein='assets/roh/karte.jpg'):
    bild = Image.open(ein).convert('RGB')
    w, h = bild.size
    rgb = np.asarray(bild).astype(np.float32) / 255

    # Maske: links voll, weicher Übergang, Rand leicht wellig damit es nicht wie ein Lineal aussieht
    rng = np.random.default_rng(7)
    welle = np.asarray(Image.fromarray((rng.random((12, 1)) * 255).astype(np.uint8)).resize((1, h), Image.BICUBIC)).astype(np.float32)[:, 0] / 255
    grenze_voll = VOLL + (welle - 0.5) * 0.05
    x = np.linspace(0, 1, w)[None, :]
    maske = np.clip((FREI + (welle[:, None] - 0.5) * 0.05 - x) / (FREI - grenze_voll[:, None]), 0, 1)
    maske = maske * maske * (3 - 2 * maske)          # weiche Kurve

    # Dunkler, entsättigt, leicht kalt
    grau = rgb.mean(axis=2, keepdims=True)
    dunkel = (grau * 0.75 + rgb * 0.25) * 0.38
    dunkel = dunkel * np.array([0.92, 0.95, 1.08])

    # Nebelschwaden: grobes Rauschen, stark weichgezeichnet
    schwaden = np.zeros((h, w), np.float32)
    for groesse, gewicht in ((6, 0.6), (18, 0.4)):
        r = Image.fromarray((rng.random((groesse, groesse * 2)) * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        r = r.filter(ImageFilter.GaussianBlur(w / (groesse * 10)))
        schwaden += np.asarray(r).astype(np.float32) / 255 * gewicht
    schwaden = np.clip((schwaden - 0.35) * 1.6, 0, 1)[..., None]
    nebelfarbe = np.array([0.55, 0.57, 0.63])
    dunkel = dunkel * (1 - schwaden * 0.45) + nebelfarbe * schwaden * 0.45

    m = maske[..., None]
    aus = rgb * (1 - m) + dunkel * m
    ergebnis = Image.fromarray((np.clip(aus, 0, 1) * 255).astype(np.uint8))
    ergebnis.save('assets/karte.webp', 'WEBP', quality=86, method=6)
    ergebnis.resize((2000, round(h * 2000 / w)), Image.LANCZOS).save('assets/karte-klein.webp', 'WEBP', quality=86, method=6)

if __name__ == '__main__':
    nebel()
