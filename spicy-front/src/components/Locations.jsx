import { ArrowUpRight, MapPin, MessageCircle } from 'lucide-react';
import { useSettings, contactLink } from '../lib/SiteContext';

export default function Locations() { const settings=useSettings(); const whatsapp=message=>contactLink(settings,message);
  return <section id="villes" className="locations section shell">
    <div className="section-heading"><div><p className="eyebrow text-orange">02 / RETROUVE LE FEU</p><h2>DEUX VILLES.<br />UNE MÊME <span className="text-fire">FLAMME.</span></h2></div><p className="heading-aside">Repère le truck noir et orange. <br />Suis l’odeur. Tu y es presque.</p></div>
    <div className="locations-layout"><div className="truck-photo"><img src="./images/truck-original.jpg" alt="Le véritable food truck Spicy, noir et orange, à Kolwezi" loading="lazy" /><div className="truck-caption"><span className="live-dot" /> LE GOÛT SE VIT DANS LA RUE.</div></div>
      <div className="city-list">{[{ name: 'Lubumbashi', region: 'HAUT-KATANGA', copy: 'Au cœur de la ville, au plus près de ta faim. Retrouve notre équipe et tes favoris Spicy.' }, { name: 'Kolwezi', region: 'LUALABA', copy: 'En ville, aux événements et aux foires. Le truck bouge, la gourmandise reste. Livraison disponible.' }].map((city, i) => <article className="city-card" key={city.name}><div className="city-top"><span className="city-number">0{i + 1}</span><span><MapPin size={13} /> {city.region}</span></div><h3>{city.name}<span className="text-fire">.</span></h3><p>{city.copy}</p><a aria-disabled={!settings?.infoline_phone} href={whatsapp(`Bonjour Spicy ! Où se trouve votre truck à ${city.name} aujourd’hui, et quels sont les horaires ?`)} target="_blank" rel="noreferrer">Demander la position <ArrowUpRight size={20} /></a></article>)}</div>
    </div><p className="location-note"><MessageCircle size={15} /> Les emplacements et horaires peuvent varier. Un message et on te guide.</p>
  </section>;
}
