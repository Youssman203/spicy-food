import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { createPool } from '../src/db.js';
import { hashPassword } from '../src/security.js';
import { parse, adminSchema } from '../src/validation.js';
const rl=createInterface({input:stdin,output:stdout});
const pool=createPool();
try {
 const name=await rl.question('Nom du super administrateur : ');
 const email=await rl.question('Email : ');
 // Mute terminal output only while entering the password; no secret in argv/env.
 stdout.write('Mot de passe (12 caractères minimum, saisie masquée) : ');
 rl._writeToOutput=()=>{};
 const password=await rl.question(''); stdout.write('\n');
 const data=parse(adminSchema,{name,email,password});
 await pool.query("INSERT INTO admins(name,email,password_hash,role) VALUES($1,$2,$3,'super_admin')",[data.name,data.email,await hashPassword(data.password)]);
 console.log('Super administrateur créé. Aucun compte existant modifié.');
}catch(error){console.error(error.code==='23505'?'Cet email existe déjà.':error.message);process.exitCode=1;}
finally{rl.close();await pool.end();}
