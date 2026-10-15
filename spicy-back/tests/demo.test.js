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
 const page=await fetch(`${address}/demo/`);assert.equal(page.status,200);
 const html=await page.text();assert.match(html,/Tester l’interface admin/);assert.match(html,/Tester l’interface super admin/);assert.ok(!html.includes(password));
 const info=await fetch(`${address}/api/demo`);assert.equal((await info.json()).enabled,true);
 for(const audience of ['admin','superadmin']){
  for(const origin of [undefined,'https://evil.example']){
   const denied=await fetch(`${address}/api/demo/${audience}/enter`,{method:'POST',headers:origin?{Origin:origin}:{},redirect:'manual'});assert.equal(denied.status,403);
  }
  const direct=await fetch(`${address}/api/demo/${audience}/enter`,{method:'POST',headers:{Origin:address},redirect:'manual'});
  assert.equal(direct.status,303);assert.equal(direct.headers.get('location'),`/${audience}/`);
  const cookie=direct.headers.get('set-cookie').split(';')[0];assert.match(direct.headers.get('set-cookie'),/HttpOnly/);
  const session=await fetch(`${address}/api/${audience}/session`,{headers:{Cookie:cookie}});assert.equal(session.status,200);
  const user=await session.json();assert.equal(user.role,audience==='admin'?'admin':'super_admin');assert.ok(user.csrf_token);
  const data=await fetch(`${address}/api/${audience}/orders`,{headers:{Cookie:cookie}});assert.equal(data.status,200);
  const forbidden=await fetch(`${address}/api/${audience}/logout`,{method:'POST',headers:{Origin:address,Cookie:cookie}});assert.equal(forbidden.status,403);
  const logout=await fetch(`${address}/api/${audience}/logout`,{method:'POST',headers:{Origin:address,Cookie:cookie,'X-CSRF-Token':user.csrf_token}});assert.equal(logout.status,204);
  assert.equal((await fetch(`${address}/api/${audience}/session`,{headers:{Cookie:cookie}})).status,401);
 }
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
