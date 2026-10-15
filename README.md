# Spicy Food Truck — V2.2

Monorepo React / Tailwind / Express / PostgreSQL pour **spicy-drc.tech**. Toutes les commandes ci-dessous se lancent depuis `site/`, sauf mention contraire. Node.js 24 et npm sont requis en développement ; Docker Engine et Compose sont requis sur le VPS Linux.

**Pour installer la version actuelle : [Guide simple de production V2.2](DEPLOIEMENT-PRODUCTION.md).** Il couvre la première installation, la mise à jour, les accès permanents, la récupération et les sauvegardes. Utiliser l’archive `spicy-v2.2.0.tar.gz` et `.env.production.example`. Le script `sh deploy/init-env.sh` crée les secrets de la première installation sans écraser une configuration existante.

La super administration propose maintenant le CRUD des administrateurs **et** super administrateurs : rôle, nom, email, désactivation/réactivation et remplacement de mot de passe. « Mon compte » permet à chacun de modifier son propre mot de passe. Les mots de passe choisis sont permanents, stockés uniquement sous forme d’empreinte scrypt et ne sont jamais relus par le site. Conserver les accès dans un gestionnaire de mots de passe. En cas d’oubli, utiliser Équipe ou la commande serveur `reset-admin-password.js` décrite dans le guide. Voir [Validation V2.2](VALIDATION-V2.2.md).

| Dossier | Rôle | URL de production |
|---|---|---|
| `spicy-front/` | Vitrine, menu et contacts dynamiques, panier et commande | `/` |
| `spicy-admin/` | Commandes, CRUD menu, CRM clients | `/admin/` |
| `spicy-supadmin/` | Fonctions admin, paramètres, comptes de l’équipe | `/superadmin/` |
| `spicy-back/` | API Express, sessions JWT, validation, transactions | `/api/` |
| `spicy-data/` | Migrations SQL, seed officiel, PostgreSQL | Aucun accès HTTP |

La V2 conserve les 22 produits et les portions Standard / XL / Méga de la V1, en francs congolais. Les catégories SQL sont `tacos`, `sandwichs`, `combos`, `boissons` ; `combos` regroupe les plats, accompagnements et formules. La typographie devient **Oswald / Inter**, chargée localement, avec les couleurs officielles. Les images de plats sont illustratives, les références et le logo restent conservés.

## Nouveautés V2.1

Inscription client directe avec prénom, nom et numéro WhatsApp, sans mot de passe ni vérification OTP. Session de 30 jours sur le navigateur, suivi privé des commandes en direct, statuts colorés, TikTok et uploads de photos. Aucun fournisseur SMS à configurer. Le numéro seul ne permet pas de récupérer un espace sur un autre appareil ou après déconnexion : une nouvelle inscription crée un profil distinct. Lire le guide [Mise à jour V2.1](MISE-A-JOUR-V2.1.md), notamment la migration `003_customer_without_otp.sql`, avant de mettre à jour le serveur.

## Installation et aperçu rapide

```sh
npm ci
npm test
npm run build
npm run demo
```

L’aperçu est disponible sur `http://127.0.0.1:4173`. Il utilise l’API réelle et PostgreSQL embarqué (PGlite) avec une base **jetable en mémoire**, réservée à la revue locale. Les emails `admin@spicy.test` et `super@spicy.test`, ainsi qu’un mot de passe aléatoire commun, sont affichés dans le terminal. Les données et comptes disparaissent à l’arrêt. Aucun de ces comptes n’est installé en production. Arrêt : `Ctrl+C`.

### Accéder aux interfaces de démonstration

**Accès conseillé : sans mot de passe.** Après avoir lancé la démo, ouvrir **http://127.0.0.1:4173/demo/** et choisir **Tester l’interface admin** ou **Tester l’interface super admin**. Cette page ouvre une vraie session sur la base jetable. Elle est servie directement par le script de démo, même si les interfaces ont été compilées avant ce correctif. Les boutons sont également proposés sur les pages de connexion après recompilation.

Pour préparer et lancer les trois interfaces avec une seule commande, depuis `site/` :

```powershell
npm.cmd run demo:ready
```

Cette commande compile puis lance la démo locale ; elle ne démarre pas les serveurs de développement et ne nécessite ni Docker, ni PostgreSQL installé, ni compte SMS. Si les interfaces sont déjà compilées, `npm.cmd run demo` suffit. Si les dépendances ne sont pas encore installées, exécuter d’abord `npm.cmd ci`.

Sous Windows, vous pouvez aussi **double-cliquer sur `site/DEMO.cmd`** : il lance la préparation et la démo depuis le bon dossier. Garder son terminal ouvert pendant le test.

Arrêter l’ancienne démo avec Ctrl+C avant de relancer le script actualisé. Si `/demo/` affiche une erreur 404, le navigateur pointe sur une ancienne instance ou sur un autre serveur : utiliser exactement l’adresse **ACCÈS DIRECT SANS MOT DE PASSE** du nouveau terminal. Si le port 4173 est occupé et que vous voulez garder l’autre instance, lancer dans PowerShell `$env:SPICY_DEMO_PORT='4178'; npm.cmd run demo`, puis ouvrir l’adresse imprimée. Le script n’arrête aucun autre processus.

Les accès directs existent uniquement dans le script local qui crée sa propre base jetable et écoute sur `127.0.0.1`. Ils refusent les requêtes d’autres origines et les hôtes non prévus. Le serveur de production ne monte aucune de ces routes et conserve la connexion par mot de passe.

La connexion manuelle reste disponible en option :

| Interface | Adresse exacte | Email |
|---|---|---|
| Admin | `http://127.0.0.1:4173/admin/` | `admin@spicy.test` |
| Super admin | `http://127.0.0.1:4173/superadmin/` | `super@spicy.test` |

Utiliser pour les deux comptes la valeur **Mot de passe commun** affichée par le lancement actuellement actif de `npm run demo`. Le mot de passe n’est pas celui de PostgreSQL ou du VPS, et celui d’un ancien lancement ne fonctionne plus. Ne pas utiliser ces accès sur les ports Vite 5173/5174/5175 ou sur le domaine de production.

Si le mot de passe n’est plus visible, appuyer sur **Entrée dans le terminal où la démo tourne** : les accès sont réaffichés sans changer le mot de passe ni effacer les données. Cette commande nécessite le script de démo actualisé. Pour une ancienne instance : arrêter avec `Ctrl+C`, relancer `npm run demo`, puis copier le nouveau mot de passe sans espace. Le redémarrage réinitialise uniquement les données jetables de démonstration.

Le message **Identifiants incorrects** indique un email ou mot de passe non reconnu, ou un compte admin utilisé sur l’interface super admin. Vérifier notamment l’email exact `super@spicy.test`. `localhost` est également accepté par la démo, mais utiliser les liens affichés ci-dessus évite de mélanger les cookies de plusieurs hôtes. Si le port est occupé, le terminal indique qu’aucun nouvel accès n’a été activé ; arrêter l’ancienne instance avant de relancer.

Sur Windows, utiliser `npm.cmd` si PowerShell bloque `npm.ps1`. Le fichier de verrouillage de référence V2 est **`site/package-lock.json`**. Les anciens fichiers Docker, Compose et lockfile du sous-dossier `spicy-front/` appartiennent à la V1 et ne sont pas le point d’entrée V2.

## Développement avec PostgreSQL persistant

1. Copier `.env.example` vers `.env`. Renseigner `POSTGRES_PASSWORD`, un `JWT_SECRET` aléatoire de 32 caractères minimum, et les origines locales :

```dotenv
APP_ORIGINS=http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175
DB_HOST=127.0.0.1
DB_PORT=5432
```

2. Initialiser PostgreSQL et les comptes :

```sh
docker compose --env-file .env -f spicy-data/compose.local.yml up -d --wait
npm run db:migrate
npm run db:seed
npm run admin:create
```

Le dernier script demande le nom, l’email et le mot de passe masqué du premier super administrateur. Il ne remplace pas les comptes existants. Le seed n’insère aucun mot de passe.

3. Ouvrir quatre terminaux depuis `site/` :

```sh
npm run dev:api
npm run dev:front
npm run dev:admin
npm run dev:superadmin
```

URLs : `http://127.0.0.1:5173`, `http://127.0.0.1:5174/admin/`, `http://127.0.0.1:5175/superadmin/`. Chaque serveur Vite transmet `/api` à Express sur le port 3000. Utiliser ces hôtes exacts pour correspondre à `APP_ORIGINS`. Ne pas définir `NODE_ENV=production` pour ce développement HTTP : les cookies sécurisés de production exigent HTTPS.

## Déploiement sur le VPS

### 1. Préparer le domaine et Traefik

Le Compose V2 réutilise les entrypoints `websecure` et le résolveur `letsencrypt` du Traefik central fourni. La redirection HTTP vers HTTPS reste gérée par ce Traefik. Les DNS A et éventuellement AAAA de `spicy-drc.tech` doivent pointer vers le VPS, et les ports 80/443 être accessibles pour HTTP-01.

Le réseau externe par défaut s’appelle `traefik-public`. Vérifier son existence :

```sh
docker network inspect traefik-public
```

S’il n’existe pas, le créer une seule fois :

```sh
docker network create traefik-public
```

Si un réseau Traefik externe existe sous un autre nom, renseigner ce nom dans `TRAEFIK_NETWORK` au lieu de créer un doublon.

**Cas de votre configuration actuelle : `network_mode: host`.** Le Traefik central utilise directement le réseau du VPS et ne doit pas être ajouté à un réseau bridge. Sur le même Docker Engine Linux standard, il peut joindre les IP des conteneurs du bridge externe ; le label `traefik.docker.network` choisit ce réseau. Le Compose V2 ne modifie pas votre Traefik central. Si Traefik est ultérieurement placé sur un bridge, il devra rejoindre ce même réseau externe dans son propre Compose.

Les trois interfaces et l’API rejoignent le réseau externe. PostgreSQL et le job de migration restent sur le réseau interne ; PostgreSQL possède `traefik.enable=false`, aucun routeur TCP/HTTP ni port publié. Aucun port applicatif 3000/8080/5432 n’est publié sur le VPS.

### 2. Transférer les sources

Depuis le dossier `site/` sous Windows, créer une archive des sources sans dépendances, sorties de compilation ou secrets :

```powershell
tar --exclude=node_modules --exclude=dist --exclude=.git --exclude=.env --exclude=backups --exclude=uploads -czf spicy-v2.2.0.tar.gz package.json package-lock.json DEMO.cmd docker-compose.yml .dockerignore .gitattributes .env.example .env.production.example DEPLOIEMENT-PRODUCTION.md VALIDATION-V2.2.md deploy README.md MISE-A-JOUR-V2.1.md VALIDATION-V2.1.md VALIDATION-V2.md docs spicy-front spicy-admin spicy-supadmin spicy-back spicy-data
scp .\spicy-v2.2.0.tar.gz deploy@IP_DU_SERVEUR:~/
ssh deploy@IP_DU_SERVEUR
```

Sur Linux :

```sh
mkdir -p ~/apps/spicy-v2
tar -xzf ~/spicy-v2.2.0.tar.gz -C ~/apps/spicy-v2
cd ~/apps/spicy-v2
cp .env.example .env
chmod 600 .env
nano .env
```

Renseigner `SPICY_DOMAIN=spicy-drc.tech`, `APP_ORIGINS=https://spicy-drc.tech`, le réseau externe, un mot de passe PostgreSQL et un secret JWT distinct. Pour générer chacun des secrets : `openssl rand -hex 32`. Ne pas réutiliser les valeurs de démonstration. La variable `SPICY_DOMAIN` ne contient ni protocole ni chemin ; ne pas ajouter de slash à `APP_ORIGINS`.

### 3. Construire et vérifier avant la bascule

```sh
docker compose config --quiet
docker compose build --pull
docker compose up -d --wait spicy-data
docker compose run --rm --no-deps spicy-migrate
docker compose run --rm --no-deps --label traefik.enable=false spicy-back node spicy-back/scripts/create-admin.js
docker compose run --rm --no-deps --label traefik.enable=false spicy-front -t
docker compose run --rm --no-deps --label traefik.enable=false spicy-admin -t
docker compose run --rm --no-deps --label traefik.enable=false spicy-supadmin -t
```

Le conteneur `spicy-migrate` applique les migrations dans une transaction, puis le catalogue initial une seule fois. Les tables `schema_migrations` et `schema_seeds` empêchent les réexécutions destructrices. Les modifications de carte et de contacts faites par l’équipe sont préservées aux prochains démarrages. Ne pas exécuter les fichiers de seed directement avec `psql` après l’installation ; passer par le script.

### 4. Passer de V1 à V2

Conserver le dossier, le `.env` et l’image Docker de la V1. Pendant une courte fenêtre de maintenance, arrêter **uniquement le service frontend V1** depuis son ancien dossier :

```sh
cd /CHEMIN/EXISTANT/spicy-front
docker compose stop frontend
```

Puis revenir dans le dossier V2 :

```sh
cd ~/apps/spicy-v2
docker compose up -d --no-build --wait --wait-timeout 120
docker compose ps -a
docker compose logs --tail=100 spicy-migrate spicy-back
```

Le job de migration doit être `Exited (0)` ; les cinq services persistants doivent être démarrés et sains. Ne pas laisser les routeurs V1 et V2 actifs simultanément sur le même domaine pendant la bascule. Il n’y a pas de modification du volume ACME central. La V1 n’avait pas de base de données : aucune commande WhatsApp historique n’est importée automatiquement.

```sh
curl -I http://spicy-drc.tech
curl -I https://spicy-drc.tech
curl -I https://spicy-drc.tech/admin/
curl -I https://spicy-drc.tech/superadmin/
curl -fsS https://spicy-drc.tech/api/health
curl -fsS https://spicy-drc.tech/api/menu
```

Vérifier la redirection HTTPS, l’état `{"status":"ok"}`, le menu, une connexion super administrateur et les paramètres. Les endpoints d’écriture exigent une origine autorisée ; un simple `curl POST` sans `Origin` sera volontairement refusé. Les chemins `/admin` et `/superadmin` redirigent vers leurs variantes avec slash. Les assets gardent leur préfixe ; **ne pas ajouter de middleware StripPrefix**.

### 5. Sauvegarde et restauration

Les données vivent dans le volume Docker `spicy-v2_postgres-data` si le nom de projet par défaut est conservé. Ne jamais supprimer ce volume pour mettre à jour le code. Garder également `.env` dans votre sauvegarde sécurisée. Depuis le VPS Linux :

```sh
mkdir -p backups
chmod 700 backups
docker compose exec -T spicy-data sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "backups/spicy-$(date +%Y%m%d-%H%M%S).dump"
```

Copier la sauvegarde hors du VPS et en vérifier périodiquement la restauration sur une base dédiée. Exemple de restauration de test dans une **nouvelle base** :

```sh
docker compose exec -T spicy-data sh -c 'createdb -U "$POSTGRES_USER" spicy_restore_check'
docker compose exec -T spicy-data sh -c 'pg_restore -U "$POSTGRES_USER" -d spicy_restore_check --no-owner --exit-on-error' < backups/NOM_DU_FICHIER.dump
docker compose exec -T spicy-data sh -c 'psql -U "$POSTGRES_USER" -d spicy_restore_check -c "SELECT count(*) FROM orders;"'
```

La base de test doit être nouvelle pour chaque restauration. Ces commandes ne remplacent pas la base active. Pour restaurer la production, prévoir l’arrêt des écritures et une procédure explicitement validée avec la sauvegarde choisie.

### 6. Mise à jour et retour arrière

Avant chaque mise à jour : sauvegarder la base, conserver le code et les images précédents, puis utiliser un nouveau `SPICY_IMAGE_TAG` (ex. `v2.0.1`). Construire les images avant la maintenance. Les migrations futures doivent rester compatibles avec la version précédente si un retour immédiat est nécessaire. Ne pas modifier une migration déjà appliquée ; ajouter un nouveau fichier numéroté.

```sh
docker compose build --pull
docker compose up -d --no-build --wait --wait-timeout 120
```

Pour revenir au frontend V1 : arrêter les services HTTP V2 (`docker compose stop spicy-front spicy-admin spicy-supadmin spicy-back`), puis relancer `docker compose up -d --no-build frontend` dans le dossier V1. Conserver la base V2 : les commandes déjà reçues y restent enregistrées et devront être prises en charge avant le retour arrière. Pour revenir à une précédente V2, restaurer les fichiers Compose et le tag d’image correspondants, puis `up --no-build --pull never` uniquement si le schéma reste compatible. Un retour de schéma exige un plan de restauration ; aucune suppression automatique n’est fournie.

## Fonctionnement et sécurité

- JWT signé HS256, durée de huit heures, cookies `HttpOnly`, `Secure` en production, `SameSite=Strict`. Cookies distincts limités à `/api/admin` et `/api/superadmin`, audiences JWT distinctes. Aucune session en localStorage.
- Sessions persistantes révocables en PostgreSQL. La déconnexion révoque le JWT ; supprimer un administrateur supprime ses sessions. Les rôles sont relus dans la base à chaque requête.
- Vérification d’origine pour toutes les écritures, jeton CSRF supplémentaire pour le personnel, cookie SameSite Strict pour les sessions clients, limites de connexion et de commandes, mots de passe scrypt salés, SQL paramétré et validation Zod stricte.
- Le super administrateur gère les deux rôles dans Équipe : création, modification, désactivation, suppression et remplacement de mot de passe. Le retrait de son propre accès et du dernier super admin actif est refusé. Les modifications d’accès révoquent les sessions. Chaque utilisateur change son propre mot de passe dans Mon compte ; le responsable du VPS dispose aussi de commandes de récupération interactives.
- Les prix et portions viennent de la base, jamais du total fourni par le navigateur. La transaction enregistre client et commande ensemble et incrémente `order_count` une seule fois par clé de tentative. Un changement de disponibilité ou de portion bloque la commande avec une explication.
- `order_count` compte les commandes enregistrées, y compris celles ensuite annulées. Aucun programme de points ou paiement n’est encore appliqué.
- Les détails des commandes conservent le nom du produit, le prix, les choix, l’identité et l’adresse au moment de l’achat. Modifier ou supprimer un plat ne modifie pas l’historique.
- La vitrine reçoit un événement SSE à chaque modification de carte ou de contacts, puis recharge les données immédiatement. Un rafraîchissement toutes les 30 secondes et au retour sur l’onglet sert de secours. L’API vérifie immédiatement prix et disponibilités à la commande. Le suivi client utilise un SSE privé et un secours de 15 secondes. La liste admin se recharge toutes les 10 secondes et dispose du bouton Actualiser.
- PostgreSQL et l’API sont prévus pour une instance de chaque service. Le limiteur HTTP est en mémoire ; en cas de réplication de l’API, utiliser un magasin partagé pour ce limiteur. Le mode de test PGlite ne valide pas la concurrence réelle de plusieurs connexions PostgreSQL.
- Les pages de gestion sont des shells statiques publics : les données et opérations sensibles sont protégées côté API. Les clients créent directement leur espace sans mot de passe ni code, avec une session de 30 jours sur le navigateur. Le téléphone est une coordonnée de contact, pas une preuve d’identité. Aucun envoi SMS ou WhatsApp automatique.
- La session client donne accès uniquement aux commandes de son profil ; le personnel authentifié conserve son accès CRM. Plusieurs profils peuvent avoir le même numéro sans partager leurs données. Les corps de requêtes, mots de passe et jetons ne sont pas journalisés en production.

## API

| Méthode | Route | Accès |
|---|---|---|
| GET | `/api/health`, `/api/menu`, `/api/settings`, `/api/events` (SSE) | Public |
| POST | `/api/orders` | Session client, origine autorisée, validation stricte |
| POST | `/api/{admin\|superadmin}/login` | Identifiants + origine |
| GET / POST | `/api/{espace}/session`, `/api/{espace}/logout` | Session de cet espace |
| GET / POST | `/api/{espace}/menu` | Admin |
| PUT / DELETE | `/api/{espace}/menu/:id` | Admin |
| GET | `/api/{espace}/clients?search=&page=1` | Admin, 25 résultats/page |
| GET / PATCH | `/api/{espace}/orders`, `/api/{espace}/orders/:id` | Admin |
| GET / PUT | `/api/{espace}/settings` | Super admin exclusivement |
| GET / POST / PUT / DELETE | `/api/{espace}/admins`, `/api/{espace}/admins/:id` | Super admin exclusivement ; création des deux rôles |
| POST | `/api/{espace}/admins/:id/password` | Super admin ; remplacement du mot de passe d’un autre compte |
| POST | `/api/{espace}/password` | Utilisateur connecté ; mot de passe actuel et nouveau requis |

Les schémas de requête sont définis dans `spicy-back/src/validation.js`. L’API renvoie `{error: "message"}` en cas d’échec. Une commande utilise `request_key` (UUID), `client`, `delivery_address`, `location`, `note` et `items: [{id,size,heat,quantity}]`. Une nouvelle tentative du même contenu garde la même clé ; un nouveau contenu doit utiliser une nouvelle clé.

### API V2.1

| Méthode | Route | Accès |
|---|---|---|
| POST | `/api/customer/register` | Prénom (`first_name`), nom (`last_name`), téléphone (`phone`) ; origine autorisée, 20 demandes/heure/IP |
| GET | `/api/customer/session`, `/api/customer/orders?page=1`, `/api/customer/events` | Session client ; uniquement ses données |
| PUT / POST | `/api/customer/profile`, `/api/customer/logout` | Session client et origine autorisée |
| POST | `/api/{espace}/uploads` | Admin + CSRF ; corps binaire JPEG, PNG ou WebP, 5 Mo maximum |
| GET | `/api/media/:file` | Image publique WebP |

## Dépannage

- **403 à la connexion/enregistrement** : vérifier `APP_ORIGINS` (protocole, hôte et port exacts). Ne pas activer CORS permissif pour contourner la vérification.
- **401 après connexion** : vérifier HTTPS et le chemin du cookie. Une session `/admin` n’ouvre pas `/superadmin`.
- **502 Traefik** : vérifier l’état de santé, le réseau choisi, le port 3000/8080, le même daemon Docker et le pare-feu. Les priorités de routes sont 200 pour API, 100 pour les espaces de gestion et 10 pour la vitrine.
- **API indisponible** : consulter `docker compose logs spicy-back spicy-migrate spicy-data`. Une migration échouée empêche le démarrage de l’API.
- **Mot de passe PostgreSQL modifié dans `.env`** : il ne modifie pas celui d’un volume existant. Une rotation nécessite aussi la modification du rôle en base.
- **Images absentes** : les URL doivent être HTTPS. Les images Unsplash nécessitent une connexion Internet ; la vitrine possède une illustration de secours.
- **Construction Windows EPERM** : vérifier les permissions du dossier de travail. Sur le VPS, les constructions se font dans les images Linux.

Références : [routage Docker Traefik](https://doc.traefik.io/traefik/reference/dynamic-configuration/docker/), [guide Docker et Traefik](https://docs.docker.com/guides/traefik), [sécurité Express](https://expressjs.com/en/advanced/best-practice-security.html).
