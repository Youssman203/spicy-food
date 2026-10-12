import { useEffect, useState } from 'react';
import { Check, ShoppingBag, ArrowUpRight } from 'lucide-react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MenuSection from './components/MenuSection';
import Locations from './components/Locations';
import About from './components/About';
import Footer from './components/Footer';
import ProductDialog from './components/ProductDialog';
import CartDialog from './components/CartDialog';
import { addToCart, money, totalPrice } from './lib/order';

export default function App() {
  const [lines, setLines] = useState([]);
  const [product, setProduct] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 3500); return () => clearTimeout(timer); }, [toast]);
  function add(product, variant, heat) {
    setLines((current) => addToCart(current, product, variant, heat));
    setToast({ name: product.name });
  }
  return <>
    <a className="skip-link" href="#menu">Aller au menu</a>
    <Navbar count={count} onCart={() => setCartOpen(true)} />
    <main><Hero /><MenuSection onSelect={setProduct} /><Locations /><About /></main>
    <Footer />
    {count > 0 && !cartOpen && !product && <button className="floating-cart" onClick={() => setCartOpen(true)}><ShoppingBag size={18} /><span>Mon panier <b>{count}</b></span><strong>{money(totalPrice(lines))}</strong><ArrowUpRight size={19} /></button>}
    <div className="toast-region" role="status" aria-live="polite">{toast && <div className="toast"><Check size={17} />{toast.name} ajouté au panier</div>}</div>
    {product && <ProductDialog product={product} onClose={() => setProduct(null)} onAdd={add} />}
    {cartOpen && <CartDialog lines={lines} onClose={() => setCartOpen(false)} onQuantity={(key, delta) => setLines((current) => current.map((line) => line.key === key ? { ...line, quantity: Math.max(1, Math.min(99, line.quantity + delta)) } : line))} onRemove={(key) => setLines((current) => current.filter((line) => line.key !== key))} />}
  </>;
}
