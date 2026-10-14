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
import { request, toProduct } from './lib/api';
import { SiteContext } from './lib/SiteContext';

export default function App() {
  const [lines, setLines] = useState([]);
  const [product, setProduct] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [menu, setMenu] = useState([]);
  const [settings, setSettings] = useState(null);
  const [menuError, setMenuError] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    async function refresh() {
      await Promise.allSettled([
        request('/menu').then(data => { if(active){setMenu(data.map(toProduct));setMenuError('');} }).catch(() => {if(active)setMenuError('La carte ne peut pas être actualisée. Réessayez dans un instant.');}).finally(()=>{if(active)setLoading(false);}),
        request('/settings').then(data => {if(active){setSettings(data);setSettingsError('');}}).catch(()=>{if(active)setSettingsError('Les contacts ne peuvent pas être actualisés.');}),
      ]);
    }
    refresh(); const timer=setInterval(refresh,30000);
    const events=new EventSource('/api/events');
    events.addEventListener('refresh',refresh);
    const onVisible=()=>{if(document.visibilityState==='visible')refresh();};
    document.addEventListener('visibilitychange',onVisible);
    return ()=>{active=false;clearInterval(timer);events.close();document.removeEventListener('visibilitychange',onVisible);};
  }, []);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 3500); return () => clearTimeout(timer); }, [toast]);
  function add(product, variant, heat) {
    setLines((current) => addToCart(current, product, variant, heat));
    setToast({ name: product.name });
  }
  return <SiteContext.Provider value={settings}>
    <a className="skip-link" href="#menu">Aller au menu</a>
    <Navbar count={count} onCart={() => setCartOpen(true)} />
    {settings?.site_notice && <p className="site-notice">{settings.site_notice}</p>}
    <main><Hero /><MenuSection onSelect={setProduct} menu={menu} loading={loading} error={menuError} /><Locations /><About /></main>
    {settingsError && <p className="shell api-error" role="status">{settingsError}</p>}
    <Footer />
    {count > 0 && !cartOpen && !product && <button className="floating-cart" onClick={() => setCartOpen(true)}><ShoppingBag size={18} /><span>Mon panier <b>{count}</b></span><strong>{money(totalPrice(lines))}</strong><ArrowUpRight size={19} /></button>}
    <div className="toast-region" role="status" aria-live="polite">{toast && <div className="toast"><Check size={17} />{toast.name} ajouté au panier</div>}</div>
    {product && <ProductDialog product={product} onClose={() => setProduct(null)} onAdd={add} />}
    {cartOpen && <CartDialog lines={lines} onOrdered={() => setLines([])} onClose={() => setCartOpen(false)} onQuantity={(key, delta) => setLines((current) => current.map((line) => line.key === key ? { ...line, quantity: Math.max(1, Math.min(99, line.quantity + delta)) } : line))} onRemove={(key) => setLines((current) => current.filter((line) => line.key !== key))} />}
  </SiteContext.Provider>;
}
