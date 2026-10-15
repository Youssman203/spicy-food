import { useRef, useState } from 'react';
import { Copy, Upload } from 'lucide-react';

export default function ImageField({value,onChange,api,onBusy}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const input=useRef(null);
 async function copy(){setError('');setMessage('');try{await navigator.clipboard.writeText(new URL(value,window.location.origin).href);setMessage('URL copiée.');}catch{input.current?.focus();input.current?.select();setError('Copie automatique indisponible. Copiez le champ sélectionné.');}}
 async function upload(event){
  const file=event.target.files?.[0];event.target.value='';if(!file)return;
  setError('');setMessage('');
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){setError('Choisissez un JPEG, PNG ou WebP de 5 Mo maximum.');return;}
  setBusy(true);onBusy(true);
  try{const data=await api('/uploads',{method:'POST',body:file});onChange(data.url);setMessage('Photo envoyée. Enregistrez le plat pour la publier.');}
  catch(e){setError(e.message);}finally{setBusy(false);onBusy(false);}
 }
 return <div className="image-editor"><label>Photo : coller une URL HTTPS ou envoyer un fichier<input ref={input} type="text" maxLength={2048} placeholder="https://images.unsplash.com/…" value={value} disabled={busy} onChange={e=>onChange(e.target.value)}/></label><div className="image-actions"><button type="button" disabled={!value||busy} onClick={copy}><Copy size={16}/> Copier l’URL</button><label className={`upload-button ${busy?'disabled':''}`}><Upload size={16}/>{busy?'Envoi de la photo…':'Choisir une photo'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={upload}/></label></div><small>Ordinateur ou téléphone · JPEG, PNG, WebP · 5 Mo maximum.</small>{value&&<img className="image-preview" src={value} alt="Aperçu du plat"/>}{message&&<p className="notice" role="status">{message}</p>}{error&&<p className="error" role="alert">{error}</p>}</div>;
}
