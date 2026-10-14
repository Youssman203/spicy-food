import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createPool } from '../src/db.js';
export async function migrate(pool) {
 const db=await pool.connect();
 try {
  await db.query('BEGIN');
  await db.query('SELECT pg_advisory_xact_lock(20261014)');
  await db.query('CREATE TABLE IF NOT EXISTS schema_migrations(name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
  const dir=new URL('../../spicy-data/migrations/',import.meta.url);
  for(const name of (await readdir(dir)).filter(n=>n.endsWith('.sql')).sort()) {
   if((await db.query('SELECT name FROM schema_migrations WHERE name=$1',[name])).rowCount) continue;
   await db.query(await readFile(new URL(name,dir),'utf8')); await db.query('INSERT INTO schema_migrations(name) VALUES($1)',[name]);
  }
  await db.query('COMMIT');
 }catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
}
export async function seed(pool) {
 const db=await pool.connect();
 try {
  await db.query('BEGIN'); await db.query('SELECT pg_advisory_xact_lock(20261015)');
  await db.query('CREATE TABLE IF NOT EXISTS schema_seeds(name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
  if(!(await db.query("SELECT name FROM schema_seeds WHERE name='001_catalog'")).rowCount) {
   await db.query(await readFile(new URL('../../spicy-data/seeds/001_catalog.sql',import.meta.url),'utf8'));
   await db.query("INSERT INTO schema_seeds(name) VALUES('001_catalog')");
  }
  await db.query('COMMIT');
 }catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
 const pool=createPool();
 try {if(process.argv[2]==='migrate') await migrate(pool); else if(process.argv[2]==='seed') await seed(pool); else throw new Error('Utiliser migrate ou seed.'); console.log('Base mise à jour.');}
 finally{await pool.end();}
}
