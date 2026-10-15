export async function request(path, options={}) {
 const response=await fetch(`/api${path}`,{...options,headers:{'Content-Type':'application/json',...options.headers},body:options.body===undefined?undefined:JSON.stringify(options.body)});
 const data=await response.json();
 if(!response.ok) {const error=new Error(data.error||'Le service est momentanément indisponible.');error.status=response.status;throw error;}
 return data;
}
export const labels={tacos:'Tacos',sandwichs:'Sandwichs',combos:'Plats & Frites',boissons:'Boissons'};
export function toProduct(item) {return {...item,category:labels[item.category],image:item.image_url,variants:item.variants,spicy:item.category!=='boissons',badge:item.spiciness_level==='Fiery'?'FIERY':''};}
