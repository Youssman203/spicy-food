import { Leaf, Timer, Flame } from 'lucide-react';
const pillars = [
  { Icon: Leaf, number: '01', title: 'DU FRAIS. POINT.', text: 'Des ingrédients frais, des garnitures généreuses et des plats préparés à la minute. Le goût commence ici.' },
  { Icon: Timer, number: '02', title: 'LA RUE N’ATTEND PAS.', text: 'Une pause entre deux rendez-vous ou une sortie entre amis : l’esprit street food, servi avec le sourire.' },
  { Icon: Flame, number: '03', title: 'LA TOUCHE SPICY.', text: 'Nos recettes ont du caractère. Notre sauce fromagère signature aussi. Et le niveau de piment ? C’est toi qui décides.' },
];
export default function About() {
  return <section id="a-propos" className="about-section"><div className="shell section"><div className="about-intro"><div><p className="eyebrow text-orange">03 / PAS JUSTE UN FOOD TRUCK</p><h2>DU CŒUR.<br />ET DU <span className="text-fire">CARACTÈRE.</span></h2></div><p>Née en RDC, Spicy rassemble tout ce qu’on aime : la convivialité de la rue, les recettes qui régalent et cette générosité qui donne envie de revenir.</p></div><div className="pillars">{pillars.map(({ Icon, number, title, text }) => <article key={number}><div className="pillar-top"><Icon size={29} /><span>{number}</span></div><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>;
}
