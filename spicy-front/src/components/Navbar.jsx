import { useState } from 'react';
import { Menu, X, ShoppingBag, ArrowUpRight } from 'lucide-react';
import Brand from './Brand';

const links = [['Accueil', 'accueil'], ['Notre Menu', 'menu'], ['Nos Villes', 'villes'], ['À propos', 'a-propos'], ['Contact', 'contact']];
export default function Navbar({ count, onCart }) {
  const [open, setOpen] = useState(false);
  return <header className="navbar">
    <div className="nav-inner shell">
      <Brand />
      <nav className="desktop-nav" aria-label="Navigation principale">{links.map(([label, id]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav>
      <div className="nav-actions">
        <button className="button button-fire nav-order" onClick={onCart}><ShoppingBag size={16} /><span>Commander</span>{count > 0 ? <b className="cart-count">{count}</b> : <ArrowUpRight size={16} />}</button>
        <button className="icon-button mobile-toggle" aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
    </div>
    {open && <nav id="mobile-navigation" className="mobile-nav" aria-label="Navigation mobile" onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}>{links.map(([label, id]) => <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>{label}<ArrowUpRight size={17} /></a>)}</nav>}
  </header>;
}
