import { ArrowUpRight, Instagram, Phone, MessageCircle } from 'lucide-react';
import { INSTAGRAM, PHONE, whatsapp } from '../lib/order';
import Brand from './Brand';

export default function Footer() {
  return <footer id="contact"><div className="contact-banner shell"><div><p className="eyebrow">ON GARDE UNE PLACE POUR TA FAIM.</p><h2>ON SE FAIT<br />UN <span>SPICY ?</span></h2></div><div className="contact-actions"><a className="button button-dark" href={whatsapp('Bonjour Spicy ! J’aimerais avoir des informations sur vos food trucks.')} target="_blank" rel="noreferrer"><MessageCircle size={20} /> Écris-nous sur WhatsApp <ArrowUpRight size={18} /></a><a className="contact-phone" href={`tel:+${PHONE}`}><Phone size={17} /> 0977 105 688</a></div></div><div className="footer-main shell"><Brand /><p>Le vrai goût de la démesure.<br /><span>Lubumbashi & Kolwezi · RD Congo</span></p><a className="instagram-link" href={INSTAGRAM} target="_blank" rel="noreferrer"><Instagram size={20} /> @spicyfood.drc <ArrowUpRight size={15} /></a></div><div className="footer-bottom shell"><span>© {new Date().getFullYear()} Spicy Food Truck. Tous droits réservés.</span><span className="footer-adore">ADORÉ<span className="text-fire">.</span></span><a href="#accueil">Retour en haut ↑</a></div></footer>;
}
