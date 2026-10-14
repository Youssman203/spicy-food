import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('accès imprimés par la démo : connexion des deux rôles et réaffichage sans changement', {timeout:30000}, async t=>{
 const child=spawn(process.execPath,[fileURLToPath(new URL('../scripts/preview-v2.js',import.meta.url))],{
  env:{...process.env,NODE_ENV:'test',SPICY_DEMO_PORT:'0'},stdio:['pipe','pipe','pipe'],
 });
 t.after(()=>{child.kill();});
 let output='';
 child.stdout.setEncoding('utf8');child.stdout.on('data',chunk=>{output+=chunk;});
 const waitFor=predicate=>new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{cleanup();reject(new Error('La démo ne répond pas.'));},15000);
  const onData=()=>{if(predicate()){cleanup();resolve();}};
  const onExit=()=>{cleanup();reject(new Error('La démo s’est arrêtée avant validation.'));};
  function cleanup(){clearTimeout(timer);child.stdout.off('data',onData);child.off('exit',onExit);}
  child.stdout.on('data',onData);child.once('exit',onExit);onData();
 });
 await waitFor(()=>output.includes('Les données disparaissent'));
 const address=output.match(/Admin : (http:\/\/127\.0\.0\.1:\d+)\/admin\//)[1];
 const password=output.match(/Mot de passe commun : ([\w-]+)/)[1];
 for(const [audience,email,role] of [['admin','admin@spicy.test','admin'],['superadmin','super@spicy.test','super_admin']]){
  for(const origin of [address,address.replace('127.0.0.1','localhost')]){
   const response=await fetch(`${address}/api/${audience}/login`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
   assert.equal(response.status,200,`${audience} depuis ${origin}`);
   const cookie=response.headers.get('set-cookie').split(';')[0];
   const session=await fetch(`${address}/api/${audience}/session`,{headers:{Cookie:cookie}});
   assert.equal(session.status,200);assert.equal((await session.json()).role,role);
  }
 }
 const wrong=await fetch(`${address}/api/admin/login`,{method:'POST',headers:{Origin:address,'Content-Type':'application/json'},body:JSON.stringify({email:'admin@spicy.test',password:'ancien-mot-de-passe'})});
 assert.equal(wrong.status,401);
 child.stdin.write('\n');
 await waitFor(()=>output.split('Mot de passe commun : ').length===3);
 const printed=[...output.matchAll(/Mot de passe commun : ([\w-]+)/g)].map(m=>m[1]);
 assert.deepEqual(printed,[password,password]);
});
