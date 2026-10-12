export const categories = ['Tous', 'Tacos', 'Sandwichs', 'Plats & Frites', 'Boissons'];
export const heatLevels = ['Doux', 'Moyen', 'Fiery / Intense'];
export const photos = {
  tacos: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1200&q=85',
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=85',
  shawarma: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=85',
  chicken: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=900&q=85',
  fries: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=85',
  drink: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=900&q=85',
};
const sizes = (standard, xl, mega) => [{ name: 'Standard', price: standard }, ...(xl ? [{ name: 'XL', price: xl }] : []), ...(mega ? [{ name: 'Méga', price: mega }] : [])];
const item = (id, name, category, description, image, variants, badge = '') => ({ id, name, category, description, image, variants, badge, spicy: category !== 'Boissons' });

// Prix transcrits de Presentation/IMG-20261012-WA0042.jpg. Aucun taux de change appliqué.
export const menu = [
  item('tacos-poulet', 'Tacos poulet', 'Tacos', 'Poulet, frites croustillantes et notre sauce fromagère signature. Le trio qui fait tout.', photos.tacos, sizes(12000, 14000, 25000), 'LA SIGNATURE'),
  item('shawarma-poulet', 'Shawarma poulet', 'Sandwichs', 'Du poulet savoureux, une galette roulée et une bonne dose de gourmandise.', photos.shawarma, sizes(12000)),
  item('poulet-frites', 'Poulet & frites', 'Plats & Frites', 'Poulet, frites dorées et salade fraîche. Une assiette qui voit grand.', photos.chicken, sizes(15000), 'GÉNÉREUX'),
  item('tacos-compose', 'Tacos composé', 'Tacos', 'Des viandes, des frites et la sauce fromagère signature. Toute la démesure Spicy.', photos.tacos, sizes(20000, 25000, 35000), 'POUR LES GRANDES FAIMS'),
  item('sandwich-viande', 'Sandwich viande', 'Sandwichs', 'Du pain, de la viande savoureuse et une garniture fraîche. Simplement irrésistible.', photos.sandwich, sizes(5000, 10000)),
  item('frites', 'Frites dorées', 'Plats & Frites', 'Croustillantes à souhait. À partager… ou à garder pour soi.', photos.fries, sizes(5000)),
  item('tacos-viande', 'Tacos viande', 'Tacos', 'Viande, frites et sauce fromagère, généreusement réunies dans une tortilla.', photos.tacos, sizes(15000, 20000, 30000)),
  item('shawarma-viande', 'Shawarma viande', 'Sandwichs', 'Une galette roulée, de la viande et des saveurs qui ne passent pas inaperçues.', photos.shawarma, sizes(15000)),
  item('sandwich-simple', 'Sandwich simple', 'Sandwichs', 'Le petit plaisir street food, avec une garniture fraîche et de la gourmandise.', photos.sandwich, sizes(3000, 6000)),
  item('saucisses-frites', 'Saucisses & frites', 'Plats & Frites', 'Saucisses, frites et salade. Le bon plan pour une vraie pause gourmande.', photos.fries, sizes(10000)),
  item('viande-frites', 'Viande & frites', 'Plats & Frites', 'Viande, frites et salade fraîche : le grand classique version généreuse.', photos.chicken, sizes(20000)),
  item('salade', 'Salade', 'Plats & Frites', 'Une touche de fraîcheur pour accompagner votre commande.', photos.sandwich, sizes(2000)),
  item('plantain', 'Banane plantain', 'Plats & Frites', 'L’accompagnement gourmand qui a toute sa place à côté de vos favoris.', photos.fries, sizes(6000)),
  item('campus', 'Combo Campus', 'Plats & Frites', 'Sandwich simple Standard, frites et Fanta ou Coca-Cola.', photos.sandwich, sizes(10000), 'COMBO'),
  item('express', 'Combo Express', 'Plats & Frites', 'Shawarma poulet, frites et Coca-Cola.', photos.shawarma, sizes(15500), 'COMBO'),
  item('spicy-xl', 'Combo Spicy XL', 'Plats & Frites', 'Tacos composé XL, grande frite, plantain et Fanta.', photos.tacos, sizes(25000), 'COMBO'),
  item('mega-king', 'Combo Méga King', 'Plats & Frites', 'Méga tacos composé, grande frite, plantain et Malta.', photos.tacos, sizes(39000), 'COMBO'),
  item('duo', 'Duo Spicy', 'Plats & Frites', '2 shawarmas poulet, grande frite et 2 boissons au choix.', photos.shawarma, sizes(19000), 'À DEUX'),
  item('coca', 'Coca-Cola', 'Boissons', 'La pause fraîcheur pour accompagner votre street food.', photos.drink, sizes(2000)),
  item('eau', 'Eau', 'Boissons', 'Tout simplement rafraîchissante.', photos.drink, sizes(1500)),
  item('fanta', 'Fanta', 'Boissons', 'Une touche fruitée avec votre commande.', photos.drink, sizes(2000)),
  item('malta', 'Malta Guinness', 'Boissons', 'Une boisson maltée pour compléter votre repas.', photos.drink, sizes(2000)),
];
