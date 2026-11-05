import {BEYONDERS,COMMISSIONS,ARTIFACTS,PATHWAYS,MEMBERS} from '../data/mock';
const wait=d=>new Promise(r=>setTimeout(r,d));
const wrap=data=>async()=>{await wait(150);return structuredClone(data)};
export const api={beyonders:wrap(BEYONDERS),commissions:wrap(COMMISSIONS),artifacts:wrap(ARTIFACTS),pathways:wrap(PATHWAYS),members:wrap(MEMBERS),
 login:async(u,p)=>{await wait(900);if(!u||!p)throw new Error('Name and password required');return{name:u}}};
