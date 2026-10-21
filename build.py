#!/usr/bin/env python3
"""Assemble src/pages/**/*.html avec les partials de src/partials/ vers la racine du projet.

- Les pages construites (index.html, patrimoine.html, blog/…) et le dossier assets/ sont à la
  racine pour que n'importe quel hébergeur statique (Vercel, Netlify, GitHub Pages) les serve
  sans configuration. Ne jamais éditer les .html générés : ils sont écrasés à chaque build.
- {{> nom}} insère src/partials/nom.html ; {{cle}} insère une valeur du bloc <!--meta … --> de la
  page (ou une valeur calculée : base, read, blog_cards, related_cards, article_ld…).
- {{base}} vaut "" pour les pages de la racine et "../" pour les pages de blog/ : à utiliser
  devant tout lien ou chemin d'asset dans les partials et les articles.
- Blog : chaque fichier src/pages/blog/<slug>.html est un article ; sa méta alimente les cartes
  de blog.html et de l'accueil, le JSON-LD (BlogPosting, fil d'Ariane, FAQ) et le sitemap.
- SITE_URL : renseigner le domaine définitif (sans slash final) pour activer canonical, og:url,
  les URL absolues du JSON-LD et sitemap.xml.
"""
import re, json, pathlib, datetime

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
PAGES = SRC / "pages"
SITE_URL = ""  # ex. "https://www.david-hubschwerlin.fr"
TODAY = datetime.date.today().isoformat()
ARROW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 8h11M9 4l4 4-4 4"/></svg>'

PARTIALS = {p.stem: p.read_text(encoding="utf-8") for p in (SRC / "partials").glob("*.html")}
META_RE = re.compile(r"\s*<!--meta(.*?)-->", re.S)


def parse(page):
    src = page.read_text(encoding="utf-8")
    meta, m = {}, META_RE.match(src)
    if m:
        for line in m.group(1).strip().splitlines():
            k, _, v = line.partition(":")
            if k.strip():
                meta[k.strip()] = v.strip()
        src = src[m.end():]
    return meta, src


def expand_partials(s):
    return re.sub(r"\{\{>\s*([\w-]+)\s*\}\}", lambda m: PARTIALS[m.group(1)], s)


def strip_tags(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s)).strip()


def abs_url(path):
    return f"{SITE_URL}/{'' if path == 'index.html' else path}" if SITE_URL else None


# ---------- articles ----------
articles = []
for page in sorted((PAGES / "blog").glob("*.html")) if (PAGES / "blog").exists() else []:
    meta, body = parse(page)
    meta["slug"] = page.stem
    article_body = re.search(r'<article class="article"[^>]*>(.*?)</article>', body, re.S)
    words = len(re.findall(r"\w+", strip_tags(article_body.group(1) if article_body else body)))
    meta["words"] = words
    meta["read"] = f"{max(2, round(words / 200))} min"
    articles.append(meta)
articles.sort(key=lambda a: a["date"], reverse=True)


def card(a, base, featured=False):
    cover = PARTIALS.get("cover-" + a.get("cover", ""), "")
    return (
        f'<a class="post{" post--featured" if featured else ""}" href="{base}blog/{a["slug"]}.html" data-cat="{a["cat_slug"]}">\n'
        f'        <div class="post__cover cover"><span class="post__cat">{a["category"]}</span>{cover}</div>\n'
        f'        <div class="post__body">\n'
        f'          <div class="post__meta"><time datetime="{a["date"]}">{a["date_fr"]}</time><span>·</span><span>{a["read"]} de lecture</span></div>\n'
        f'          <h3>{a["card_title"]}</h3>\n'
        f'          <p>{a["excerpt"]}</p>\n'
        f'          <span class="link"><span>Lire l\'article</span>{ARROW}</span>\n'
        f'        </div>\n'
        f'      </a>'
    )


def faq_items(body):
    block = re.search(r'<section class="faq".*?</section>', body, re.S)
    if not block:
        return []
    qs = re.findall(r"<h3>(.*?)</h3>", block.group(0), re.S)
    ans = re.findall(r'<div class="acc__content">(.*?)</div>\s*</div>', block.group(0), re.S)
    return [(strip_tags(q), strip_tags(a)) for q, a in zip(qs, ans)]


def article_ld(a, body, url_path):
    author = {"@type": "Person", "name": "David Hubschwerlin", "jobTitle": "Agent Général AXA et courtier en assurances"}
    if SITE_URL:
        author["url"] = abs_url("agence.html")
    post = {
        "@type": "BlogPosting", "headline": a["h1"], "description": a["desc"], "inLanguage": "fr-FR",
        "datePublished": a["date"], "dateModified": a.get("updated", a["date"]), "wordCount": a["words"],
        "articleSection": a["category"], "keywords": a.get("keywords", ""), "author": author,
        "publisher": {"@type": "Organization", "name": "AXA Assurance et Banque David Hubschwerlin"},
    }
    if SITE_URL:
        post["mainEntityOfPage"] = abs_url(url_path)
    crumbs = [("Accueil", "index.html"), ("Le journal", "blog.html"), (a["card_title"], url_path)]
    breadcrumb = {"@type": "BreadcrumbList", "itemListElement": []}
    for i, (name, path) in enumerate(crumbs, 1):
        item = {"@type": "ListItem", "position": i, "name": name}
        if SITE_URL and i < 3:
            item["item"] = abs_url(path)
        breadcrumb["itemListElement"].append(item)
    graph = [post, breadcrumb]
    faq = faq_items(body)
    if faq:
        graph.append({"@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": t}} for q, t in faq]})
    return {"@context": "https://schema.org", "@graph": graph}


# ---------- rendu ----------
built = []
for page in sorted(PAGES.rglob("*.html")):
    meta, src = parse(page)
    rel = page.relative_to(PAGES)
    url_path = rel.as_posix()
    base = "../" * (len(rel.parts) - 1)
    is_article = rel.parts[0] == "blog"
    meta["base"] = base
    meta.setdefault("ogtype", "article" if is_article else "website")
    meta["canonical"] = f'<link rel="canonical" href="{abs_url(url_path)}">' if SITE_URL else ""
    meta["og_url"] = f'<meta property="og:url" content="{abs_url(url_path)}">' if SITE_URL else ""
    meta["og_article"] = ""
    if is_article:
        a = next(x for x in articles if x["slug"] == page.stem)
        for k, v in a.items():
            meta.setdefault(k, v)
        meta["og_article"] = (f'<meta property="article:published_time" content="{a["date"]}">\n'
                              f'<meta property="article:section" content="{a["category"]}">\n'
                              f'<meta property="article:author" content="David Hubschwerlin">')
        meta["cover_svg"] = PARTIALS.get("cover-" + a.get("cover", ""), "")
        meta["related_cards"] = "\n      ".join(card(x, base) for x in articles if x["slug"] != a["slug"])
        meta["article_ld"] = json.dumps(article_ld(a, src, url_path), ensure_ascii=False)
    if "{{blog_cards}}" in src:
        meta["blog_cards"] = "\n      ".join(card(x, base, featured=(i == 0)) for i, x in enumerate(articles))
    if "{{home_posts}}" in src:
        meta["home_posts"] = "\n      ".join(card(x, base) for x in articles[:3])
    html = expand_partials(src)
    html = re.sub(r"\{\{(\w+)\}\}", lambda m: meta.get(m.group(1), ""), html)
    out = ROOT / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html.lstrip(), encoding="utf-8")
    built.append((url_path, meta.get("date", TODAY), is_article))
    print("built", url_path, len(html), "chars")

# ---------- robots & sitemap ----------
(ROOT / "robots.txt").write_text("User-agent: *\nAllow: /\n" + (f"Sitemap: {SITE_URL}/sitemap.xml\n" if SITE_URL else ""), encoding="utf-8")
if SITE_URL:
    rows = []
    for path, lastmod, is_article in built:
        prio = "1.0" if path == "index.html" else ("0.7" if is_article else "0.8")
        rows.append(f"  <url><loc>{abs_url(path)}</loc><lastmod>{lastmod}</lastmod><priority>{prio}</priority></url>")
    (ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(rows) + "\n</urlset>\n", encoding="utf-8")
    print("sitemap.xml écrit")
else:
    print("SITE_URL vide : pas de canonical ni de sitemap (voir README)")
