import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { z } from 'zod';
import { verifyPassword } from './security.js';
import { parse, fail, idParam, loginSchema, menuSchema, orderSchema, settingsSchema } from './validation.js';
import { mountStaff } from './staff.js';
import { mountCustomer } from './customer.js';
import { defaultUploadDir, mountUploads, serveUploads } from './uploads.js';

export function createApp({ pool, secret, origins, production = false, uploadDir = defaultUploadDir }) {
 if (!secret || secret.length < 32) throw new Error('JWT_SECRET doit contenir au moins 32 caractères.');
 const app = express();
 const subscribers = new Set();
 const notifyPublic = () => { for (const res of subscribers) res.write('event: refresh\ndata: {}\n\n'); };
 app.disable('x-powered-by');
 if (production) app.set('trust proxy', 1);
 app.use(helmet(), express.json({ limit: '64kb' }), cookieParser());
 app.use('/api', (req, res, next) => {
   res.set('Cache-Control', 'no-store');
   if (!['GET','HEAD','OPTIONS'].includes(req.method) && !origins.includes(req.get('Origin'))) return res.status(403).json({error:'Origine de la requête refusée.'});
   next();
 });
 const limiter = (limit, minutes) => rateLimit({windowMs: minutes * 60000, limit, standardHeaders: 'draft-8', legacyHeaders: false, message: {error:'Trop de tentatives. Réessayez plus tard.'}});
 const loginLimit = limiter(10, 15);
 const customer=mountCustomer(app,{pool,production,limiter});
 serveUploads(app,uploadDir);
 app.get('/api/events', (req, res) => {
   res.set({'Content-Type':'text/event-stream', 'Cache-Control':'no-cache', 'Connection':'keep-alive', 'X-Accel-Buffering':'no'});
   res.flushHeaders(); res.write(': connected\n\n'); subscribers.add(res);
   const timer=setInterval(()=>res.write(': heartbeat\n\n'),25000);
   req.on('close',()=>{clearInterval(timer);subscribers.delete(res);});
 });
 app.get('/api/health', async (req, res) => { await pool.query('SELECT 1'); res.json({status:'ok'}); });
 app.get('/api/menu', async (req, res) => res.json((await pool.query('SELECT * FROM menu_items WHERE is_available = true ORDER BY id')).rows));
 app.get('/api/settings', async (req, res) => res.json(Object.fromEntries((await pool.query('SELECT setting_key, setting_value FROM site_settings')).rows.map(r => [r.setting_key, r.setting_value]))));

 app.post('/api/orders', limiter(20, 15), customer.authenticate, async (req, res) => {
   const data = parse(orderSchema, req.body);
   if(data.client.phone!==req.customer.phone) fail(403,'Utilise le numéro enregistré dans ton espace client.');
   const fingerprint = createHash('sha256').update(JSON.stringify(data)).digest('hex');
   const db = await pool.connect();
   try {
     await db.query('BEGIN');
     // Serialize retries before touching the client or its order counter.
     await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [data.request_key]);
     const previous = (await db.query('SELECT id, client_id, total_amount, status, request_hash FROM orders WHERE request_key=$1', [data.request_key])).rows[0];
     if (previous) {
       if (previous.client_id!==req.customer.id || previous.request_hash !== fingerprint) fail(409, 'Cette tentative correspond déjà à une autre commande.');
       await db.query('COMMIT');
       return res.json({id:previous.id, total_amount:previous.total_amount, status:previous.status, replayed:true});
     }
     const ids = [...new Set(data.items.map(i => i.id))].sort((a,b) => a-b);
     const products = (await db.query('SELECT * FROM menu_items WHERE id = ANY($1::int[]) ORDER BY id FOR SHARE', [ids])).rows;
     let cents = 0;
     const lines = data.items.map(line => {
       const product = products.find(p => p.id === line.id);
       if (!product?.is_available) fail(409, 'Un produit est indisponible. Actualisez votre panier.');
       const variant = product.variants.find(v => v.name === line.size);
       if (!variant) fail(409, `La portion de ${product.name} a changé. Ajoutez à nouveau ce produit.`);
       if (product.category === 'boissons' && line.heat) fail(400, 'Une boisson ne peut pas avoir de niveau de piment.');
       const priceCents = Math.round(Number(variant.price) * 100);
       cents += priceCents * line.quantity;
       return {...line, name:product.name, price:priceCents / 100};
     });
     if (cents > 999999999999) fail(400, 'Montant de commande trop élevé.');
     const client = (await db.query(`UPDATE clients SET first_name=$1,last_name=$2,address=$3,location=$4,order_count=order_count+1 WHERE id=$5 RETURNING id`,
       [data.client.first_name,data.client.last_name,data.delivery_address,data.location,req.customer.id])).rows[0];
     const order = (await db.query(`INSERT INTO orders (client_id,total_amount,order_details,delivery_address,location,request_key,request_hash,status_history)
       VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7,jsonb_build_array(jsonb_build_object('status','pending','at',now()))) RETURNING id,total_amount,status`,
       [client.id,cents/100,JSON.stringify({items:lines,note:data.note,client:data.client}),data.delivery_address,data.location,data.request_key,fingerprint])).rows[0];
     await db.query('COMMIT'); customer.notify(client.id); res.status(201).json(order);
   } catch (error) { await db.query('ROLLBACK'); throw error; } finally { db.release(); }
 });

 const cookieOptions = audience => ({httpOnly:true, secure:production, sameSite:'strict', path:`/api/${audience}`});
 const cookieName = audience => `spicy_${audience}`;
 async function authenticate(req, res, next) {
   let claims;
   try { claims = jwt.verify(req.cookies[cookieName(req.audience)] || '', secret, {algorithms:['HS256'], audience:req.audience, issuer:'spicy-api'}); }
   catch { return res.status(401).json({error:'Connectez-vous pour continuer.'}); }
   const user = (await pool.query(`SELECT a.id,a.name,a.email,a.role,s.csrf_token FROM admin_sessions s JOIN admins a ON a.id=s.admin_id
      WHERE s.id=$1 AND s.admin_id=$2 AND s.audience=$3 AND s.expires_at > now() AND a.is_active`, [claims.jti,Number(claims.sub),req.audience])).rows[0];
   if (!user) return res.status(401).json({error:'Session expirée. Reconnectez-vous.'});
   req.user = user; req.sessionId = claims.jti;
   if (!['GET','HEAD','OPTIONS'].includes(req.method) && req.get('X-CSRF-Token') !== user.csrf_token) return res.status(403).json({error:'Jeton de sécurité invalide. Reconnectez-vous.'});
   next();
 }
 function requireAdmin(req, res, next) { if (!['admin','super_admin'].includes(req.user.role)) return res.status(403).json({error:'Accès administrateur requis.'}); next(); }
 function requireSuperAdmin(req, res, next) { if (req.user.role !== 'super_admin') return res.status(403).json({error:'Accès super administrateur requis.'}); next(); }
 for (const audience of ['admin','superadmin']) {
   const router = express.Router();
   router.use((req,res,next) => {req.audience=audience; next();});
   router.post('/login', loginLimit, async (req,res) => {
     const data = parse(loginSchema, req.body);
     const user = (await pool.query('SELECT * FROM admins WHERE email=$1', [data.email])).rows[0];
     // A fixed valid hash keeps missing-account password work comparable.
     const valid = await verifyPassword(data.password, user?.password_hash || `scrypt:${'0'.repeat(32)}:${'0'.repeat(128)}`);
     if (!user || !valid || !user.is_active || audience === 'superadmin' && user.role !== 'super_admin') fail(401, 'Identifiants incorrects.');
     await pool.query('DELETE FROM admin_sessions WHERE expires_at <= now()');
     const sessionId = randomUUID(), csrf = randomBytes(32).toString('hex');
     // Recheck under a row lock: a concurrent password reset must not leave a new old-password session.
     const db=await pool.connect();
     try {
       await db.query('BEGIN');
       const current=(await db.query('SELECT password_hash,email,role,is_active FROM admins WHERE id=$1 FOR UPDATE',[user.id])).rows[0];
       if(!current||!current.is_active||current.email!==user.email||current.password_hash!==user.password_hash||current.role!==user.role)fail(401,'Identifiants incorrects.');
       await db.query("INSERT INTO admin_sessions(id,admin_id,audience,csrf_token,expires_at) VALUES ($1,$2,$3,$4,now()+interval '8 hours')", [sessionId,user.id,audience,csrf]);
       await db.query('COMMIT');
     }catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
     const token = jwt.sign({}, secret, {algorithm:'HS256', subject:String(user.id), audience, issuer:'spicy-api', jwtid:sessionId, expiresIn:'8h'});
     res.cookie(cookieName(audience), token, {...cookieOptions(audience),maxAge:8*3600000});
     res.json({id:user.id,name:user.name,email:user.email,role:user.role,csrf_token:csrf});
   });
   router.use(authenticate, audience === 'superadmin' ? requireSuperAdmin : requireAdmin);
   mountUploads(router,uploadDir,limiter(30,15));
   router.get('/session', (req,res) => res.json(req.user));
   router.post('/logout', async (req,res) => {await pool.query('DELETE FROM admin_sessions WHERE id=$1',[req.sessionId]); res.clearCookie(cookieName(audience),cookieOptions(audience)).status(204).end();});
   router.get('/menu', async (req,res) => res.json((await pool.query('SELECT * FROM menu_items ORDER BY id')).rows));
   router.post('/menu', async (req,res) => {
     const d=parse(menuSchema,req.body);
     const result=await pool.query('INSERT INTO menu_items(name,description,price,category,image_url,spiciness_level,is_available,variants) VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb) RETURNING *', [d.name,d.description,d.price,d.category,d.image_url,d.spiciness_level,d.is_available,JSON.stringify(d.variants)]);
     notifyPublic(); res.status(201).json(result.rows[0]);
   });
   router.put('/menu/:id', async (req,res) => {
     const d=parse(menuSchema,req.body);
     const result=await pool.query('UPDATE menu_items SET name=$1,description=$2,price=$3,category=$4,image_url=$5,spiciness_level=$6,is_available=$7,variants=$8::jsonb,updated_at=now() WHERE id=$9 RETURNING *', [d.name,d.description,d.price,d.category,d.image_url,d.spiciness_level,d.is_available,JSON.stringify(d.variants),idParam(req.params.id)]);
     if (!result.rowCount) fail(404,'Plat introuvable.'); notifyPublic(); res.json(result.rows[0]);
   });
   router.delete('/menu/:id', async (req,res) => { const result=await pool.query('DELETE FROM menu_items WHERE id=$1',[idParam(req.params.id)]); if(!result.rowCount) fail(404,'Plat introuvable.'); notifyPublic(); res.status(204).end(); });
   router.get('/clients', async (req,res) => {
     const page=Math.max(1,Math.min(100000,Number.parseInt(req.query.page,10)||1));
     const search=String(req.query.search||'').slice(0,100);
     const where="WHERE concat(first_name,' ',last_name,' ',phone) ILIKE $1";
     const params=[`%${search}%`];
     const result=await pool.query(`SELECT * FROM clients ${where} ORDER BY created_at DESC,id DESC LIMIT 25 OFFSET $2`,[...params,(page-1)*25]);
     const count=await pool.query(`SELECT count(*) FROM clients ${where}`,params);
     res.json({items:result.rows,total:Number(count.rows[0].count),page});
   });
   router.get('/orders', async (req,res) => {
     const page=Math.max(1,Math.min(100000,Number.parseInt(req.query.page,10)||1));
     const result=await pool.query(`SELECT o.*,c.first_name,c.last_name,c.phone FROM orders o JOIN clients c ON c.id=o.client_id ORDER BY o.created_at DESC,o.id DESC LIMIT 25 OFFSET $1`,[(page-1)*25]);
     const count=await pool.query('SELECT count(*) FROM orders'); res.json({items:result.rows,total:Number(count.rows[0].count),page});
   });
   router.patch('/orders/:id', async (req,res) => {
     const d=parse(z.object({status:z.enum(['pending','preparing','completed','cancelled'])}).strict(),req.body);
     const result=await pool.query(`UPDATE orders SET status=$1::text,status_history=CASE WHEN status<>$1::text THEN status_history||jsonb_build_array(jsonb_build_object('status',$1::text,'at',now())) ELSE status_history END WHERE id=$2 RETURNING id,status,client_id`,[d.status,idParam(req.params.id)]);
     if(!result.rowCount) fail(404,'Commande introuvable.'); customer.notify(result.rows[0].client_id); res.json({id:result.rows[0].id,status:result.rows[0].status});
   });
   // Explicit role guard on both namespaces, even if the UI hides these screens.
   router.get('/settings', requireSuperAdmin, async(req,res) => res.json(Object.fromEntries((await pool.query('SELECT setting_key,setting_value FROM site_settings')).rows.map(r=>[r.setting_key,r.setting_value]))));
   router.put('/settings', requireSuperAdmin, async(req,res) => {
     const data=parse(settingsSchema,req.body), db=await pool.connect();
     try { await db.query('BEGIN'); for(const [key,value] of Object.entries(data)) await db.query('INSERT INTO site_settings(setting_key,setting_value) VALUES($1,$2) ON CONFLICT(setting_key) DO UPDATE SET setting_value=EXCLUDED.setting_value,updated_at=now()',[key,value]); await db.query('COMMIT'); }
     catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();} notifyPublic(); res.json(data);
   });
   mountStaff(router,{pool,requireSuperAdmin,limiter});
   app.use(`/api/${audience}`,router);
 }
 app.use((req,res)=>res.status(404).json({error:'Route introuvable.'}));
 app.use((error,req,res,next)=>{
   if(res.headersSent)return next(error);
   if(error.type==='entity.too.large')return res.status(413).json({error:'Fichier trop volumineux (5 Mo maximum pour une photo).'});
   if(error.code==='23505') return res.status(409).json({error:'Cette entrée existe déjà.'});
   const status=error.status||500;
   if(status>=500) console.error('API error',error.code || error.name);
   res.status(status).json({error:status>=500?'Service temporairement indisponible. Réessayez.':error.message});
 });
 return app;
}
