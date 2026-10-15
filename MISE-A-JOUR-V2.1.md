# Spicy V2.1 — utilisation et déploiement

Mise à jour du 15 octobre 2026 : l’inscription client est directe, sans mot de passe ni code OTP. Aucun fournisseur SMS n’est nécessaire. Le suivi privé des commandes, les statuts colorés, TikTok et les photos envoyées depuis un téléphone ou un ordinateur restent disponibles.

## Tester la démo

Depuis `site/`, arrêter l’ancienne démo avec Ctrl+C, puis double-cliquer sur `DEMO.cmd`. Ou utiliser :

```powershell
npm.cmd ci
npm.cmd run demo:ready
```

Cette commande compile les trois interfaces puis lance la démo, sans serveur de développement ni Docker. Si les interfaces sont déjà compilées, `npm.cmd run demo` suffit.

Ouvrir `http://127.0.0.1:4173`, cliquer sur **Mon espace**, renseigner prénom, nom et numéro WhatsApp, puis **Créer mon espace**. L’espace s’ouvre immédiatement, sans code. Compléter ensuite l’adresse et la ville dans « Mes informations » ou au panier.

Pour tester admin et super admin sans saisir d’identifiants, ouvrir `http://127.0.0.1:4173/demo/` puis cliquer sur le rôle voulu. Ces accès rapides sont absents de la production. Créer une commande côté client, changer son statut côté admin, puis vérifier sa mise à jour dans « Mes commandes ». Les comptes, profils, photos et commandes de la démo sont jetables à son arrêt.

## Espace client sans OTP

- Une session conserve l’espace pendant 30 jours sur le même navigateur : cookie HttpOnly, Secure en HTTPS, SameSite Strict ; seule l’empreinte du jeton est stockée en base.
- Le numéro est une coordonnée de contact, pas une preuve d’identité. Une nouvelle inscription sur un autre navigateur crée un profil distinct, même avec le même numéro. Elle ne permet jamais de consulter les commandes d’un autre profil.
- Après déconnexion, suppression des cookies ou expiration de la session, le numéro seul ne permet pas de récupérer l’ancien espace. Le site le précise avant l’inscription et demande confirmation avant la déconnexion. La récupération et la connexion vérifiée sur plusieurs appareils sont reportées à une version ultérieure.
- Les sessions existantes encore valides conservent leur profil et leurs commandes après la mise à jour. Aucune commande historique n’est rattachée à un nouvel espace sur la seule base du numéro.
- Prénom, nom, numéro WhatsApp, adresse et ville sont modifiables dans « Mes informations ». Le panier reprend ces coordonnées. Plusieurs fiches CRM peuvent porter le même numéro : leurs historiques et compteurs restent propres à chaque profil.
- Le suivi utilise un flux SSE privé et une actualisation de secours toutes les 15 secondes. L’administration recharge sa liste toutes les 10 secondes et propose aussi « Actualiser ». Conserver une seule instance de l’API ; la diffusion SSE est en mémoire.

| Statut | Couleur |
|---|---|
| À confirmer | Jaune |
| En préparation | Orange |
| Terminée | Vert |
| Annulée | Rouge |

Les anciennes routes `/api/customer/code` et `/api/customer/verify` sont supprimées. L’inscription utilise `POST /api/customer/register`. Les anciennes variables `TWILIO_*` ne sont plus utilisées et peuvent être retirées du `.env` ; conserver les secrets PostgreSQL et JWT existants.


## TikTok et photos

**Super admin → Paramètres → Lien TikTok**, juste après les champs Instagram. Ce réglage est réservé au super administrateur : aucune rubrique TikTok dans le menu admin, et aucune modification autorisée par son API. Laisser vide masque le lien. Le pied de page public se met à jour après enregistrement. Aucun compte TikTok n’est présumé : saisir votre URL officielle.

**La carte → Modifier → Photo** propose : coller une URL HTTPS, copier l’URL actuelle ou choisir un fichier sur l’appareil. Formats JPEG, PNG et WebP, maximum 5 Mo et 40 mégapixels. Pour une photo HEIC, l’exporter en JPEG depuis le téléphone. Le serveur vérifie les données, corrige l’orientation, retire les métadonnées et convertit en WebP jusqu’à 1600 × 1600. **Enregistrer le plat** pour publier la nouvelle photo. Les fichiers envoyés sont publics, comme les autres images du menu.

Les photos sont dans le volume Docker `menu-uploads`, monté sur `/app/uploads`, et servies sous `/api/media/` par le routeur API Traefik existant. Elles survivent aux redémarrages et reconstructions. Hors Docker, `UPLOAD_DIR` configure leur répertoire ; le défaut est `uploads/` dans le répertoire de lancement. La copie automatique requiert HTTPS ou localhost ; sinon le champ est sélectionné pour une copie manuelle.

Le remplacement ou la suppression d’un plat ne supprime pas les anciens fichiers : cela évite de casser des liens déjà publiés. Inclure le volume dans les sauvegardes et surveiller son occupation. Les uploads sont limités à 30 par quart d’heure et par IP, derrière authentification admin et protection CSRF.

## Mise à jour d’un serveur V2 existant

Faire cette opération dans le dossier de déploiement existant. **Conserver le même `COMPOSE_PROJECT_NAME`** (par défaut `spicy-v2`), le même volume PostgreSQL et le même `.env`. Ne pas exécuter `down -v`.

1. Sauvegarder la base avec la procédure du README. Conserver une copie des fichiers Compose et des tags V2. Copier les sources V2.1 sans écraser le `.env` du serveur. Les anciens fichiers de déploiement V1 dans `spicy-front/` ne sont pas utilisés.
2. Définir `SPICY_IMAGE_TAG=v2.1.0` dans le `.env` existant et conserver les secrets PostgreSQL et JWT. Aucun fournisseur SMS ni changement dans le Traefik central en `network_mode: host` n’est nécessaire.
3. Construire les images, puis arrêter brièvement les écritures pour appliquer la migration :

```sh
docker compose config --quiet
docker compose build
docker compose stop spicy-back
docker compose run --rm --no-deps spicy-migrate
docker compose up -d --wait
docker compose ps -a
```

Si la migration échoue, corriger l’erreur avant de redémarrer les écritures. Le job applique les migrations manquantes une seule fois. `002_customer_space.sql` ajoute les sessions, la ville du profil, l’historique de statut et TikTok. `003_customer_without_otp.sql` retire l’unicité du téléphone et supprime les anciennes demandes de code. Elle conserve les profils, sessions client, commandes, produits et comptes admin. Le seed historique ne recrée pas les plats supprimés. Même si V2.1 est déjà installée, reconstruire les images et appliquer la migration 003.

Un retour à l’ancien backend OTP nécessite la restauration de la sauvegarde correspondante : sa table de vérification n’existe plus après la migration 003.

4. Recharger le navigateur, vérifier `/api/health`, puis tester : inscription client sans code, profil et commande, session conservée après rechargement, changement de statut depuis admin, statut reçu sur le client, upload/photo après redémarrage du backend, lien TikTok après enregistrement. Les comptes admin existants restent valables.

### Sauvegarder aussi les photos

Depuis le VPS, après le premier lancement V2.1 :

```sh
mkdir -p backups
docker compose exec -T spicy-back tar -czf - -C /app/uploads . > "backups/menu-uploads-$(date +%Y%m%d-%H%M%S).tar.gz"
```

Sauvegarder PostgreSQL et le volume des photos ensemble, idéalement pendant un arrêt des écritures admin. Tester la restauration sur un environnement distinct avant une restauration de production. L’archive de code source ne contient ni `.env`, ni base, ni photos envoyées par les utilisateurs.

## Validation et limites

Voir `VALIDATION-V2.1.md`. Les tests locaux utilisent PGlite ; ils ne remplacent pas le test des conteneurs Linux sur le VPS. Aucun service SMS n’est appelé. Aucun déploiement distant n’a été exécuté automatiquement.
