export function createApi(audience, onUnauthorized) {
 let csrf='';
 async function api(path, options={}) {
  const response=await fetch(`/api/${audience}${path}`,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json','X-CSRF-Token':csrf,...options.headers},body:options.body===undefined?undefined:JSON.stringify(options.body)});
  const data=response.status===204?null:await response.json();
  if(!response.ok){if(response.status===401 && path!=='/login') onUnauthorized();throw new Error(data?.error||'La requête a échoué.');}
  if(data?.csrf_token) csrf=data.csrf_token;
  return data;
 }
 return api;
}
