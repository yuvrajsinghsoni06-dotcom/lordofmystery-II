// Shared, authenticated socket. One connection for the whole app, no matter how many components use it.
import {useSyncExternalStore} from 'react';
const API=import.meta.env.VITE_API_URL||'';
let ws=null,refs=0,tries=0,hb,pongT,rt,stopped=true;
const seen=new Set(),lastTs={},subs={},ls=new Set();
const ALIAS={PRAYER_BROADCAST:'prayer',COMMISSION_UPDATED:'commission',PROJECTION_UPDATED:'projection'};
let S={status:'offline',stale:false,onlineMembers:[],incomingPrayers:[],activeDispatches:[],historicalProjections:[],commissionUpdates:[]};
const set=p=>{S={...S,...p};ls.forEach(f=>f())};
const emit=(t,p)=>(subs[t]||[]).forEach(f=>f(p));
async function snapshot(){try{const r=await fetch(API+'/api/snapshot',{credentials:'include'});if(!r.ok)throw 0;const d=await r.json();
 set({stale:false,onlineMembers:d.members.filter(m=>m.online),incomingPrayers:d.prayers,historicalProjections:d.projections})}catch{set({stale:true})}}
function handle(raw){let m;try{m=JSON.parse(raw)}catch{return}
 if(m.type==='pong'){clearTimeout(pongT);return}
 if(!m.id||seen.has(m.id))return;seen.add(m.id);if(seen.size>500)seen.delete(seen.values().next().value);
 const replace=m.type==='MEMBER_PRESENCE_UPDATED';if(replace){if(m.ts<(lastTs[m.type]||''))return;lastTs[m.type]=m.ts}
 const p=m.payload;
 if(m.type==='MEMBER_PRESENCE_UPDATED')set({onlineMembers:p.online});
 else if(m.type==='PRAYER_BROADCAST')set({incomingPrayers:[p,...S.incomingPrayers].slice(0,50),...(p.type==='EMERGENCY'?{activeDispatches:[p,...S.activeDispatches].slice(0,20)}:{})});
 else if(m.type==='COMMISSION_UPDATED')set({commissionUpdates:[p,...S.commissionUpdates].slice(0,50)});
 else if(m.type==='PROJECTION_UPDATED')set({historicalProjections:[p,...S.historicalProjections.filter(x=>x.id!==p.id)]});
 else if(m.type==='PROJECTION_EXPIRED')set({historicalProjections:S.historicalProjections.filter(x=>x.id!==p.id)});
 emit(m.type,p);if(ALIAS[m.type])emit(ALIAS[m.type],p)}
function connect(){if(!API||ws)return;stopped=false;set({status:tries?'reconnecting':'connecting'});
 const w=ws=new WebSocket(API.replace(/^http/,'ws')+'/ws');
 w.onopen=()=>{const re=tries>0;tries=0;set({status:'connected'});if(re||true)snapshot();
  hb=setInterval(()=>{if(w.readyState!==1)return;w.send(JSON.stringify({type:'ping'}));pongT=setTimeout(()=>w.close(),10000)},20000)};
 w.onmessage=e=>handle(e.data);w.onerror=()=>w.close();
 w.onclose=()=>{clearInterval(hb);clearTimeout(pongT);ws=null;if(stopped){set({status:'offline'});return}
  set({status:'reconnecting'});rt=setTimeout(connect,Math.min(30000,1000*2**tries++)*(.5+Math.random()/2))}}
function disconnect(){stopped=true;clearTimeout(rt);clearInterval(hb);clearTimeout(pongT);ws?.close();ws=null;set({status:'offline'})}
const on=(t,f)=>{(subs[t]??=[]).push(f);return()=>{subs[t]=subs[t].filter(x=>x!==f)}};
// All writes go through the REST API (authoritative); the socket only receives.
const send=()=>false;
const sub=f=>{ls.add(f);if(++refs===1)connect();return()=>{ls.delete(f);if(--refs===0)disconnect()}};
export default function useSefirahSocket(){const s=useSyncExternalStore(sub,()=>S);return {...s,send,on,connect,disconnect}}
