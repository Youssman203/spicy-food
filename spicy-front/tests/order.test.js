import test from 'node:test';
import assert from 'node:assert/strict';
import { menu } from '../src/data/menu.js';
import { addToCart, orderMessage, totalPrice, whatsapp } from '../src/lib/order.js';

test('le panier fusionne les choix identiques et sépare les formats et piments', () => {
  const taco = menu.find((item) => item.id === 'tacos-poulet');
  let lines = addToCart([], taco, taco.variants[0], 'Doux');
  lines = addToCart(lines, taco, taco.variants[0], 'Doux');
  lines = addToCart(lines, taco, taco.variants[1], 'Doux');
  lines = addToCart(lines, taco, taco.variants[0], 'Fiery / Intense');
  assert.equal(lines.length, 3);
  assert.equal(lines[0].quantity, 2);
  assert.equal(totalPrice(lines), 50000);
});

test('le récapitulatif WhatsApp conserve accents, choix, ville et quantités', () => {
  const taco = menu.find((item) => item.id === 'tacos-compose');
  const lines = addToCart([], taco, taco.variants[2], 'Fiery / Intense');
  const message = orderMessage(lines, 'Kolwezi', 'Sans oignon & retrait');
  const url = new URL(whatsapp(message));
  assert.equal(url.pathname, '/243977105688');
  assert.equal(url.searchParams.get('text'), message);
  assert.match(message, /Kolwezi/);
  assert.match(message, /Méga, piment Fiery/);
  assert.match(message, /Sans oignon & retrait/);
  assert.match(message, /confirmer la disponibilité/);
});

test('le catalogue possède des identifiants uniques et des prix valides', () => {
  assert.equal(new Set(menu.map((item) => item.id)).size, menu.length);
  for (const product of menu) {
    assert.ok(product.variants.length > 0);
    for (const variant of product.variants) assert.ok(Number.isInteger(variant.price) && variant.price > 0);
  }
  assert.equal(menu.find((item) => item.id === 'eau').variants[0].price, 1500);
});
