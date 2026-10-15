# Validation V2.2 — 15 octobre 2026

## Résultats locaux

- 24 tests réussis : 3 frontend et 21 backend. Après correction de l’isolation des compteurs de limitation entre scénarios de tests, toute la suite backend a été rejouée avec succès ; les limites de production n’ont pas été réduites.
- `npm run build` : compilation réussie de la vitrine, de l’administration et de la super administration.
- `docker compose --env-file .env.production.example config --quiet` : configuration valide avec des secrets factices fournis uniquement au processus de validation.
- `deploy/init-env.sh` : syntaxe shell vérifiée sous Git Bash ; exécution dans un dossier temporaire, génération de deux secrets de longueurs attendues et refus d’écraser le fichier existant vérifiés. Aucun secret de production généré dans le dépôt.
- Contrôle navigateur sur la démo locale : accès super admin, tableau Équipe avec actions et états, formulaire de création avec choix des deux rôles et confirmation du mot de passe, écran Mon compte. Capture : `docs/v2.2-equipe.jpg`. Les mutations de mots de passe et de permissions sont vérifiées par les tests API.

## Gestion des accès couverte par les tests

- Création d’admins et de super admins, normalisation de l’email, doublons et mots de passe trop courts refusés.
- CRUD et réinitialisation réservés aux super admins ; absence de CSRF refusée ; aucune empreinte ou mot de passe renvoyé par les listes et réponses de gestion.
- Modification d’email et de rôle, désactivation/réactivation, révocation des sessions des deux interfaces ; un admin ne se connecte pas à la super administration.
- Réinitialisation par un super admin et changement personnel avec vérification de l’ancien mot de passe. L’ancien mot de passe et les sessions précédentes cessent de fonctionner.
- Suppression des deux rôles avec révocation, refus de supprimer/désactiver/rétrograder son propre accès, conservation d’un super admin actif. Les mutations sont sérialisées par un verrou transactionnel en base ; le statut de l’opérateur est revérifié dans la transaction.
- Une connexion revérifie le compte sous verrou avant de créer sa session : une réinitialisation ou désactivation concurrente ne doit pas laisser entrer une nouvelle session avec les anciens identifiants.
- Récupération serveur sans ancien mot de passe, email inexistant refusé sans création implicite, mot de passe choisi conservé après recréation de l’application sur la même base.
- Les tests existants couvrent aussi les commandes, les sessions client sans OTP, le suivi SSE, les droits TikTok, les photos et l’absence des accès de démo dans le serveur normal.

## Livrables de production

Version des cinq packages et images : `2.2.0` / `v2.2.0`. Le nom du projet Compose reste `spicy-v2` pour conserver les volumes. Migration additionnelle `004_staff_management.sql` ; les comptes existants restent actifs, leurs empreintes sont conservées. PostgreSQL n’est plus connecté au réseau partagé Traefik.

Archive source `spicy-v2.2.0.tar.gz` accompagnée de sa somme SHA256 ; exclusion des dépendances, builds, fichiers d’environnement réels, sauvegardes et uploads. Modèles `.env.example` et `.env.production.example`, script d’initialisation, commandes interactives de création/récupération et guide `DEPLOIEMENT-PRODUCTION.md` inclus.

## Limites à vérifier sur le VPS

Le moteur Docker Linux n’est pas disponible sur ce poste. Les images n’ont pas été construites ni exécutées dans Docker ici. La livraison des certificats Traefik, la persistance après redémarrage des conteneurs, les sauvegardes/restaurations et la saisie interactive SSH/Docker doivent être vérifiées sur le serveur.

PGlite valide les requêtes PostgreSQL mais ne reproduit pas les courses de plusieurs connexions PostgreSQL réelles. La sérialisation et les verrous sont implémentés ; une recette concurrente sur PostgreSQL reste utile avant une exploitation à forte charge. Une seule instance API est prévue pour les flux SSE et les limiteurs IP.

Aucun compte de production créé, aucun secret client utilisé, aucun déploiement distant effectué. Les mots de passe ne sont jamais récupérables en clair depuis le site : conservation dans un gestionnaire de mots de passe ou remplacement par les moyens documentés.
