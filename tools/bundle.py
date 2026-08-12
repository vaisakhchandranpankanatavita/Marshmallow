#!/usr/bin/env python3
"""
Flattens the multi-file site into one self-contained HTML page.

Used to produce a shareable preview: CSS, JS and all 84 SVGs are inlined, so
the result renders with zero network requests. The real site stays multi-file —
this is an export, not the source of truth.

    python3 tools/bundle.py [outfile]
"""

import base64
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "preview.html")

read = lambda *p: open(os.path.join(ROOT, *p), encoding="utf-8").read()


def data_uri(path):
    raw = open(path, "rb").read()
    return "data:image/svg+xml;base64," + base64.b64encode(raw).decode("ascii")


def main():
    html = read("index.html")

    # --- asset map -------------------------------------------------------
    assets_dir = os.path.join(ROOT, "assets")
    assets = {
        f"assets/{name}": data_uri(os.path.join(assets_dir, name))
        for name in sorted(os.listdir(assets_dir))
        if name.endswith(".svg")
    }

    # --- strip the document shell; the artifact host supplies it ----------
    html = re.sub(r"(?is)^.*?<head[^>]*>", "", html)
    html = re.sub(r"(?is)</head>\s*<body[^>]*>", "", html)
    html = re.sub(r"(?is)</body>\s*</html>\s*$", "", html)

    # --- drop anything that would hit the network ------------------------
    # The artifact CSP blocks external hosts outright, so a webfont <link>
    # would fail silently and only add a render delay.
    html = re.sub(r'(?i)\s*<link[^>]*rel="(?:preconnect|icon)"[^>]*>\s*', "\n", html)
    html = re.sub(r'(?i)\s*<link[^>]*fonts\.googleapis[^>]*>\s*', "\n", html)

    # --- inline the stylesheet -------------------------------------------
    html = html.replace(
        '<link rel="stylesheet" href="css/styles.css">',
        "<style>\n" + read("css", "styles.css") + "\n</style>",
    )

    # --- single-page: cross-page links become in-page anchors ------------
    # index.html already carries the full catalog and FAQ, so nothing is lost.
    html = html.replace('href="shop.html#grid"', 'href="#grid"')
    html = html.replace('href="shop.html"', 'href="#grid"')
    html = html.replace('href="about.html#sustainability"', 'href="#story"')
    html = html.replace('href="about.html"', 'href="#story"')
    html = html.replace('href="index.html#', 'href="#')
    html = html.replace('href="index.html"', 'href="#top"')

    # --- inline the scripts ----------------------------------------------
    for name in ("products.js", "store.js", "cart.js", "auth.js", "main.js", "scroll.js"):
        src = read("js", name)
        if name == "products.js":
            # PRODUCT_IMAGE builds "assets/<slug>--<colour>.svg" at runtime, so
            # static replacement cannot reach it — route it through the map.
            src += (
                "\n\n/* bundled: resolve artwork paths through the inlined map */\n"
                "window.PRODUCT_IMAGE = function (product, colorway) {\n"
                "  var key = 'assets/' + product.slug + '--' +\n"
                "            (colorway || product.colorways[0]) + '.svg';\n"
                "  return (window.ASSET_MAP && window.ASSET_MAP[key]) || key;\n"
                "};\n"
            )
        if name == "main.js":
            # Review avatars are built from a template literal, so they need the
            # same map lookup as the product artwork.
            src = src.replace(
                'src="assets/avatar-${r.initials}.svg"',
                'src="${window.ASSET_MAP[`assets/avatar-${r.initials}.svg`]'
                ' || `assets/avatar-${r.initials}.svg`}"',
            )
        html = html.replace(
            f'<script src="js/{name}"></script>',
            "<script>\n" + src + "\n</script>",
        )

    # --- swap static asset references ------------------------------------
    for path, uri in assets.items():
        html = html.replace(f'"{path}"', f'"{uri}"')

    # --- expose the map to the runtime -----------------------------------
    # It goes immediately before the first inlined script, NOT at the top of the
    # document. The map is ~400KB; putting it first would push both the <title>
    # past the host's 8KB scan and the charset declaration past the 1024 bytes a
    # browser reads when sniffing the encoding — which decodes every ₹, ★ and →
    # as mojibake.
    entries = ",\n".join(f'  {k!r}: {v!r}' for k, v in assets.items())
    asset_script = "<script>\nwindow.ASSET_MAP = {\n" + entries + "\n};\n</script>\n"
    first_script = html.find("<script>")
    if first_script == -1:
        raise SystemExit("bundle: no inlined <script> found to anchor the asset map")
    html = html[:first_script] + asset_script + html[first_script:]

    # Hoist the title, then declare the charset ahead of everything. The host
    # supplies its own <head>, so this <meta> lands in the body — but the
    # encoding sniffer scans the first 1024 bytes of the document regardless of
    # where the tag sits, so being first is what makes it work.
    m = re.search(r"(?is)<title>.*?</title>", html)
    if m:
        html = m.group(0) + "\n" + html.replace(m.group(0), "", 1)

    html = '<meta charset="utf-8">\n<a id="top"></a>\n' + html

    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)

    kb = os.path.getsize(OUT) / 1024
    leftover = re.findall(r'"(?:assets|css|js)/[^"]+"', html)
    print(f"wrote {OUT}  ({kb:.0f} KB, {len(assets)} assets inlined)")
    print(f"unresolved local refs: {sorted(set(leftover)) or 'none'}")


if __name__ == "__main__":
    main()
