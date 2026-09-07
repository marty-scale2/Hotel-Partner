#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Erzeugt og-image.png, das Social-Preview-Bild von Hotelfreunde.
1200x630, in nativer Aufloesung, keine Browser-Screenshot-Umwege.

Wird verwendet, wenn oeffnet jemand einen Link zur Seite in einer
E-Mail, WhatsApp, LinkedIn oder Slack teilt, siehe og:image und
twitter:image in index.html.

Ausfuehren:
    python og-image-erzeugen.py
Braucht:
    pip install fonttools brotli pillow
    (fonttools + brotli nur zum Entpacken der WOFF2-Schriften in TTF,
    Pillow kann selbst kein WOFF2 lesen)

Farben, Wortmarke und Text 1:1 aus index.html uebernommen. Wenn sich
Headline, Claim oder Marke aendern, hier nachziehen statt eine neue
Vorlage zu bauen. Stand 07.09.2026: die Marke ist eine reine
Wortmarke (Fraunces, Gewicht 750, "Hotelfreunde" plus farbiger Punkt),
kein Icon mehr davor, siehe .brand .wort in index.html.
"""
import os
import tempfile
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

HIER = os.path.dirname(os.path.abspath(__file__))

W, H = 1200, 630
PAPER = (252, 250, 246)
INK = (16, 24, 28)
INK2 = (72, 84, 91)
FLAME = (244, 67, 22)
SUN = (255, 208, 74)


def woff2_zu_ttf(woff2_pfad, ziel_pfad):
    f = TTFont(woff2_pfad)
    f.flavor = None
    f.save(ziel_pfad)


def getrackte_breite(draw, text, font, tracking):
    total = 0
    for ch in text:
        total += draw.textlength(ch, font=font) + tracking
    return total - tracking


def zeichne_getrackt(draw, xy, text, font, fill, tracking=0):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking
    return x


def bauen():
    with tempfile.TemporaryDirectory() as tmp:
        archivo_ttf = os.path.join(tmp, "archivo.ttf")
        fraunces_ttf = os.path.join(tmp, "fraunces.ttf")
        woff2_zu_ttf(os.path.join(HIER, "fonts/archivo-latin.woff2"), archivo_ttf)
        woff2_zu_ttf(os.path.join(HIER, "fonts/fraunces-latin.woff2"), fraunces_ttf)

        img = Image.new("RGB", (W, H), PAPER)
        d = ImageDraw.Draw(img)

        # feine Punkt-Textur, wie im echten Seiten-Hintergrund
        dot_col = (89, 63, 35)
        for gx in range(0, W + 34, 34):
            for gy in range(0, H + 34, 34):
                for dx, dy, a in [(4.8, 6.8, 20), (27.9, 25.8, 14)]:
                    x, y = gx + dx, gy + dy
                    if 0 <= x < W and 0 <= y < H:
                        t = a / 255
                        d.ellipse(
                            [x - 1.2, y - 1.2, x + 1.2, y + 1.2],
                            fill=(
                                int(PAPER[0] * (1 - t) + dot_col[0] * t),
                                int(PAPER[1] * (1 - t) + dot_col[1] * t),
                                int(PAPER[2] * (1 - t) + dot_col[2] * t),
                            ),
                        )

        # linker Flame-Balken
        d.rectangle([64, 64, 67, H - 64], fill=FLAME)

        content_x = 110
        right_x = W - 64

        archivo_reg = ImageFont.truetype(archivo_ttf, 19)
        archivo_reg.set_variation_by_axes([400])
        archivo_bold_s = ImageFont.truetype(archivo_ttf, 17)
        archivo_bold_s.set_variation_by_axes([700])
        fraunces = ImageFont.truetype(fraunces_ttf, 80)
        fraunces.set_variation_by_axes([144, 700, 55, 0])  # Optical Size, Weight, Softness, Wonky
        fraunces_marke = ImageFont.truetype(fraunces_ttf, 42)
        fraunces_marke.set_variation_by_axes([42, 750, 55, 0])

        # Wortmarke: reine Typo wie im Topbar, kein Icon mehr davor
        # (.brand .wort in index.html: Fraunces 750, letter-spacing -.045em,
        # "Hotel" in Ink, "freunde" in Flame, Punkt in Sun).
        wy = 56
        wx = zeichne_getrackt(d, (content_x, wy), "Hotel", fraunces_marke, INK, tracking=-1.9)
        wx = zeichne_getrackt(d, (wx, wy), "freunde", fraunces_marke, FLAME, tracking=-1.9)
        d.text((wx - 1.9, wy), ".", font=fraunces_marke, fill=SUN)

        # Eyebrow
        zeichne_getrackt(
            d, (content_x, 168), "FÜR INHABERGEFÜHRTE HOTELS IM DACH-RAUM",
            archivo_bold_s, INK, tracking=3.2,
        )

        # Headline, drei Zeilen wie im echten Hero
        hy = 224
        d.text((content_x, hy), "Mehr Direktbuchungen", font=fraunces, fill=INK)
        d.text((content_x, hy + 82), "& höheren Profit", font=fraunces, fill=INK)
        d.text((content_x, hy + 164), "mit Online Marketing", font=fraunces, fill=FLAME)

        # Fusszeile
        foot_y = H - 90
        d.text((content_x, foot_y), "Digitale Systeme statt Portal-Abhängigkeit,", font=archivo_reg, fill=INK2)
        d.text((content_x, foot_y + 27), "ohne Pflicht-Werbebudget.", font=archivo_reg, fill=INK2)

        domain = "www.hotelfreunde.com"
        dwidth = getrackte_breite(d, domain, archivo_bold_s, 0.6)
        zeichne_getrackt(d, (right_x - dwidth, foot_y + 8), domain, archivo_bold_s, INK, tracking=0.6)

        ziel = os.path.join(HIER, "og-image.png")
        img.save(ziel, optimize=True)
        print("gespeichert:", ziel, img.size)


if __name__ == "__main__":
    bauen()
