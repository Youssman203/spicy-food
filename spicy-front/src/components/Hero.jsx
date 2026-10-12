import { ArrowDown, ArrowUpRight, Flame, MapPin, Sparkles } from 'lucide-react';
import { photos } from '../data/menu';
import FoodImage from './FoodImage';

export default function Hero() {
  return <>
    <section id="accueil" className="hero shell">
      <div className="hero-copy">
        <p className="eyebrow"><span className="live-dot" /> LUBUMBASHI & KOLWEZI</p>
        <h1>LE VRAI GOÛT<br />DE LA <span>DÉMESURE<span className="full-stop">.</span></span></h1>
        <p className="hero-description"><strong>Adoré à Lubumbashi & Kolwezi.</strong><br />Tacos, sandwichs et plats généreux<br className="desktop-break" /> préparés à la minute.</p>
        <div className="hero-actions"><a href="#menu" className="button button-fire">Voir le Menu <ArrowUpRight size={19} /></a><a href="#villes" className="button button-outline"><MapPin size={17} /> Trouver un Truck</a></div>
        <div className="hero-footnote"><span className="mini-flames"><Flame /><Flame /><Flame /></span><span>Du goût. Du caractère. <strong>Du Spicy.</strong></span></div>
      </div>
      <div className="hero-visual">
        <div className="visual-coordinate">STREET FOOD / RDC</div>
        <FoodImage priority className="hero-image" src={photos.tacos} alt="Tacos généreusement garnis, citron vert et salsa — photographie d’illustration" />
        <div className="hero-image-shade" />
        <div className="adore-stamp"><Sparkles size={20} /><strong>ADORÉ.</strong><span>À LA PREMIÈRE BOUCHÉE</span></div>
        <div className="hero-food-caption"><div><span>GÉNÉREUX PAR NATURE.</span><strong>Spicy par passion.</strong></div><a href="#menu" className="round-link" aria-label="Découvrir nos tacos"><ArrowUpRight /></a></div>
        <span className="photo-credit">Photo d’illustration · Unsplash</span>
      </div>
      <a className="scroll-cue" href="#menu"><ArrowDown size={15} /> LA SUITE EST ENCORE MEILLEURE</a>
    </section>
    <div className="ticker" aria-label="Street food, généreux par nature, sauce signature, authentique et épicé"><div>STREET FOOD, REAL MOOD <span>✳</span> GÉNÉREUX PAR NATURE <span>✳</span> SAUCE SIGNATURE <span>✳</span> AUTHENTIC & FIERY <span>✳</span> ADORÉ. <span>✳</span></div></div>
  </>;
}
