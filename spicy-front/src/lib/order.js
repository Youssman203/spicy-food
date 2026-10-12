export const PHONE = '243977105688';
export const INSTAGRAM = 'https://www.instagram.com/spicyfood.drc?exln=bXEzb2ZkYjl3NGxx';
export const money = (value) => `${new Intl.NumberFormat('fr-CD').format(value)} FC`;
export const whatsapp = (message) => `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
export const lineKey = (id, size, heat) => `${id}:${size}:${heat}`;
export const totalPrice = (lines) => lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
export function addToCart(lines, product, variant, heat) {
  const key = lineKey(product.id, variant.name, heat);
  const existing = lines.find((line) => line.key === key);
  if (existing) return lines.map((line) => line.key === key ? { ...line, quantity: Math.min(99, line.quantity + 1) } : line);
  return [...lines, { key, id: product.id, name: product.name, size: variant.name, price: variant.price, heat, quantity: 1 }];
}
export function orderMessage(lines, city, note = '') {
  return [
    `Bonjour Spicy ! Je souhaite commander à ${city} :`, '',
    ...lines.map((line) => `• ${line.quantity} × ${line.name} (${line.size}${line.heat ? `, piment ${line.heat}` : ''}) — ${money(line.price * line.quantity)}`),
    '', `Total des articles : ${money(totalPrice(lines))}`,
    ...(note.trim() ? [`Note : ${note.trim()}`] : []),
    'Pouvez-vous confirmer la disponibilité, le total avec éventuels frais et les modalités de retrait ou de livraison ? Merci !',
  ].join('\n');
}
