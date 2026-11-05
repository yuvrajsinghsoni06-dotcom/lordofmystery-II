import React,{useRef,useEffect,useState} from 'react';import toast from 'react-hot-toast';import {BEYONDERS,ARCANA} from '../data/mock';import {useApp} from '../contexts/AppContext';import Modal from '../components/Modal';
export default function CrimsonStars(){const {socket}=useApp();const cv=useRef(),stars=useRef(BEYONDERS.map(b=>({...b}))),ripples=useRef([]),hover=useRef(null);
 const [tip,setTip]=useState(null),[menu,setMenu]=useState(null),[drawer,setDrawer]=useState(false),[form,setForm]=useState({id:'The Fool',type:'Prayer',message:''});
 useEffect(()=>socket.on('prayer',p=>{ripples.current.push({x:Math.random(),y:Math.random(),t:0});toast(`${p.from}: ${p.type}`,{icon:'🔔'});try{new Audio('/sounds/prayer.mp3').play().catch(()=>{})}catch{}}),[socket.on]);
 useEffect(()=>{const c=cv.current,x=c.getContext('2d');let raf,W,H;
  const size=()=>{W=c.width=c.clientWidth;H=c.height=c.clientHeight};size();window.addEventListener('resize',size);
  const draw=t=>{x.fillStyle='rgba(10,10,15,.35)';x.fillRect(0,0,W,H);
   for(const s of stars.current){s.x+=s.vx*16;s.y+=s.vy*16;if(s.x<0||s.x>1)s.vx*=-1;if(s.y<0||s.y>1)s.vy*=-1;
    const px=s.x*W,py=s.y*H,pulse=1+.25*Math.sin(t/600+s.sequence*2),r=(10-s.sequence)*1.3*pulse+2;
    const g=x.createRadialGradient(px,py,0,px,py,r*4);g.addColorStop(0,'#ff3b3b');g.addColorStop(.25,s.color+'aa');g.addColorStop(1,'transparent');
    x.fillStyle=g;x.beginPath();x.arc(px,py,r*4,0,7);x.fill();x.fillStyle=hover.current===s?'#fff':'#c01818';x.beginPath();x.arc(px,py,r,0,7);x.fill()}
   ripples.current=ripples.current.filter(q=>(q.t+=.012)<1);for(const q of ripples.current){x.strokeStyle=`rgba(139,0,0,${1-q.t})`;x.lineWidth=3;x.beginPath();x.arc(q.x*W,q.y*H,q.t*220,0,7);x.stroke()}
   raf=requestAnimationFrame(draw)};raf=requestAnimationFrame(draw);return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',size)}},[]);
 const find=e=>{const b=cv.current.getBoundingClientRect(),mx=e.clientX-b.left,my=e.clientY-b.top;return stars.current.find(s=>Math.hypot(s.x*b.width-mx,s.y*b.height-my)<(10-s.sequence)*1.3+10)};
 const move=e=>{const s=find(e);hover.current=s||null;setTip(s?{s,x:e.clientX,y:e.clientY}:null)};
 const send=()=>{if(!form.message.trim())return toast.error('Write your message first');socket.send(form.type==='Emergency Dispatch'?'dispatch':'prayer',{id:Date.now(),from:form.id,type:form.type,message:form.message,at:Date.now()});setForm({...form,message:''});setDrawer(false);toast.success('Sent through the fog')};
 return <div className="relative -m-4 md:-m-6 h-[calc(100vh-0px)]"><canvas ref={cv} className="w-full h-full block cursor-crosshair" onMouseMove={move} onMouseLeave={()=>setTip(null)} onClick={e=>{const s=find(e);if(s)setMenu(s)}} aria-label="Sea of Crimson Stars"/>
 <button className="btn absolute top-4 right-4 bg-void/80" onClick={()=>setDrawer(true)}>Pray</button>
 {tip&&<div className="fixed panel pointer-events-none text-xs z-40" style={{left:tip.x+14,top:tip.y+14}}><b className="text-gold">{tip.s.codename}</b><br/>{tip.s.pathway} · Sequence {tip.s.sequence}<br/>{tip.s.status}</div>}
 <Modal open={!!menu} onClose={()=>setMenu(null)} title={menu?.codename}><div className="flex gap-2"><button className="btn" onClick={()=>{toast.success('Whisper sent to '+menu.codename);setMenu(null)}}>Whisper</button><button className="btn" onClick={()=>{setForm(f=>({...f,message:`To ${menu.codename}: `}));setMenu(null);setDrawer(true)}}>Send prayer</button></div></Modal>
 {drawer&&<aside className="absolute right-0 top-0 h-full w-80 max-w-full panel space-y-2 z-30" role="dialog" aria-label="Prayer drawer"><h2 className="text-gold">Prayer</h2>
  <select className="inp" value={form.id} onChange={e=>setForm({...form,id:e.target.value})}>{ARCANA.slice(0,8).map(a=><option key={a}>{a}</option>)}</select>
  <select className="inp" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{['Prayer','Support Request','Emergency Dispatch'].map(a=><option key={a}>{a}</option>)}</select>
  <textarea className="inp h-32" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="Speak into the fog"/>
  <div className="flex gap-2"><button className="btn" onClick={send}>Send</button><button className="btn" onClick={()=>setDrawer(false)}>Close</button></div></aside>}</div>}
