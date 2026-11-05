import React from 'react';import {Routes,Route,Navigate} from 'react-router-dom';import {Toaster} from 'react-hot-toast';
import MainLayout from './layouts/MainLayout';import Login from './pages/Login';import Dashboard from './pages/Dashboard';import Beyonders from './pages/Beyonders';import Pathways from './pages/Pathways';
import Commissions from './pages/Commissions';import CrimsonStars from './pages/CrimsonStars';import FogHistory from './pages/FogHistory';import BronzeTable from './pages/BronzeTable';import Settings from './pages/Settings';
export default function App(){return <><Toaster toastOptions={{style:{background:'#1E1E2C',color:'#EAE7DC',border:'1px solid #7B5A2B'}}}/>
 <Routes><Route path="/login" element={<Login/>}/><Route element={<MainLayout/>}>
 <Route path="/dashboard" element={<Dashboard/>}/><Route path="/beyonders" element={<Beyonders/>}/><Route path="/pathways" element={<Pathways/>}/><Route path="/commissions" element={<Commissions/>}/>
 <Route path="/crimson-stars" element={<CrimsonStars/>}/><Route path="/fog-history" element={<FogHistory/>}/><Route path="/bronze-table" element={<BronzeTable/>}/><Route path="/settings" element={<Settings/>}/></Route>
 <Route path="*" element={<Navigate to="/dashboard" replace/>}/></Routes></>}
