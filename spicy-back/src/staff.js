import { hashPassword, verifyPassword } from './security.js';
import { adminSchema, adminUpdateSchema, resetPasswordSchema, changePasswordSchema, parse, fail, idParam } from './validation.js';

const columns='id,name,email,role,is_active,created_at,updated_at,password_changed_at';
// Serialize staff mutations, including server recovery, to protect the last active super admin.
export async function staffTransaction(pool, action) {
 const db=await pool.connect();
 try {await db.query('BEGIN');await db.query('SELECT pg_advisory_xact_lock(20261016)');const result=await action(db);await db.query('COMMIT');return result;}
 catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
}
async function currentActor(db,req,superOnly=true){
 const actor=(await db.query(`SELECT a.* FROM admins a JOIN admin_sessions s ON s.admin_id=a.id
 WHERE a.id=$1 AND a.is_active AND s.id=$2 AND s.expires_at>now() FOR UPDATE OF a`,[req.user.id,req.sessionId])).rows[0];
 if(!actor)fail(401,'Session expirée. Reconnectez-vous.');
 if(superOnly&&actor.role!=='super_admin')fail(403,'Accès super administrateur requis.');
 return actor;
}
async function targetAccount(db,id){const row=(await db.query('SELECT * FROM admins WHERE id=$1 FOR UPDATE',[id])).rows[0];if(!row)fail(404,'Compte introuvable.');return row;}
async function protectLastSuper(db,target){
 if(target.role==='super_admin'&&target.is_active){
  const count=Number((await db.query("SELECT count(*) FROM admins WHERE role='super_admin' AND is_active")).rows[0].count);
  if(count<=1)fail(409,'Conservez au moins un super administrateur actif.');
 }
}
export async function resetStaffPassword(pool,email,password){
 const hash=await hashPassword(parse(resetPasswordSchema,{password}).password);
 return staffTransaction(pool,async db=>{
  const target=(await db.query('SELECT id FROM admins WHERE email=$1 FOR UPDATE',[email.trim().toLowerCase()])).rows[0];
  if(!target)fail(404,'Aucun compte avec cet email. Aucun compte créé.');
  const result=await db.query(`UPDATE admins SET password_hash=$1,password_changed_at=now(),updated_at=now() WHERE id=$2 RETURNING ${columns}`,[hash,target.id]);
  await db.query('DELETE FROM admin_sessions WHERE admin_id=$1',[target.id]);return result.rows[0];
 });
}
export function mountStaff(router,{pool,requireSuperAdmin,limiter}){
 router.get('/admins',requireSuperAdmin,async(req,res)=>res.json((await pool.query(`SELECT ${columns} FROM admins ORDER BY id`)).rows));
 router.post('/admins',requireSuperAdmin,limiter(30,15),async(req,res)=>{
  const d=parse(adminSchema,req.body),hash=await hashPassword(d.password);
  const user=await staffTransaction(pool,async db=>{await currentActor(db,req);return (await db.query(`INSERT INTO admins(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING ${columns}`,[d.name,d.email,hash,d.role])).rows[0];});
  res.status(201).json(user);
 });
 router.put('/admins/:id',requireSuperAdmin,async(req,res)=>{
  const id=idParam(req.params.id),d=parse(adminUpdateSchema,req.body);
  const user=await staffTransaction(pool,async db=>{
   await currentActor(db,req);const target=await targetAccount(db,id);
   if(id===req.user.id&&(d.role!=='super_admin'||!d.is_active))fail(409,'Vous ne pouvez pas retirer votre propre accès super administrateur.');
   if(d.role!=='super_admin'||!d.is_active)await protectLastSuper(db,target);
   const updated=(await db.query(`UPDATE admins SET name=$1,email=$2,role=$3,is_active=$4,updated_at=now() WHERE id=$5 RETURNING ${columns}`,[d.name,d.email,d.role,d.is_active,id])).rows[0];
   if(d.email!==target.email||d.role!==target.role||d.is_active!==target.is_active)await db.query('DELETE FROM admin_sessions WHERE admin_id=$1',[id]);
   return updated;
  });res.json(user);
 });
 router.post('/admins/:id/password',requireSuperAdmin,limiter(20,15),async(req,res)=>{
  const id=idParam(req.params.id),d=parse(resetPasswordSchema,req.body);
  if(id===req.user.id)fail(409,'Utilisez Mon compte pour changer votre propre mot de passe.');
  const hash=await hashPassword(d.password);
  await staffTransaction(pool,async db=>{await currentActor(db,req);await targetAccount(db,id);await db.query('UPDATE admins SET password_hash=$1,password_changed_at=now(),updated_at=now() WHERE id=$2',[hash,id]);await db.query('DELETE FROM admin_sessions WHERE admin_id=$1',[id]);});
  res.status(204).end();
 });
 router.delete('/admins/:id',requireSuperAdmin,async(req,res)=>{
  const id=idParam(req.params.id);if(id===req.user.id)fail(409,'Vous ne pouvez pas supprimer votre compte.');
  await staffTransaction(pool,async db=>{await currentActor(db,req);const target=await targetAccount(db,id);await protectLastSuper(db,target);await db.query('DELETE FROM admins WHERE id=$1',[id]);});
  res.status(204).end();
 });
 router.post('/password',limiter(10,15),async(req,res)=>{
  const d=parse(changePasswordSchema,req.body),hash=await hashPassword(d.password);
  await staffTransaction(pool,async db=>{
   const actor=await currentActor(db,req,false);
   if(!await verifyPassword(d.current_password,actor.password_hash))fail(400,'Le mot de passe actuel est incorrect.');
   await db.query('UPDATE admins SET password_hash=$1,password_changed_at=now(),updated_at=now() WHERE id=$2',[hash,actor.id]);
   await db.query('DELETE FROM admin_sessions WHERE admin_id=$1',[actor.id]);
  });res.status(204).end();
 });
}
