// Local review only: real API + disposable PostgreSQL WASM, never a production store.
import express from 'express';
import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { testPool } from '../tests/helpers.js';
import { migrate, seed } from './database.js';
import { hashPassword } from '../src/security.js';
import { createApp } from '../src/app.js';
if(process.env.NODE_ENV==='production')throw new Error('Cet aperçu est réservé au développement.');
const port=Number(process.env.SPICY_DEMO_PORT ?? 4173);
if(!Number.isInteger(port)||port<0||port>65535)throw new Error('SPICY_DEMO_PORT doit être un port valide.');
const pool=await testPool();await migrate(pool);await seed(pool);
const password=randomBytes(12).toString('base64url');
await pool.query("INSERT INTO admins(name,email,password_hash,role) VALUES('Équipe Démo','admin@spicy.test',$1,'admin'),('Direction Démo','super@spicy.test',$1,'super_admin')",[await hashPassword(password)]);
const app=express();
app.use('/admin',express.static(fileURLToPath(new URL('../../spicy-admin/dist/',import.meta.url))));
app.use('/superadmin',express.static(fileURLToPath(new URL('../../spicy-supadmin/dist/',import.meta.url))));
app.use(express.static(fileURLToPath(new URL('../../spicy-front/dist/',import.meta.url))));
// The embedded test engine has one connection; serialize requests around transactions.
let queue=Promise.resolve();
app.use((req,res,next)=>{if(req.path==='/api/events')return next();const previous=queue;let release;queue=new Promise(resolve=>{release=resolve;});previous.then(()=>{res.once('finish',release);res.once('close',release);next();});});
const origins=[];
app.use(createApp({pool,secret:randomBytes(48).toString('hex'),origins}));
let terminal;
const server=app.listen(port,'127.0.0.1',()=>{
 const address=`http://127.0.0.1:${server.address().port}`;
 origins.push(address,`http://localhost:${server.address().port}`);
 function showAccess(){
  console.log(`\n=== ACCÈS À CETTE DÉMO ===\nAdmin : ${address}/admin/\nEmail admin : admin@spicy.test\nSuper admin : ${address}/superadmin/\nEmail super admin : super@spicy.test\nMot de passe commun : ${password}\nCe mot de passe change à chaque lancement. Copiez uniquement sa valeur, sans espace.\nCes comptes fonctionnent uniquement sur cette démo locale.\nAppuyez sur Entrée dans ce terminal pour réafficher les accès.\nLes données disparaissent à l’arrêt (Ctrl+C).\n`);
 }
 showAccess();
 terminal=createInterface({input:process.stdin});
 terminal.on('line',showAccess);
});
server.on('error',async error=>{
 console.error(error.code==='EADDRINUSE'?`Le port ${port} est déjà utilisé. Arrêtez l’ancienne démo avec Ctrl+C, puis relancez. Aucun nouvel accès n’a été activé.`:error.message);
 await pool.end();process.exitCode=1;
});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{
 terminal?.close();
 server.close(async()=>{await pool.end();process.exit(0);});
 setTimeout(()=>process.exit(0),3000).unref();
});
