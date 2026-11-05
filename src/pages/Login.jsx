import React,{useState} from 'react';import {useNavigate} from 'react-router-dom';import {motion} from 'framer-motion';import toast from 'react-hot-toast';
import {useApp} from '../contexts/AppContext';import {api} from '../services/api';import {PATHWAYS} from '../data/mock';import Atmosphere from '../components/Atmosphere';
export default function Login(){const {login}=useApp(),nav=useNavigate();const [u,setU]=useState(''),[p,setP]=useState(''),[w,setW]=useState(PATHWAYS[0].name),[busy,setBusy]=useState(false);
 const go=async e=>{e.preventDefault();setBusy(true);try{login({...(await api.login(u,p)),pathway:w});nav('/dashboard')}catch(x){toast.error(x.message);setBusy(false)}};
 return <div className="min-h-screen grid place-items-center p-4"><Atmosphere/>
 <motion.form onSubmit={go} className="panel w-full max-w-sm space-y-3" animate={busy?{boxShadow:'0 0 60px #8B0000'}:{}}>
  <motion.svg viewBox="0 0 100 100" className="w-24 mx-auto" animate={{rotate:busy?360:0}} transition={{duration:2}}><circle cx="50" cy="50" r="44" fill="none" stroke="#D4AF37" strokeWidth="2"/><circle cx="50" cy="50" r="32" fill="none" stroke="#7B5A2B"/><path d="M50 14L58 42 86 50 58 58 50 86 42 58 14 50 42 42Z" fill="#8B0000" stroke="#D4AF37"/></motion.svg>
  <h1 className="text-center text-2xl text-gold">Beyonder Registry</h1>
  <label className="block text-sm">Name<input className="inp" value={u} onChange={e=>setU(e.target.value)} autoComplete="username"/></label>
  <label className="block text-sm">Password<input type="password" className="inp" value={p} onChange={e=>setP(e.target.value)} autoComplete="current-password"/></label>
  <label className="block text-sm">Pathway<select className="inp" value={w} onChange={e=>setW(e.target.value)}>{PATHWAYS.map(x=><option key={x.id}>{x.name}</option>)}</select></label>
  <button className="btn w-full" disabled={busy}>{busy?'Crossing the fog…':'Enter the gathering'}</button></motion.form></div>}
