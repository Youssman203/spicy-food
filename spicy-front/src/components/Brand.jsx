import { Flame } from 'lucide-react';

export default function Brand() {
  return <a className="brand" href="#accueil" aria-label="Spicy Food Truck — Accueil">
    <span className="brand-symbol"><img src="./images/logo-original.jpg" alt="" width="48" height="48" /><Flame size={15} strokeWidth={2} aria-hidden="true" /></span>
    <span><strong>SPICY<span className="text-fire">.</span></strong><small>FOOD TRUCK</small></span>
  </a>;
}
