import React,{createContext,useContext,useState} from 'react';
import useReal from '../hooks/useSefirahSocket';import useSim from '../hooks/useSimulatedSocket';
const useSefirahSocket=import.meta.env.VITE_API_URL?useReal:useSim;
const Ctx=createContext();export const useApp=()=>useContext(Ctx);
export function AppProvider({children}){
 const [user,setUser]=useState(()=>{try{return JSON.parse(sessionStorage.getItem('user'))}catch{return null}});
 const socket=useSefirahSocket();
 const login=u=>{sessionStorage.setItem('user',JSON.stringify(u));setUser(u)};
 const logout=()=>{sessionStorage.removeItem('user');setUser(null)};
 return <Ctx.Provider value={{user,login,logout,socket}}>{children}</Ctx.Provider>}
