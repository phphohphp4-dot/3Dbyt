import fs from 'node:fs';
import path from 'node:path';
import {randomBytes,scryptSync,timingSafeEqual,randomUUID} from 'node:crypto';
import {validPlacement,type IntakeRecord} from './house-placement';
const root=path.resolve(process.env.BYT3D_DATA_DIR||'.private/byt3d');
const sessions=new Map<string,number>(),attempts=new Map<string,{count:number;until:number}>(),cache=new Map<string,{at:number;data:unknown}>();
let auth:{salt:string;hash:string}|undefined,lastSearch=0;
function config(){if(auth)return auth;fs.mkdirSync(root,{recursive:true});const file=path.join(root,'auth.json');if(process.env.BYT3D_STAFF_PASSWORD){const salt=randomBytes(16).toString('hex');auth={salt,hash:scryptSync(process.env.BYT3D_STAFF_PASSWORD,salt,64).toString('hex')};}else if(fs.existsSync(file))auth=JSON.parse(fs.readFileSync(file,'utf8'));else{const password=randomBytes(18).toString('base64url'),salt=randomBytes(16).toString('hex');auth={salt,hash:scryptSync(password,salt,64).toString('hex')};fs.writeFileSync(file,JSON.stringify(auth),{mode:0o600,flag:'wx'});fs.writeFileSync(path.join(root,'staff-access.txt'),password+'\n',{mode:0o600,flag:'wx'});}return auth!;}
export function initializeIntake(){config();}
function token(req:Request){return req.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('byt3d_staff='))?.slice(12)||'';}
export function staffAuthorized(req:Request){const t=token(req),expiry=sessions.get(t)||0;if(expiry<Date.now()){sessions.delete(t);return false;}return true;}
function json(data:unknown,status=200,headers:Record<string,string>={}){return Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});}
function cookie(req:Request,value:string,seconds:number){return`byt3d_staff=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${seconds}${new URL(req.url).protocol==='https:'?'; Secure':''}`;}
function limited(key:string,max:number,ms:number){const now=Date.now();for(const[k,v]of attempts)if(v.until<now)attempts.delete(k);const v=attempts.get(key)||{count:0,until:now+ms};v.count++;attempts.set(key,v);return v.count>max;}
async function body(req:Request,max:number){const reader=req.body?.getReader();if(!reader)return new Uint8Array();let size=0;const chunks:Uint8Array[]=[];while(true){const{done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new Error('Soubor je větší než 12 MB.');}chunks.push(value);}return Buffer.concat(chunks);}
function fileType(data:Buffer,mime:string){if(mime==='application/pdf')return data.subarray(0,5).toString()==='%PDF-';if(mime==='image/png')return data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));if(mime==='image/jpeg')return data[0]===255&&data[1]===216&&data[2]===255;if(mime==='image/webp')return data.subarray(0,4).toString()==='RIFF'&&data.subarray(8,12).toString()==='WEBP';return false;}
export async function handleIntake(req:Request):Promise<Response>{
 try{config();const url=new URL(req.url),route=url.pathname.replace('/api/intake/',''),ip=req.headers.get('x-real-ip')||'local';
 if(req.method!=='GET'&&req.headers.get('origin')!==url.origin)return json({error:'Požadavek musí přijít z tohoto webu.'},403);
 if(route==='session'){
  if(req.method==='GET')return json({authenticated:staffAuthorized(req)});
  if(req.method==='DELETE'){sessions.delete(token(req));return json({ok:true},200,{'Set-Cookie':cookie(req,'',0)});}
  if(req.method!=='POST')return json({error:'Nepodporovaná metoda.'},405);
  if(limited('login:'+ip,8,15*60*1000))return json({error:'Příliš mnoho pokusů. Zkuste to za 15 minut.'},429);
  const input=JSON.parse(Buffer.from(await body(req,4096)).toString()),password=String(input.password||'');if(password.length>256)return json({error:'Nesprávné heslo.'},401);
  const a=config(),actual=scryptSync(password,a.salt,64),expected=Buffer.from(a.hash,'hex');if(!timingSafeEqual(actual,expected))return json({error:'Nesprávné heslo.'},401);
  for(const[t,expiry]of sessions)if(expiry<Date.now())sessions.delete(t);const t=randomBytes(32).toString('hex');sessions.set(t,Date.now()+8*3600000);attempts.delete('login:'+ip);return json({authenticated:true},200,{'Set-Cookie':cookie(req,t,8*3600)});
 }
 if(route==='map-config'&&req.method==='GET')return json({tileUrl:process.env.BYT3D_TILE_URL||'https://tile.openstreetmap.org/{z}/{x}/{y}.png',attribution:process.env.BYT3D_TILE_ATTRIBUTION||'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'});
 if(route==='search'&&req.method==='GET'){
  const q=(url.searchParams.get('q')||'').trim();if(q.length<3||q.length>160)return json({error:'Napište obec nebo adresu (alespoň 3 znaky).'},400);
  const known=cache.get(q);if(known&&Date.now()-known.at<86400000)return json(known.data);
  if(Date.now()-lastSearch<1100)return json({error:'Vyhledávání je vytížené. Zkuste to za chvíli.'},429);lastSearch=Date.now();
  const target=new URL(process.env.BYT3D_GEOCODER_URL||'https://photon.komoot.io/api/');target.searchParams.set('q',q);target.searchParams.set('limit','5');
  const response=await fetch(target,{headers:{'User-Agent':'Byt3D/1.0 (property placement)'},signal:AbortSignal.timeout(10000)}).catch(()=>{throw new Error('Vyhledávání nyní není dostupné. Místo můžete najít přiblížením mapy.');});if(!response.ok)throw new Error('Vyhledávání nyní není dostupné. Místo můžete najít přiblížením mapy.');
  const result=await response.json();const features=(result.features||[]).slice(0,5).map((v:{geometry:{coordinates:number[]};properties:Record<string,string>})=>({lat:v.geometry.coordinates[1],lng:v.geometry.coordinates[0],label:[v.properties.name,v.properties.street,v.properties.housenumber,v.properties.city,v.properties.country].filter(Boolean).filter((s,i,a)=>a.indexOf(s)===i).join(', ')})).filter((v:{lat:number;lng:number})=>Number.isFinite(v.lat)&&Number.isFinite(v.lng));
  if(cache.size>200)cache.clear();const data={results:features};cache.set(q,{at:Date.now(),data});return json(data);
 }
 if(route==='requests'&&req.method==='POST'){
  if(limited('upload:'+ip,12,3600000))return json({error:'Limit nahrávání byl dosažen. Zkuste to později.'},429);
  const bytes=await body(req,13*1024*1024),form=await new Request(req.url,{method:'POST',headers:{'Content-Type':req.headers.get('content-type')||''},body:bytes}).formData();
  const file=form.get('plan');if(!(file instanceof File)||file.size===0||file.size>12*1024*1024)throw new Error('Nahrajte půdorys do 12 MB.');
  const data=Buffer.from(await file.arrayBuffer());if(!fileType(data,file.type))throw new Error('Použijte platný PDF, PNG, JPG nebo WebP.');
  const placement=validPlacement(JSON.parse(String(form.get('placement')))),name=String(form.get('name')||'').trim(),email=String(form.get('email')||'').trim(),note=String(form.get('note')||'').trim();
  if(name.length<2||name.length>120||email.length>200||!/^\S+@\S+\.\S+$/.test(email)||note.length>2000)throw new Error('Vyplňte jméno a kontaktní e-mail.');
  const id=randomUUID(),record:IntakeRecord={id,created:new Date().toISOString(),name,email,note,filename:path.basename(file.name).slice(0,160),mime:file.type,placement,status:'new'},dir=path.join(root,'requests',id);fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'plan'),data,{flag:'wx',mode:0o600});fs.writeFileSync(path.join(dir,'request.json'),JSON.stringify(record,null,2),{flag:'wx',mode:0o600});return json({id,created:record.created},201);
 }
 if(route.startsWith('requests')){
  if(!staffAuthorized(req))return json({error:'Přihlaste se do studia.'},401);
  if(req.method!=='GET')return json({error:'Nepodporovaná metoda.'},405);
  if(route==='requests'){const dir=path.join(root,'requests');const requests=fs.existsSync(dir)?fs.readdirSync(dir).filter(id=>/^[0-9a-f-]{36}$/.test(id)).map(id=>JSON.parse(fs.readFileSync(path.join(dir,id,'request.json'),'utf8'))).sort((a,b)=>b.created.localeCompare(a.created)):[];return json({requests});}
  const match=/^requests\/([0-9a-f-]{36})\/plan$/.exec(route);if(!match)return json({error:'Nenalezeno.'},404);const dir=path.join(root,'requests',match[1]);if(!fs.existsSync(path.join(dir,'request.json')))return json({error:'Nenalezeno.'},404);const r:IntakeRecord=JSON.parse(fs.readFileSync(path.join(dir,'request.json'),'utf8'));return new Response(fs.readFileSync(path.join(dir,'plan')),{headers:{'Content-Type':r.mime,'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(r.filename)}`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }
 return json({error:'Nenalezeno.'},404);
 }catch(e){return json({error:e instanceof Error?e.message:'Požadavek se nepodařilo zpracovat.'},400);}
}
