import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle, Clock, Flame, Smartphone } from 'lucide-react';
import { useCustomer } from '../lib/CustomerContext';
import { request } from '../lib/api';
import { money } from '../lib/order';
import Dialog from './Dialog';

export const statuses={pending:'À confirmer',preparing:'En préparation',completed:'Terminée',cancelled:'Annulée'};
const date=value=>new Date(value).toLocaleString('fr-CD',{timeZone:'Africa/Lubumbashi',dateStyle:'medium',timeStyle:'short'});

export function CustomerAccess(){
 const {setCustomer}=useCustomer();
 const [form,setForm]=useState({first_name:'',last_name:'',phone:''}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const inFlight=useRef(false);
 async function register(e){e.preventDefault();if(inFlight.current)return;inFlight.current=true;setBusy(true);setError('');try{setCustomer(await request('/customer/register',{method:'POST',body:form}));}catch(e){setError(e.message);}finally{inFlight.current=false;setBusy(false);}}
 return <div className="customer-access"><span className="customer-icon"><Smartphone size={27}/></span><p className="eyebrow text-orange">TA FAIM A SON ESPACE.</p><h3>Bienvenue chez toi.</h3><p>Renseigne tes coordonnées pour commander et suivre la préparation. Aucun mot de passe ni code à saisir.</p><form className="checkout-fields" onSubmit={register}>{[['first_name','Prénom','given-name'],['last_name','Nom','family-name'],['phone','Numéro WhatsApp','tel']].map(([key,label,auto])=><label key={key}>{label}<input required disabled={busy} autoComplete={auto} type={key==='phone'?'tel':'text'} maxLength={key==='phone'?32:80} placeholder={key==='phone'?'0977105688':undefined} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}<button className="button button-fire" disabled={busy}>{busy?'Création de ton espace…':'Créer mon espace'}<ArrowRight size={17}/></button><small>Ton espace reste ouvert 30 jours sur ce navigateur. Après une déconnexion, une suppression des cookies ou sur un autre appareil, ton numéro seul ne permet pas de retrouver tes anciennes commandes.</small></form>{error&&<p className="api-error" role="alert">{error}</p>}</div>;
}
function Profile(){
 const {customer,setCustomer}=useCustomer();
 const [form,setForm]=useState(()=>({first_name:customer.first_name,last_name:customer.last_name,phone:customer.phone,address:customer.address,location:customer.location})),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);
 async function save(e){e.preventDefault();setBusy(true);setError('');setSaved(false);try{setCustomer(await request('/customer/profile',{method:'PUT',body:form}));setSaved(true);}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <form onSubmit={save} className="checkout-fields"><p>Ces informations préremplissent tes prochaines commandes.</p>{[['first_name','Prénom','given-name'],['last_name','Nom','family-name']].map(([key,label,auto])=><label key={key}>{label}<input required maxLength={80} autoComplete={auto} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}<label>Numéro WhatsApp<input required type="tel" autoComplete="tel" maxLength={32} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label>Ville<select value={form.location} onChange={e=>setForm({...form,location:e.target.value})}><option>Lubumbashi</option><option>Kolwezi</option></select></label><label>Adresse de livraison<textarea required minLength={5} maxLength={1000} autoComplete="street-address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label>{error&&<p className="api-error" role="alert">{error}</p>}{saved&&<p role="status">Tes informations sont enregistrées.</p>}<button className="button button-fire" disabled={busy}>{busy?'Enregistrement…':'Enregistrer mes informations'}</button></form>;
}

function CustomerOrders(){
 const {refresh:refreshSession}=useCustomer();
 const [data,setData]=useState({items:[],total:0}),[page,setPage]=useState(1),[error,setError]=useState(''),[loading,setLoading]=useState(true),[live,setLive]=useState(false);
 useEffect(()=>{
  let active=true,inFlight=false;
  const refresh=async()=>{if(inFlight)return;inFlight=true;try{const d=await request(`/customer/orders?page=${page}`);if(active){setData(d);setError('');}}catch(e){if(active){setError(e.message);if(e.status===401)refreshSession();}}finally{inFlight=false;if(active)setLoading(false);}};
  setLoading(true);refresh();const timer=setInterval(refresh,15000);
  const events=new EventSource('/api/customer/events');
  events.onopen=()=>{if(active)setLive(true);refresh();};events.onerror=()=>{if(active)setLive(false);};events.addEventListener('orders',refresh);
  const visible=()=>{if(document.visibilityState==='visible')refresh();};document.addEventListener('visibilitychange',visible);
  return()=>{active=false;clearInterval(timer);events.close();document.removeEventListener('visibilitychange',visible);};
 },[page,refreshSession]);
 return <div className="customer-orders"><p className="tracking-live"><span className={live?'live-dot':''}/>{live?'Suivi en direct':'Actualisation automatique toutes les 15 secondes'}</p>{error&&<p className="api-error" role="alert">{error}</p>}{loading?<p>On retrouve tes commandes…</p>:!data.items.length?<div className="empty-cart"><Flame size={35}/><h3>La première bouchée t’attend.</h3><p>Tes commandes apparaîtront ici dès leur enregistrement.</p></div>:<div aria-live="polite">{data.items.map(o=><article className="customer-order" key={o.id}><header><div><small>{date(o.created_at)}</small><h3>Commande #{o.id}</h3></div><span className={`order-status status-${o.status}`}>{statuses[o.status]}</span></header><div className="order-progress" aria-label={`Statut : ${statuses[o.status]}`}>{o.status==='cancelled'?<p className="status-cancelled order-status">Commande annulée</p>:[['pending','À confirmer',Clock],['preparing','En préparation',Flame],['completed','Terminée',CheckCircle]].map(([key,label,Icon],i)=><div key={key} className={i<=['pending','preparing','completed'].indexOf(o.status)?`reached status-${o.status}`:''}><Icon size={19}/><span>{label}</span></div>)}</div><ul>{o.order_details.items.map((line,i)=><li key={i}><span>{line.quantity} × {line.name}<small>{line.size}{line.heat&&` · ${line.heat}`}</small></span><strong>{money(line.price*line.quantity)}</strong></li>)}</ul><p className="customer-order-total">Total articles <strong>{money(o.total_amount)}</strong></p><p className="customer-delivery">{o.location} · {o.delivery_address}</p><details><summary>Historique des étapes</summary><ol className="status-history">{o.status_history.map((h,i)=><li key={i}><span className={`order-status status-${h.status}`}>{statuses[h.status]}</span><time>{date(h.at)}</time></li>)}</ol></details></article>)}</div>}{data.total>20&&<div className="customer-actions"><button className="button button-outline" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Précédent</button><span>Page {page}</span><button className="button button-outline" disabled={page*20>=data.total} onClick={()=>setPage(p=>p+1)}>Suivant</button></div>}</div>;
}

export default function CustomerSpace({onClose}){
 const {customer,loading,error,refresh,logout}=useCustomer();
 const [tab,setTab]=useState('orders'),[logoutError,setLogoutError]=useState('');
 return <Dialog title={customer?`TON ESPACE SPICY.`:'BIENVENUE CHEZ TOI.'} wide onClose={onClose}>{loading?<p>Chargement de ton espace…</p>:error?<div><p className="api-error">{error}</p><button className="button button-outline" onClick={refresh}>Réessayer</button></div>:!customer?<CustomerAccess/>:<><div className="customer-welcome"><div><h3>Salut {customer.first_name||'toi'} !</h3><p>{customer.phone} · espace sur cet appareil</p></div><button className="button button-outline" onClick={async()=>{if(!window.confirm("Se déconnecter ? Les commandes de cet espace ne seront plus accessibles sur ce navigateur. Le numéro seul ne permettra pas de les retrouver."))return;try{await logout();}catch(e){setLogoutError(e.message);}}}>Se déconnecter</button></div>{logoutError&&<p className="api-error" role="alert">{logoutError}</p>}<div className="customer-tabs" role="group" aria-label="Mon espace"><button className={tab==='orders'?'active':''} onClick={()=>setTab('orders')}>Mes commandes</button><button className={tab==='profile'?'active':''} onClick={()=>setTab('profile')}>Mes informations</button></div>{tab==='orders'?<CustomerOrders/>:<Profile/>}</>}</Dialog>;
}
