import { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';
export default function Modal({title,onClose,children}) {
 const ref=useRef(null),id=useId();
 useEffect(()=>{const previous=document.activeElement;ref.current.showModal();const overflow=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=overflow;previous?.focus();};},[]);
 return <dialog ref={ref} aria-labelledby={id} onCancel={e=>{e.preventDefault();onClose();}}><header><h2 id={id}>{title}</h2><button onClick={onClose} aria-label="Fermer"><X size={19}/></button></header>{children}</dialog>;
}
