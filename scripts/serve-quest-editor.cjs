const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {loadEnvConfig}=require('@next/env');loadEnvConfig(path.resolve(__dirname,'..'));
const {handleTourEditor}=require('../blender-output/quest-server/editor.cjs');
const {handleIntake,staffAuthorized,initializeIntake}=require('../blender-output/quest-server/intake.cjs');
initializeIntake();
const root=path.resolve(__dirname,'../blender-output/quest-web');const port=Number(process.env.TOUR_PORT||3004);
const types={'.bcmap':'application/octet-stream','.pfb':'application/octet-stream','.ttf':'font/ttf','.wasm':'application/wasm','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.glb':'model/gltf-binary','.hdr':'application/octet-stream','.jpg':'image/jpeg','.png':'image/png','.txt':'text/plain; charset=utf-8'};
http.createServer(async(req,res)=>{
 try{
  const base=`http://127.0.0.1:${port}`,url=new URL(req.url,base);
  if(req.headers.host!==`127.0.0.1:${port}`&&req.headers.host!==`localhost:${port}`){res.writeHead(403);res.end();return;}
  if(url.pathname.startsWith('/api/intake/')){
   const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>13*1024*1024){res.writeHead(413,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Soubor je větší než 12 MB.'}));return;}chunks.push(chunk);}
   const request=new Request(`http://${req.headers.host}${url.pathname}${url.search}`,{method:req.method,headers:{...req.headers,'x-real-ip':req.socket.remoteAddress||'local'},...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
   const response=await handleIntake(request);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
  }
  if((url.pathname.startsWith('/staff-workspace.')||url.pathname==='/api/tour-editor')&&!staffAuthorized(new Request(base,{headers:req.headers}))){res.writeHead(401,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:'Přihlaste se do studia.'}));return;}
  if(url.pathname==='/api/tour-editor'){
   const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>6000){res.writeHead(413);res.end();return;}chunks.push(chunk);}
   const response=await handleTourEditor(new Request(`http://${req.headers.host}${url.pathname}`,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})}));
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  const relative=decodeURIComponent(url.pathname),file=path.resolve(root,'.'+(relative==='/'?'/index.html':relative));
  if(!file.startsWith(root+path.sep)||!types[path.extname(file)]||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':types[path.extname(file)],'Content-Length':fs.statSync(file).size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
  if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
 }catch{res.writeHead(500);res.end('Server error');}
}).listen(port,'127.0.0.1',()=>console.log(`Tour editor: http://127.0.0.1:${port}/`));
