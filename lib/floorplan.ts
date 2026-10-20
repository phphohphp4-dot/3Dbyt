/** Image-space geometry. Only validated geometry enters the 3D builder. */
export type PlanPoint={x:number;y:number};
export type PlanWall={id:string;a:PlanPoint;b:PlanPoint};
export type PlanOpening={id:string;wallId:string;t:number;width:number;kind?:'door'|'window';height?:number;sill?:number;open?:boolean;reverse?:boolean};
export const WINDOW_PRESETS={standard:{label:'Klasické okno',width:1.2,height:1.3,sill:.9},wide:{label:'Široké okno',width:2.4,height:1.2,sill:1},tall:{label:'Vysoké okno',width:.9,height:2.2,sill:0},glazing:{label:'Prosklení k podlaze',width:2.4,height:2.2,sill:0}} as const;
export function openingDimensions(o:PlanOpening){return{height:o.height??(o.kind==='window'?1.3:2.1),sill:o.kind==='window'?(o.sill??.9):0};}
export const ROOM_TYPES={living:'Obývací pokoj',livingKitchen:'Obývák s kuchyní',kitchen:'Kuchyně',bedroom:'Ložnice',children:'Dětský pokoj',bathroom:'Koupelna',toilet:'WC',hall:'Chodba',entry:'Zádveří',wardrobe:'Šatna',office:'Pracovna',other:'Jiná místnost'} as const;
export type PlanRoom={id:string;name:string;type:keyof typeof ROOM_TYPES;position:PlanPoint};
export type FloorProject={version:1;name:string;image:string;pixelWidth:number;pixelHeight:number;walls:PlanWall[];openings:PlanOpening[];rooms?:PlanRoom[];roof?:'flat'|'gable';roofRise?:number;width:number;height:number;thickness:number;wallColor:string;floorColor:string;updated:string};
export function planBounds(walls:PlanWall[]){const p=walls.flatMap(w=>[w.a,w.b]);return{minX:Math.min(...p.map(v=>v.x)),maxX:Math.max(...p.map(v=>v.x)),minY:Math.min(...p.map(v=>v.y)),maxY:Math.max(...p.map(v=>v.y))};}
export function planScale(p:FloorProject){const b=planBounds(p.walls);return p.width/Math.max(1,b.maxX-b.minX);}
export function wallLength(w:PlanWall){return Math.hypot(w.b.x-w.a.x,w.b.y-w.a.y);}
export function wallPoint(w:PlanWall,t:number):PlanPoint{return{x:w.a.x+(w.b.x-w.a.x)*t,y:w.a.y+(w.b.y-w.a.y)*t};}
export function distanceToWall(p:PlanPoint,w:PlanWall){const dx=w.b.x-w.a.x,dy=w.b.y-w.a.y;const t=Math.max(0,Math.min(1,((p.x-w.a.x)*dx+(p.y-w.a.y)*dy)/(dx*dx+dy*dy||1)));const q=wallPoint(w,t);return{distance:Math.hypot(p.x-q.x,p.y-q.y),t};}
/** Door intervals drive both mesh generation and collision checks. */
export function solidIntervals(p:FloorProject,w:PlanWall){const length=wallLength(w)*planScale(p);if(length<.001)return[];const holes=p.openings.filter(o=>o.wallId===w.id).map(o=>[Math.max(0,o.t-o.width/length/2),Math.min(1,o.t+o.width/length/2)]).sort((a,b)=>a[0]-b[0]);const out:number[][]=[];let end=0;for(const[a,b]of holes){if(a>end)out.push([end,a]);end=Math.max(end,b);}if(end<1)out.push([end,1]);return out;}
export function validateFloorProject(value:unknown):FloorProject{
 if(!value||typeof value!=='object')throw new Error('Neplatný projekt.');const p=value as FloorProject;
 const finite=(n:unknown,min:number,max:number)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
 if(p.version!==1||typeof p.name!=='string'||p.name.length>120||!finite(p.pixelWidth,32,1600)||!finite(p.pixelHeight,32,1600)||!finite(p.width,2,60)||!finite(p.height,2.2,5)||!finite(p.thickness,.08,.6))throw new Error('Rozměry projektu nejsou platné.');
 if(typeof p.image!=='string'||p.image.length>3500000||!/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(p.image))throw new Error('Neplatný podklad projektu.');
 if(!/^#[a-f0-9]{6}$/i.test(p.wallColor)||!/^#[a-f0-9]{6}$/i.test(p.floorColor))throw new Error('Neplatný materiál.');
 if(!Array.isArray(p.walls)||p.walls.length<1||p.walls.length>250)throw new Error('Projekt musí obsahovat 1 až 250 stěn.');
 const ids=new Set<string>();for(const w of p.walls){if(!w||typeof w.id!=='string'||w.id.length>80||ids.has(w.id))throw new Error('Neplatné ID stěny.');ids.add(w.id);for(const v of[w.a,w.b])if(!v||!finite(v.x,0,p.pixelWidth)||!finite(v.y,0,p.pixelHeight))throw new Error('Stěna leží mimo výkres.');if(wallLength(w)<1)throw new Error('Stěna je příliš krátká.');}
 const b=planBounds(p.walls);if(b.maxX-b.minX<5||b.maxY-b.minY<5||(b.maxY-b.minY)*planScale(p)>80)throw new Error('Model nemá platný půdorysný rozsah.');
 if(!Array.isArray(p.openings)||p.openings.length>100)throw new Error('Neplatné otvory.');if(p.rooms!==undefined){if(!Array.isArray(p.rooms)||p.rooms.length>50)throw new Error('Neplatné místnosti.');const rooms=new Set<string>();for(const room of p.rooms){if(!room||typeof room.id!=='string'||room.id.length>80||rooms.has(room.id)||typeof room.name!=='string'||!room.name.trim()||room.name.length>60||!Object.hasOwn(ROOM_TYPES,room.type)||!room.position||!finite(room.position.x,0,p.pixelWidth)||!finite(room.position.y,0,p.pixelHeight))throw new Error('Neplatné označení místnosti.');rooms.add(room.id);}}const openings=new Set<string>();for(const o of p.openings){if(!o||typeof o.id!=='string'||o.id.length>80||openings.has(o.id)||!ids.has(o.wallId)||!finite(o.t,0,1)||!finite(o.width,.3,6))throw new Error('Neplatný otvor.');
 const d=openingDimensions(o);if((o.kind!==undefined&&!['door','window'].includes(o.kind))||!finite(d.height,.3,p.height)||!finite(d.sill,0,p.height)||d.height+d.sill>p.height+.001||(o.open!==undefined&&typeof o.open!=='boolean')||(o.reverse!==undefined&&typeof o.reverse!=='boolean'))throw new Error('Výška okna nebo dveří přesahuje stěnu.');
 openings.add(o.id);}if(p.roof!==undefined&&!(['flat','gable'] as unknown[]).includes(p.roof))throw new Error('Neplatná střecha.');if(p.roofRise!==undefined&&!finite(p.roofRise,.3,4))throw new Error('Neplatná výška střechy.');return p;
}
/** Trace neutral solid wall bands; reject coloured annotations and thin dimension lines. */
export function detectPlanWalls(data:Uint8ClampedArray,width:number,height:number,threshold=245):PlanWall[]{
 const ink=new Uint8Array(width*height),dark=new Uint8Array(width*height);
 for(let i=0;i<ink.length;i++){const a=data[i*4+3]/255,r=data[i*4]*a+255*(1-a),g=data[i*4+1]*a+255*(1-a),b=data[i*4+2]*a+255*(1-a);ink[i]=Math.max(r,g,b)-Math.min(r,g,b)<110&&Math.max(r,g,b)<threshold?1:0;}
 // A wall must have area, not just a single dark border. Coloured hatching is excluded above.
 for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){let count=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)count+=ink[(y+dy)*width+x+dx];dark[y*width+x]=count>=8?1:0;}
 type Run={axis:0|1;at:number;start:number;end:number;count:number;low:number;high:number};const groups:Run[]=[];
 for(const axis of[0,1]as const){const outer=axis===0?height:width,inner=axis===0?width:height,min=Math.max(20,Math.round(inner*.035));
  for(let row=0;row<outer;row++){let start=-1,last=-1;const flush=()=>{if(start<0||last-start<min)return;const m=groups.find(g=>g.axis===axis&&row-g.high<=2&&row-g.low<=48&&Math.min(last,g.end)-Math.max(start,g.start)>.84*Math.min(last-start,g.end-g.start)&&Math.abs(last+start-g.end-g.start)<25);if(m){m.at=(m.at*m.count+row)/(m.count+1);m.count++;m.high=row;m.start=Math.min(start,m.start);m.end=Math.max(last,m.end);}else groups.push({axis,at:row,start,end:last,count:1,low:row,high:row});};
   for(let col=0;col<=inner;col++){const on=col<inner&&dark[axis===0?row*width+col:col*width+row];if(on){if(start<0)start=col;last=col;}else if(start>=0&&(col-last>2||col===inner)){flush();start=-1;last=-1;}}
  }
 }
 const bands=groups.filter(g=>g.count>=3);
 // Adjacent runs at T junctions describe one thick band, not two parallel walls.
 for(let changed=true;changed;){changed=false;outer:for(let i=0;i<bands.length;i++)for(let j=i+1;j<bands.length;j++){
  const a=bands[i],b=bands[j],overlap=Math.min(a.end,b.end)-Math.max(a.start,b.start);
  if(a.axis===b.axis&&Math.max(a.low,b.low)-Math.min(a.high,b.high)<=2&&Math.max(a.high,b.high)-Math.min(a.low,b.low)<48&&overlap>.6*Math.min(a.end-a.start,b.end-b.start)){
   a.low=Math.min(a.low,b.low);a.high=Math.max(a.high,b.high);a.at=a.end-a.start>=b.end-b.start?a.at:b.at;a.start=Math.min(a.start,b.start);a.end=Math.max(a.end,b.end);bands.splice(j,1);changed=true;break outer;
  }
 }}
 const useful=bands.filter(a=>!bands.some(b=>a!==b&&a.axis!==b.axis&&a.start>=b.low-2&&a.end<=b.high+2&&a.at>=b.start-2&&a.at<=b.end+2));
 return useful.sort((a,b)=>(b.end-b.start)-(a.end-a.start)).slice(0,180).map((g,i)=>({id:`wall-${i}`,a:g.axis===0?{x:g.start,y:g.at}:{x:g.at,y:g.start},b:g.axis===0?{x:g.end,y:g.at}:{x:g.at,y:g.end}}));
}
/** Repair short drafting gaps at L/T junctions without spanning door-sized gaps. */
export function joinWallJunctions(p:FloorProject):FloorProject{
 if(!p.walls.length)return p;
 const scale=planScale(p),reach=Math.min(.28,Math.max(.16,p.thickness*1.5))/scale;
 const walls=p.walls.map(w=>({...w,a:{...w.a},b:{...w.b}}));
 const axis=(w:PlanWall)=>Math.abs(w.a.y-w.b.y)<.01?0:Math.abs(w.a.x-w.b.x)<.01?1:-1;
 const inDoor=(w:PlanWall,q:PlanPoint)=>p.openings.some(o=>o.wallId===w.id&&Math.hypot(wallPoint(w,o.t).x-q.x,wallPoint(w,o.t).y-q.y)<o.width/scale/2+p.thickness/scale/2);
 // Proposals use the same original geometry, so processing order does not move a joint twice.
 for(let i=0;i<walls.length;i++){
  const original=p.walls[i],direction=axis(original);if(direction<0)continue;
  for(const end of ['a','b'] as const){const point=original[end];let best=reach+.0001,target:PlanPoint|null=null;
   for(const other of p.walls){if(other.id===original.id||axis(other)<0)continue;
    if(axis(other)!==direction){
     const q=direction===0?{x:other.a.x,y:point.y}:{x:point.x,y:other.a.y};
     const distance=Math.hypot(q.x-point.x,q.y-point.y),onto=distanceToWall(q,other).distance;
     if(distance<best&&onto<=reach&&!inDoor(other,q)&&!inDoor(original,q)){best=distance;target=q;}
    }else{
     // Only nearly collinear endpoints may meet. Never close a normal doorway.
     for(const tip of [other.a,other.b]){const lateral=direction===0?Math.abs(point.y-tip.y):Math.abs(point.x-tip.x);const distance=Math.hypot(point.x-tip.x,point.y-tip.y);
      if(lateral<.001&&distance<best&&distance<=.22/scale&&!inDoor(other,tip)&&!inDoor(original,point)){best=distance;target={x:(point.x+tip.x)/2,y:(point.y+tip.y)/2};}
     }
    }
   }
   if(target&&best>.001)walls[i][end]=target;
  }
  if(wallLength(walls[i])<1)walls[i]={...original,a:{...original.a},b:{...original.b}};
 }
 const openings=p.openings.map(o=>{const old=p.walls.find(w=>w.id===o.wallId)!,w=walls.find(w=>w.id===o.wallId)!,q=wallPoint(old,o.t);const t=distanceToWall(q,w).t;return{...o,t};});
 // If trimming would consume an explicit opening, keep that wall's original endpoints.
 for(const o of openings){const index=walls.findIndex(w=>w.id===o.wallId),w=walls[index],margin=o.width/scale/2;if(o.t*wallLength(w)<margin||(1-o.t)*wallLength(w)<margin){walls[index]=p.walls[index];}}
 const mapped=p.openings.map(o=>{const q=wallPoint(p.walls.find(w=>w.id===o.wallId)!,o.t);return{...o,t:distanceToWall(q,walls.find(w=>w.id===o.wallId)!).t};});
 return{...p,walls,openings:mapped};
}

/** Collinear gaps are candidates only; symbols in the drawing still require review. */
export function openingGaps(p:FloorProject):PlanWall[]{
 const result:PlanWall[]=[],scale=planScale(p),tolerance=Math.min(12,p.thickness/scale);
 for(let i=0;i<p.walls.length;i++)for(let j=i+1;j<p.walls.length;j++){
 const a=p.walls[i],b=p.walls[j],horizontal=Math.abs(a.a.y-a.b.y)<.1;
 if(!horizontal&&Math.abs(a.a.x-a.b.x)>.1)continue;
 if(horizontal?Math.abs(b.a.y-b.b.y)>.1||Math.abs(a.a.y-b.a.y)>tolerance:Math.abs(b.a.x-b.b.x)>.1||Math.abs(a.a.x-b.a.x)>tolerance)continue;
 const axis=horizontal?'x':'y',cross=horizontal?'y':'x';const aa=[a.a,a.b].sort((x,y)=>x[axis]-y[axis]),bb=[b.a,b.b].sort((x,y)=>x[axis]-y[axis]);
 const left=aa[1][axis]<=bb[0][axis]?aa:bb,right=aa[1][axis]<=bb[0][axis]?bb:aa;
 const length=(right[0][axis]-left[1][axis])*scale;if(length<.55||length>3.6)continue;
 const mid=(left[1][cross]+right[0][cross])/2;
 const wall={id:`gap-${i}-${j}`,a:{...left[1],[cross]:mid},b:{...right[0],[cross]:mid}};
 // A real wall or an earlier bridge inside the gap rules out this proposal.
 if(p.walls.some(w=>w!==a&&w!==b&&[.2,.5,.8].some(t=>distanceToWall(wallPoint(wall,t),w).distance<tolerance)))continue;
 if(!result.some(w=>distanceToWall(wallPoint(wall,.5),w).distance<tolerance))result.push(wall);
 }return result;
}
export function placeOpening(p:FloorProject,q:PlanPoint,kind:'door'|'window',id:string,preferredWall?:string):FloorProject{
 if(p.openings.length>=100)throw new Error('Maximum je 100 oken a dveří.');
 const scale=planScale(p),gaps=preferredWall?[]:openingGaps(p),candidates=[...p.walls,...gaps];
 const wall=preferredWall?p.walls.find(w=>w.id===preferredWall):candidates.sort((a,b)=>distanceToWall(q,a).distance-distanceToWall(q,b).distance)[0];
 if(!wall||distanceToWall(q,wall).distance*scale>.4)throw new Error('Klikněte na stěnu nebo doprostřed mezery mezi stěnami.');
 const bridge=gaps.includes(wall),length=wallLength(wall)*scale;if(length<.35)throw new Error('Tato stěna je pro otvor příliš krátká.');
 const width=bridge?length:Math.min(kind==='window'?1.2:.9,length-.04),t=bridge?.5:Math.max(width/length/2,Math.min(1-width/length/2,distanceToWall(q,wall).t));
 if(p.openings.some(o=>o.wallId===wall.id&&Math.abs(o.t-t)*length<(o.width+width)/2+.02))throw new Error('Zde už otvor je. Vyberte jeho značku pro úpravu.');
 const host=bridge?{...wall,id:`host-${id}`}:wall;
 if(bridge&&p.walls.length>=250)throw new Error('Maximum je 250 stěn.');
 return{...p,walls:bridge?[...p.walls,host]:p.walls,openings:[...p.openings,{id,wallId:host.id,t,width,kind,height:kind==='window'?Math.min(1.3,p.height-.9):Math.min(2.1,p.height),sill:kind==='window'?.9:0,open:true}]};
}
export function editOpening(p:FloorProject,id:string,patch:Partial<PlanOpening>):FloorProject{
 const old=p.openings.find(o=>o.id===id);if(!old)throw new Error('Otvor nebyl nalezen.');const o={...old,...patch,id:old.id,wallId:old.wallId},wall=p.walls.find(w=>w.id===o.wallId)!;const length=wallLength(wall)*planScale(p);
 if(o.width>length+.001)throw new Error(`Na tomto úseku je místo nejvýše pro ${length.toFixed(2)} m. Nejprve upravte stěnu.`);
 o.t=Math.max(o.width/length/2,Math.min(1-o.width/length/2,o.t));
 if(p.openings.some(other=>other.id!==id&&other.wallId===o.wallId&&Math.abs(other.t-o.t)*length<(other.width+o.width)/2+.01))throw new Error('Otvory by se překrývaly.');
 return validateFloorProject({...p,openings:p.openings.map(item=>item.id===id?o:item)});
}
