"""Charakterbild freistellen und auf einheitliche Leinwand setzen (Füße unten, mittig).
Nutzung: python tools/figur.py eingabe.jpg ausgabe.webp [gruen|magenta]
"""
import sys, os, tempfile
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from freistellen import freistellen

BREITE, HOEHE, RAND = 640, 760, 16

def figur(ein, aus, farbe='gruen'):
    tmp = os.path.join(tempfile.gettempdir(), 'nwu-figur.webp')
    freistellen(ein, tmp, farbe, rand=0)
    fig = Image.open(tmp).convert('RGBA')
    s = min((BREITE - 2 * RAND) / fig.width, (HOEHE - 2 * RAND) / fig.height)
    fig = fig.resize((round(fig.width * s), round(fig.height * s)), Image.LANCZOS)
    leinwand = Image.new('RGBA', (BREITE, HOEHE), (0, 0, 0, 0))
    leinwand.paste(fig, ((BREITE - fig.width) // 2, HOEHE - RAND - fig.height), fig)
    leinwand.save(aus, 'WEBP', quality=90, method=6)
    return fig.size

if __name__ == '__main__':
    print(figur(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else 'gruen'))
