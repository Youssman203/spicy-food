# Spicy Food Truck

Application monopage en français, React + Vite, Tailwind CSS et Lucide React. Conçue pour Lubumbashi et Kolwezi, avec animations CSS et prise en compte de `prefers-reduced-motion`.

## Démarrer

Prérequis : Node.js 22.12+ et npm.

```powershell
cd site/spicy-front
npm install
npm run dev
```

Sous PowerShell, utiliser `npm.cmd` si la politique d’exécution bloque `npm.ps1`.

```powershell
npm test
npm run build
npm run preview
```

La compilation produit `dist/`, prêt à héberger sur un serveur statique. `base: './'` permet un déploiement dans un sous-dossier. Le serveur de développement écoute uniquement sur 127.0.0.1 par défaut ; ajouter `-- --host 0.0.0.0` pour un test sur le réseau local.

## Structure

```text
public/
  favicon.svg
  images/                 # Références originales fournies
src/
  components/             # Navigation, sections, cartes et dialogues accessibles
  data/menu.js            # Catalogue, catégories, variantes et photos
  lib/order.js            # Prix, panier et génération du message WhatsApp
  App.jsx                 # État partagé et composition de la page
  main.jsx                # Entrée React et polices auto-hébergées
  styles.css              # Design et adaptations responsive
tests/order.test.js        # Règles métier du panier et récapitulatif
tailwind.config.js        # Palette exacte et polices ; chargé avec @config
vite.config.js
```

## Contenu et personnalisation

- Les 22 références et leurs tarifs en FC sont transcrits depuis `Presentation/IMG-20261012-WA0042.jpg`, y compris les combos. Modifier `src/data/menu.js` pour mettre la carte à jour.
- Le piment est un choix du client, proposé sur les produits salés. Aucun niveau n’est présenté comme une propriété vérifiée d’une recette.
- Le lien WhatsApp emploie `243977105688`, format international du numéro fourni `0977105688`. Le message contient la ville, les formats, le piment, les quantités, le total des articles et une note facultative. L’utilisateur doit lui-même envoyer le message dans WhatsApp.
- Le panier est conservé en mémoire pendant la visite ; recharger la page le réinitialise. Aucun backend, paiement, compte client ni collecte de données n’est ajouté.
- La confirmation de disponibilité, le retrait, la livraison et les frais sont traités avec l’équipe. Les adresses et horaires précis ne figurent pas dans les références ; les liens demandent la position du truck au lieu d’afficher une adresse inventée.
- Les photographies culinaires sont des illustrations externes Unsplash, parfois réutilisées pour une même famille de produits. Elles ne sont pas des photographies contractuelles des recettes. Remplacer chaque URL par une photographie du produit avant une mise en ligne commerciale si nécessaire. Un visuel de secours s’affiche en cas d’erreur réseau.
- La photo du truck, la carte officielle et le logo original sont locaux. La navigation associe le logo fourni, un mot-symbole typographique compact et une flamme Lucide.
- Les polices DM Sans et Barlow Condensed sont distribuées localement via `@fontsource`. Seules les photos d’illustration nécessitent Unsplash ; les actions de contact ouvrent WhatsApp ou Instagram.

## Accessibilité et validation

Navigation clavier, lien d’évitement, noms accessibles, filtres avec `aria-pressed`, annonces d’ajout, éléments de formulaire étiquetés et dialogues HTML natifs (focus contenu dans la fenêtre, Échap, restauration du focus). Animations désactivées lorsque l’utilisateur préfère un mouvement réduit.

Les tests Node vérifient la fusion du panier, les variantes, les totaux et l’encodage WhatsApp. `npm run build` vérifie la compilation de production.

Documentation des outils : [Vite](https://vite.dev/guide/) et [Tailwind avec Vite](https://tailwindcss.com/docs/installation/using-vite).
