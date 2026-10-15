import { useEffect, useState } from 'react';

export default function DemoAccess({audience}){
 const [demo,setDemo]=useState(null);
 useEffect(()=>{let active=true;fetch('/api/demo').then(async r=>r.ok?r.json():null).then(d=>{if(active&&d?.enabled===true)setDemo(d);}).catch(()=>{});return()=>{active=false;};},[]);
 if(!demo)return null;
 return <div className="demo-access"><span className="tag">DÉMO LOCALE · {demo.instance}</span><p>Accès immédiat, sans email ni mot de passe.</p><form method="post" action={`/api/demo/${audience}/enter`}><button className="primary">Tester l’interface {audience==='superadmin'?'super admin':'admin'}</button></form><a href="/demo/">Choisir une autre interface →</a></div>;
}
