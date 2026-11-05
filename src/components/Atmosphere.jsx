import React from 'react';
export default function Atmosphere(){return <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden bg-void">
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#2a1a20,transparent_60%)]"/>
 <div className="absolute -inset-x-20 top-1/3 h-64 bg-gradient-to-r from-transparent via-fog/60 to-transparent blur-3xl animate-drift"/>
 {Array.from({length:30}).map((_,i)=><span key={i} className="absolute w-px h-px rounded-full bg-gold" style={{left:(i*37)%100+'%',top:(i*53)%100+'%',boxShadow:'0 0 6px 2px #D4AF37',opacity:.15+(i%5)*.1}}/>)}</div>}
