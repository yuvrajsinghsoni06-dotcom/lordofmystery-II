import {useEffect,useRef,useState,useCallback} from 'react';
import {MEMBERS,BEYONDERS,COMMISSIONS} from '../data/mock';
const URL_=import.meta.env.VITE_WS_URL;
export default function useSimulatedSocket(url=URL_){
 const ws=useRef(null),hb=useRef(),rt=useRef(),sim=useRef([]),tries=useRef(0),subs=useRef({}),stop=useRef(true),handleRef=useRef();
 const [status,setStatus]=useState('closed');
 const [state,setState]=useState({onlineMembers:MEMBERS.filter(m=>m.online),incomingPrayers:[],activeDispatches:[],historicalProjections:[],commissionUpdates:[]});
 const on=useCallback((t,f)=>{(subs.current[t]??=[]).push(f);return()=>{subs.current[t]=subs.current[t].filter(x=>x!==f)}},[]);
 const handle=useCallback(raw=>{let m;try{m=typeof raw==='string'?JSON.parse(raw):raw}catch{return}
  if(!m||m.type==='pong')return;
  setState(s=>{const n={...s},p=m.payload;
   if(m.type==='presence')n.onlineMembers=p;
   if(m.type==='prayer')n.incomingPrayers=[p,...s.incomingPrayers].slice(0,50);
   if(m.type==='dispatch')n.activeDispatches=[p,...s.activeDispatches].slice(0,20);
   if(m.type==='projection')n.historicalProjections=[p,...s.historicalProjections];
   if(m.type==='commission')n.commissionUpdates=[p,...s.commissionUpdates].slice(0,50);
   return n});
  (subs.current[m.type]||[]).forEach(f=>f(m.payload))},[]);
 handleRef.current=handle;
 const startSim=()=>{setStatus('open');const e=(t,p)=>handleRef.current({type:t,payload:p});
  sim.current=[
   setInterval(()=>e('presence',MEMBERS.filter(()=>Math.random()>.35)),6000),
   setInterval(()=>{const b=BEYONDERS[Math.floor(Math.random()*50)];e('prayer',{id:Date.now(),from:b.codename,beyonderId:b.id,type:['Prayer','Support Request','Emergency Dispatch'][Math.floor(Math.random()*3)],message:'Lord of the Mysteries, grant me guidance.',at:Date.now()})},14000),
   setInterval(()=>{const c=COMMISSIONS[Math.floor(Math.random()*25)];e('commission',{id:c.id,status:['Assigned','Active','Completed','Failed'][Math.floor(Math.random()*4)],progress:Math.floor(Math.random()*100)})},9000)]};
 const connect=useCallback(()=>{stop.current=false;
  if(!url){startSim();return}
  setStatus('connecting');const w=new WebSocket(url);ws.current=w;
  w.onopen=()=>{tries.current=0;setStatus('open');hb.current=setInterval(()=>w.readyState===1&&w.send(JSON.stringify({type:'ping'})),20000)};
  w.onmessage=e=>handleRef.current(e.data);
  w.onclose=()=>{clearInterval(hb.current);setStatus('closed');if(!stop.current){const d=Math.min(30000,1000*2**tries.current++);rt.current=setTimeout(connect,d)}};
  w.onerror=()=>w.close()},[url]);
 const disconnect=useCallback(()=>{stop.current=true;clearTimeout(rt.current);clearInterval(hb.current);sim.current.forEach(clearInterval);sim.current=[];ws.current?.close();setStatus('closed')},[]);
 const send=useCallback((type,payload)=>{const m={type,payload};if(!url)handleRef.current(m);else if(ws.current?.readyState===1)ws.current.send(JSON.stringify(m))},[url]);
 useEffect(()=>{connect();return disconnect},[connect,disconnect]);
 return {status,send,on,connect,disconnect,...state};
}
