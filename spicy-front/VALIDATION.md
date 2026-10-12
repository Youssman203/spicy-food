# Vérifications du 12 octobre 2026

- `npm run build` : compilation de production réussie ; sortie dans `dist/`.
- `npm test` : 3 tests réussis (variantes et fusion du panier, total, encodage WhatsApp et intégrité du catalogue).
- Aperçu Vite : réponse HTTP 200.
- Contrôle dans le navigateur : largeurs 320, 390, 768 et 1440 pixels ; aucun débordement horizontal du document après corrections. La barre des catégories défile horizontalement sur mobile.
- Images de la vue principale, logo et photo du truck : chargement vérifié. Une URL Unsplash indisponible a été remplacée.
- Parcours vérifié : tacos poulet XL, piment intense, ajout au panier, passage à deux portions (28 000 FC), choix de Kolwezi et note. Le lien WhatsApp reprend correctement ces informations. Aucun message n’a été envoyé.
- Filtre Tacos : trois produits attendus. Menu mobile : ouverture, navigation vers les villes et fermeture automatique.
- Fenêtres : fermeture par Échap et par bouton ; retrait d’un article et état du panier vide vérifiés.

Les photos culinaires demeurent des illustrations externes. Les adresses exactes, horaires, disponibilités et frais de livraison ne sont pas fournis par les références et doivent être confirmés directement auprès de Spicy. La commande utilise WhatsApp, sans backend ni paiement en ligne.
