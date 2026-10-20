import {type FloorProject,type PlanPoint,type PlanWall,planScale,wallLength,wallPoint,distanceToWall,editOpening,type PlanOpening} from './floorplan';
/** Join only touching collinear pieces so an opening can move across a detected seam. */
export function openingRun(p:FloorProject,id:string):FloorProject{
 const opening=p.openings.find(o=>o.id===id),host=p.walls.find(w=>w.id===opening?.wallId);if(!host)return p;
 const length=wallLength(host),ux=(host.b.x-host.a.x)/length,uy=(host.b.y-host.a.y)/length,scale=planScale(p),tolerance=Math.min(.06,p.thickness/3)/scale;
 const along=(q:PlanPoint)=>(q.x-host.a.x)*ux+(q.y-host.a.y)*uy;
 const lateral=(q:PlanPoint)=>Math.abs((q.x-host.a.x)*uy-(q.y-host.a.y)*ux);
 const ids=new Set([host.id]);let lo=0,hi=length,changed=true;
 while(changed){changed=false;for(const w of p.walls){if(ids.has(w.id)||lateral(w.a)>tolerance||lateral(w.b)>tolerance)continue;
 const dx=(w.b.x-w.a.x)/wallLength(w),dy=(w.b.y-w.a.y)/wallLength(w);if(Math.abs(dx*uy-dy*ux)>.001)continue;
 const a=Math.min(along(w.a),along(w.b)),b=Math.max(along(w.a),along(w.b));if(a>hi+.025/scale||b<lo-.025/scale)continue;
 ids.add(w.id);lo=Math.min(lo,a);hi=Math.max(hi,b);changed=true;}}
 if(ids.size===1)return p;
 const merged={...host,a:{x:host.a.x+ux*lo,y:host.a.y+uy*lo},b:{x:host.a.x+ux*hi,y:host.a.y+uy*hi}};
 return{...p,walls:p.walls.filter(w=>!ids.has(w.id)||w.id===host.id).map(w=>w.id===host.id?merged:w),openings:p.openings.map(o=>ids.has(o.wallId)?{...o,wallId:host.id,t:distanceToWall(wallPoint(p.walls.find(w=>w.id===o.wallId)!,o.t),merged).t}:o)};
}
export function adjustOpening(p:FloorProject,id:string,patch:Partial<PlanOpening>){return editOpening(openingRun(p,id),id,patch);}
export function dragOpening(p:FloorProject,id:string,q:PlanPoint,handle:'move'|'start'|'end'){
 const next=openingRun(p,id),o=next.openings.find(o=>o.id===id)!,w=next.walls.find(w=>w.id===o.wallId)!,length=wallLength(w)*planScale(next),at=distanceToWall(q,w).t*length;
 if(handle==='move')return editOpening(next,id,{t:Math.round(at*100)/100/length});
 const left=o.t*length-o.width/2,right=o.t*length+o.width/2,edge=Math.round(at*100)/100;
 const a=handle==='start'?Math.min(edge,right-.3):left,b=handle==='end'?Math.max(edge,left+.3):right;
 return editOpening(next,id,{width:b-a,t:(a+b)/2/length});
}
export function relocateOpening(p:FloorProject,id:string,q:PlanPoint,wallId:string){
 const o=p.openings.find(o=>o.id===id)!;const moved={...p,openings:p.openings.map(v=>v.id===id?{...o,wallId}:v)};const next=openingRun(moved,id),w=next.walls.find(w=>w.id===wallId)!;
 return editOpening(next,id,{t:distanceToWall(q,w).t});
}
/** Snap endpoints or an orthogonal intersection, never across an existing opening. */
export function snapWallPoint(p:FloorProject,q:PlanPoint,start?:PlanPoint):{point:PlanPoint;snapped:boolean}{
 const scale=p.walls.length?planScale(p):1,reach=.2/scale;
 const horizontal=start?Math.abs(q.x-start.x)>=Math.abs(q.y-start.y):false;
 const base=start?(horizontal?{x:q.x,y:start.y}:{x:start.x,y:q.y}):q;
 let point=base,best=reach,snapped=false;
 const consider=(v:PlanPoint,w:PlanWall)=>{if(start&&(horizontal?Math.abs(v.y-start.y):Math.abs(v.x-start.x))>.001)return;const distance=Math.hypot(v.x-base.x,v.y-base.y);if(distance>=best)return;
 if(p.openings.some(o=>o.wallId===w.id&&Math.hypot(wallPoint(w,o.t).x-v.x,wallPoint(w,o.t).y-v.y)<o.width/scale/2))return;
 point=v;best=distance;snapped=true;};
 for(const w of p.walls){consider(w.a,w);consider(w.b,w);if(start){if(horizontal&&Math.abs(w.a.x-w.b.x)<.001&&base.y>=Math.min(w.a.y,w.b.y)&&base.y<=Math.max(w.a.y,w.b.y))consider({x:w.a.x,y:base.y},w);if(!horizontal&&Math.abs(w.a.y-w.b.y)<.001&&base.x>=Math.min(w.a.x,w.b.x)&&base.x<=Math.max(w.a.x,w.b.x))consider({x:base.x,y:w.a.y},w);}else consider(wallPoint(w,distanceToWall(base,w).t),w);}
 return{point,snapped};
}
