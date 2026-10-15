# Spicy V2.2 — mettre le site en production

Ce guide concerne le VPS Linux et votre Traefik central existant. Les trois interfaces sont compilées dans Docker : aucun serveur de développement n’est nécessaire.

**Déjà en V2 ou V2.1 ? Aller directement à « Mettre à jour un site existant ».** Ne pas remplacer son `.env` ni son volume PostgreSQL.

## 1. Ce qu’il faut préparer

- Un accès SSH au VPS avec Docker Engine et Docker Compose v2 (`docker compose version`).
- Le domaine pointant vers ce VPS. Les exemples utilisent `spicy-drc.tech` ; remplacer ce domaine si nécessaire.
- Traefik déjà lancé avec vos entrées `web` / `websecure` et le résolveur `letsencrypt`. Les ports 80 et 443 doivent être accessibles. Si un DNS IPv6 AAAA existe, il doit aussi pointer vers ce serveur.
- L’archive `spicy-v2.2.0.tar.gz` et son fichier `.sha256` fournis dans `site/`.

Votre configuration Traefik `network_mode: host` reste inchangée. Elle doit utiliser le même moteur Docker Linux que Spicy. Spicy ne publie aucun port 3000, 8080 ou 5432 sur le VPS. PostgreSQL reste sur le réseau interne de l’application.

## 2. Envoyer les fichiers au serveur

Dans PowerShell, depuis le dossier `site/`, remplacer `UTILISATEUR` et `IP_DU_SERVEUR` :

```powershell
scp .\spicy-v2.2.0.tar.gz .\spicy-v2.2.0.tar.gz.sha256 UTILISATEUR@IP_DU_SERVEUR:~/
ssh UTILISATEUR@IP_DU_SERVEUR
```

Dans le terminal du VPS :

```sh
cd ~
sha256sum -c spicy-v2.2.0.tar.gz.sha256
mkdir -p ~/apps/spicy-v2
tar -xzf ~/spicy-v2.2.0.tar.gz -C ~/apps/spicy-v2
cd ~/apps/spicy-v2
```

Le contrôle doit afficher `OK`. Le nom de dossier et le nom de projet Docker `spicy-v2` restent identiques même en V2.2 : cela préserve les volumes lors des mises à jour.

## 3. Créer la configuration — première installation uniquement

```sh
sh deploy/init-env.sh
```

Appuyer sur Entrée pour garder le domaine `spicy-drc.tech` et le réseau `traefik-public`, ou saisir vos valeurs. Le script crée **`.env`**, avec un mot de passe PostgreSQL et un secret de session uniques. Il refuse d’écraser un `.env` existant. Aucun mot de passe admin n’y est enregistré.

Le modèle lisible est `.env.production.example`. Pour ajuster une valeur : `nano .env`. Garder `APP_ORIGINS=https://VOTRE_DOMAINE`, sans slash final, et `SPICY_DOMAIN=VOTRE_DOMAINE`, sans `https://`. Sauvegarder le fichier `.env` dans un emplacement privé ; ne pas le publier.

Vérifier le réseau (remplacer le nom si vous en avez choisi un autre) :

```sh
docker network inspect traefik-public
```

Si Docker indique que ce réseau n’existe pas :

```sh
docker network create traefik-public
```

Avec votre Traefik en mode host, il n’y a pas à y raccorder le conteneur Traefik. Le label `traefik.docker.network` indique les IP de conteneurs que Traefik doit joindre.

## 4. Installer et créer votre premier compte

Exécuter les commandes l’une après l’autre. En cas d’erreur, la corriger avant de poursuivre.

```sh
docker compose config --quiet
docker compose build --pull
docker compose up -d --wait spicy-data
docker compose run --rm --no-deps spicy-migrate
docker compose run --rm --no-deps --label traefik.enable=false spicy-back node spicy-back/scripts/create-admin.js
```

La dernière commande demande **votre nom, votre email et un mot de passe permanent**, puis une confirmation du mot de passe. La saisie est masquée : c’est normal que rien ne s’affiche. Utiliser au moins 12 caractères. Aucun mot de passe aléatoire ou temporaire ne vous est imposé. Enregistrer ces accès dans votre gestionnaire de mots de passe.

Lancer ensuite le site :

```sh
docker compose up -d --wait --wait-timeout 120
docker compose ps -a
curl --fail https://spicy-drc.tech/api/health
```

Le service `spicy-migrate` peut être arrêté avec le code `0` : il a terminé son travail. Les cinq services persistants doivent être démarrés et sains. L’API doit répondre `{"status":"ok"}`. Si une ancienne V1 dessert encore ce domaine, arrêter son service frontend depuis son ancien dossier avant de lancer ces nouveaux routeurs.

Ouvrir :

| Accès | Adresse |
|---|---|
| Clients | `https://spicy-drc.tech/` |
| Administrateurs | `https://spicy-drc.tech/admin/` |
| Super administrateurs | `https://spicy-drc.tech/superadmin/` |

Se connecter à `/superadmin/` avec **l’email et le mot de passe choisis à l’étape précédente**. Les identifiants et les boutons d’accès rapide de la démo ne fonctionnent pas en production.

## 5. Gérer l’équipe et ses mots de passe

Dans **Super administration → Équipe** :

| Action | Comment faire |
|---|---|
| Créer un admin ou super admin | « Créer un compte », remplir nom/email, choisir le rôle, saisir et confirmer son mot de passe permanent |
| Modifier le nom, l’email ou le rôle | « Modifier » sur la ligne du compte |
| Suspendre ou réactiver un accès | « Modifier », décocher ou cocher « Compte actif » |
| Remplacer un mot de passe oublié | « Mot de passe » sur la ligne du compte, choisir et confirmer le nouveau |
| Supprimer un compte | « Supprimer », puis confirmer ; utiliser la désactivation pour conserver sa fiche |
| Changer votre propre mot de passe | « Mon compte », saisir le mot de passe actuel puis le nouveau |

**Plusieurs super administrateurs sont possibles.** Ils ont les mêmes droits sur l’équipe et peuvent réinitialiser les accès les uns des autres. Créer un second super administrateur de confiance facilite la récupération. Chacun utilise son propre compte. Un super administrateur ne peut ni supprimer, ni désactiver, ni rétrograder son propre compte ; le dernier accès super admin actif est protégé.

Le bouton **Afficher** permet de vérifier ce que vous saisissez. **Copier** est disponible lors du choix d’un nouveau mot de passe : le sauvegarder dans votre gestionnaire puis le transmettre directement à la personne. Le site ne l’envoie pas par email ou SMS.

Les mots de passe **ne changent pas au redémarrage ou à la reconstruction des images** et n’expirent pas automatiquement. Les sessions de connexion durent 8 heures : une reconnexion utilise le même mot de passe. Une modification d’email, de rôle ou d’état, un changement de mot de passe ou une suppression ferme les sessions concernées.

### Où retrouver les mots de passe ?

Dans le gestionnaire de mots de passe où vous les avez enregistrés. L’application conserve uniquement une **empreinte scrypt** en base, jamais le mot de passe lisible ; aucun écran, fichier `.env` ou commande ne permet de relire un ancien mot de passe. Si vous l’avez oublié, choisissez-en un nouveau avec « Mot de passe ». Il est permanent lui aussi.

Le mot de passe PostgreSQL et `JWT_SECRET` dans `.env` servent à l’application : ce ne sont pas des identifiants de connexion à l’interface.

## 6. Si plus aucun super administrateur ne peut se connecter

Se connecter au VPS en SSH, puis ouvrir le dossier de l’installation :

```sh
cd ~/apps/spicy-v2
docker compose exec spicy-back node spicy-back/scripts/list-admins.js
docker compose exec spicy-back node spicy-back/scripts/reset-admin-password.js
```

La première commande affiche les noms, emails, rôles et états, sans mot de passe. La seconde demande l’email du compte, la confirmation `OUI`, puis un **nouveau mot de passe permanent saisi deux fois**. Elle ne demande pas l’ancien mot de passe et ferme les sessions existantes. Ne pas ajouter `-T` : la saisie exige un terminal interactif.

Le compte reste dans son état actuel : un compte désactivé n’est pas réactivé par une réinitialisation. Si nécessaire, créer un nouvel accès super admin avec un email distinct :

```sh
docker compose exec spicy-back node spicy-back/scripts/create-admin.js
```

Cette commande ne modifie aucun compte existant. Une fois connecté avec le nouveau compte, réactiver les comptes nécessaires dans Équipe. Ces commandes sont réservées au responsable ayant accès au serveur ; aucune porte de récupération publique n’est ajoutée au site.

## 7. Mettre à jour un site V2 ou V2.1 existant

Conserver le dossier de déploiement, le **même `.env`**, `COMPOSE_PROJECT_NAME`, les secrets et les volumes. Ne jamais utiliser `docker compose down -v` pour une mise à jour.

Envoyer la nouvelle archive et sa somme SHA256 comme à l’étape 2. Avant de l’extraire, depuis le dossier de l’installation existante :

```sh
mkdir -p backups
chmod 700 backups
umask 077
docker compose stop spicy-back
docker compose exec -T spicy-data sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > "backups/spicy-$(date +%Y%m%d-%H%M%S).sql"
docker compose run --rm -T --no-deps --label traefik.enable=false spicy-back tar -czf - -C /app/uploads . > "backups/photos-$(date +%Y%m%d-%H%M%S).tar.gz"
cp .env "backups/env-$(date +%Y%m%d-%H%M%S)"
cp docker-compose.yml "backups/compose-$(date +%Y%m%d-%H%M%S).yml"
```

Pour une installation V2 sans photos, ignorer uniquement la commande de sauvegarde des photos si `/app/uploads` n’existe pas encore. Vérifier la réussite des sauvegardes, en garder une copie privée hors VPS et conserver l’ancienne archive de code. En cas d’abandon avant migration, `docker compose start spicy-back` remet l’ancienne API en service.

Vérifier le fichier reçu depuis son dossier, puis extraire les sources dans le dossier de l’installation existante :

```sh
(cd ~ && sha256sum -c spicy-v2.2.0.tar.gz.sha256)
tar -xzf ~/spicy-v2.2.0.tar.gz -C .
nano .env
```

Changer seulement `SPICY_IMAGE_TAG=v2.2.0` dans `.env`, puis :

```sh
docker compose config --quiet
docker compose build --pull
docker compose run --rm --no-deps spicy-migrate
docker compose up -d --wait --wait-timeout 120
docker compose ps -a
```

Les migrations manquantes sont appliquées une fois. La migration 004 ajoute les états des comptes et les dates de modification ; **les comptes et mots de passe existants restent valables**. Les migrations 002/003 ajoutent l’espace client puis retirent l’OTP si elles n’ont pas encore été exécutées. Aucune réinitialisation automatique des comptes, du catalogue ou des commandes.

Si la migration échoue, corriger l’erreur avant de relancer. Un retour à l’ancienne version doit utiliser la sauvegarde et le code correspondants, notamment si l’ancien code dépend de l’OTP supprimé par la migration 003.

## 8. Vérifier avant l’ouverture

1. Se connecter avec deux comptes super admin distincts ; créer un admin, modifier son nom et essayer sa connexion à `/admin/`.
2. Remplacer son mot de passe depuis Équipe et confirmer que l’ancien ne fonctionne plus. Tester désactivation puis réactivation.
3. Côté client, créer un espace sans code, passer une commande, puis changer son statut côté admin et vérifier le suivi client.
4. Tester un upload de photo et le réglage TikTok dans les paramètres super admin.
5. Redémarrer `spicy-back`, puis vérifier les accès et la photo : `docker compose restart spicy-back`.

**Problème de connexion :** vérifier l’email dans Équipe, le rôle, l’état actif et la bonne page. Un admin ne peut pas ouvrir `/superadmin/`. Le bouton Afficher aide à vérifier la saisie. Après trop de tentatives, attendre 15 minutes avant de réessayer.

**Erreur 403 :** `APP_ORIGINS` doit correspondre exactement au domaine HTTPS utilisé. **Erreur 502 :** consulter `docker compose ps -a` et `docker compose logs --tail=100 spicy-back spicy-migrate`, puis vérifier le réseau Traefik.

Le client reste connecté 30 jours sur son navigateur sans OTP. Un autre appareil ne récupère pas ses commandes par simple saisie du numéro. L’API utilise une seule instance pour les flux de suivi et les limites par IP.

La version est préparée et testée localement. La construction des images Linux, HTTPS/Traefik et les sauvegardes/restaurations doivent être vérifiés sur votre VPS : aucun déploiement distant n’a été effectué.
