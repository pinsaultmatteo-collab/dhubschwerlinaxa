#!/usr/bin/env python3
"""Assemble les pages de src/pages/ avec les partials de src/partials/ vers la racine du projet.

Les pages construites (index.html, patrimoine.html, ...) et le dossier assets/ sont a la
racine pour que n'importe quel hebergeur statique (Vercel, Netlify, GitHub Pages) les serve
sans configuration. Ne pas editer les .html de la racine : ils sont ecrases a chaque build.
"""
import re, pathlib
ROOT = pathlib.Path(__file__).parent
PARTIALS = {p.stem: p.read_text(encoding="utf-8") for p in (ROOT / "src/partials").glob("*.html")}
OUT = ROOT
for page in sorted((ROOT / "src/pages").glob("*.html")):
    src = page.read_text(encoding="utf-8")
    meta = {}
    m = re.match(r"\s*<!--meta(.*?)-->", src, re.S)
    if m:
        for line in m.group(1).strip().splitlines():
            k, _, v = line.partition(":")
            meta[k.strip()] = v.strip()
        src = src[m.end():]
    html = re.sub(r"\{\{>\s*(\w+)\s*\}\}", lambda mm: PARTIALS[mm.group(1)], src)
    html = re.sub(r"\{\{(\w+)\}\}", lambda mm: meta.get(mm.group(1), ""), html)
    (OUT / page.name).write_text(html.lstrip(), encoding="utf-8")
    print("built", page.name, len(html), "chars")
