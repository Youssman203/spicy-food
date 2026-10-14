import { PGlite } from '@electric-sql/pglite';
// Real PostgreSQL engine (WASM), in memory. Pool-compatible adapter for sequential tests.
export async function testPool() {
 const db=new PGlite(); await db.waitReady;
 const pool={
  async query(sql,params){
   if(!params && sql.includes(';')) {const results=await db.exec(sql);const last=results.at(-1);return {...last,rowCount:last?.affectedRows||last?.rows?.length||0};}
   const result=await db.query(sql,params);return {...result,rowCount:result.affectedRows||result.rows.length};
  },
  async connect(){return {...pool,release(){}};},async end(){await db.close();},
 };
 return pool;
}
