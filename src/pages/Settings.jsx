import React from 'react';import {useApp} from '../contexts/AppContext';
export default function Settings(){const {user,socket}=useApp();return <div className="space-y-3 max-w-xl"><h1 className="text-2xl text-gold">Settings</h1>
 <div className="panel text-sm space-y-1"><p>Member: {user.name} ({user.pathway})</p><p>Socket: {socket.status} ({import.meta.env.VITE_WS_URL||'simulated'})</p><div className="flex gap-2 pt-2"><button className="btn" onClick={socket.connect}>Connect</button><button className="btn" onClick={socket.disconnect}>Disconnect</button></div></div></div>}
