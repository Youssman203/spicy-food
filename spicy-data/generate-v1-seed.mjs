// Source historique V1 ; ne pas exécuter pour exporter une base de production.
import { mkdir, writeFile } from 'node:fs/promises';
import { menu } from '../spicy-front/src/data/menu.js';
const q=value=>`'${String(value).replaceAll("'","''")}'`;
const categories={'Tacos':'tacos','Sandwichs':'sandwichs','Plats & Frites':'combos','Boissons':'boissons'};
const statements=menu.map(item=>`INSERT INTO menu_items(seed_key,name,description,price,category,image_url,spiciness_level,variants) VALUES (${[item.id,item.name,item.description,item.variants[0].price,categories[item.category],item.image,'Doux',JSON.stringify(item.variants)].map(q).join(',')}) ON CONFLICT(seed_key) DO NOTHING;`);
const settings={infoline_phone:'+243977105688',instagram_url:'https://www.instagram.com/spicyfood.drc',instagram_handle:'@spicyfood.drc',site_notice:''};
for(const [key,value] of Object.entries(settings)) statements.push(`INSERT INTO site_settings(setting_key,setting_value) VALUES(${q(key)},${q(value)}) ON CONFLICT(setting_key) DO NOTHING;`);
await mkdir(new URL('./seeds/',import.meta.url),{recursive:true});
await writeFile(new URL('./seeds/001_catalog.sql',import.meta.url),'-- Catalogue V1 officiel, prix en FC. Exécuter via npm run db:seed (transaction + registre).\n'+statements.join('\n')+'\n');
