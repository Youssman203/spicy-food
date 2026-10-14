import { useState } from 'react';
import { Plus } from 'lucide-react';
import Dialog from './Dialog';
import { heatLevels } from '../data/menu';
import { money } from '../lib/order';

export default function ProductDialog({ product, onClose, onAdd }) {
  const [size, setSize] = useState(0);
  const [heat, setHeat] = useState(product.spiciness_level || 'Doux');
  return <Dialog title={product.name} onClose={onClose}><p className="dialog-description">{product.description}</p>
    <fieldset className="option-field"><legend>Ta portion</legend><div className="size-options">{product.variants.map((variant, index) => <label className={size === index ? 'selected' : ''} key={variant.name}><input type="radio" name="size" checked={size === index} onChange={() => setSize(index)} /><span>{variant.name}</span><strong>{money(variant.price)}</strong></label>)}</div></fieldset>
    {product.spicy && <fieldset className="option-field"><legend>Tu aimes quand ça chauffe ?</legend><div className="heat-options">{heatLevels.map((level, index) => <label key={level} className={heat === level ? 'selected' : ''}><input type="radio" name="heat" checked={heat === level} onChange={() => setHeat(level)} /><span aria-hidden="true">{'🌶️'.repeat(index + 1)}</span><strong>{level}</strong></label>)}</div></fieldset>}
    <button className="button button-fire dialog-submit" onClick={() => { onAdd(product, product.variants[size], product.spicy ? heat : ''); onClose(); }}><Plus size={18} /> Ajouter au panier <span>{money(product.variants[size].price)}</span></button>
  </Dialog>;
}
