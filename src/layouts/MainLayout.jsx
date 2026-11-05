import React from 'react';import {NavLink,Outlet,Navigate} from 'react-router-dom';import {LayoutDashboard,Users,FlaskConical,ScrollText,Stars,Library,Table2,Settings,LogOut} from 'lucide-react';
import {useApp} from '../contexts/AppContext';import Atmosphere from '../components/Atmosphere';
const nav=[['/dashboard','Dashboard',LayoutDashboard],['/beyonders','Beyonders',Users],['/pathways','Pathways',FlaskConical],['/commissions','Commissions',ScrollText],['/crimson-stars','Crimson Stars',Stars],['/fog-history','Fog of History',Library],['/bronze-table','Bronze Table',Table2],['/settings','Settings',Settings]];
export default function MainLayout(){const {user,logout,socket}=useApp();if(!user)return <Navigate to="/login" replace/>;
 return <div className="min-h-screen md:flex"><Atmosphere/>
 <nav className="md:w-56 shrink-0 bg-void/80 border-b md:border-b-0 md:border-r border-bronze/60 p-3 flex md:flex-col gap-1 overflow-x-auto">
  <div className="hidden md:block font-display text-gold text-lg mb-4">Tarot Club</div>
  {nav.map(([to,l,I])=><NavLink key={to} to={to} className={({isActive})=>`flex items-center gap-2 px-3 py-2 whitespace-nowrap font-display text-sm ${isActive?'bg-crimson/40 text-gold border-l-2 border-gold':'hover:bg-fog'}`}><I size={16}/>{l}</NavLink>)}
  <div className="md:mt-auto text-xs px-3 py-2 whitespace-nowrap">Socket: <span className={socket.status==='open'?'text-spectral':'text-crimson'}>{socket.status}</span></div>
  <button onClick={logout} className="flex items-center gap-2 px-3 py-2 text-sm hover:text-gold"><LogOut size={16}/>Leave</button></nav>
 <main className="flex-1 p-4 md:p-6 min-w-0"><Outlet/></main></div>}
