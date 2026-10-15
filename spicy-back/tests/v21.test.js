import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import sharp from 'sharp';
import { createApp } from '../src/app.js';

import { migrate, seed } from '../scripts/database.js';
import { testPool } from './helpers.js';
import { hashPassword } from '../src/security.js';

const origin='https://spicy-drc.tech';
let pool,app,uploadDir,staffCookie,csrf,cookie,otherCookie,orderId;
const call=(method,path,body,session)=>{const r=request(app)[method](`/api${path}`).set('Origin',origin);if(session)r.set('Cookie',session);return body?r.send(body):r;};
const staff=(method,path,body)=>call(method,`/admin${path}`,body,staffCookie).set('X-CSRF-Token',csrf);
async function login(phone){return call('post','/customer/register',{first_name:'Ada',last_name:'Test',phone}).expect(201);}
before(async()=>{
 pool=await testPool();await migrate(pool);await seed(pool);uploadDir=await mkdtemp(join(tmpdir(),'spicy-v21-test-'));
 app=createApp({pool,secret:'v21-test-secret-with-at-least-32-characters',origins:[origin],production:true,uploadDir});
 await pool.query("INSERT INTO admins(name,email,password_hash,role) VALUES('Chef','chef@example.test',$1,'admin')",[await hashPassword('Password-for-test-21')]);
 const staffLogin=await call('post','/admin/login',{email:'chef@example.test',password:'Password-for-test-21'}).expect(200);staffCookie=staffLogin.headers['set-cookie'][0].split(';')[0];csrf=staffLogin.body.csrf_token;
});
after(async()=>{await pool?.end();if(uploadDir)await rm(uploadDir,{recursive:true,force:true});});

test('inscription directe, origine, champs requis et session persistante',async()=>{
 await call('get','/customer/orders').expect(401);
 await request(app).post('/api/customer/register').send({first_name:'Ada',last_name:'Test',phone:'0977105688'}).expect(403);
 await call('post','/customer/register',{phone:'0977105688'}).expect(400);
 await call('post','/customer/register',{first_name:'Ada',last_name:'Test',phone:'abc'}).expect(400);
 await call('post','/customer/code',{phone:'0977105688'}).expect(404);
 await call('post','/customer/verify',{challenge:randomUUID(),code:'123456'}).expect(404);
 const registered=await login('0977105688');cookie=registered.headers['set-cookie'][0].split(';')[0];
 assert.match(registered.headers['set-cookie'][0],/HttpOnly/);assert.match(registered.headers['set-cookie'][0],/Secure/);assert.match(registered.headers['set-cookie'][0],/Max-Age=2592000/);
 const session=await call('get','/customer/session',null,cookie).expect(200);assert.equal(session.body.phone,'+243977105688');assert.equal(session.body.first_name,'Ada');
 const repeated=await call('post','/customer/register',{first_name:'Autre',last_name:'Nom',phone:'0991234567'},cookie).expect(200);assert.equal(repeated.body.id,session.body.id);assert.equal(repeated.body.first_name,'Ada');
 assert.equal(Number((await pool.query('SELECT count(*) FROM clients')).rows[0].count),1);
 const stored=(await pool.query('SELECT token_hash FROM customer_sessions')).rows[0].token_hash;assert.notEqual(stored,cookie.split('=')[1]);
});
test('commande liée à la session, isolation même avec le même numéro',async()=>{
 await call('put','/customer/profile',{first_name:'Ada',last_name:'Test',phone:'0977105688',address:'Avenue du Test 12',location:'Kolwezi'},cookie).expect(200);
 const item=(await call('get','/menu')).body[0];
 const payload={request_key:randomUUID(),client:{first_name:'Ada',last_name:'Test',phone:'0977105688'},delivery_address:'Avenue du Test 12',location:'Kolwezi',items:[{id:item.id,size:item.variants[0].name,heat:'Doux',quantity:1}]};
 await call('post','/orders',payload).expect(401);
 await call('post','/orders',{...payload,client:{...payload.client,phone:'0991234567'}},cookie).expect(403);
 const placed=await call('post','/orders',payload,cookie).expect(201);orderId=placed.body.id;
 assert.equal((await call('get','/customer/orders',null,cookie)).body.items[0].status_history[0].status,'pending');
 const other=await login('0977105688');otherCookie=other.headers['set-cookie'][0].split(';')[0];
 const empty=await call('get',`/customer/orders?client_id=${placed.body.client_id||1}`,null,otherCookie).expect(200);assert.equal(empty.body.total,0);
 await call('post','/orders',payload,otherCookie).expect(409);
});

test('statuts en direct privés, historique et déconnexion isolée', {timeout:15000},async()=>{
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 const controller=new AbortController();
 try{
  const response=await fetch(`http://127.0.0.1:${server.address().port}/api/customer/events`,{headers:{Cookie:cookie},signal:controller.signal});
  assert.equal(response.status,200);const reader=response.body.getReader();await reader.read();const pending=reader.read();
  await staff('patch',`/orders/${orderId}`,{status:'preparing'}).expect(200);
  assert.match(new TextDecoder().decode((await pending).value),/event: orders/);
  await staff('patch',`/orders/${orderId}`,{status:'completed'}).expect(200);
  await staff('patch',`/orders/${orderId}`,{status:'completed'}).expect(200);
  const orders=(await call('get','/customer/orders',null,cookie)).body.items;
  assert.deepEqual(orders[0].status_history.map(h=>h.status),['pending','preparing','completed']);
  assert.equal((await call('get','/customer/orders',null,otherCookie)).body.total,0);
  const next=await login('0977105688');const nextCookie=next.headers['set-cookie'][0].split(';')[0];
  assert.equal((await call('get','/customer/orders',null,nextCookie)).body.total,0);
  const changed=await call('put','/customer/profile',{first_name:'Autre',last_name:'Client',phone:'0991234567',address:'Autre adresse 99',location:'Lubumbashi'},nextCookie).expect(200);assert.equal(changed.body.phone,'+243991234567');
  assert.equal((await call('get','/customer/session',null,cookie)).body.first_name,'Ada');
  await call('post','/customer/logout',{},cookie).expect(200);await call('get','/customer/orders',null,cookie).expect(401);
  await call('get','/customer/session',null,nextCookie).expect(200);
 }finally{controller.abort();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});

test('TikTok : aucun accès en écriture pour un administrateur',async()=>{
 const before=(await call('get','/settings')).body;
 await staff('get','/social').expect(404);
 await staff('put','/social',{tiktok_url:'https://www.tiktok.com/@spicyfood.drc'}).expect(404);
 await staff('put','/settings',{...before,tiktok_url:'https://www.tiktok.com/@spicyfood.drc'}).expect(403);
 assert.equal((await call('get','/settings')).body.tiktok_url,before.tiktok_url);
 await staff('get','/settings').expect(403);
});

test('photos : authentification, CSRF, image réelle, poids, conversion et persistance',async()=>{
 const png=await sharp({create:{width:40,height:40,channels:3,background:'#e64c2e'}}).png().toBuffer();
 await call('post','/admin/uploads').set('Content-Type','image/png').send(png).expect(401);
 await call('post','/admin/uploads',null,staffCookie).set('Content-Type','image/png').send(png).expect(403);
 await staff('post','/uploads').set('Content-Type','image/png').send(Buffer.from('<svg/>')).expect(400);
 await staff('post','/uploads').set('Content-Type','image/png').send(Buffer.alloc(5*1024*1024+1)).expect(413);
 const sent=await staff('post','/uploads').set('Content-Type','image/png').send(png).expect(201);
 assert.match(sent.body.url,/^\/api\/media\/[a-f0-9-]+\.webp$/);
 const served=await request(app).get(sent.body.url).expect(200);assert.match(served.headers['content-type'],/image\/webp/);
 const metadata=await sharp(await readFile(join(uploadDir,sent.body.url.split('/').at(-1)))).metadata();assert.equal(metadata.format,'webp');assert.equal(metadata.exif,undefined);
 const item={name:'Photo test',description:'',price:1000,category:'tacos',image_url:sent.body.url,spiciness_level:'Doux',is_available:true,variants:[{name:'Standard',price:1000}]};
 await staff('post','/menu',item).expect(201);
 await staff('post','/menu',{...item,image_url:'/api/media/../../secret'}).expect(400);
});

test('session expirée : aucune récupération par numéro ou jeton inventé',async()=>{
 const registered=await login('0997654321');const expired=registered.headers['set-cookie'][0].split(';')[0];
 await pool.query("UPDATE customer_sessions SET expires_at=now()-interval '1 second' WHERE client_id=$1",[registered.body.id]);
 await call('get','/customer/session',null,expired).expect(401);
 await call('get','/customer/orders',null,`spicy_customer=${'a'.repeat(64)}`).expect(401);
 const fresh=await call('post','/customer/register',{first_name:'Ada',last_name:'Test',phone:'0997654321'},expired).expect(201);
 assert.notEqual(fresh.body.id,registered.body.id);
});

test('migration sans OTP : conservation des anciens profils, sessions et commandes',async()=>{
 const old=await testPool();
 try{
  for(const file of ['001_initial.sql','002_customer_space.sql'])await old.query(await readFile(new URL(`../../spicy-data/migrations/${file}`,import.meta.url),'utf8'));
  const client=(await old.query("INSERT INTO clients(first_name,last_name,phone) VALUES('Ancien','Client','+243990000001') RETURNING id")).rows[0];
  await old.query("INSERT INTO customer_sessions(token_hash,client_id,expires_at) VALUES($1,$2,now()+interval '1 day')",['b'.repeat(64),client.id]);
  await old.query("INSERT INTO orders(client_id,total_amount,order_details,delivery_address,location,request_key,request_hash) VALUES($1,1000,'{}','Ancienne adresse','Lubumbashi',$2,$3)",[client.id,randomUUID(),'c'.repeat(64)]);
  await old.query(await readFile(new URL('../../spicy-data/migrations/003_customer_without_otp.sql',import.meta.url),'utf8'));
  const next=(await old.query("INSERT INTO clients(first_name,last_name,phone) VALUES('Nouveau','Client','+243990000001') RETURNING id")).rows[0];
  assert.notEqual(next.id,client.id);
  assert.equal((await old.query('SELECT client_id FROM customer_sessions')).rows[0].client_id,client.id);
  assert.equal((await old.query('SELECT client_id FROM orders')).rows[0].client_id,client.id);
  assert.equal((await old.query("SELECT to_regclass('customer_verifications') AS name")).rows[0].name,null);
 }finally{await old.end();}
});
