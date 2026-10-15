import { randomBytes, createHash } from 'node:crypto';
import { z } from 'zod';
import { fail, parse, phone } from './validation.js';

const digest=value=>createHash('sha256').update(value).digest('hex');
const profileSchema=z.object({first_name:z.string().trim().min(1).max(80),last_name:z.string().trim().min(1).max(80),phone,address:z.string().trim().min(5).max(1000),location:z.enum(['Lubumbashi','Kolwezi'])}).strict();
const registrationSchema=profileSchema.pick({first_name:true,last_name:true,phone:true});
export function mountCustomer(app,{pool,production,limiter}) {
 const options={httpOnly:true,secure:production,sameSite:'strict',path:'/api'};
 const streams=new Set();
 const profile=c=>({id:c.id,first_name:c.first_name,last_name:c.last_name,phone:c.phone,address:c.address||'',location:c.location});
 async function authenticate(req,res,next){
  const token=req.cookies.spicy_customer;
  if(!token || !/^[a-f0-9]{64}$/.test(token)) fail(401,'Connecte-toi pour retrouver ton espace.');
  const row=(await pool.query(`SELECT c.*,s.expires_at FROM customer_sessions s JOIN clients c ON c.id=s.client_id WHERE s.token_hash=$1 AND s.expires_at>now()`,[digest(token)])).rows[0];
  if(!row) fail(401,'Ta session a expiré. Crée un nouvel espace sur cet appareil.');
  req.customer=row;req.customerToken=digest(token);next();
 }
 function notify(clientId){for(const stream of streams)if(stream.clientId===clientId)stream.res.write('event: orders\ndata: {}\n\n');}
 app.post('/api/customer/register',limiter(20,60),async(req,res)=>{
  const data=parse(registrationSchema,req.body);
  // Reuse only the browser's valid session, never a match on an unverified phone.
  const existingToken=req.cookies.spicy_customer;
  if(existingToken&&/^[a-f0-9]{64}$/.test(existingToken)){
   const existing=(await pool.query('SELECT c.* FROM customer_sessions s JOIN clients c ON c.id=s.client_id WHERE s.token_hash=$1 AND s.expires_at>now()',[digest(existingToken)])).rows[0];
   if(existing)return res.json(profile(existing));
  }
  const db=await pool.connect();let customer;
  const token=randomBytes(32).toString('hex');
  try{
   await db.query('BEGIN');
   customer=(await db.query('INSERT INTO clients(first_name,last_name,phone) VALUES($1,$2,$3) RETURNING *',[data.first_name,data.last_name,data.phone])).rows[0];
   await db.query('DELETE FROM customer_sessions WHERE expires_at<=now()');
   await db.query("INSERT INTO customer_sessions(token_hash,client_id,expires_at) VALUES($1,$2,now()+interval '30 days')",[digest(token),customer.id]);
   await db.query('COMMIT');
  }catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
  res.cookie('spicy_customer',token,{...options,maxAge:30*86400000}).status(201).json(profile(customer));
 });
 app.get('/api/customer/session',authenticate,(req,res)=>res.json(profile(req.customer)));
 app.put('/api/customer/profile',authenticate,async(req,res)=>{
  const d=parse(profileSchema,req.body);
  const c=(await pool.query('UPDATE clients SET first_name=$1,last_name=$2,address=$3,location=$4,phone=$5 WHERE id=$6 RETURNING *',[d.first_name,d.last_name,d.address,d.location,d.phone,req.customer.id])).rows[0];
  res.json(profile(c));
 });
 app.post('/api/customer/logout',authenticate,async(req,res)=>{
  await pool.query('DELETE FROM customer_sessions WHERE token_hash=$1',[req.customerToken]);
  for(const stream of streams)if(stream.token===req.customerToken)stream.res.end();
  res.clearCookie('spicy_customer',options).json({ok:true});
 });
 app.get('/api/customer/orders',authenticate,async(req,res)=>{
  const page=Math.max(1,Math.min(100000,parseInt(req.query.page,10)||1));
  const result=await pool.query('SELECT id,total_amount,status,status_history,order_details,delivery_address,location,created_at FROM orders WHERE client_id=$1 ORDER BY created_at DESC,id DESC LIMIT 20 OFFSET $2',[req.customer.id,(page-1)*20]);
  const count=await pool.query('SELECT count(*) FROM orders WHERE client_id=$1',[req.customer.id]);
  res.json({items:result.rows,total:Number(count.rows[0].count),page});
 });
 app.get('/api/customer/events',authenticate,(req,res)=>{
  res.set({'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});res.flushHeaders();res.write(': connected\n\n');
  const stream={clientId:req.customer.id,token:req.customerToken,res};streams.add(stream);
  const timer=setInterval(()=>{if(new Date(req.customer.expires_at)<=new Date())res.end();else res.write(': heartbeat\n\n');},25000);
  req.on('close',()=>{clearInterval(timer);streams.delete(stream);});
 });
 return {authenticate,notify};
}
