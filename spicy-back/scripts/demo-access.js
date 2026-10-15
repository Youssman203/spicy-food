// Imported only by the disposable loopback demo, never by src/server.js.
import { randomUUID, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';

export function mountDemoAccess(app,{pool,secret,origins}) {
 if(process.env.NODE_ENV==='production')throw new Error('Les accès rapides sont interdits en production.');
 const instance=randomBytes(4).toString('hex');
 const roles={admin:{email:'admin@spicy.test',role:'admin',label:'admin'},superadmin:{email:'super@spicy.test',role:'super_admin',label:'super admin'}};
 function localOnly(req,res,next){
  const local=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
  const allowedHost=origins.some(origin=>new URL(origin).host===req.get('Host'));
  if(!local||!allowedHost)return res.status(403).json({error:'Accès réservé à la démo sur cet ordinateur.'});
  res.set({'Cache-Control':'no-store','X-Frame-Options':'DENY','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"});
  if(req.method==='POST'&&!origins.includes(req.get('Origin')))return res.status(403).json({error:'Ouvrez la page /demo/ de cette démo pour continuer.'});
  next();
 }
 app.get('/api/demo',localOnly,(req,res)=>res.json({enabled:true,instance}));
 app.get(['/demo','/demo/'],localOnly,(req,res)=>res.type('html').send(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Démo locale · Spicy</title><style>
 *{box-sizing:border-box}body{margin:0;background:#1a1a1a;color:#fff;font-family:Arial,sans-serif;min-height:100vh;display:grid;place-items:center;padding:24px}main{width:min(560px,100%);padding:32px;border:1px solid #ffffff26;border-radius:24px;background:#222}h1{font-size:38px;margin:14px 0}p{color:#ccc;line-height:1.7;font-size:14px}small{color:#f77737;letter-spacing:.12em}form{margin-top:16px}button,a{display:block;width:100%;padding:17px;border-radius:12px;text-align:center;font:700 15px Arial;cursor:pointer}button{border:0;background:#e64c2e;color:white}button:hover{background:#f77737}button:focus-visible,a:focus-visible{outline:3px solid #f77737;outline-offset:4px}a{color:white;border:1px solid #ffffff33;text-decoration:none;margin-top:16px}footer{font-size:12px;color:#aaa;margin-top:25px;line-height:1.7}
 </style></head><body><main><small>SPICY / DÉMO LOCALE</small><h1>Entre dans les coulisses.</h1><p>Choisis une interface. Aucun email ni mot de passe à saisir.</p>${Object.entries(roles).map(([audience,r])=>`<form method="post" action="/api/demo/${audience}/enter"><button>Tester l’interface ${r.label}</button></form>`).join('')}<a href="/">Tester le site client</a><footer>Base de démonstration jetable, sur cet ordinateur uniquement.<br>Les données disparaissent à l’arrêt. Instance ${instance}.</footer></main></body></html>`));
 for(const [audience,role] of Object.entries(roles)){
  app.post(`/api/demo/${audience}/enter`,localOnly,async(req,res)=>{
   const user=(await pool.query('SELECT id FROM admins WHERE email=$1 AND role=$2',[role.email,role.role])).rows[0];
   if(!user)return res.status(409).type('text').send('Compte de démonstration supprimé. Relancez la démo pour le recréer.');
   await pool.query('DELETE FROM admin_sessions WHERE expires_at<=now()');
   const id=randomUUID(),csrf=randomBytes(32).toString('hex');
   await pool.query("INSERT INTO admin_sessions(id,admin_id,audience,csrf_token,expires_at) VALUES($1,$2,$3,$4,now()+interval '8 hours')",[id,user.id,audience,csrf]);
   const token=jwt.sign({},secret,{algorithm:'HS256',subject:String(user.id),audience,issuer:'spicy-api',jwtid:id,expiresIn:'8h'});
   res.cookie(`spicy_${audience}`,token,{httpOnly:true,secure:false,sameSite:'strict',path:`/api/${audience}`,maxAge:8*3600000});
   res.redirect(303,`/${audience}/`);
  });
 }
}
