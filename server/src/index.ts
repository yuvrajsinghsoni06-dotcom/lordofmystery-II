import express,{Request,Response,NextFunction} from 'express';import http from 'http';import cors from 'cors';import helmet from 'helmet';import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';import bcrypt from 'bcryptjs';import {z,ZodError} from 'zod';import {WebSocketServer,WebSocket} from 'ws';import rateLimit from 'express-rate-limit';
import {randomUUID} from 'crypto';import {PrismaClient,Prisma} from '@prisma/client';
const SECRET=process.env.JWT_SECRET;if(!SECRET)throw new Error('JWT_SECRET is required');
const ORIGIN=process.env.CLIENT_ORIGIN||'http://localhost:5173',PORT=+(process.env.PORT||4000),db=new PrismaClient();
class HttpErr extends Error{constructor(public status:number,public code:string,msg:string){super(msg)}}
const A=(f:(q:Request,s:Response)=>Promise<unknown>)=>(q:Request,s:Response,n:NextFunction)=>f(q,s).catch(n);
// ---------- realtime hub (server pushes only; clients never publish over WS) ----------
const conns=new Map<string,Set<WebSocket>>();
const envl=(type:string,payload:unknown)=>JSON.stringify({id:randomUUID(),type,ts:new Date().toISOString(),payload});
const toAll=(t:string,p:unknown)=>{const m=envl(t,p);conns.forEach(s=>s.forEach(w=>w.readyState===1&&w.send(m)))};
const toUsers=(ids:string[],t:string,p:unknown)=>{const m=envl(t,p);ids.forEach(i=>conns.get(i)?.forEach(w=>w.readyState===1&&w.send(m)))};
const online=()=>[...conns.keys()];
// ---------- app ----------
const app=express();app.use(helmet(),cors({origin:ORIGIN,credentials:true}),express.json({limit:'20kb'}),cookieParser());
const cookieOpts={httpOnly:true,sameSite:'lax' as const,secure:process.env.NODE_ENV==='production',maxAge:864e5};
const auth=(q:Request,s:Response,n:NextFunction)=>{try{s.locals.uid=(jwt.verify(q.cookies.token,SECRET) as {sub:string}).sub;n()}catch{n(new HttpErr(401,'UNAUTHENTICATED','Sign in required'))}};
const limit=(max:number)=>rateLimit({windowMs:6e4,max,standardHeaders:true,legacyHeaders:false,message:{error:{code:'RATE_LIMITED',message:'Too many requests, slow down'}}});
const me=(s:Response)=>s.locals.uid as string;
const profileOf=async(id:string)=>{const p=await db.memberProfile.findUnique({where:{userId:id}});if(!p)throw new HttpErr(403,'NO_PROFILE','Member profile required');return p};
app.post('/api/auth/login',limit(10),A(async(q,s)=>{const b=z.object({username:z.string().max(40),password:z.string().max(100)}).parse(q.body);
 const u=await db.user.findUnique({where:{username:b.username}});if(!u||!(await bcrypt.compare(b.password,u.passwordHash)))throw new HttpErr(401,'BAD_CREDENTIALS','Invalid username or password');
 s.cookie('token',jwt.sign({sub:u.id},SECRET,{expiresIn:'1d'}),cookieOpts).json({id:u.id,username:u.username})}));
app.post('/api/auth/logout',(q,s)=>{s.clearCookie('token').json({ok:true})});
app.get('/api/auth/me',auth,A(async(q,s)=>{const id=me(s);const [u,p,per]=await Promise.all([db.user.findUniqueOrThrow({where:{id}}),db.memberProfile.findUnique({where:{userId:id}}),db.userPersona.findMany({where:{userId:id},include:{persona:true}})]);
 s.json({id,username:u.username,role:u.role,profile:p,personas:per.map(x=>x.persona)})}));
const roster=async()=>(await db.memberProfile.findMany({where:{isPublic:true}})).map(p=>({id:p.userId,codename:p.codename,pathway:p.pathway,sequence:p.sequence,region:p.region,online:conns.has(p.userId)}));
app.get('/api/members',auth,A(async(q,s)=>{s.json(await roster())}));
// prayers + commissions
app.get('/api/prayers',auth,A(async(q,s)=>{s.json(await db.prayer.findMany({orderBy:{createdAt:'desc'},take:50,include:{persona:true,commission:true}}))}));
app.post('/api/prayers',auth,limit(5),A(async(q,s)=>{const b=z.object({personaId:z.number().int(),type:z.enum(['PRAYER','SUPPORT','EMERGENCY']),message:z.string().trim().min(3).max(500)}).parse(q.body);const id=me(s);
 if(!(await db.userPersona.findUnique({where:{userId_personaId:{userId:id,personaId:b.personaId}}})))throw new HttpErr(403,'PERSONA_FORBIDDEN','You may not use that persona');
 const p=await db.prayer.create({data:{authorId:id,...b},include:{persona:true}});toAll('PRAYER_BROADCAST',p);s.status(201).json(p)}));
app.post('/api/prayers/:id/claim',auth,limit(20),A(async(q,s)=>{const id=me(s),pr=await profileOf(id);if(pr.sequence>5)throw new HttpErr(403,'NOT_ELIGIBLE','Only Sequence 5 or higher may claim');
 try{const c=await db.$transaction(async t=>{const c=await t.commission.create({data:{prayerId:q.params.id,claimerId:id}});await t.prayer.update({where:{id:q.params.id},data:{status:'CLAIMED'}});await t.auditLog.create({data:{actorId:id,action:'CLAIM_PRAYER',target:q.params.id}});return c});
  toAll('COMMISSION_UPDATED',c);s.status(201).json(c)}
 catch(e){if(e instanceof Prisma.PrismaClientKnownRequestError){if(e.code==='P2002')throw new HttpErr(409,'ALREADY_CLAIMED','Another member already claimed this prayer');if(e.code==='P2003')throw new HttpErr(404,'NOT_FOUND','Prayer not found')}throw e}}));
// artifacts + projections (server owns expiry)
app.get('/api/artifacts',auth,A(async(q,s)=>{const f=z.object({grade:z.coerce.number().int().min(0).max(3).optional(),search:z.string().max(60).optional()}).parse(q.query);
 s.json(await db.artifact.findMany({where:{grade:f.grade,name:f.search?{contains:f.search,mode:'insensitive'}:undefined},orderBy:[{grade:'asc'},{name:'asc'}]}))}));
app.post('/api/projections',auth,limit(6),A(async(q,s)=>{const n=await db.artifact.count({where:{available:true}});if(!n)throw new HttpErr(503,'NO_ARTIFACTS','No artifacts available to project');
 const a=await db.artifact.findFirstOrThrow({where:{available:true},skip:Math.floor(Math.random()*n)});
 const p=await db.projectionSession.create({data:{userId:me(s),artifactId:a.id,expiresAt:new Date(Date.now()+60_000)},include:{artifact:true}});toAll('PROJECTION_UPDATED',p);s.status(201).json(p)}));
app.get('/api/projections/active',auth,A(async(q,s)=>{s.json(await db.projectionSession.findMany({where:{status:'ACTIVE',expiresAt:{gt:new Date()}},include:{artifact:true}}))}));
setInterval(async()=>{try{const due=await db.projectionSession.findMany({where:{status:'ACTIVE',expiresAt:{lte:new Date()}}});for(const p of due){const r=await db.projectionSession.updateMany({where:{id:p.id,status:'ACTIVE'},data:{status:'EXPIRED'}});if(r.count)toAll('PROJECTION_EXPIRED',{id:p.id})}}catch(e){console.error('sweep failed')}},3000);
// seats
app.get('/api/seats',auth,A(async(q,s)=>{const seats=await db.tarotSeat.findMany({orderBy:{id:'asc'},include:{occupant:{select:{id:true,profile:{select:{codename:true}}}}}});s.json(seats.map(x=>({id:x.id,title:x.title,occupied:!!x.occupantId,occupant:x.occupant?{id:x.occupant.id,codename:x.occupant.profile?.codename}:null})))}));
app.post('/api/seats/:id/take',auth,limit(20),A(async(q,s)=>{const id=me(s),seat=+q.params.id;if(!(seat>=0&&seat<=21))throw new HttpErr(400,'BAD_SEAT','Seat must be 0-21');
 const r=await db.$transaction(async t=>{await t.tarotSeat.updateMany({where:{occupantId:id},data:{occupantId:null}});return t.tarotSeat.updateMany({where:{id:seat,occupantId:null},data:{occupantId:id}})});
 if(!r.count)throw new HttpErr(409,'SEAT_TAKEN','That seat is already occupied');toAll('TABLE_SEAT_UPDATED',{id:seat,occupantId:id});s.json({ok:true})}));
app.post('/api/seats/leave',auth,A(async(q,s)=>{const m=await db.tarotSeat.findFirst({where:{occupantId:me(s)}});if(m){await db.tarotSeat.update({where:{id:m.id},data:{occupantId:null}});toAll('TABLE_SEAT_UPDATED',{id:m.id,occupantId:null})}s.json({ok:true})}));
// barter
app.get('/api/barter/listings',auth,A(async(q,s)=>{const k=z.enum(['POTION','INGREDIENT','ARTIFACT','OTHER']).optional().parse(q.query.kind);s.json(await db.barterListing.findMany({where:{status:'OPEN',kind:k},orderBy:{createdAt:'desc'},take:50,include:{offers:{where:{OR:[{offererId:me(s)},{listing:{ownerId:me(s)}}]}}}}))}));
app.post('/api/barter/listings',auth,limit(10),A(async(q,s)=>{const b=z.object({kind:z.enum(['POTION','INGREDIENT','ARTIFACT','OTHER']),title:z.string().trim().min(3).max(120),details:z.string().max(500),wants:z.string().max(200)}).parse(q.body);
 const l=await db.barterListing.create({data:{...b,ownerId:me(s)}});toAll('BARTER_LISTING_UPDATED',l);s.status(201).json(l)}));
app.post('/api/barter/listings/:id/offers',auth,limit(10),A(async(q,s)=>{const b=z.object({offering:z.string().trim().min(3).max(300)}).parse(q.body);const l=await db.barterListing.findUnique({where:{id:q.params.id}});
 if(!l||l.status!=='OPEN')throw new HttpErr(409,'LISTING_CLOSED','Listing is not open');if(l.ownerId===me(s))throw new HttpErr(400,'OWN_LISTING','You cannot offer on your own listing');
 const o=await db.barterOffer.create({data:{listingId:l.id,offererId:me(s),offering:b.offering}});toUsers([l.ownerId,me(s)],'BARTER_OFFER_UPDATED',o);s.status(201).json(o)}));
app.post('/api/barter/offers/:id/:action',auth,limit(20),A(async(q,s)=>{const id=me(s),act=z.enum(['accept','reject','withdraw']).parse(q.params.action);
 const o=await db.barterOffer.findUnique({where:{id:q.params.id},include:{listing:true}});if(!o)throw new HttpErr(404,'NOT_FOUND','Offer not found');
 const isOwner=o.listing.ownerId===id,isOfferer=o.offererId===id;
 if(act==='withdraw'?!isOfferer:!isOwner)throw new HttpErr(403,'FORBIDDEN','Not allowed');
 const to=act==='accept'?'ACCEPTED':act==='reject'?'REJECTED':'WITHDRAWN';
 const res=await db.$transaction(async t=>{const u=await t.barterOffer.updateMany({where:{id:o.id,status:'PENDING'},data:{status:to}});if(!u.count)throw new HttpErr(409,'OFFER_NOT_PENDING','Offer already resolved');
  if(act==='accept'){const l=await t.barterListing.updateMany({where:{id:o.listingId,status:'OPEN'},data:{status:'CLOSED'}});if(!l.count)throw new HttpErr(409,'LISTING_CLOSED','Listing already closed');
   await t.barterOffer.updateMany({where:{listingId:o.listingId,status:'PENDING'},data:{status:'REJECTED'}});await t.trade.create({data:{listingId:o.listingId,offerId:o.id,sellerId:o.listing.ownerId,buyerId:o.offererId}});await t.auditLog.create({data:{actorId:id,action:'ACCEPT_OFFER',target:o.id}})}
  return t.barterOffer.findUniqueOrThrow({where:{id:o.id}})});
 toUsers([o.listing.ownerId,o.offererId],'BARTER_OFFER_UPDATED',res);if(act==='accept')toAll('BARTER_LISTING_UPDATED',{id:o.listingId,status:'CLOSED'});s.json(res)}));
// intelligence + whispers
app.get('/api/intelligence',auth,A(async(q,s)=>{s.json(await db.intelligencePost.findMany({orderBy:{createdAt:'desc'},take:30,include:{author:{select:{profile:{select:{codename:true}}}}}}))}));
app.post('/api/intelligence',auth,limit(10),A(async(q,s)=>{const b=z.object({title:z.string().trim().min(3).max(120),body:z.string().trim().min(3).max(1000)}).parse(q.body);const p=await db.intelligencePost.create({data:{...b,authorId:me(s)}});toAll('INTELLIGENCE_POST_CREATED',p);s.status(201).json(p)}));
app.post('/api/whispers',auth,limit(20),A(async(q,s)=>{const b=z.object({toId:z.string(),body:z.string().trim().min(1).max(1000)}).parse(q.body);if(b.toId===me(s))throw new HttpErr(400,'SELF','Cannot whisper to yourself');
 if(!(await db.memberProfile.findUnique({where:{userId:b.toId}})))throw new HttpErr(404,'NOT_FOUND','Recipient not found');
 const w=await db.whisperMessage.create({data:{fromId:me(s),...b}});toUsers([b.toId,me(s)],'WHISPER_RECEIVED',w);s.status(201).json(w)}));
app.get('/api/whispers/:otherId',auth,A(async(q,s)=>{const id=me(s),o=q.params.otherId;s.json(await db.whisperMessage.findMany({where:{OR:[{fromId:id,toId:o},{fromId:o,toId:id}]},orderBy:{createdAt:'desc'},take:50}))}));
// snapshot for reconnect recovery
app.get('/api/snapshot',auth,A(async(q,s)=>{const [members,prayers,projections,seats]=await Promise.all([roster(),db.prayer.findMany({orderBy:{createdAt:'desc'},take:50,include:{persona:true}}),db.projectionSession.findMany({where:{status:'ACTIVE',expiresAt:{gt:new Date()}},include:{artifact:true}}),db.tarotSeat.findMany({orderBy:{id:'asc'}})]);
 s.json({ts:new Date().toISOString(),members,prayers,projections,seats})}));
app.use((e:unknown,q:Request,s:Response,_n:NextFunction)=>{
 if(e instanceof ZodError)return void s.status(400).json({error:{code:'VALIDATION',message:'Invalid input',details:e.issues.map(i=>({path:i.path.join('.'),message:i.message}))}});
 if(e instanceof HttpErr)return void s.status(e.status).json({error:{code:e.code,message:e.message}});
 console.error(e instanceof Error?e.message:'error');s.status(500).json({error:{code:'INTERNAL',message:'Something went wrong'}})});
// ---------- websocket ----------
const server=http.createServer(app),wss=new WebSocketServer({noServer:true});
server.on('upgrade',(req,sock,head)=>{try{if(req.headers.origin!==ORIGIN||!req.url?.startsWith('/ws'))throw 0;
 const tok=(req.headers.cookie||'').split(';').map(x=>x.trim().split('=')).find(([k])=>k==='token')?.[1];const uid=(jwt.verify(decodeURIComponent(tok||''),SECRET) as {sub:string}).sub;
 wss.handleUpgrade(req,sock,head,w=>{(w as any).uid=uid;wss.emit('connection',w)})}catch{sock.write('HTTP/1.1 401 Unauthorized\r\n\r\n');sock.destroy()}});
const presence=async()=>toAll('MEMBER_PRESENCE_UPDATED',{online:online()});
wss.on('connection',(w:WebSocket)=>{const uid=(w as any).uid as string;(conns.get(uid)||conns.set(uid,new Set()).get(uid)!).add(w);presence();
 w.on('message',d=>{try{if(JSON.parse(d.toString()).type==='ping')w.send(envl('pong',{}))}catch{}});
 w.on('close',()=>{const s=conns.get(uid);s?.delete(w);if(!s?.size)conns.delete(uid);presence()})});
server.listen(PORT,()=>console.log('API + WS on :'+PORT));
