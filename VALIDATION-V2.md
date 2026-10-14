# Validation V2 — 14 octobre 2026

## Correctif des accès de démonstration

- Le script affiche séparément les liens `/admin/` et `/superadmin/`, leurs emails exacts et le mot de passe commun de la session active.
- Entrée dans le terminal réaffiche les accès sans changer le mot de passe.
- Les origines `127.0.0.1` et `localhost` sont acceptées uniquement pour le port de cette démo locale. La configuration de production est inchangée.
- Un test supplémentaire lance réellement le script sur un port libre, récupère ses accès, vérifie la connexion et la session des deux rôles depuis les deux origines, le rejet d’un mauvais mot de passe et le réaffichage à l’identique. **9 tests backend réussis** après ce correctif ; les 3 tests frontend précédents ne sont pas affectés.

## Vérifications réussies

- `npm test` : **11 tests réussis** (3 tests du panier/catalogue V1 conservés et 8 tests d’intégration V2).
- API exécutée avec Express et PostgreSQL embarqué PGlite : migrations et seed réexécutables, catalogue officiel de 22 produits, contacts, CRUD menu, recherche CRM, statuts de commande, paramètres et gestion des comptes.
- Sécurité : cookies HttpOnly/Secure/SameSite, audiences et chemins de session distincts, refus de la session admin dans l’espace super admin, refus des permissions super admin pour un admin, contrôle d’origine et CSRF, révocation au logout et à la suppression d’un compte.
- Commandes : adresse obligatoire, rejet d’un total injecté, prix recalculés, transaction client/commande, normalisation du téléphone, compteur unique par tentative, rejeu idempotent, rejet d’un contenu modifié avec la même clé, rejet des produits indisponibles et portions inconnues.
- Flux SSE : réception d’un événement après modification des paramètres.
- `npm run build` : trois compilations de production réussies (vitrine, admin, super admin).
- `docker compose config --quiet` : fichier de production valide avec valeurs de validation non sensibles injectées uniquement dans le processus. Six services : cinq applications persistantes et un job de migration.
- `git diff --check` : absence d’erreurs d’espacement après nettoyage.

## Parcours dans le navigateur

Exécution locale sur une base jetable, sans contact avec la production ni envoi WhatsApp.

- Vitrine : choix Tacos poulet XL / Fiery, deux portions, Kolwezi, nom et WhatsApp de démonstration. Le formulaire bloque une adresse vide. Une adresse de test permet d’enregistrer la commande ; confirmation **28 000 FC**, référence et lien WhatsApp présents.
- Super admin : connexion, commande retrouvée dans le tableau, client retrouvé dans le CRM avec adresse et compteur `1`.
- Carte : modification du prix Standard de 12 000 à 13 000 FC dans la base jetable ; prix actualisé sur la vitrine. Les prix de seed livrés restent ceux de la V1.
- Paramètres : annonce enregistrée puis affichée sur la vitrine. Après intégration SSE, une deuxième annonce apparaît dans un onglet déjà ouvert sans rechargement manuel, en moins de dix secondes.
- Isolation visible : ouvrir `/admin/` après connexion à `/superadmin/` affiche un formulaire de connexion distinct. Le compte standard ne voit que Commandes, La carte et Clients.
- Responsive : vitrine contrôlée à 320, 390 et 1440 px ; administration à 320, 390, 768 et 1440 px. Aucun débordement horizontal du document mesuré. Les tableaux et la navigation ont leur propre défilement sur les petits écrans.
- Images de la carte chargées ; capture du tableau de gestion dans `spicy-admin/docs/apercu-v2.png`.

## Limites de cette validation

Le moteur Docker Desktop local est arrêté : la construction des images Linux, le démarrage sous PostgreSQL 17 natif, le routage Traefik, le certificat HTTPS et la sauvegarde/restauration en conteneur n’ont pas été exécutés ici. Les étapes de contrôle correspondantes figurent dans le README. Le moteur PGlite exécute réellement le SQL, mais ces tests séquentiels ne constituent pas un test de charge ni de concurrence entre plusieurs connexions PostgreSQL.

Les événements temps réel et le limiteur HTTP sont locaux à une instance API, conformément au Compose fourni. Un déploiement à plusieurs réplicas demanderait une diffusion d’événements et un limiteur partagés.

Aucun accès VPS, aucune modification de DNS, aucun compte réel et aucun déploiement en production n’ont été effectués.
