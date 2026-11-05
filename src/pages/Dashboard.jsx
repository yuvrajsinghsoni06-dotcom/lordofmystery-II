import React,{useMemo} from 'react';import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,PieChart,Pie,Cell} from 'recharts';
import {BEYONDERS,COMMISSIONS,ARTIFACTS,PATHWAYS} from '../data/mock';import {useApp} from '../contexts/AppContext';
export default function Dashboard(){const {socket}=useApp();
 const stats=[['Registered Beyonders',BEYONDERS.length],['Active Investigations',BEYONDERS.filter(b=>b.status==='Investigating').length],['Open Commissions',COMMISSIONS.filter(c=>c.status==='Open').length],['Online Tarot Members',socket.onlineMembers.length],['Dangerous Artifacts',ARTIFACTS.filter(a=>a.danger>=7).length],['Live Prayer Queue',socket.incomingPrayers.length]];
 const byPath=useMemo(()=>PATHWAYS.map(p=>({name:p.name,count:BEYONDERS.filter(b=>b.pathway===p.name).length,color:p.color})),[]);
 const byStatus=useMemo(()=>['Open','Assigned','Active','Completed','Failed'].map(s=>({name:s,value:COMMISSIONS.filter(c=>c.status===s).length})),[]);
 const col=['#5A8DEE','#D4AF37','#7B5A2B','#6b9b6b','#8B0000'];
 return <div className="space-y-4"><h1 className="text-2xl text-gold">Dashboard</h1>
 <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{stats.map(([l,v])=><div key={l} className="panel"><div className="text-3xl font-display text-gold">{v}</div><div className="text-sm">{l}</div></div>)}</div>
 <div className="grid lg:grid-cols-2 gap-3">
  <div className="panel h-72"><h2 className="mb-2">Beyonders by pathway</h2><ResponsiveContainer><BarChart data={byPath}><XAxis dataKey="name" hide/><YAxis stroke="#EAE7DC"/><Tooltip contentStyle={{background:'#1E1E2C',border:'1px solid #7B5A2B'}}/><Bar dataKey="count">{byPath.map(d=><Cell key={d.name} fill={d.color}/>)}</Bar></BarChart></ResponsiveContainer></div>
  <div className="panel h-72"><h2 className="mb-2">Commission status</h2><ResponsiveContainer><PieChart><Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={90} label>{byStatus.map((d,i)=><Cell key={d.name} fill={col[i]}/>)}</Pie><Tooltip contentStyle={{background:'#1E1E2C',border:'1px solid #7B5A2B'}}/></PieChart></ResponsiveContainer></div></div>
  <div className="panel"><h2 className="mb-2">Live prayer queue</h2>{socket.incomingPrayers.length?socket.incomingPrayers.slice(0,6).map(p=><p key={p.id} className="text-sm border-b border-bronze/30 py-1"><b className="text-gold">{p.from}</b> ({p.type}): {p.message}</p>):<p className="text-sm opacity-70">No prayers yet. The fog is quiet.</p>}</div></div>}
