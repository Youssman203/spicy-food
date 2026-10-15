# Validation V2.1 — 15 octobre 2026

## Correctif des accès à la démo

La page locale `/demo/` ouvre admin et super admin sans saisir de mot de passe. Vérification dans le navigateur : les deux boutons ouvrent effectivement le tableau de bord du rôle choisi. Le lancement Windows `DEMO.cmd` appelle la commande de préparation `demo:ready` ; aucun serveur de développement supplémentaire n’est nécessaire.

Les 16 tests backend repassent après ce correctif. Le test de la démo couvre maintenant les redirections, le rôle et le cookie de session, l’accès aux commandes, le rejet des POST sans origine ou depuis une origine étrangère, le contrôle CSRF et la révocation après déconnexion. Le test du serveur normal confirme l’absence des routes `/demo/`, `/api/demo` et des deux entrées directes. Aucun paramètre d’activation n’a été ajouté au serveur de production.

## Vérifications automatisées

- `npm test` : **19 tests réussis** (3 frontend et 16 backend). Les suites backend sont exécutées séquentiellement pour éviter de lancer plusieurs moteurs PGlite lourds simultanément.
- `npm run build` : compilation de la vitrine, de l’administration et de la super administration.
- `docker compose config --quiet` : configuration valide, avec des valeurs de validation pour les secrets obligatoires.
- Migrations et seed idempotents, validation des commandes et recalcul des prix, protection CSRF du personnel, isolation des rôles et révocation des sessions existantes.
- Inscription sans OTP : refus de mauvaise origine et des coordonnées invalides, anciennes routes de code absentes, réutilisation de la session valide du navigateur, cookie persistant HttpOnly/Secure, empreinte seule en base, expiration et déconnexion.
- Commandes : session client obligatoire, refus d’un numéro différent du profil, aucune commande d’un autre client dans les réponses, historique des étapes. Une inscription depuis un autre navigateur avec le même numéro crée un espace distinct ; les commandes et modifications de profil restent isolées.
- SSE : réception d’une notification privée après changement du statut ; historique sans duplication lors d’un statut inchangé.
- TikTok : modification exclusivement dans les paramètres du super administrateur ; refus des écritures admin, suppression de la route `/social` et rejet des URL dangereuses.
- Photos : refus sans authentification ou sans CSRF, refus des fichiers falsifiés et trop volumineux, conversion WebP, métadonnées retirées, URL servie et enregistrement dans le menu.
- Migration 003 testée avec un profil, une session et une commande préexistants : données et relations conservées, plusieurs profils autorisés pour un même numéro, table des demandes de code supprimée.

## Vérifications dans le navigateur

Le 15 octobre, démo jetable sur un port distinct avec coordonnées fictives : inscription avec prénom, nom et numéro, ouverture immédiate de l’espace sans code, puis rechargement et réouverture de « Mon espace » avec la session conservée. Capture actuelle : `docs/v2.1-inscription-directe.jpg`.

Vérifications visuelles réalisées le 14 octobre avant le retrait de l’OTP (historique, non rejouées intégralement le 15 octobre) :

- Profil enregistré, coordonnées préremplies au panier.
- Commande de tacos à 12 000 FC, reçue dans l’administration.
- Changement « À confirmer » → « En préparation » visible dans l’espace client sans rechargement, puis « Terminée ».
- Rechargement du site et nouvel onglet : session et commandes retrouvées.
- Affichage client contrôlé à 320, 390 et 1440 pixels : pas de débordement horizontal du document ou du dialogue. Administration contrôlée à 320 pixels ; les tables utilisent leur défilement interne.
- Lien TikTok présent dans le pied de page public après configuration. Le réglage est désormais exclusivement dans les paramètres du super administrateur, après Instagram.
- Sélection d’un JPEG local, conversion et prévisualisation, copie de l’URL, puis enregistrement du plat dans la démo.
- Capture historique : `docs/v2.1-espace-client.jpg` (elle montre encore l’ancienne mention de numéro vérifié).

## Limites et recette avant production

L’OTP et son fournisseur ont été retirés. Aucun SMS ni déploiement VPS effectué. L’espace actuel est lié à la session du navigateur pendant 30 jours : après déconnexion, suppression des cookies ou expiration, le téléphone seul ne permet pas de récupérer l’historique. La récupération vérifiée sur plusieurs appareils est reportée à une version ultérieure.

PGlite exécute les migrations SQL mais ne valide pas la concurrence de plusieurs connexions PostgreSQL. Le moteur Docker local n’est pas disponible : la compilation des images Linux et la persistance du nouveau volume `menu-uploads` doivent être validées sur le serveur. Le test local vérifie la persistance des fichiers sur disque entre envoi et lecture, pas un redémarrage de conteneur.

La liste admin utilise une actualisation de 10 secondes ; le client utilise SSE et un secours de 15 secondes. Les flux SSE et les limiteurs IP supposent une seule instance d’API. Aucun changement n’a été apporté au Traefik central.
