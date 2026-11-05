import React,{useEffect} from 'react';import {motion,AnimatePresence} from 'framer-motion';import {X} from 'lucide-react';
export default function Modal({open,onClose,title,children}){
 useEffect(()=>{const h=e=>e.key==='Escape'&&onClose();window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[onClose]);
 return <AnimatePresence>{open&&<motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}>
  <motion.div role="dialog" aria-label={title} className="panel max-w-lg w-full" initial={{scale:.92,y:20}} animate={{scale:1,y:0}} exit={{scale:.95,opacity:0}} onClick={e=>e.stopPropagation()}>
   <div className="flex justify-between mb-3"><h2 className="text-gold text-xl">{title}</h2><button aria-label="Close" onClick={onClose}><X size={18}/></button></div>{children}</motion.div></motion.div>}</AnimatePresence>}
