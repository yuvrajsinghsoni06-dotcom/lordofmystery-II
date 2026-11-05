import {PrismaClient} from '@prisma/client';import bcrypt from 'bcryptjs';
const db=new PrismaClient();
const ARCANA=['The Fool','The Magician','The High Priestess','The Empress','The Emperor','The Hierophant','The Lovers','The Chariot','Strength','The Hermit','Wheel of Fortune','Justice','The Hanged Man','Death','Temperance','The Devil','The Tower','The Star','The Moon','The Sun','Judgement','The World'];
const PERSONAS=['The Fool','The World','Justice','The Sun','The Hermit','The Moon','The Star','The Magician'];
const USERS:[string,string,string,number,string][]=[['klein','Klein Moretti','Fool',5,'Backlund'],['audrey','Audrey Hall','Spectator',7,'Backlund'],['alger','Alger Wilson','Sailor',6,'Backlund'],['derrick','Derrick Berg','Sun',4,'Tingen'],['fors','Fors Wall','Reader',8,'Tingen'],['emlyn','Emlyn White','Hermit',9,'Trier']];
async function main(){
 const hash=await bcrypt.hash(process.env.DEMO_PASSWORD||'dev-only-change-me',10);
 for(let i=0;i<22;i++)await db.tarotSeat.upsert({where:{id:i},update:{},create:{id:i,title:ARCANA[i]}});
 for(const n of PERSONAS)await db.persona.upsert({where:{name:n},update:{},create:{name:n}});
 const personas=await db.persona.findMany();
 for(const [u,c,p,s,r] of USERS){
  const user=await db.user.upsert({where:{username:u},update:{},create:{username:u,passwordHash:hash,profile:{create:{codename:c,pathway:p,sequence:s,region:r}}}});
  for(const per of personas.slice(0,s<=5?5:2))await db.userPersona.upsert({where:{userId_personaId:{userId:user.id,personaId:per.id}},update:{},create:{userId:user.id,personaId:per.id}});
 }
 if(await db.artifact.count()===0){
  const names=['Blasphemy Slate','Crimson Candle','Silent Lantern','Weeping Mirror','Bronze Compass','Hollow Chalice','Gray Hourglass','Shackled Grimoire'];
  await db.artifact.createMany({data:Array.from({length:24},(_,i)=>({name:names[i%8]+' '+(Math.floor(i/8)+1),grade:i%4,description:'A sealed relic kept in the Church archives. Its cost is paid in sanity.',drainRate:+(0.5+(i%4)*1.3).toFixed(1),usage:'Use only inside a warded room with a second Beyonder present.',available:i%5!==0}))});
 }
 const k=await db.user.findUniqueOrThrow({where:{username:'klein'}});
 if(await db.barterListing.count()===0)await db.barterListing.create({data:{ownerId:k.id,kind:'POTION',title:'Seer formula (Sequence 8)',details:'Complete, verified formula.',wants:'Intelligence on Tingen cult activity'}});
 if(await db.intelligencePost.count()===0)await db.intelligencePost.create({data:{authorId:k.id,title:'Silent lantern sighting',body:'A Grade 2 lantern was seen near the Tingen docks.'}});
 console.log('Seeded. Demo users (local dev only): klein, audrey, alger, derrick, fors, emlyn');
}
main().finally(()=>db.$disconnect());
