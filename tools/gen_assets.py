#!/usr/bin/env python3
"""
Generates the site's SVG artwork into assets/.

Everything here is flat vector art, so the whole site ships with zero external
image requests. Swap any file for a real product photo of the same name and the
markup keeps working.

    python3 tools/gen_assets.py
"""

import math
import os
import random

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")

INK = "#141414"
CREAM = "#FBF3E4"

# Funky product palette. Structural red/yellow/black lives in the CSS; the
# garments are where the colour gets loud.
PAL = {
    "pink": "#FF2E93",
    "blue": "#2D7DFF",
    "lime": "#B4FF39",
    "orange": "#FF6B1A",
    "purple": "#8B2FE8",
    "cyan": "#00E5D0",
    "yellow": "#FFC72C",
    "red": "#E03127",
    "black": "#141414",
    "cream": "#FBF3E4",
}


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def wrap(body, w=600, h=600):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
        f'width="{w}" height="{h}" role="img">{body}</svg>'
    )


def write(name, svg):
    path = os.path.join(OUT, name)
    with open(path, "w") as f:
        f.write(svg)
    return path


# --------------------------------------------------------------------------
# print artwork — each returns SVG drawn inside the given box
# --------------------------------------------------------------------------

def art_checker(x, y, w, h, c1, c2):
    n = 6
    cw, ch = w / n, h / n
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c1}"/>']
    for r in range(n):
        for c in range(n):
            if (r + c) % 2:
                out.append(
                    f'<rect x="{x + c * cw:.1f}" y="{y + r * ch:.1f}" '
                    f'width="{cw:.1f}" height="{ch:.1f}" fill="{c2}"/>'
                )
    return "".join(out)


def art_smiley(x, y, w, h, c1, c2):
    cx, cy, r = x + w / 2, y + h / 2, min(w, h) / 2
    return (
        f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{c1}"/>'
        f'<ellipse cx="{cx - r * .35}" cy="{cy - r * .25}" rx="{r * .11}" ry="{r * .18}" fill="{c2}"/>'
        f'<ellipse cx="{cx + r * .35}" cy="{cy - r * .25}" rx="{r * .11}" ry="{r * .18}" fill="{c2}"/>'
        f'<path d="M {cx - r * .5} {cy + r * .18} Q {cx} {cy + r * .72} {cx + r * .5} {cy + r * .18}" '
        f'stroke="{c2}" stroke-width="{r * .16}" fill="none" stroke-linecap="round"/>'
    )


def art_flames(x, y, w, h, c1, c2):
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c1}" rx="{w*.06}"/>']
    for i in range(3):
        fx = x + w * (0.22 + i * 0.28)
        fw = w * 0.2
        out.append(
            f'<path d="M {fx} {y + h * .82} '
            f'C {fx - fw} {y + h * .55}, {fx - fw * .3} {y + h * .42}, {fx} {y + h * .16} '
            f'C {fx + fw * .3} {y + h * .42}, {fx + fw} {y + h * .55}, {fx} {y + h * .82} Z" '
            f'fill="{c2}"/>'
        )
    return "".join(out)


def art_stripes(x, y, w, h, c1, c2):
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c1}"/>']
    n = 7
    bh = h / (n * 2 - 1)
    for i in range(n):
        out.append(
            f'<rect x="{x}" y="{y + i * bh * 2:.1f}" width="{w}" height="{bh:.1f}" fill="{c2}"/>'
        )
    return "".join(out)


def art_star(x, y, w, h, c1, c2):
    cx, cy, R = x + w / 2, y + h / 2, min(w, h) / 2
    pts = []
    for i in range(10):
        rr = R if i % 2 == 0 else R * 0.42
        a = math.pi / 2 * -1 + i * math.pi / 5
        pts.append(f"{cx + rr * math.cos(a):.1f},{cy + rr * math.sin(a):.1f}")
    return (
        f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="{c1}"/>'
        f'<polygon points="{" ".join(pts)}" fill="{c2}"/>'
    )


def art_waves(x, y, w, h, c1, c2):
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c1}"/>']
    rows = 5
    for i in range(rows):
        yy = y + h * (i + 0.5) / rows
        amp = h / rows * 0.3
        d = [f"M {x} {yy:.1f}"]
        seg = w / 4
        for s in range(4):
            sx = x + seg * s
            d.append(
                f"Q {sx + seg * .25:.1f} {yy - amp:.1f} {sx + seg * .5:.1f} {yy:.1f} "
                f"Q {sx + seg * .75:.1f} {yy + amp:.1f} {sx + seg:.1f} {yy:.1f}"
            )
        out.append(
            f'<path d="{" ".join(d)}" stroke="{c2}" stroke-width="{h/rows*.3:.1f}" '
            f'fill="none" stroke-linecap="round"/>'
        )
    return "".join(out)


def art_bolt(x, y, w, h, c1, c2):
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c1}" rx="{w*.06}"/>'
        f'<path d="M {x+w*.58} {y+h*.08} L {x+w*.28} {y+h*.52} L {x+w*.48} {y+h*.52} '
        f'L {x+w*.4} {y+h*.92} L {x+w*.74} {y+h*.44} L {x+w*.53} {y+h*.44} Z" fill="{c2}"/>'
    )


def art_eye(x, y, w, h, c1, c2):
    cx, cy = x + w / 2, y + h / 2
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c1}" rx="{w*.06}"/>'
        f'<path d="M {x+w*.1} {cy} Q {cx} {y+h*.2} {x+w*.9} {cy} '
        f'Q {cx} {y+h*.8} {x+w*.1} {cy} Z" fill="{c2}"/>'
        f'<circle cx="{cx}" cy="{cy}" r="{h*.16}" fill="{c1}"/>'
        f'<circle cx="{cx+h*.05}" cy="{cy-h*.05}" r="{h*.05}" fill="{c2}"/>'
    )


def art_daisy(x, y, w, h, c1, c2):
    cx, cy, R = x + w / 2, y + h / 2, min(w, h) / 2
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c1}" rx="{w*.06}"/>']
    for i in range(8):
        a = i * math.pi / 4
        px, py = cx + R * 0.55 * math.cos(a), cy + R * 0.55 * math.sin(a)
        out.append(
            f'<ellipse cx="{px:.1f}" cy="{py:.1f}" rx="{R*.3:.1f}" ry="{R*.17:.1f}" '
            f'fill="{c2}" transform="rotate({math.degrees(a):.1f} {px:.1f} {py:.1f})"/>'
        )
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{R*.24:.1f}" fill="{c1}"/>')
    return "".join(out)


def art_spiral(x, y, w, h, c1, c2):
    cx, cy, R = x + w / 2, y + h / 2, min(w, h) / 2
    pts = []
    for i in range(140):
        t = i / 140 * 6.2 * math.pi
        rr = R * i / 140
        pts.append(f"{cx + rr*math.cos(t):.1f},{cy + rr*math.sin(t):.1f}")
    return (
        f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="{c1}"/>'
        f'<polyline points="{" ".join(pts)}" stroke="{c2}" stroke-width="{R*.14:.1f}" '
        f'fill="none" stroke-linecap="round"/>'
    )


def art_mushroom(x, y, w, h, c1, c2):
    cx = x + w / 2
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c1}" rx="{w*.06}"/>'
        f'<path d="M {x+w*.14} {y+h*.55} A {w*.36} {h*.34} 0 0 1 {x+w*.86} {y+h*.55} Z" fill="{c2}"/>'
        f'<rect x="{cx-w*.13}" y="{y+h*.54}" width="{w*.26}" height="{h*.32}" rx="{w*.07}" fill="{c2}"/>'
        f'<circle cx="{cx-w*.16}" cy="{y+h*.42}" r="{w*.06}" fill="{c1}"/>'
        f'<circle cx="{cx+w*.17}" cy="{y+h*.46}" r="{w*.05}" fill="{c1}"/>'
        f'<circle cx="{cx+w*.02}" cy="{y+h*.33}" r="{w*.045}" fill="{c1}"/>'
    )


def art_rainbow(x, y, w, h, c1, c2):
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c1}"/>']
    cx, cy = x + w / 2, y + h * 0.88
    band = h * 0.13
    for i, col in enumerate([c2, PAL["yellow"], PAL["cyan"], c2]):
        r = h * 0.78 - i * band
        if r <= 0:
            continue
        out.append(
            f'<path d="M {cx-r:.1f} {cy:.1f} A {r:.1f} {r:.1f} 0 0 1 {cx+r:.1f} {cy:.1f}" '
            f'stroke="{col}" stroke-width="{band*.8:.1f}" fill="none"/>'
        )
    return "".join(out)


def art_zigzag(x, y, w, h, c1, c2):
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c1}"/>']
    rows = 5
    for i in range(rows):
        yy = y + h * (i + 0.5) / rows
        step = w / 6
        d = [f"M {x} {yy:.1f}"]
        for s in range(6):
            d.append(f"L {x+step*(s+.5):.1f} {yy - h/rows*.3:.1f} L {x+step*(s+1):.1f} {yy:.1f}")
        out.append(
            f'<path d="{" ".join(d)}" stroke="{c2}" stroke-width="{h/rows*.26:.1f}" '
            f'fill="none" stroke-linejoin="round" stroke-linecap="round"/>'
        )
    return "".join(out)


ARTS = {
    "checker": art_checker, "smiley": art_smiley, "flames": art_flames,
    "stripes": art_stripes, "star": art_star, "waves": art_waves,
    "bolt": art_bolt, "eye": art_eye, "daisy": art_daisy,
    "spiral": art_spiral, "mushroom": art_mushroom, "rainbow": art_rainbow,
    "zigzag": art_zigzag,
}


# --------------------------------------------------------------------------
# garment / case mockups
#
# Each fit and case kind gets a genuinely different silhouette — the
# subcategory filters are only meaningful if the products look different.
# --------------------------------------------------------------------------

NECK = "M 250 108 C 262 142, 338 142, 350 108"

# fit -> (torso path, [sleeve paths], print box)
TEE_FITS = {
    "classic": (
        "M 195 130 L 250 108 C 262 142, 338 142, 350 108 L 405 130 "
        "L 396 216 L 396 492 L 204 492 L 204 216 Z",
        ["M 405 130 L 470 168 L 432 236 L 396 216 Z",
         "M 195 130 L 130 168 L 168 236 L 204 216 Z"],
        (232, 250, 136, 148),
    ),
    "oversized": (
        "M 182 132 L 250 106 C 262 142, 338 142, 350 106 L 418 132 "
        "L 410 234 L 410 504 L 190 504 L 190 234 Z",
        ["M 418 132 L 494 180 L 452 260 L 410 234 Z",
         "M 182 132 L 106 180 L 148 260 L 190 234 Z"],
        (224, 262, 152, 160),
    ),
    "crop": (
        "M 195 130 L 250 108 C 262 142, 338 142, 350 108 L 405 130 "
        "L 396 216 L 396 396 L 204 396 L 204 216 Z",
        ["M 405 130 L 470 168 L 432 236 L 396 216 Z",
         "M 195 130 L 130 168 L 168 236 L 204 216 Z"],
        (238, 244, 124, 112),
    ),
    "longsleeve": (
        "M 195 130 L 250 108 C 262 142, 338 142, 350 108 L 405 130 "
        "L 396 216 L 396 492 L 204 492 L 204 216 Z",
        ["M 405 130 L 464 156 L 512 402 L 462 420 L 398 212 Z",
         "M 195 130 L 136 156 L 88 402 L 138 420 L 202 212 Z"],
        (232, 250, 136, 148),
    ),
}


def tee(body, art_name, ink, bg=CREAM, uid="t", fit="classic"):
    torso, sleeves, (px, py, pw, ph) = TEE_FITS[fit]
    art = ARTS[art_name](px, py, pw, ph, ink, body if body != ink else CREAM)
    parts = [f'<rect width="600" height="600" fill="{bg}"/>',
             f'<defs><clipPath id="pr{uid}">'
             f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="10"/></clipPath></defs>']
    for sl in sleeves:
        parts.append(f'<path d="{sl}" fill="{body}" stroke="{INK}" stroke-width="9" '
                     f'stroke-linejoin="round"/>')
    parts.append(f'<path d="{torso}" fill="{body}" stroke="{INK}" stroke-width="9" '
                 f'stroke-linejoin="round"/>')
    parts.append(f'<path d="{NECK}" fill="none" stroke="{INK}" stroke-width="9"/>')
    parts.append(f'<g clip-path="url(#pr{uid})">{art}</g>')
    parts.append(f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="10" fill="none" '
                 f'stroke="{INK}" stroke-width="6"/>')
    if fit == "crop":
        parts.append('<path d="M 204 380 L 396 380" stroke="%s" stroke-width="5" opacity=".45"/>' % INK)
    else:
        hem = 504 if fit == "oversized" else 492
        parts.append(f'<path d="M 204 {hem-22} L 396 {hem-22}" stroke="{INK}" '
                     f'stroke-width="5" opacity=".45"/>')
    if fit == "longsleeve":
        parts.append(f'<path d="M 466 410 L 508 396" stroke="{INK}" stroke-width="7"/>')
        parts.append(f'<path d="M 134 410 L 92 396" stroke="{INK}" stroke-width="7"/>')
    return wrap("".join(parts))


# MagSafe needs headroom under the graphic for the ring, so its print box is
# shorter than the others rather than having the ring sit on top of the art.
CASE_PRINT = {
    "slim":    (206, 236, 188, 254),
    "tough":   (208, 240, 184, 246),
    "clear":   (206, 236, 188, 254),
    "magsafe": (206, 232, 188, 176),
}


def case(body, art_name, ink, bg=CREAM, uid="c", kind="slim"):
    px, py, pw, ph = CASE_PRINT[kind]
    art = ARTS[art_name](px, py, pw, ph, ink, body if body != ink else CREAM)
    out = [f'<rect width="600" height="600" fill="{bg}"/>',
           f'<defs><clipPath id="pc{uid}">'
           f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="16"/></clipPath></defs>']

    if kind == "tough":
        # chunky outer shell with reinforced corners
        out.append(f'<rect x="176" y="74" width="248" height="452" rx="54" fill="{INK}"/>')
        out.append(f'<rect x="188" y="86" width="224" height="428" rx="46" fill="{body}" '
                   f'stroke="{INK}" stroke-width="9"/>')
        for cx, cy in [(206, 104), (394, 104), (206, 496), (394, 496)]:
            out.append(f'<circle cx="{cx}" cy="{cy}" r="15" fill="{INK}" opacity=".85"/>')
    elif kind == "clear":
        # translucent shell over a mid-grey handset — a dark phone underneath
        # dragged every colourway towards mud.
        out.append(f'<rect x="200" y="96" width="200" height="408" rx="38" fill="#8A8A8A"/>')
        out.append(f'<rect x="200" y="96" width="200" height="408" rx="38" fill="{CREAM}" '
                   f'fill-opacity=".35"/>')
        out.append(f'<rect x="190" y="86" width="220" height="428" rx="46" fill="{body}" '
                   f'fill-opacity=".5" stroke="{INK}" stroke-width="9"/>')
    else:
        out.append(f'<rect x="190" y="86" width="220" height="428" rx="46" fill="{body}" '
                   f'stroke="{INK}" stroke-width="9"/>')

    out.append(f'<g clip-path="url(#pc{uid})">{art}</g>')
    out.append(f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="16" fill="none" '
               f'stroke="{INK}" stroke-width="6"/>')

    if kind == "magsafe":
        out.append(f'<circle cx="300" cy="452" r="56" fill="none" stroke="{INK}" '
                   f'stroke-width="8" opacity=".9"/>')
        out.append(f'<circle cx="300" cy="452" r="38" fill="none" stroke="{INK}" '
                   f'stroke-width="5" opacity=".5"/>')

    # camera island + side buttons, shared by every kind
    out.append(f'<rect x="212" y="110" width="104" height="104" rx="28" fill="{INK}" opacity=".92"/>')
    for cx, cy in [(243, 141), (286, 141), (243, 184)]:
        out.append(f'<circle cx="{cx}" cy="{cy}" r="17" fill="{CREAM}"/>'
                   f'<circle cx="{cx}" cy="{cy}" r="8" fill="{INK}"/>')
    out.append(f'<rect x="418" y="180" width="10" height="46" rx="5" fill="{INK}"/>')
    out.append(f'<rect x="418" y="240" width="10" height="72" rx="5" fill="{INK}"/>')
    return wrap("".join(out))


# --------------------------------------------------------------------------
# poster panels — stand-ins for photography, deliberately graphic
# --------------------------------------------------------------------------

def poster(lines, bg, fg, accent, w=800, h=600, seed=1, kicker=None):
    rnd = random.Random(seed)
    out = [f'<rect width="{w}" height="{h}" fill="{bg}"/>']
    for _ in range(7):
        s = rnd.randint(40, 130)
        x, y = rnd.randint(-30, w - 40), rnd.randint(-30, h - 40)
        kind = rnd.choice(["c", "r", "t"])
        col = rnd.choice([accent, fg])
        op = round(rnd.uniform(0.12, 0.3), 2)
        if kind == "c":
            out.append(f'<circle cx="{x}" cy="{y}" r="{s//2}" fill="{col}" opacity="{op}"/>')
        elif kind == "r":
            out.append(
                f'<rect x="{x}" y="{y}" width="{s}" height="{s}" rx="{s//6}" fill="{col}" '
                f'opacity="{op}" transform="rotate({rnd.randint(-30,30)} {x+s//2} {y+s//2})"/>'
            )
        else:
            out.append(
                f'<polygon points="{x},{y+s} {x+s//2},{y} {x+s},{y+s}" fill="{col}" opacity="{op}"/>'
            )

    n = len(lines)
    size = min(96, int(h * 0.9 / max(n, 1) * 0.62))
    total = size * 1.06 * n
    top = (h - total) / 2 + size * 0.82
    if kicker:
        out.append(
            f'<text x="{w/2}" y="{top - size*1.05:.0f}" text-anchor="middle" fill="{accent}" '
            f'font-family="DM Sans, Helvetica, Arial, sans-serif" font-size="{max(15,int(size*.3))}" '
            f'font-weight="700" letter-spacing="4">{esc(kicker.upper())}</text>'
        )
    for i, ln in enumerate(lines):
        out.append(
            f'<text x="{w/2}" y="{top + i*size*1.06:.0f}" text-anchor="middle" fill="{fg}" '
            f'font-family="Archivo Black, Impact, Haettenschweiler, sans-serif" '
            f'font-size="{size}" letter-spacing="-1">{esc(ln.upper())}</text>'
        )
    return wrap("".join(out), w, h)


def badge(label, w=240, h=90):
    return wrap(
        f'<rect width="{w}" height="{h}" fill="none"/>'
        f'<text x="{w/2}" y="{h/2+11}" text-anchor="middle" fill="{INK}" '
        f'font-family="Archivo Black, Impact, sans-serif" font-size="30" '
        f'letter-spacing="1">{esc(label.upper())}</text>',
        w, h,
    )


def avatar(initials, bg, fg=CREAM, s=120):
    return wrap(
        f'<rect width="{s}" height="{s}" rx="{s//2}" fill="{bg}"/>'
        f'<text x="{s/2}" y="{s/2+15}" text-anchor="middle" fill="{fg}" '
        f'font-family="Archivo Black, Impact, sans-serif" font-size="42">{esc(initials)}</text>',
        s, s,
    )


# --------------------------------------------------------------------------

# (slug, kind, art, variant, colourways[(name, hex, ink)])
# variant is a tee fit or a case kind — it drives the silhouette.
P = PAL
CATALOG = [
    # ---- oversized tees ----
    ("cosmic-checker",  "tee", "checker",  "oversized", [("pink", P["pink"], INK), ("blue", P["blue"], P["lime"]), ("black", P["black"], P["cyan"])]),
    ("acid-smiley",     "tee", "smiley",   "oversized", [("lime", P["lime"], INK), ("purple", P["purple"], P["yellow"]), ("cream", P["cream"], P["pink"])]),
    ("hot-flames",      "tee", "flames",   "oversized", [("orange", P["orange"], INK), ("black", P["black"], P["orange"]), ("red", P["red"], P["yellow"])]),
    ("supernova",       "tee", "star",     "oversized", [("purple", P["purple"], P["lime"]), ("red", P["red"], P["cream"]), ("blue", P["blue"], P["yellow"])]),
    ("hypnotica",       "tee", "spiral",   "oversized", [("black", P["black"], P["cream"]), ("red", P["red"], P["cream"]), ("cyan", P["cyan"], INK)]),
    ("third-eye",       "tee", "eye",      "oversized", [("purple", P["purple"], P["cream"]), ("cream", P["cream"], P["purple"]), ("black", P["black"], P["lime"])]),
    # ---- classic fit tees ----
    ("sunset-stripe",   "tee", "stripes",  "classic",   [("yellow", P["yellow"], P["red"]), ("cyan", P["cyan"], P["purple"]), ("cream", P["cream"], P["blue"])]),
    ("tidal",           "tee", "waves",    "classic",   [("cyan", P["cyan"], INK), ("blue", P["blue"], P["cream"]), ("lime", P["lime"], P["purple"])]),
    ("high-voltage",    "tee", "bolt",     "classic",   [("black", P["black"], P["yellow"]), ("yellow", P["yellow"], INK), ("pink", P["pink"], P["cyan"])]),
    ("shroom-boom",     "tee", "mushroom", "classic",   [("lime", P["lime"], P["red"]), ("cream", P["cream"], P["purple"]), ("blue", P["blue"], P["orange"])]),
    ("double-rainbow",  "tee", "rainbow",  "classic",   [("blue", P["blue"], P["cream"]), ("cream", P["cream"], P["pink"]), ("black", P["black"], P["yellow"])]),
    # ---- crop tees ----
    ("daisy-crop",      "tee", "daisy",    "crop",      [("cream", P["cream"], P["orange"]), ("pink", P["pink"], P["yellow"]), ("lime", P["lime"], P["red"])]),
    ("checker-crop",    "tee", "checker",  "crop",      [("cyan", P["cyan"], INK), ("black", P["black"], P["pink"]), ("yellow", P["yellow"], P["purple"])]),
    ("smiley-crop",     "tee", "smiley",   "crop",      [("purple", P["purple"], P["lime"]), ("orange", P["orange"], INK), ("cream", P["cream"], P["red"])]),
    ("zigzag-crop",     "tee", "zigzag",   "crop",      [("pink", P["pink"], P["cream"]), ("lime", P["lime"], P["blue"]), ("blue", P["blue"], P["yellow"])]),
    # ---- full sleeve tees ----
    ("bolt-sleeve",     "tee", "bolt",     "longsleeve",[("black", P["black"], P["yellow"]), ("blue", P["blue"], P["cream"]), ("red", P["red"], P["cream"])]),
    ("spiral-sleeve",   "tee", "spiral",   "longsleeve",[("cream", P["cream"], P["purple"]), ("purple", P["purple"], P["cream"]), ("black", P["black"], P["cyan"])]),
    ("wave-sleeve",     "tee", "waves",    "longsleeve",[("blue", P["blue"], P["cream"]), ("cyan", P["cyan"], INK), ("lime", P["lime"], P["purple"])]),

    # ---- tough cases ----
    ("checker-tough",   "case", "checker", "tough",     [("pink", P["pink"], INK), ("lime", P["lime"], INK), ("black", P["black"], P["cyan"])]),
    ("flame-tough",     "case", "flames",  "tough",     [("black", P["black"], P["orange"]), ("orange", P["orange"], INK), ("red", P["red"], P["yellow"])]),
    ("bolt-tough",      "case", "bolt",    "tough",     [("yellow", P["yellow"], INK), ("black", P["black"], P["yellow"]), ("blue", P["blue"], P["cream"])]),
    ("star-tough",      "case", "star",    "tough",     [("purple", P["purple"], P["lime"]), ("red", P["red"], P["cream"]), ("cyan", P["cyan"], INK)]),
    # ---- slim cases ----
    ("smiley-slim",     "case", "smiley",  "slim",      [("yellow", P["yellow"], INK), ("purple", P["purple"], P["yellow"]), ("cyan", P["cyan"], INK)]),
    ("zigzag-slim",     "case", "zigzag",  "slim",      [("cream", P["cream"], P["blue"]), ("pink", P["pink"], P["cream"]), ("lime", P["lime"], P["purple"])]),
    ("wave-slim",       "case", "waves",   "slim",      [("cyan", P["cyan"], INK), ("blue", P["blue"], P["cream"]), ("purple", P["purple"], P["lime"])]),
    ("daisy-slim",      "case", "daisy",   "slim",      [("cream", P["cream"], P["orange"]), ("pink", P["pink"], P["lime"]), ("lime", P["lime"], P["red"])]),
    # ---- clear cases ----
    ("mushroom-clear",  "case", "mushroom","clear",     [("cream", P["cream"], P["lime"]), ("cyan", P["cyan"], P["purple"]), ("pink", P["pink"], P["red"])]),
    ("daisy-clear",     "case", "daisy",   "clear",     [("cream", P["cream"], P["pink"]), ("lime", P["lime"], P["orange"]), ("blue", P["blue"], P["yellow"])]),
    ("eye-clear",       "case", "eye",     "clear",     [("cream", P["cream"], P["purple"]), ("cyan", P["cyan"], INK), ("yellow", P["yellow"], P["red"])]),
    # ---- magsafe cases ----
    ("spiral-mag",      "case", "spiral",  "magsafe",   [("purple", P["purple"], P["cream"]), ("red", P["red"], P["cream"]), ("black", P["black"], P["pink"])]),
    ("rainbow-mag",     "case", "rainbow", "magsafe",   [("blue", P["blue"], P["cream"]), ("black", P["black"], P["yellow"]), ("cream", P["cream"], P["pink"])]),
    ("stripe-mag",      "case", "stripes", "magsafe",   [("yellow", P["yellow"], P["red"]), ("pink", P["pink"], P["cream"]), ("black", P["black"], P["lime"])]),
]

POSTERS = [
    ("story-1.svg",  ["Cotton", "From Tiruppur"], P["red"],    CREAM,      P["yellow"], "the blanks"),
    ("story-2.svg",  ["Screen", "Printed"],       P["yellow"], INK,        P["red"],    "by hand"),
    ("story-3.svg",  ["Small", "Batch"],          P["blue"],   CREAM,      P["lime"],   "no reprints"),
    ("story-4.svg",  ["Packed", "In Bengaluru"],  P["pink"],   CREAM,      P["yellow"], "shipped fast"),
    ("cat-tees.svg", ["Tees"],                    P["red"],    CREAM,      P["yellow"], "18 designs"),
    ("cat-cases.svg",["Cases"],                   P["blue"],   CREAM,      P["lime"],   "14 designs"),
    ("look-1.svg",   ["Loud"],                    P["purple"], P["lime"],  P["yellow"], None),
    ("look-2.svg",   ["Proud"],                   P["orange"], INK,        P["cream"],  None),
    ("look-3.svg",   ["Never", "Basic"],          P["cyan"],   INK,        P["red"],    None),
    ("look-4.svg",   ["Wear", "It Loud"],         INK,         P["yellow"],P["pink"],   None),
    ("look-5.svg",   ["Colour", "Riot"],          P["lime"],   INK,        P["purple"], None),
    ("look-6.svg",   ["Own It"],                  P["pink"],   CREAM,      P["cyan"],   None),
    ("drop.svg",     ["Drop", "007"],             P["yellow"], INK,        P["red"],    "out now"),
]

RETAILERS = ["Myntra", "Ajio", "Nykaa Fashion", "Tata CLiQ", "Amazon.in"]

REVIEWERS = [
    ("AS", P["pink"]), ("RK", P["blue"]), ("PN", P["lime"]),
    ("MD", P["purple"]), ("SI", P["orange"]), ("KV", P["cyan"]),
]


def main():
    os.makedirs(OUT, exist_ok=True)
    n = 0

    for slug, kind, art, variant, ways in CATALOG:
        for cname, chex, cink in ways:
            uid = f"{slug}{cname}".replace("-", "")
            svg = (tee(chex, art, cink, CREAM, uid, variant) if kind == "tee"
                   else case(chex, art, cink, CREAM, uid, variant))
            write(f"{slug}--{cname}.svg", svg)
            n += 1

    for name, lines, bg, fg, accent, kicker in POSTERS:
        write(name, poster(lines, bg, fg, accent, seed=sum(map(ord, name)), kicker=kicker))
        n += 1

    for r in RETAILERS:
        write("retailer-" + r.lower().replace(" ", "-").replace(".", "-") + ".svg", badge(r))
        n += 1

    for ini, col in REVIEWERS:
        write(f"avatar-{ini.lower()}.svg", avatar(ini, col))
        n += 1

    print(f"wrote {n} svg files to {OUT}")


if __name__ == "__main__":
    main()
