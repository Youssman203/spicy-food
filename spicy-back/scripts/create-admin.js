import { createPool } from '../src/db.js';
import { hashPassword } from '../src/security.js';
import { parse, adminSchema } from '../src/validation.js';
import { staffTransaction } from '../src/staff.js';
import { terminalInput } from './terminal-input.js';
const pool=createPool();let input;
try {
 input=terminalInput();
 const name=await input.ask('Nom du super administrateur : ');
 const email=await input.ask('Email de connexion : ');
 const password=await input.password();
 const data=parse(adminSchema,{name,email,password,role:'super_admin'}),hash=await hashPassword(data.password);
 await staffTransaction(pool,db=>db.query("INSERT INTO admins(name,email,password_hash,role) VALUES($1,$2,$3,'super_admin')",[data.name,data.email,hash]));
 console.log(`Super administrateur créé : ${data.email}. Mot de passe permanent choisi par vous, sans expiration automatique. Enregistrez-le dans votre gestionnaire de mots de passe. Aucun compte existant modifié.`);
}catch(error){console.error(error.code==='23505'?'Cet email existe déjà. Utilisez admin:reset pour remplacer son mot de passe.':error.message);process.exitCode=1;}
finally{input?.close();await pool.end();}
