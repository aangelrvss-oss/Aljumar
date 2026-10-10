"""
Extrae el logotipo de Aljumar de capturas de la web antigua (aljumar.es),
eliminando SOLO el color de fondo con el algoritmo «color a alfa» (el de
GIMP): cada píxel se descompone en color de primer plano + transparencia
respecto al fondo conocido, de modo que los bordes suavizados se conservan
sin halo. No se redibuja ni se modifica el diseño.

Origen:
  captura-pie-logo-vertical.png      → logotipo vertical (SVG oficial
      «Aljumar_Inmuebles_V-FONDO.svg» renderizado en el pie de
      /nuestra-esencia/, fondo #004B93), 1x.
  captura-cabecera-logo-horizontal.png → logotipo horizontal (JPG oficial
      «logo-Aljumar_bsuperior_www.jpg» de la cabecera, fondo #215171), 1x.

Uso: python3 extract-logo.py <salida-dir>
Cuando se ejecute `npm run media:fetch`, los archivos fuente oficiales
(public/brand/logo-vertical.svg, logo-horizontal.jpg) tienen prioridad.
"""
import sys
from PIL import Image


def color_to_alpha(im, bg):
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            a = 0.0
            for c, k in zip((r, g, b), bg):
                if c > k:
                    a = max(a, (c - k) / (255 - k))
                elif c < k:
                    a = max(a, (k - c) / k)
            if a <= 0.02:
                px[x, y] = (0, 0, 0, 0)
                continue
            fg = [min(255, max(0, round((c - k) / a + k))) for c, k in zip((r, g, b), bg)]
            px[x, y] = (*fg, round(a * 255))
    bbox = im.getbbox()
    return im.crop(bbox)


def tile_bbox(im, bg, tol=6):
    """Recorta a la zona del fondo del logotipo (la cabecera tiene otro azul alrededor)."""
    px = im.convert("RGB").load()
    w, h = im.size
    xs = [x for x in range(w) for y in range(h) if all(abs(a - b) <= tol for a, b in zip(px[x, y], bg))]
    ys = [y for y in range(h) for x in range(w) if all(abs(a - b) <= tol for a, b in zip(px[x, y], bg))]
    return (min(xs), min(ys), max(xs) + 1, max(ys) + 1)


out = sys.argv[1] if len(sys.argv) > 1 else "."
v = Image.open("captura-pie-logo-vertical.png")
color_to_alpha(v, (0, 75, 147)).save(f"{out}/logo-vertical.png", optimize=True)

hz = Image.open("captura-cabecera-logo-horizontal.png").convert("RGB")
bg = (33, 81, 113)
hz = hz.crop(tile_bbox(hz, bg))
color_to_alpha(hz, bg).save(f"{out}/logo-horizontal.png", optimize=True)
print("ok")
