import * as THREE from 'three';
import {type FloorProject,planBounds,planScale,wallPoint,wallLength,openingDimensions,solidIntervals,distanceToWall,type PlanWall} from './floorplan';
export function buildFloorScene(p:FloorProject){
 const root=new THREE.Group();root.name='Byt3D_Pudorys';const b=planBounds(p.walls),scale=planScale(p),cx=(b.minX+b.maxX)/2,cz=(b.minY+b.maxY)/2;
 const wallMaterial=new THREE.MeshStandardMaterial({color:p.wallColor,roughness:.86}),floorMaterial=new THREE.MeshStandardMaterial({color:p.floorColor,roughness:.72}),frameMaterial=new THREE.MeshStandardMaterial({color:'#444b50',roughness:.4}),woodMaterial=new THREE.MeshStandardMaterial({color:'#bb9670',roughness:.65}),metalMaterial=new THREE.MeshStandardMaterial({color:'#bfc5c8',metalness:.8,roughness:.25}),glassMaterial=new THREE.MeshStandardMaterial({color:'#cce6ee',transparent:true,opacity:.22,roughness:.12,metalness:.2,depthWrite:false});
 const box=(parent:THREE.Object3D,name:string,x:number,y:number,z:number,w:number,h:number,d:number,material:THREE.Material)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.name=name;m.position.set(x,y,z);m.castShadow=material!==glassMaterial;m.receiveShadow=true;parent.add(m);return m;};
 const depth=(b.maxY-b.minY)*scale,floor=box(root,'Podlaha',0,-.06,0,p.width+p.thickness,.12,depth+p.thickness,floorMaterial);
 const colliders:PlanWall[]=[],doors=new Map<string,{pivot:THREE.Group;open:boolean;reverse:boolean;width:number;angle:number;origin:THREE.Vector3}>();
 const collider=(w:PlanWall,a:number,z:number)=>{const q=wallPoint(w,a),r=wallPoint(w,z);colliders.push({id:w.id,a:{x:(q.x-cx)*scale,y:(q.y-cz)*scale},b:{x:(r.x-cx)*scale,y:(r.y-cz)*scale}});};
 const segment=(w:PlanWall,start:number,end:number,height:number,y:number)=>{const a=wallPoint(w,start),v=wallPoint(w,end),dx=(v.x-a.x)*scale,dz=(v.y-a.y)*scale;if(Math.hypot(dx,dz)<.005||height<=.001)return;const mesh=box(root,`Stena_${w.id}`,((a.x+v.x)/2-cx)*scale,y,((a.y+v.y)/2-cz)*scale,Math.hypot(dx,dz),height,p.thickness,wallMaterial);mesh.rotation.y=-Math.atan2(dz,dx);};
 for(const w of p.walls){
  for(const[a,z]of solidIntervals(p,w)){segment(w,a,z,p.height,p.height/2);collider(w,a,z);}
  for(const o of p.openings.filter(o=>o.wallId===w.id)){
   const length=wallLength(w)*scale,start=Math.max(0,o.t-o.width/length/2),end=Math.min(1,o.t+o.width/length/2),width=(end-start)*length,{height,sill}=openingDimensions(o),top=sill+height;
   segment(w,start,end,sill,sill/2);segment(w,start,end,p.height-top,top+(p.height-top)/2);
   const q=wallPoint(w,(start+end)/2),assembly=new THREE.Group();assembly.name=`${o.kind==='window'?'Okno':'Dvere'}_${o.id}`;assembly.position.set((q.x-cx)*scale,0,(q.y-cz)*scale);const angle=-Math.atan2(w.b.y-w.a.y,w.b.x-w.a.x);assembly.rotation.y=angle;root.add(assembly);
   const rail=.055;for(const sign of[-1,1])box(assembly,'Ram',sign*(width-rail)/2,sill+height/2,0,rail,height,p.thickness+.025,frameMaterial);
   box(assembly,'Nadprazi',0,top-rail/2,0,width,rail,p.thickness+.025,frameMaterial);
   if(o.kind==='window'){
    collider(w,start,end);box(assembly,'Spodni_ram',0,sill+rail/2,0,width,rail,p.thickness+.025,frameMaterial);
    box(assembly,'Sklo',0,sill+height/2,0,Math.max(.01,width-rail*2),height-rail*2,.012,glassMaterial);
    if(width>1.4)box(assembly,'Sloupek',0,sill+height/2,0,.045,height,.06,frameMaterial);
    if(sill>.05)box(assembly,'Parapet',0,sill-.025,.035,width+.08,.05,p.thickness+.14,wallMaterial);
   }else{
    const pivot=new THREE.Group(),reverse=o.reverse??false;assembly.add(pivot);pivot.position.x=(reverse?1:-1)*(width/2-rail);pivot.userData.doorId=o.id;
    const leafWidth=Math.max(.05,width-rail*2),dir=reverse?-1:1;
    box(pivot,'Dverni_kridlo',dir*leafWidth/2,(height-rail)/2,0,leafWidth,height-rail,.045,woodMaterial);
    for(const sign of[-1,1])box(pivot,'Klika',dir*(leafWidth-.12),1,sign*.055,.13,.025,.07,metalMaterial);
    const open=o.open??true;pivot.rotation.y=open?(reverse?-1:1)*Math.PI/2:0;
    doors.set(o.id,{pivot,open,reverse,width:leafWidth,angle,origin:assembly.position.clone()});
   }
  }
 }
 const envelope=new THREE.Group();envelope.name='Strop_a_strecha';root.add(envelope);
 box(envelope,'Strop',0,p.height+.06,0,p.width+p.thickness,.12,depth+p.thickness,wallMaterial);
 const roofMaterial=new THREE.MeshStandardMaterial({color:'#62696b',roughness:.8,side:THREE.DoubleSide});
 if(p.roof==='gable'){
  const half=p.width/2+p.thickness/2+.2,rise=p.roofRise??1.5,span=depth+p.thickness+.4,base=p.height+.16;
  for(const sign of[-1,1]){const panel=box(envelope,'Sedlova_strecha',sign*half/2,base+rise/2,0,Math.hypot(half,rise),.1,span,roofMaterial);panel.rotation.z=-sign*Math.atan2(rise,half);}
  for(const sign of[-1,1]){const shape=new THREE.Shape();shape.moveTo(-half,base);shape.lineTo(half,base);shape.lineTo(0,base+rise);shape.closePath();const g=new THREE.Mesh(new THREE.ShapeGeometry(shape),wallMaterial.clone());(g.material as THREE.MeshStandardMaterial).side=THREE.DoubleSide;g.position.z=sign*(depth+p.thickness)/2;g.name='Stit';envelope.add(g);}
 }else box(envelope,'Plocha_strecha',0,p.height+.15,0,p.width+p.thickness+.12,.08,depth+p.thickness+.12,roofMaterial);
 const doorCollider=(d:{pivot:THREE.Group;reverse:boolean;width:number})=>{d.pivot.updateWorldMatrix(true,false);const a=d.pivot.localToWorld(new THREE.Vector3()),z=d.pivot.localToWorld(new THREE.Vector3((d.reverse?-1:1)*d.width,0,0));return{id:'leaf',a:{x:a.x,y:a.z},b:{x:z.x,y:z.z}};};
 const canStand=(x:number,z:number)=>Math.abs(x)<p.width/2-.12&&Math.abs(z)<depth/2-.12&&!colliders.some(w=>distanceToWall({x,y:z},w).distance<p.thickness/2+.18)&&![...doors.values()].some(d=>distanceToWall({x,y:z},doorCollider(d)).distance<.2);
 const toggleDoor=(object:THREE.Object3D)=>{let item:THREE.Object3D|null=object;while(item&&!item.userData.doorId)item=item.parent;const d=item?doors.get(item.userData.doorId):undefined;if(!d)return false;d.open=!d.open;d.pivot.rotation.y=d.open?(d.reverse?-1:1)*Math.PI/2:0;return true;};
 const spawn=new THREE.Vector3(0,1.65,0);let found=false,best=0;const step=Math.max(.25,Math.max(p.width,depth)/45);for(let z=-depth/2+step;z<depth/2;z+=step)for(let x=-p.width/2+step;x<p.width/2;x+=step){if(!canStand(x,z))continue;const clearance=Math.min(p.width/2-Math.abs(x),depth/2-Math.abs(z),...colliders.map(w=>distanceToWall({x,y:z},w).distance));if(clearance>best){best=clearance;spawn.set(x,1.65,z);found=true;}}
 return{root,floor,envelope,toggleDoor,canStand,spawn,depth,canWalk:found};
}
export function disposeFloorScene(root:THREE.Object3D){const materials=new Set<THREE.Material>();root.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});materials.forEach(m=>m.dispose());}
