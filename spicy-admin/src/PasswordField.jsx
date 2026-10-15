import { useState } from 'react';
import { Eye, EyeOff, Copy } from 'lucide-react';

export default function PasswordField({label='Mot de passe',name='password',value,onChange,newPassword=false,copyable=false}){
 const [visible,setVisible]=useState(false),[notice,setNotice]=useState('');
 async function copy(){try{await navigator.clipboard.writeText(value);setNotice('Copié. Enregistrez-le dans votre gestionnaire de mots de passe.');}catch{setNotice('Copie indisponible : affichez puis sélectionnez le mot de passe.');}}
 return <div className="password-field"><label>{label}<input name={name} type={visible?'text':'password'} value={value} onChange={e=>{onChange(e.target.value);setNotice('');}} autoComplete={newPassword?'new-password':'current-password'} required minLength={newPassword?12:1} maxLength={128}/></label><div className="password-actions"><button type="button" aria-label={`${visible?'Masquer':'Afficher'} ${label.toLowerCase()}`} aria-pressed={visible} onClick={()=>setVisible(v=>!v)}>{visible?<EyeOff size={16}/>:<Eye size={16}/>} {visible?'Masquer':'Afficher'}</button>{copyable&&<button type="button" disabled={!value} onClick={copy}><Copy size={16}/> Copier</button>}</div>{notice&&<small role="status">{notice}</small>}</div>;
}
