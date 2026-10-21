# Site David Hubschwerlin — Agent Général AXA

Site vitrine statique (HTML / CSS / JS), positionnement « L'architecte de votre patrimoine » et « assureur partenaire, pas assureur sinistre ». Trois pôles : **Patrimoine**, **Entreprise** et **Particuliers**.

## Structure

Les pages construites sont **à la racine du dépôt**, pour que n'importe quel hébergeur statique
(Vercel, Netlify, GitHub Pages, Cloudflare Pages) les serve sans configuration.

```
index.html           Accueil : hero photo + blueprint, trois pôles, accompagnement 360° (anneau interactif),
                     manifeste, chiffres, méthode 3 niveaux, expertises (défilement horizontal), l'agence,
                     frise 2012→aujourd'hui animée au scroll, avis (carrousel + lien Google), contact
agence.html          L'agence : portrait et bio, 4 principes, agent général vs courtier, frise verticale animée,
                     chiffres, infos pratiques (adresse, horaires, avis Google)
patrimoine.html      Pôle Patrimoine : genèse, solutions particuliers (accordéon), renvoi vers le pôle Particuliers,
                     dirigeants (11 solutions, panneau interactif), étapes, contact
entreprise.html      Pôle Entreprise : positionnement assureur partenaire, schéma du risque (donut interactif),
                     chaîne prévention → sinistralité → cotisations → rentabilité, 4 axes illustrés, 9 secteurs dépliables
                     avec exemples d'activités (transport : marchandises / voyageurs), méthode 5 étapes,
                     outil de prévention (Easy Pilote), avis, contact
particuliers.html    Pôle Particuliers : approche, 6 assurances du quotidien (bento) + biens d'exception,
                     étapes, avis, contact
contact.html         Formulaire, coordonnées, carte (32 av. Pasteur, Cazères), rendez-vous à domicile
blog.html            Le journal : filtres par pôle, cartes d'articles (générées par build.py)
blog/<slug>.html     Articles : hero + illustration, sommaire collant, barre de lecture, tableaux, « À retenir »,
                     FAQ dépliable, encadré auteur, articles liés. JSON-LD BlogPosting + fil d'Ariane + FAQPage
robots.txt           Généré par build.py (sitemap.xml aussi, dès que SITE_URL est renseigné)
assets/css/main.css  Design system (tokens couleurs / typo / composants / responsive)
assets/js/main.js    Animations : preloader, curseur, scroll fluide (Lenis), GSAP ScrollTrigger,
                     dessin des SVG au scroll, compteurs, section épinglée, accordéons, donut, etc.
assets/img/          Portrait, favicon
src/                 ← SOURCES : pages (dont pages/blog/) + partials (head, nav, footer, scripts,
                     article-head, article-foot, cover-*)
build.py             ← assemble src/ → racine (python3 build.py)
vercel.json          Configuration Vercel (pas de build, en-têtes de cache et de sécurité)
```

Pour modifier le header, le footer ou les scripts : éditer `src/partials/*.html` puis lancer `python3 build.py`.
Pour modifier une page : éditer `src/pages/<page>.html` puis rebuild.

> **Ne jamais éditer directement les `.html` de la racine** : ils sont régénérés et écrasés à chaque build.

### Ajouter un article de blog

1. Créer `src/pages/blog/<slug>.html` en copiant un article existant. Le bloc `<!--meta … -->` en tête
   alimente tout le reste : `title` (balise title, ≤ 62 caractères), `desc` (meta description, ≤ 160),
   `h1`, `card_title` (titre court des cartes), `chapo`, `excerpt`, `category` + `cat_slug`
   (patrimoine / entreprise / particuliers), `date` (AAAA-MM-JJ) + `date_fr`, `cover` (nom d'une
   illustration `src/partials/cover-<nom>.html`), `keywords`.
2. Rédiger le contenu dans `<article class="article">` : des `<h2 id="…">` (ils forment le sommaire),
   un encadré `.callout`, une `<section class="faq">` (ses questions sont reprises en JSON-LD FAQPage),
   un `.article__cta`. Utiliser `{{base}}` devant les liens internes (`{{base}}contact.html`).
3. Lancer `python3 build.py` : la carte apparaît automatiquement sur blog.html, sur l'accueil (3 derniers)
   et dans « À lire aussi » des autres articles ; le temps de lecture est calculé.

### Avant la mise en ligne : SITE_URL

Dans `build.py`, renseigner `SITE_URL = "https://www.votre-domaine.fr"` (sans slash final) puis rebuild :
cela active les balises canonical, og:url, les URL absolues du JSON-LD et génère `sitemap.xml`.

## Dépendances (CDN, aucune installation)

- Google Fonts : Instrument Serif + Manrope
- GSAP 3.12 + ScrollTrigger (cdnjs)
- Lenis 1.1 (jsdelivr)

Le site fonctionne sans JS (contenu visible, sans animations) et respecte `prefers-reduced-motion`.

## À compléter avant mise en ligne (placeholders)

- [x] **Téléphone** : `05 31 61 42 80` (fiche Google de l'agence)
- [ ] **Email** : `david.hubschwerlin@axa.fr` (à confirmer)
- [x] **Adresse** : 32 avenue Pasteur, Local n°5, 31220 Cazères (fiche Google). Les anciennes adresses WH ont été retirées
- [ ] **Horaires** : « 9h30 – 12h30 / 14h – 18h » (ouverture 9h30 d'après Google, fermeture à confirmer)
- [ ] **Photo du hero (accueil)** : façade classique illuminée, Unsplash (licence libre, photo-1763142106308-07cc683cecfd),
      chargée depuis le CDN Unsplash. Pour la production : télécharger le fichier dans `assets/img/hero.jpg`
      (ou remplacer par une vraie photo de l'agence / de Toulouse) et mettre à jour `src/pages/index.html`
- [ ] **Bloc avis** : note 4,2 et 21 avis saisis en dur (fiche Google au 19/10/2026) ; les 6 avis de chaque carrousel sont des
      placeholders à remplacer par de vrais avis Google. Le lien ouvre la fiche via une recherche Maps
- [ ] **N° ORIAS** agent général + courtage (footer, mention légale obligatoire)
- [x] **Photo portrait** de David intégrée (bloc « L'agence » de index.html) — `assets/img/david-hubschwerlin.jpg` + `.webp`
- [ ] **Photo portrait haute résolution** : le fichier fourni fait 467 × 484 px. Il est net sur mobile mais légèrement
      adouci sur grand écran et sur écran Retina. Idéalement fournir l'original en **1200 px de large minimum**,
      cadrage vertical (portrait). Remplacer les deux fichiers et régénérer le WebP :
      `cwebp -q 88 assets/img/david-hubschwerlin.jpg -o assets/img/david-hubschwerlin.webp`
- [ ] **Témoignages** : voir « Bloc avis » ci-dessus
- [x] **Chiffres clés** validés par David le 18/10/2026 : +1 500 clients, 94 % de satisfaction. Restent +30 ans d'expérience
      et +50 secteurs (repris de l'ancien site) : à confirmer, sachant que l'activité d'agent général date de 2012
- [x] **Historique** : « depuis 2012 » partout (corrigé le 18/10/2026). Timeline 2012 → 2015 → 2021 → 2024 → aujourd'hui,
      les étapes 2015/2021/2024 viennent de l'historique WH : à confirmer
- [ ] **Exemples d'activités** (entreprise.html, 9 secteurs dépliables) : listes rédigées d'après le métier, à relire par David
- [ ] **Pages légales** : mentions légales + politique de confidentialité (liens `#` dans le footer)
- [ ] **Formulaire** : actuellement sans backend (affiche un message de confirmation). Brancher sur Formspree,
      Netlify Forms, ou un script PHP `mail()` selon l'hébergeur.
- [x] **Carte** : iframe Google Maps sur l'adresse de Cazères
- [ ] **SITE_URL** dans `build.py` (canonical, og:url, sitemap.xml) : à renseigner dès que le domaine est connu
- [ ] **Articles de blog** : 4 articles rédigés (Dutreil, sinistralité flotte, assurance emprunteur, assurance vie / PER).
      Les règles fiscales et légales citées sont celles connues à la rédaction : à faire relire par David avant publication
- [x] **Crédit PMC Marketing** en bas du footer : « Site conçu par » + logo (`assets/img/pmc-marketing.png` / `.webp`),
      lien vers https://www.agence-pmc-marketing.com/

## Prévisualiser en local

```bash
python3 -m http.server 8000
```
puis ouvrir http://localhost:8000

## Déploiement

Site 100 % statique : aucune étape de build côté hébergeur, aucune dépendance à installer.

**Vercel** — importer le dépôt GitHub puis laisser les réglages par défaut :

| Réglage           | Valeur       |
| ----------------- | ------------ |
| Framework Preset  | Other        |
| Root Directory    | `./`         |
| Build Command     | *(vide)*     |
| Output Directory  | *(vide)*     |
| Install Command   | *(vide)*     |

Si un déploiement renvoie « page doesn't exist », c'est que le *Root Directory* du projet Vercel ne
pointe pas sur la racine du dépôt : le corriger dans Settings → General, puis relancer un déploiement.

**GitHub Pages** — Settings → Pages → Source : `Deploy from a branch`, branche `main`, dossier `/ (root)`.
