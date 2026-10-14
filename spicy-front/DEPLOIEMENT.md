> Archive V1 : pour le code actuel et le deploiement V2, suivre [le README du monorepo](../README.md) et [la validation V2](../VALIDATION-V2.md). Les instructions ci-dessous decrivent la version precedente.

# Déployer Spicy Food Truck V1 avec le Traefik central

Ce guide publie le site à la racine d’un domaine, par exemple `https://spicy.votre-domaine.com`. Remplacer les domaines et adresses d’exemple par les vôtres. Le déploiement est à exécuter sur votre serveur ; aucune mise en ligne n’est effectuée par la création de ces fichiers.

## 1. Architecture prévue

```text
Visiteur → HTTPS :443 → Traefik central (network_mode: host)
                              ↓ HTTP, IP Docker du conteneur :8080
                         Nginx → fichiers React compilés
```

L’image est construite en deux étapes : Node.js installe les versions verrouillées par `package-lock.json`, lance les tests et compile Vite ; Nginx sert uniquement les fichiers générés. Node.js et le serveur Vite ne tournent pas en production.

Le Compose Spicy réutilise exactement les éléments de votre configuration centrale :

| Configuration centrale | Configuration Spicy |
| --- | --- |
| `providers.docker=true` | Découverte des labels du conteneur |
| `exposedbydefault=false` | `traefik.enable=true` explicitement |
| `websecure` sur 443 | Routeur HTTPS sur `websecure` |
| Résolveur `letsencrypt` | `tls.certresolver=letsencrypt` |
| Redirection globale `web` → `websecure` | Aucune seconde redirection à configurer |
| `network_mode: host` | Accès depuis l’hôte au réseau bridge de Spicy |

**Hypothèse de déploiement : serveur Linux avec Docker Engine standard, Traefik et Spicy sur le même hôte et le même daemon Docker.** Le réseau `spicy-v1-web` est créé automatiquement. Traefik en mode host n’a pas à être rattaché à ce réseau : il partage le réseau de l’hôte Linux, qui peut joindre les IP du bridge Docker, sauf restrictions particulières du pare-feu. Cette topologie n’est pas un guide Docker rootless, Swarm, Docker Desktop ou multi-serveurs.

Les noms du routeur et du service Traefik suivent `COMPOSE_PROJECT_NAME`. Aucun port Nginx n’est publié sur l’hôte : seuls les ports 80 et 443 du Traefik central reçoivent le trafic public. Le frontend n’emploie ni socket Docker ni volume de certificats.

## 2. Prérequis sur le serveur et DNS

1. Docker Engine et le plugin Compose sont installés. Utiliser un Compose récent prenant en charge `up --wait`.
2. Votre Traefik central est déjà démarré avec la configuration fournie, un `ACME_EMAIL` valide et son volume `traefik-letsencrypt` conservé.
3. Créer un enregistrement DNS **A** pour le domaine choisi vers l’IPv4 publique du serveur. Un enregistrement **AAAA** doit pointer vers une IPv6 réellement joignable sur ce même serveur ; corriger ou retirer un AAAA obsolète.
4. Les ports TCP **80 et 443** sont accessibles depuis Internet et arrivent sur Traefik. Le challenge HTTP de Let’s Encrypt nécessite le port 80, même si le site utilise HTTPS.
5. Le serveur peut télécharger les images Docker et les paquets npm lors de la construction.

Contrôles sur le serveur :

```bash
docker version
docker compose version
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
```

Si votre compte n’a pas accès à Docker, employer `sudo docker ...` pour les commandes Docker ci-dessous. La configuration Spicy ne nécessite pas de modifier ni de redémarrer le Traefik central. Ne pas supprimer son volume de certificats.

## 3. Envoyer le projet depuis Windows

L’archive `site/spicy-front-v1.0.0.tar.gz` fournie contient les sources, les médias locaux, les dépendances verrouillées et la configuration. Elle exclut `node_modules`, `dist` et votre futur `.env`.

Depuis PowerShell, dans le dossier `Spicy` :

```powershell
$SpicyServer = "deploy@IP_DU_SERVEUR"
scp .\site\spicy-front-v1.0.0.tar.gz "${SpicyServer}:~/"
ssh $SpicyServer
```

Remplacer `deploy` par votre utilisateur SSH et `IP_DU_SERVEUR` par votre serveur. Vous pouvez aussi transférer le dossier source avec Git ou SFTP ; le Dockerfile construit lui-même `dist/`.

Sur le serveur Linux, pour une première installation :

```bash
mkdir -p ~/apps/spicy-front
tar -xzf ~/spicy-front-v1.0.0.tar.gz -C ~/apps/spicy-front
cd ~/apps/spicy-front
cp .env.example .env
nano .env
```

Renseigner par exemple :

```dotenv
SPICY_DOMAIN=spicy.votre-domaine.com
SPICY_IMAGE_TAG=v1.0.0
COMPOSE_PROJECT_NAME=spicy-v1
```

`SPICY_DOMAIN` contient uniquement un nom DNS, sans `https://`, slash, chemin ou port. Un seul domaine est configuré : `www` n’est pas automatiquement inclus. Ne pas laisser `spicy.example.com`. Conserver `COMPOSE_PROJECT_NAME` pour les mises à jour de cette installation. `.env` est exclu de Git et de la construction Docker ; ces valeurs configurent le déploiement, elles ne sont pas injectées dans le navigateur.

## 4. Construire et démarrer

Depuis `~/apps/spicy-front` :

```bash
docker compose config --quiet
docker compose build --pull frontend
docker compose run --rm --no-deps --label traefik.enable=false frontend -t
docker compose up -d --no-build --wait --wait-timeout 120
docker compose ps
```

- `config` vérifie le Compose et les substitutions du `.env`.
- `build` installe avec `npm ci`, lance les tests puis compile ; une erreur interrompt la construction.
- `run ... -t` vérifie la syntaxe Nginx dans l’image, avec les mêmes restrictions d’exécution que le service.
- `up --wait` attend l’état sain du conteneur. Un conteneur sain ne prouve pas encore que le DNS et le certificat fonctionnent.

Nginx écoute sur 8080 comme utilisateur non-root, avec système de fichiers en lecture seule et `/tmp` temporaire. Son contrôle de santé appelle `/healthz`. Les logs sont limités à trois fichiers de 10 Mo.

## 5. Vérifier la mise en ligne

Remplacer le domaine ci-dessous par celui du `.env` :

```bash
curl -I http://spicy.votre-domaine.com
curl -I https://spicy.votre-domaine.com
curl -fsS https://spicy.votre-domaine.com/healthz
docker compose logs --tail=100 frontend
```

Résultats attendus : redirection HTTP vers HTTPS, réponse HTTPS `200`, puis `ok` pour la santé. Traefik demande le certificat automatiquement ; sa première émission peut prendre un court moment. Ne pas utiliser `curl -k` pour considérer le TLS comme validé.

Dans un navigateur, vérifier le logo, les images, les filtres, le panier, les formats et le lien WhatsApp. Les photos Unsplash nécessitent une connexion Internet. Le site ne facture rien et n’envoie pas de message automatiquement.

Pour consulter les logs centraux, utiliser le nom Traefik retourné par `docker ps` :

```bash
docker logs --tail=100 NOM_DU_CONTENEUR_TRAEFIK
```

Les fichiers Vite sous `/assets/` portent une empreinte et sont mis en cache un an. Le HTML est revalidé à chaque visite ; les images locales sont mises en cache une heure. La navigation de cette V1 utilise des ancres (`#menu`, `#villes`) : les URL inconnues renvoient une vraie erreur 404. Ajouter ultérieurement un routeur React avec chemins nécessitera d’adapter ce comportement et la base Vite.

## 6. Mettre à jour et revenir en arrière

Utiliser un tag d’image différent à chaque livraison. Exemple : passage de `v1.0.0` à `v1.0.1`. Avant la mise à jour :

```bash
cd ~/apps/spicy-front
cp .env .env.before-update
docker image inspect spicy-front:v1.0.0 --format '{{.Id}}'
```

Conserver la version précédente des sources et l’image précédente. Transférer les nouveaux fichiers sans écraser `.env`, puis modifier uniquement `SPICY_IMAGE_TAG=v1.0.1` dans `.env`. Garder le même domaine et le même `COMPOSE_PROJECT_NAME`.

```bash
docker compose config --quiet
docker compose build --pull frontend
docker compose run --rm --no-deps --label traefik.enable=false frontend -t
docker compose up -d --no-build --wait --wait-timeout 120
```

Une construction échouée laisse le conteneur actuellement en ligne fonctionner. La recréation d’une unique instance peut provoquer une brève interruption ; cette V1 n’inclut pas de déploiement sans interruption. Recharger un ancien onglet après une livraison si un fichier Vite précédent n’existe plus.

Pour revenir à l’image précédente, si seule l’application a changé et que le Compose est resté compatible :

```bash
cp .env.before-update .env
docker compose up -d --no-build --pull never --wait --wait-timeout 120
```

Vérifier ensuite l’URL publique. **Ne pas reconstruire l’ancien tag à partir des nouvelles sources** : le retour arrière doit utiliser l’image déjà construite. Si `compose.yaml` a changé, restaurer aussi sa version précédente. Ne pas purger les images conservées pour le retour arrière.

Les images de base `node:24-alpine` et `nginx:stable-alpine` sont des tags maintenus qui peuvent évoluer. Le fichier npm verrouille les dépendances JavaScript, pas ces bases. Pour reproduire exactement une construction, renseigner les arguments `NODE_IMAGE` et `NGINX_IMAGE` avec des références `image@sha256:...` vérifiées, ou conserver l’image finale construite dans votre registre/une archive Docker.

## 7. Dépannage ciblé

| Symptôme | Vérification |
| --- | --- |
| `SPICY_DOMAIN` absent | Créer `.env` au même niveau que `compose.yaml` et renseigner le domaine. |
| 404 Traefik | Vérifier le domaine de la requête, les labels avec `docker compose config`, l’état sain du conteneur et le provider Docker central. |
| 502 / 504 | Vérifier que Traefik et Spicy utilisent le même hôte/daemon ; inspecter `docker network inspect spicy-v1-web`, le port 8080 et les restrictions du pare-feu entre l’hôte et le bridge. Adapter le nom de réseau si le projet est renommé. |
| Certificat absent ou invalide | Vérifier A/AAAA, ports 80/443, `ACME_EMAIL`, resolver `letsencrypt` et logs Traefik. Ne pas multiplier les demandes en supprimant le stockage ACME. |
| Conteneur non sain | `docker compose logs --tail=100 frontend`, puis `docker compose exec frontend nginx -t`. |
| Erreur npm / téléchargement | Vérifier la connectivité sortante vers npm et Docker Hub ; relancer la construction après correction. |
| Ancienne interface | Recharger la page et contrôler le tag de l’image en cours ; seul `/assets/` a un cache immuable. |

Diagnostic du serveur web depuis son conteneur :

```bash
docker compose exec frontend wget -q -O - http://127.0.0.1:8080/healthz
```

Pour arrêter uniquement Spicy, depuis son dossier : `docker compose stop frontend`. Le Traefik central et les autres applications continuent de fonctionner.

## Références officielles

- [Provider Docker de Traefik : labels, réseaux et ports](https://doc.traefik.io/traefik/reference/install-configuration/providers/docker/).
- [Réseau host de Docker](https://docs.docker.com/engine/network/drivers/host/).
- [Configuration des services Docker Compose](https://docs.docker.com/reference/compose-file/services/).
- [NGINX : serveur statique et try_files](https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files).
