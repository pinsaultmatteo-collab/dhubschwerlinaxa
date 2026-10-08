# Site David Hubschwerlin — Agent Général AXA

Site vitrine statique (HTML / CSS / JS), positionnement « L'architecte de votre patrimoine », deux pôles : **Patrimoine** et **Entreprise**.

## Structure

```
site/                  ← site prêt à héberger (ouvrir index.html ou déposer le dossier chez l'hébergeur)
  index.html           Accueil : hero blueprint, deux pôles, manifeste, chiffres, méthode 3 niveaux,
                       expertises (défilement horizontal), l'agence, parcours 1996→aujourd'hui, avis, contact
  patrimoine.html      Pôle Patrimoine : genèse, particuliers (accordéon + bento assurances + biens d'exception),
                       dirigeants (11 solutions, panneau interactif), étapes, contact
  entreprise.html      Pôle Entreprise : positionnement agent général + courtier, schéma du risque (donut interactif),
                       4 axes, 9 secteurs, méthode en 5 étapes, outil de prévention (Easy Pilote), avis, contact
  contact.html         Formulaire, coordonnées, carte, agences
  assets/css/main.css  Design system (tokens couleurs / typo / composants / responsive)
  assets/js/main.js    Animations : preloader, curseur, scroll fluide (Lenis), GSAP ScrollTrigger,
                       dessin des SVG au scroll, compteurs, section épinglée, accordéons, donut, etc.
src/                   ← sources : pages + partials (head, nav, footer, scripts)
build.py               ← assemble src/ → site/ (python3 build.py)
```

Pour modifier le header, le footer ou les scripts : éditer `src/partials/*.html` puis lancer `python3 build.py`.
Pour modifier une page : éditer `src/pages/<page>.html` puis rebuild. Ne pas éditer directement `site/*.html` (écrasé au build).

## Dépendances (CDN, aucune installation)

- Google Fonts : Instrument Serif + Manrope
- GSAP 3.12 + ScrollTrigger (cdnjs)
- Lenis 1.1 (jsdelivr)

Le site fonctionne sans JS (contenu visible, sans animations) et respecte `prefers-reduced-motion`.

## À compléter avant mise en ligne (placeholders)

- [ ] **Téléphone** : `05 61 00 00 00` (nav mobile, CTA, footer, contact)
- [ ] **Email** : `david.hubschwerlin@axa.fr` (à confirmer)
- [ ] **Adresses** : reprises de l'ancien site (10 route d'Espagne Toulouse, 23 rue Jean Jaurès Carbonne) — à valider
- [ ] **Horaires** (contact.html, CTA accueil)
- [ ] **N° ORIAS** agent général + courtage (footer, mention légale obligatoire)
- [x] **Photo portrait** de David intégrée (bloc « L'agence » de index.html) — `assets/img/david-hubschwerlin.jpg` + `.webp`
- [ ] **Photo portrait haute résolution** : le fichier fourni fait 467 × 484 px. Il est net sur mobile mais légèrement
      adouci sur grand écran et sur écran Retina. Idéalement fournir l'original en **1200 px de large minimum**,
      cadrage vertical (portrait). Remplacer les deux fichiers et régénérer le WebP :
      `cwebp -q 88 site/assets/img/david-hubschwerlin.jpg -o site/assets/img/david-hubschwerlin.webp`
- [ ] **Témoignages** : ceux de l'ancien site sont conservés / adaptés, à remplacer par de vrais avis
- [ ] **Chiffres clés** : +30 ans, +5 000 clients, +50 secteurs, 99 % (repris de l'ancien site WH)
- [ ] **Historique** : timeline 1996 → 2024 reprise de WH Assurances, dernière étape « Aujourd'hui » à valider avec David
- [ ] **Pages légales** : mentions légales + politique de confidentialité (liens `#` dans le footer)
- [ ] **Formulaire** : actuellement sans backend (affiche un message de confirmation). Brancher sur Formspree,
      Netlify Forms, ou un script PHP `mail()` selon l'hébergeur.
- [ ] **Carte** : iframe Google Maps sur l'adresse de Toulouse
- [ ] **Lien PMC** dans le footer

## Prévisualiser en local

```bash
cd site && python3 -m http.server 8000
```
puis ouvrir http://localhost:8000
