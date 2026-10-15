import { useEffect, useState } from 'react';
import { Plus, Pencil, KeyRound, Trash2 } from 'lucide-react';
import Modal from './Modal';
import PasswordField from './PasswordField';

const roles={admin:'Administrateur',super_admin:'Super administrateur'};
const blank={name:'',email:'',role:'admin',is_active:true};
export default function StaffManager({api,currentUser,onUserChange}){
 const [users,setUsers]=useState([]),[loading,setLoading]=useState(true),[query,setQuery]=useState('');
 const [dialog,setDialog]=useState(null),[form,setForm]=useState(blank),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function load(){setUsers(await api('/admins'));}
 useEffect(()=>{let active=true;api('/admins').then(d=>{if(active)setUsers(d);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[api]);
 function open(mode,user){setDialog({mode,user});setForm(user?{name:user.name,email:user.email,role:user.role,is_active:user.is_active}:blank);setPassword('');setConfirmation('');setError('');setNotice('');}
 function close(){if(!busy){setDialog(null);setPassword('');setConfirmation('');setError('');}}
 async function save(e){e.preventDefault();if(busy)return;setError('');if(['create','password'].includes(dialog.mode)&&password!==confirmation){setError('Les deux mots de passe ne correspondent pas.');return;}setBusy(true);
  try{
   const {mode,user}=dialog;
   if(mode==='create')await api('/admins',{method:'POST',body:{name:form.name,email:form.email,role:form.role,password}});
   if(mode==='edit'){
    const updated=await api(`/admins/${user.id}`,{method:'PUT',body:form});
    if(user.id===currentUser.id){if(updated.email!==currentUser.email){onUserChange(null);return;}onUserChange({...currentUser,...updated});}
   }
   if(mode==='password')await api(`/admins/${user.id}/password`,{method:'POST',body:{password}});
   if(mode==='delete')await api(`/admins/${user.id}`,{method:'DELETE'});
   setDialog(null);setPassword('');setConfirmation('');
   setNotice(mode==='create'?'Compte créé avec un mot de passe permanent.':mode==='password'?'Mot de passe remplacé. Toutes les sessions de ce compte sont fermées.':mode==='delete'?'Compte supprimé et sessions fermées.':'Compte mis à jour. Un changement d’email, de rôle ou d’accès ferme ses sessions.');
   await load();
  }catch(e){setError(e.message);}finally{setBusy(false);}
 }
 const filtered=users.filter(u=>`${u.name} ${u.email} ${roles[u.role]}`.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')));
 return <><div className="toolbar"><p className="intro">Gérez les comptes et les accès de votre équipe.</p><button className="primary" onClick={()=>open('create')}><Plus size={17}/> Créer un compte</button></div><label className="staff-search">Rechercher un compte<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nom, email ou rôle"/></label><p className="intro">Les mots de passe sont permanents. Ils ne sont pas consultables après enregistrement ; utilisez « Mot de passe » pour en définir un nouveau.</p>{error&&!dialog&&<p className="error" role="alert">{error}</p>}<p className="notice" role="status">{notice}</p>{loading?<p>Chargement de l’équipe…</p>:<div className="table-scroll"><table><thead><tr><th>Utilisateur</th><th>Email</th><th>Rôle</th><th>État</th><th>Actions</th></tr></thead><tbody>{filtered.map(u=><tr key={u.id}><td><b>{u.name}</b>{u.id===currentUser.id&&<small>Vous</small>}</td><td>{u.email}</td><td>{roles[u.role]}</td><td><span className={`order-status ${u.is_active?'status-completed':'status-cancelled'}`}>{u.is_active?'Actif':'Désactivé'}</span></td><td><div className="staff-actions"><button onClick={()=>open('edit',u)} aria-label={`Modifier ${u.name}`}><Pencil size={15}/> Modifier</button>{u.id!==currentUser.id&&<><button onClick={()=>open('password',u)} aria-label={`Mot de passe de ${u.name}`}><KeyRound size={15}/> Mot de passe</button><button onClick={()=>open('delete',u)} aria-label={`Supprimer ${u.name}`}><Trash2 size={15}/> Supprimer</button></>}</div></td></tr>)}</tbody></table>{!filtered.length&&<p className="empty">Aucun compte trouvé.</p>}</div>}
 {dialog&&<Modal title={dialog.mode==='create'?'Créer un compte':dialog.mode==='edit'?'Modifier le compte':dialog.mode==='password'?'Définir un nouveau mot de passe':'Supprimer ce compte ?'} onClose={close}><form className="editor" onSubmit={save}>
 {['create','edit'].includes(dialog.mode)&&<><label>Nom<input required maxLength={100} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Email<input required type="email" autoComplete="off" maxLength={254} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Rôle<select disabled={dialog.user?.id===currentUser.id} value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>{Object.entries(roles).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>{form.role==='super_admin'&&<p>Ce rôle peut gérer tous les comptes de l’équipe, y compris les autres super administrateurs.</p>}{dialog.mode==='edit'&&<label className="checkbox"><input type="checkbox" disabled={dialog.user.id===currentUser.id} checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})}/> Compte actif</label>}</>}
 {['create','password'].includes(dialog.mode)&&<>{dialog.user&&<p>{dialog.user.name} · {dialog.user.email}</p>}<PasswordField label="Mot de passe permanent" value={password} onChange={setPassword} newPassword copyable/><PasswordField label="Confirmer le mot de passe" name="confirmation" value={confirmation} onChange={setConfirmation} newPassword/><p>12 caractères minimum. Choisissez une phrase facile à retenir, enregistrez-la dans votre gestionnaire de mots de passe et transmettez-la directement à la personne. Aucun envoi automatique. {dialog.mode==='password'?'Les sessions existantes seront fermées.':''}</p></>}
 {dialog.mode==='delete'&&<p>Le compte de <b>{dialog.user.name}</b> ({dialog.user.email}) sera supprimé et ses sessions fermées. Pour conserver le compte, utilisez plutôt Modifier et décochez « Compte actif ».</p>}
 {error&&<p className="error" role="alert">{error}</p>}<div className="dialog-actions"><button type="button" disabled={busy} onClick={close}>Annuler</button><button className="primary" disabled={busy}>{busy?'Enregistrement…':dialog.mode==='delete'?'Supprimer définitivement':dialog.mode==='create'?'Créer le compte':'Enregistrer'}</button></div></form></Modal>}</>;
}

export function MyAccount({api,user,onSignedOut}){
 const [current,setCurrent]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function save(e){e.preventDefault();if(busy)return;setError('');if(password!==confirmation){setError('Les deux mots de passe ne correspondent pas.');return;}setBusy(true);try{await api('/password',{method:'POST',body:{current_password:current,password}});onSignedOut();}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <form className="panel settings-form" onSubmit={save}><span className="tag">MON ACCÈS</span><h2>{user.name}</h2><p>{user.email}</p><p className="intro">Votre mot de passe n’expire pas automatiquement. Après modification, reconnectez-vous avec le nouveau mot de passe sur vos appareils.</p><PasswordField label="Mot de passe actuel" name="current_password" value={current} onChange={setCurrent}/><PasswordField label="Nouveau mot de passe" value={password} onChange={setPassword} newPassword copyable/><PasswordField label="Confirmer le nouveau mot de passe" name="confirmation" value={confirmation} onChange={setConfirmation} newPassword/>{error&&<p role="alert" className="error">{error}</p>}<button className="primary" disabled={busy}>{busy?'Enregistrement…':'Changer mon mot de passe'}</button></form>;
}
