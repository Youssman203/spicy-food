import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { migrate, seed } from '../scripts/database.js';
import { hashPassword } from '../src/security.js';
import { testPool } from './helpers.js';
const origin='https://spicy-drc.tech',password='A-test-password-234!';
let pool,app,adminCookie,superCookie,adminCsrf,superCsrf,productId;
const call=(method,path,body)=>{const r=request(app)[method](path).set('Origin',origin);return body?r.send(body):r;};
const staff=(method,path,body,superMode=false)=>call(method,`/api/${superMode?'superadmin':'admin'}${path}`,body).set('Cookie',superMode?superCookie:adminCookie).set('X-CSRF-Token',superMode?superCsrf:adminCsrf);
before(async()=>{
 pool=await testPool();await migrate(pool);await migrate(pool);await seed(pool);await seed(pool);
 const hash=await hashPassword(password);
 await pool.query("INSERT INTO admins(name,email,password_hash,role) VALUES('Chef','admin@example.test',$1,'admin'),('Direction','super@example.test',$1,'super_admin')",[hash]);
 app=createApp({pool,secret:'test-secret-for-spicy-32-characters-long',origins:[origin],production:true});
 const a=await call('post','/api/admin/login',{email:'admin@example.test',password}).expect(200);
 const s=await call('post','/api/superadmin/login',{email:'super@example.test',password}).expect(200);
 adminCookie=a.headers['set-cookie'][0].split(';')[0];superCookie=s.headers['set-cookie'][0].split(';')[0];adminCsrf=a.body.csrf_token;superCsrf=s.body.csrf_token;
 assert.match(a.headers['set-cookie'][0],/HttpOnly/);assert.match(a.headers['set-cookie'][0],/Secure/);assert.match(a.headers['set-cookie'][0],/SameSite=Strict/);assert.match(a.headers['set-cookie'][0],/Path=\/api\/admin/);
 productId=(await pool.query('SELECT id FROM menu_items ORDER BY id LIMIT 1')).rows[0].id;
});
after(async()=>{if(pool)await pool.end();});
test('catalogue et contacts publics, migrations et seed idempotents',async()=>{
 const res=await call('get','/api/menu').expect(200);assert.equal(res.body.length,22);assert.equal(res.body[0].variants[1].price,14000);
 const settings=await call('get','/api/settings').expect(200);assert.equal(settings.body.infoline_phone,'+243977105688');
 await call('get','/api/admin/clients').expect(401);
});
test('sessions isolées, refus CSRF et droits du super administrateur',async()=>{
 await call('post','/api/superadmin/login',{email:'admin@example.test',password}).expect(401);
 await call('get','/api/superadmin/session').set('Cookie',adminCookie.replace('spicy_admin=','spicy_superadmin=')).expect(401);
 await staff('get','/settings').expect(403);await staff('get','/admins').expect(403);
 await call('post','/api/admin/menu',{}).set('Cookie',adminCookie).expect(403);
 await request(app).post('/api/admin/logout').set('Origin','https://evil.test').set('Cookie',adminCookie).set('X-CSRF-Token',adminCsrf).expect(403);
 const session=await staff('get','/session').expect(200);assert.equal(session.body.role,'admin');
});
const order=()=>({request_key:randomUUID(),client:{first_name:'Ada',last_name:'Client',phone:'0977105688'},delivery_address:'Avenue du Test 12, centre',location:'Kolwezi',note:'Sans oignon',items:[{id:productId,size:'XL',heat:'Fiery',quantity:2}]});
test('adresse obligatoire, validation stricte et recalcul serveur des prix',async()=>{
 const missing=order();delete missing.delivery_address;await call('post','/api/orders',missing).expect(400);
 const tampered=order();tampered.total_amount=1;await call('post','/api/orders',tampered).expect(400);
 const payload=order();const res=await call('post','/api/orders',payload).expect(201);assert.equal(Number(res.body.total_amount),28000);
 const repeat=await call('post','/api/orders',payload).expect(200);assert.equal(repeat.body.id,res.body.id);assert.equal(repeat.body.replayed,true);
 await call('post','/api/orders',{...payload,note:'Autre demande'}).expect(409);
 let client=(await pool.query('SELECT * FROM clients')).rows[0];assert.equal(client.order_count,1);assert.equal(client.phone,'+243977105688');
 const next=order();next.client.phone='+243977105688';next.delivery_address='Nouvelle avenue 24';await call('post','/api/orders',next).expect(201);
 client=(await pool.query('SELECT * FROM clients')).rows[0];assert.equal(client.order_count,2);assert.equal(client.address,next.delivery_address);
});
test('indisponibilité et portion inconnue : aucun client ni commande créé',async()=>{
 const count=Number((await pool.query('SELECT count(*) FROM orders')).rows[0].count);
 await pool.query('UPDATE menu_items SET is_available=false WHERE id=$1',[productId]);await call('post','/api/orders',order()).expect(409);
 await pool.query('UPDATE menu_items SET is_available=true WHERE id=$1',[productId]);
 const wrong=order();wrong.items[0].size='Gratuit';await call('post','/api/orders',wrong).expect(409);
 assert.equal(Number((await pool.query('SELECT count(*) FROM orders')).rows[0].count),count);
});
test('CRUD carte, paramètres, CRM et cycle des commandes',async()=>{
 const dish={name:'Plat test',description:'Test de la carte',price:7500,category:'combos',image_url:'',spiciness_level:'Moyen',is_available:true,variants:[{name:'Standard',price:7500}]};
 const added=await staff('post','/menu',dish).expect(201);
 await staff('put',`/menu/${added.body.id}`,{...dish,price:8000,variants:[{name:'Standard',price:8000}]}).expect(200);
 await staff('delete',`/menu/${added.body.id}`).expect(204);
 const settings={infoline_phone:'0991234567',instagram_url:'https://www.instagram.com/spicyfood.drc',instagram_handle:'@spicyfood.drc',site_notice:'À bientôt !'};
 await staff('put','/settings',settings).expect(403);await staff('put','/settings',settings,true).expect(200);
 assert.equal((await call('get','/api/settings')).body.infoline_phone,'+243991234567');
 const clients=await staff('get','/clients?search=Ada').expect(200);assert.equal(clients.body.total,1);assert.equal(clients.body.items[0].order_count,2);
 const orders=await staff('get','/orders').expect(200);const id=orders.body.items[0].id;
 await staff('patch',`/orders/${id}`,{status:'preparing'}).expect(200);
 await staff('patch',`/orders/${id}`,{status:'invalid'}).expect(400);
});
test('création de staff, protection du super admin et révocation à la suppression',async()=>{
 const result=await staff('post','/admins',{name:'Nouveau',email:'new@example.test',password},true).expect(201);assert.equal(result.body.role,'admin');
 const login=await call('post','/api/admin/login',{email:'new@example.test',password}).expect(200);const cookie=login.headers['set-cookie'][0].split(';')[0];
 await staff('post','/admins',{name:'Escalade',email:'other@example.test',password,role:'super_admin'},true).expect(400);
 const self=(await staff('get','/session',undefined,true)).body.id;await staff('delete',`/admins/${self}`,undefined,true).expect(409);
 await staff('delete',`/admins/${result.body.id}`,undefined,true).expect(204);
 await call('get','/api/admin/session').set('Cookie',cookie).expect(401);
});
test('événement temps réel après modification des paramètres',async()=>{
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 const controller=new AbortController();
 try {
  const response=await fetch(`http://127.0.0.1:${server.address().port}/api/events`,{signal:controller.signal});
  assert.match(response.headers.get('content-type'),/text\/event-stream/);
  const reader=response.body.getReader();await reader.read();
  const event=reader.read();
  const settings=(await call('get','/api/settings')).body;
  await staff('put','/settings',{...settings,site_notice:'Mise à jour immédiate'},true).expect(200);
  const message=await event;assert.match(new TextDecoder().decode(message.value),/event: refresh/);
 }finally{controller.abort();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
test('logout révoque le JWT, indépendamment de la suppression du cookie',async()=>{
 await staff('post','/logout').expect(204);await call('get','/api/admin/session').set('Cookie',adminCookie).expect(401);
 await staff('get','/session',undefined,true).expect(200);
});
