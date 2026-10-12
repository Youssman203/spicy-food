import { useState } from 'react';
import { ArrowDown, ArrowUpRight, Flame, Plus, Utensils, Sandwich, CupSoda, LayoutGrid } from 'lucide-react';
import { categories, menu } from '../data/menu';
import { money } from '../lib/order';
import FoodImage from './FoodImage';

const icons = [LayoutGrid, Flame, Sandwich, Utensils, CupSoda];
export default function MenuSection({ onSelect }) {
  const [category, setCategory] = useState('Tous');
  const [expanded, setExpanded] = useState(false);
  const filtered = menu.filter((item) => category === 'Tous' || item.category === category);
  const visible = expanded ? filtered : filtered.slice(0, 6);
  return <section id="menu" className="section shell menu-section">
    <div className="section-heading"><div><p className="eyebrow text-orange">01 / ÇA VA CHAUFFER</p><h2>LA FAIM JUSTIFIE<br />LES <span className="text-fire">MOYENS.</span></h2></div><div className="heading-aside"><p>Des recettes qui claquent. <br />Des portions qui ne trichent pas.</p><a href="./images/menu-officiel.jpg" target="_blank" rel="noreferrer" className="text-link">La carte originale <ArrowUpRight size={16} /></a></div></div>
    <div className="menu-filters" role="group" aria-label="Filtrer les plats">{categories.map((name, i) => { const Icon = icons[i]; return <button key={name} aria-pressed={category === name} className={`filter-chip ${category === name ? 'active' : ''}`} onClick={() => { setCategory(name); setExpanded(false); }}><Icon size={16} />{name}</button>; })}</div>
    <p className="sr-only" aria-live="polite">{filtered.length} produits dans la catégorie {category}</p>
    <div className="food-grid">{visible.map((item) => <article className="food-card rounded-3xl" key={item.id}>
      <button className="food-photo-button" onClick={() => onSelect(item)} aria-label={`Personnaliser ${item.name}`}><FoodImage src={item.image} alt={`${item.name} — photo d’illustration`} />{item.badge && <span className="food-badge">{item.badge}</span>}<span className="image-arrow"><ArrowUpRight size={20} /></span></button>
      <div className="food-content"><div className="food-meta"><span>{item.category}</span><span>{item.spicy ? <><Flame size={13} /> Piment au choix</> : <><CupSoda size={13} /> Bien frais</>}</span></div><h3>{item.name}</h3><p>{item.description}</p><div className="food-bottom"><div>{item.variants.length > 1 && <small>À PARTIR DE</small>}<strong>{money(item.variants[0].price)}</strong></div><button className="add-button" onClick={() => onSelect(item)} aria-label={`Ajouter ${item.name}`}><Plus size={20} /><span>Ajouter</span></button></div></div>
    </article>)}</div>
    <div className="menu-bottom"><p>Photos d’illustration · Prix en francs congolais (FC).</p>{filtered.length > 6 && <button className="button button-outline" onClick={() => setExpanded(!expanded)}>{expanded ? 'Voir moins' : `Voir les ${filtered.length} produits`}<ArrowDown size={17} className={expanded ? 'rotate-180' : ''} /></button>}</div>
  </section>;
}
