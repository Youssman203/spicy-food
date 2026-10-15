import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { request } from './api';
const CustomerContext=createContext(null);
export const useCustomer=()=>useContext(CustomerContext);
export function CustomerProvider({children}) {
 const [customer,setCustomer]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const refresh=useCallback(async()=>{
  try{const data=await request('/customer/session');setCustomer(data);setError('');return data;}
  catch(e){if(e.status===401){setCustomer(null);setError('');}else setError('Ton espace ne peut pas être chargé. Réessaie.');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{refresh();const visible=()=>{if(document.visibilityState==='visible')refresh();};document.addEventListener('visibilitychange',visible);return()=>document.removeEventListener('visibilitychange',visible);},[refresh]);
 async function logout(){await request('/customer/logout',{method:'POST'});setCustomer(null);}
 return <CustomerContext.Provider value={{customer,setCustomer,loading,error,refresh,logout}}>{children}</CustomerContext.Provider>;
}
