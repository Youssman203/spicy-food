import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { migrate } from '../scripts/database.js';
import { hashPassword, verifyPassword } from '../src/security.js';
import { resetStaffPassword } from '../src/staff.js';
import { testPool } from './helpers.js';
const origin='https://spicy.example',password='Une-phrase-permanente-2026!',replacement='Autre-phrase-permanente-2026!';
let pool,app,root,admin;
const call=(method,path,body)=>request(app)[method](path).set('Origin',origin).send(body);
const as=(session,method,path,body)=>call(method,`/api/${session.audience}${path}`,body).set('Cookie',session.cookie).set('X-CSRF-Token',session.csrf);
async function login(email,pass=password,audience='superadmin'){
 const r=await call('post',`/api/${audience}/login`,{email,password:pass}).expect(200);
 return {id:r.body.id,email,audience,cookie:r.headers['set-cookie'][0].split(';')[0],csrf:r.body.csrf_token};
}
before(async()=>{
 pool=await testPool();await migrate(pool);await migrate(pool);
 const hash=await hashPassword(password);
 await pool.query("INSERT INTO admins(name,email,role,password_hash) VALUES('Direction','root@example.test','super_admin',$1),('Équipe','staff@example.test','admin',$1)",[hash]);
 app=createApp({pool,secret:'staff-test-secret-at-least-32-characters',origins:[origin],production:true});
 root=await login('root@example.test');admin=await login('staff@example.test',password,'admin');
});
after(async()=>{await pool?.end();});
// Independent scenarios share the persisted accounts, but not their IP rate-limit counters.
beforeEach(()=>{app=createApp({pool,secret:'staff-test-secret-at-least-32-characters',origins:[origin],production:true});});

test('seul le super admin gère les comptes ; aucune empreinte ni mot de passe retourné',async()=>{
 for(const [method,path,body] of [['get','/admins'],['post','/admins',{name:'Intrus',email:'intrus@example.test',password,role:'super_admin'}],['put',`/admins/${root.id}`,{name:'Intrus',email:root.email,role:'admin',is_active:false}],['post',`/admins/${root.id}/password`,{password}],['delete',`/admins/${root.id}`]])await as(admin,method,path,body).expect(403);
 await call('post','/api/superadmin/admins',{name:'Sans CSRF',email:'csrf@example.test',password}).set('Cookie',root.cookie).expect(403);
 const created=await as(root,'post','/admins',{name:'Deuxième direction',email:'  SECOND@example.test ',role:'super_admin',password}).expect(201);
 assert.equal(created.body.email,'second@example.test');assert.equal(created.body.role,'super_admin');assert.equal(created.body.is_active,true);
 assert.equal(created.body.password_hash,undefined);assert.equal(created.body.password,undefined);
 await as(root,'post','/admins',{name:'Doublon',email:'SECOND@example.test',role:'admin',password}).expect(409);
 await as(root,'post','/admins',{name:'Court',email:'short@example.test',password:'1234'}).expect(400);
 const listed=await as(root,'get','/admins').expect(200);assert.ok(listed.body.every(u=>!('password_hash' in u)&&!('password' in u)));
 await login('second@example.test');
});
test('modification email/rôle/état révoque les sessions des deux interfaces',async()=>{
 const superSession=await login('second@example.test');const adminSession=await login('second@example.test',password,'admin');
 const id=superSession.id;
 await as(root,'put',`/admins/${id}`,{name:'Responsable',email:'renamed@example.test',role:'admin',is_active:true}).expect(200);
 await as(superSession,'get','/session').expect(401);await as(adminSession,'get','/session').expect(401);
 await call('post','/api/superadmin/login',{email:'renamed@example.test',password}).expect(401);
 const renamed=await login('renamed@example.test',password,'admin');
 await as(root,'put',`/admins/${id}`,{name:'Responsable',email:'renamed@example.test',role:'admin',is_active:false}).expect(200);
 await as(renamed,'get','/session').expect(401);await call('post','/api/admin/login',{email:'renamed@example.test',password}).expect(401);
 await as(root,'put',`/admins/${id}`,{name:'Responsable',email:'renamed@example.test',role:'admin',is_active:true}).expect(200);
 await login('renamed@example.test',password,'admin');
});
test('mot de passe permanent remplaçable ; anciennes sessions et ancien mot de passe rejetés',async()=>{
 const prior=await login('renamed@example.test',password,'admin');
 await as(root,'post',`/admins/${prior.id}/password`,{password:replacement}).expect(204);
 await as(prior,'get','/session').expect(401);
 await call('post','/api/admin/login',{email:'renamed@example.test',password}).expect(401);
 const fresh=await login('renamed@example.test',replacement,'admin');
 const stored=(await pool.query('SELECT password_hash FROM admins WHERE id=$1',[prior.id])).rows[0].password_hash;
 assert.notEqual(stored,replacement);assert.ok(await verifyPassword(replacement,stored));
 await as(fresh,'post','/password',{current_password:'incorrect',password}).expect(400);
 await as(fresh,'get','/session').expect(200);
 await as(fresh,'post','/password',{current_password:replacement,password}).expect(204);
 await as(fresh,'get','/session').expect(401);
 await login('renamed@example.test',password,'admin');
});
test('protection de son propre accès, suppression des deux rôles, et rollback sur email déjà pris',async()=>{
 // Fresh app only resets the IP limiter for the independent test, not persistent accounts.
 app=createApp({pool,secret:'staff-test-secret-at-least-32-characters',origins:[origin],production:true});
 await as(root,'delete',`/admins/${root.id}`).expect(409);
 await as(root,'put',`/admins/${root.id}`,{name:'Direction',email:root.email,role:'admin',is_active:true}).expect(409);
 await as(root,'put',`/admins/${root.id}`,{name:'Direction',email:root.email,role:'super_admin',is_active:false}).expect(409);
 await as(root,'post',`/admins/${root.id}/password`,{password:replacement}).expect(409);
 const other=await as(root,'post','/admins',{name:'Supprimable',email:'remove@example.test',role:'super_admin',password}).expect(201);
 const session=await login('remove@example.test');
 await as(root,'put',`/admins/${other.body.id}`,{name:'Autre',email:root.email,role:'admin',is_active:false}).expect(409);
 await as(session,'get','/session').expect(200);
 await as(root,'delete',`/admins/${other.body.id}`).expect(204);await as(session,'get','/session').expect(401);
 await as(root,'delete',`/admins/${other.body.id}`).expect(404);
 const staff=await login('renamed@example.test',password,'admin');await as(root,'delete',`/admins/${staff.id}`).expect(204);await as(staff,'get','/session').expect(401);
 assert.equal(Number((await pool.query("SELECT count(*) FROM admins WHERE is_active AND role='super_admin'")).rows[0].count),1);
});
test('récupération serveur sans ancien mot de passe ni création implicite, et persistance au redémarrage API',async()=>{
 await assert.rejects(resetStaffPassword(pool,'absent@example.test',replacement),/Aucun compte/);
 const recovered=await resetStaffPassword(pool,'ROOT@example.test',replacement);assert.equal(recovered.id,root.id);assert.equal(recovered.password_hash,undefined);
 await as(root,'get','/session').expect(401);
 app=createApp({pool,secret:'staff-test-secret-at-least-32-characters',origins:[origin],production:true});
 await call('post','/api/superadmin/login',{email:root.email,password}).expect(401);
 const recoveredSession=await login(root.email,replacement);
 await as(recoveredSession,'get','/admins').expect(200);
 await as(recoveredSession,'post','/password',{current_password:replacement,password}).expect(204);
 await as(recoveredSession,'get','/session').expect(401);
 await login(root.email,password);
});
