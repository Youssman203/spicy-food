import { createPool } from './db.js';
import { createApp } from './app.js';
const pool=createPool();
const production=process.env.NODE_ENV==='production';
const origins=(process.env.APP_ORIGINS || (production?'':'http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175')).split(',').filter(Boolean);
if(!origins.length) throw new Error('APP_ORIGINS est obligatoire.');
const app=createApp({pool,secret:process.env.JWT_SECRET,origins,production});
const server=app.listen(Number(process.env.PORT||3000),()=>console.log('Spicy API prête.'));
for(const signal of ['SIGTERM','SIGINT']) process.on(signal,()=>{server.close(async()=>{await pool.end();process.exit(0);});setTimeout(()=>process.exit(1),10000).unref();});
