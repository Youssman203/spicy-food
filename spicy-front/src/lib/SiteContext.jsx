import { createContext, useContext } from 'react';
export const SiteContext=createContext(null);
export const useSettings=()=>useContext(SiteContext);
export const contactLink=(settings,message)=>settings?.infoline_phone?`https://wa.me/${settings.infoline_phone.replace(/\D/g,'')}?text=${encodeURIComponent(message)}`:null;
