const testPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=','base64');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),ts=require('typescript');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'byt3d-intake-test-'));process.env.BYT3D_DATA_DIR=dir;process.env.BYT3D_STAFF_PASSWORD='test-only-password-not-production';
const {handleIntake}=require('../blender-output/quest-server/intake.cjs');
const origin='http://localhost:3004';
function req(route,method='GET',body,cookie,customOrigin=origin){return new Request(origin+'/api/intake/'+route,{method,headers:{...(method==='GET'?{}:{Origin:customOrigin}),...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{}),...(cookie?{cookie}:{} )},...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{})});}
(async()=>{
 assert.equal((await handleIntake(req('requests'))).status,401);
 assert.equal((await handleIntake(req('session','POST',{password:'wrong'}))).status,401);
 assert.equal((await handleIntake(req('session','POST',{password:process.env.BYT3D_STAFF_PASSWORD},null,'https://foreign.example'))).status,403);
 const login=await handleIntake(req('session','POST',{password:process.env.BYT3D_STAFF_PASSWORD}));assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];assert(login.headers.get('set-cookie').includes('HttpOnly'));assert(login.headers.get('set-cookie').includes('SameSite=Strict'));
 assert.equal((await(await handleIntake(req('session','GET',null,cookie))).json()).authenticated,true);
 const placement={lat:50.1,lng:14.4,width:10,length:16,rotation:35};
 function form(p=placement){const f=new FormData();f.set('name','Test klient');f.set('email','test@example.com');f.set('note','Pouze test');f.set('placement',JSON.stringify(p));f.set('plan',new Blob([testPng],{type:'image/png'}),'plan.png');return f;}
 assert.equal((await handleIntake(req('requests','POST',form({...placement,width:-1})))).status,400);
 const bad=form();bad.set('plan',new Blob(['fake'],{type:'image/png'}),'bad.png');assert.equal((await handleIntake(req('requests','POST',bad))).status,400);
 const submit=await handleIntake(req('requests','POST',form()));assert.equal(submit.status,201);const{id}=await submit.json();
 assert.equal((await handleIntake(req('requests/'+id+'/plan'))).status,401);
 const list=await(await handleIntake(req('requests','GET',null,cookie))).json();assert.equal(list.requests.length,1);assert.deepEqual(list.requests[0].placement,placement);
 const download=await handleIntake(req('requests/'+id+'/plan','GET',null,cookie));assert.equal(download.status,200);assert.equal(download.headers.get('content-type'),'image/png');assert.deepEqual(Buffer.from(await download.arrayBuffer()),testPng);
 assert(fs.existsSync(path.join(dir,'requests',id,'request.json')));
 assert.equal((await handleIntake(req('session','DELETE',null,cookie))).status,200);assert.equal((await handleIntake(req('requests','GET',null,cookie))).status,401);
 console.log('PASS: server auth, wrong password, cross-origin rejection, HttpOnly session, private list/file, validated upload, persisted original + placement, logout revocation.');
 const source=ts.transpileModule(fs.readFileSync('lib/house-placement.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,m={exports:{}};new Function('module','exports',source)(m,m.exports);
 const corners=m.exports.houseCorners(placement),distance=(a,b)=>Math.hypot((a[0]-b[0])*Math.PI/180*6378137,(a[1]-b[1])*Math.PI/180*6378137*Math.cos(placement.lat*Math.PI/180));assert(Math.abs(distance(corners[0],corners[1])-10)<.001);assert(Math.abs(distance(corners[1],corners[2])-16)<.001);assert.throws(()=>m.exports.validPlacement({...placement,lat:90}));
 console.log('PASS: real metre dimensions and rotation at selected latitude, coordinate validation.');
 // Only the unique disposable test folder created above is removed.
 if(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(dir).startsWith('byt3d-intake-test-'))fs.rmSync(dir,{recursive:true});
})().catch(e=>{console.error(e);process.exitCode=1;});
