import { createPool } from '../src/db.js';
const pool=createPool();
try{const result=await pool.query('SELECT id,name,email,role,is_active FROM admins ORDER BY id');console.table(result.rows);}
catch(error){console.error(error.message);process.exitCode=1;}finally{await pool.end();}
