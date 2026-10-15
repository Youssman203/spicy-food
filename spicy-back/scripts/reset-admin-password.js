import { createPool } from '../src/db.js';
import { resetStaffPassword } from '../src/staff.js';
import { terminalInput } from './terminal-input.js';
const pool=createPool();let input;
try{
 input=terminalInput();
 const email=await input.ask('Email du compte à réinitialiser : ');
 const target=(await pool.query('SELECT name,email,role,is_active FROM admins WHERE email=$1',[email.trim().toLowerCase()])).rows[0];
 if(!target)throw new Error('Compte introuvable. Aucun compte créé.');
 console.log(`Compte : ${target.name} · ${target.email} · ${target.role} · ${target.is_active?'actif':'désactivé'}`);
 if((await input.ask('Remplacer son mot de passe et fermer toutes ses sessions ? Tapez OUI : '))!=='OUI')throw new Error('Opération annulée.');
 await resetStaffPassword(pool,email,await input.password());
 console.log('Mot de passe permanent remplacé. Sessions fermées. Enregistrez le nouveau mot de passe dans votre gestionnaire.');
 if(!target.is_active)console.log('Le compte reste désactivé : un super administrateur doit le réactiver dans Équipe.');
}catch(error){console.error(error.message);process.exitCode=1;}
finally{input?.close();await pool.end();}
