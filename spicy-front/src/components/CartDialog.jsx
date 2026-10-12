import { useState } from 'react';
import { ArrowUpRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import Dialog from './Dialog';
import { money, orderMessage, totalPrice, whatsapp } from '../lib/order';

export default function CartDialog({ lines, onClose, onQuantity, onRemove }) {
  const [city, setCity] = useState('Lubumbashi');
  const [note, setNote] = useState('');
  return <Dialog title="TA DOSE DE SPICY." onClose={onClose} wide>{lines.length === 0 ? <div className="empty-cart"><ShoppingBag size={48} /><h3>Une petite faim ?</h3><p>Ton panier attend ses premières saveurs.</p><a className="button button-fire" href="#menu" onClick={onClose}>Explorer le menu <ArrowUpRight size={18} /></a></div> : <>
    <div className="cart-lines">{lines.map((line) => <article className="cart-line" key={line.key}><div><h3>{line.name}</h3><p>{line.size}{line.heat && ` · ${line.heat}`}</p><strong>{money(line.price * line.quantity)}</strong></div><div className="line-controls"><button className="remove-button" onClick={() => onRemove(line.key)} aria-label={`Retirer ${line.name}`}><Trash2 size={16} /></button><div className="quantity-controls"><button aria-label={`Diminuer la quantité de ${line.name}`} disabled={line.quantity <= 1} onClick={() => onQuantity(line.key, -1)}><Minus size={15} /></button><span aria-label="Quantité">{line.quantity}</span><button aria-label={`Augmenter la quantité de ${line.name}`} disabled={line.quantity >= 99} onClick={() => onQuantity(line.key, 1)}><Plus size={15} /></button></div></div></article>)}</div>
    <div className="checkout-fields"><label htmlFor="order-city">Dans quelle ville ?</label><select id="order-city" value={city} onChange={(e) => setCity(e.target.value)}><option>Lubumbashi</option><option>Kolwezi</option></select><label htmlFor="order-note">Une précision ? <span>(facultatif)</span></label><textarea id="order-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} placeholder="Boissons du combo, retrait ou livraison…" /></div>
    <div className="cart-total" aria-live="polite"><span>Total des articles</span><strong>{money(totalPrice(lines))}</strong></div><p className="checkout-note">Disponibilité, horaires et éventuels frais de livraison à confirmer avec l’équipe. Aucun paiement en ligne.</p>
    <a className="button button-fire dialog-submit" href={whatsapp(orderMessage(lines, city, note))} target="_blank" rel="noreferrer">Continuer sur WhatsApp <ArrowUpRight size={20} /></a><p className="checkout-fineprint">Le message sera préparé. Tu pourras le vérifier avant de l’envoyer.</p>
  </>}</Dialog>;
}
