import React,{useState} from 'react';import {motion} from 'framer-motion';import {PATHWAYS,seqName} from '../data/mock';
export default function Pathways(){const [open,setOpen]=useState(null);
 return <div className="space-y-3"><h1 className="text-2xl text-gold">Potion Pathways</h1><div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
 {PATHWAYS.map(p=><div key={p.id} className="panel" style={{borderColor:p.color}}><h2 style={{color:p.color}}>{p.name}</h2><p className="text-sm">{p.abilities}</p><p className="text-xs mt-1 opacity-80">{p.requirements}</p>
  <div className="mt-2 text-xs">Madness risk {p.madnessRisk}%<div className="h-1.5 bg-void"><div className="h-full bg-crimson" style={{width:p.madnessRisk+'%'}}/></div></div>
  <button className="btn mt-2" aria-expanded={open===p.id} onClick={()=>setOpen(open===p.id?null:p.id)}>{open===p.id?'Hide sequences':'Show sequences'}</button>
  {open===p.id&&<ol className="mt-2 border-l-2 pl-3 space-y-1" style={{borderColor:p.color}}>{[9,8,7,6,5,4,3,2,1,0].map((n,i)=><motion.li key={n} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*.04}} className="text-sm">{n}: {seqName(p,n)}</motion.li>)}</ol>}</div>)}</div></div>}
