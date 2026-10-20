import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {CHAIR_PLACES,MATERIALS,validateVariant,type Variant,targets,type Selection} from './tour-catalog';

type Piece={root:THREE.Group;original:THREE.Group;replacement?:THREE.Group;cloth:THREE.MeshBasicMaterial[];originalColors:THREE.Color[];style:string};
export class TourCustomizer{
 readonly pieces=new Map<string,Piece>();
 private outlines:THREE.BoxHelper[]=[];
 private selected:Selection|null=null;
 private variant:Variant={};
 private sofaBounds?:THREE.Box3;
 private sofaObstacle?:THREE.Box3;
 constructor(private model:THREE.Group){
  model.updateMatrixWorld(true);
  const meshes:THREE.Mesh[]=[];model.traverse(o=>{if(o instanceof THREE.Mesh)meshes.push(o);});
  for(const mesh of meshes){
   if(mesh.name.startsWith('VR_living_chairs'))this.split(mesh,(points)=>{
    const c=points.reduce((s,p)=>s.add(p),new THREE.Vector3()).multiplyScalar(1/3);
    let closest=0,d=Infinity;CHAIR_PLACES.forEach(([x,z],i)=>{const dd=Math.hypot(c.x-x,c.z-z);if(dd<d){d=dd;closest=i;}});
    return {id:`3kk-dining-chair-${closest+1}`,cloth:c.y>.45};
   });
   if(mesh.name.startsWith('VR_living_sofa'))this.split(mesh,points=>({id:points.every(p=>p.y>.018&&p.y<.039)?'3kk-living-rug':'3kk-living-sofa',cloth:!points.every(p=>p.y<.2)}));
   if(mesh.name.startsWith('VR_living_details'))this.split(mesh,points=>{
    // Extract only this table's top and sled base. Books and the cup stay independent.
    const within=points.every(p=>p.x>=2.509&&p.x<=3.371&&p.z>=-7.881&&p.z<=-6.579&&p.y>=.046&&p.y<=.468);
    if(!within)return null;
    return {id:'3kk-living-coffee-table',cloth:points.every(p=>p.y>=.391)};
   });
   if(mesh.name.startsWith('VR_living_floor'))this.split(mesh,()=>({id:'3kk-living-floor',cloth:true}));
  }
  const sofa=this.pieces.get('3kk-living-sofa');if(sofa)this.sofaBounds=new THREE.Box3().setFromObject(sofa.original);
  // Rugs are a whole material surface, including their thin edge.
  const rug=this.pieces.get('3kk-living-rug');if(rug){rug.original.traverse(o=>{if(o instanceof THREE.Mesh&&!rug.cloth.includes(o.material)){rug.cloth.push(o.material);rug.originalColors.push(o.material.color.clone());}});}
 }
 private split(mesh:THREE.Mesh,classify:(points:THREE.Vector3[])=>{id:string;cloth:boolean}|null){
  if(!(mesh.material instanceof THREE.MeshBasicMaterial))throw new Error('Neočekávaný materiál upravitelného nábytku.');
  const g=mesh.geometry,position=g.getAttribute('position'),index=g.index,groups=new Map<string,{id:string;cloth:boolean;indices:number[]}>();
  const keep:number[]=[];
  const count=index?.count??position.count;
  for(let i=0;i<count;i+=3){
   const ids=[0,1,2].map(j=>index?index.getX(i+j):i+j);
   const part=classify(ids.map(id=>new THREE.Vector3().fromBufferAttribute(position,id).applyMatrix4(mesh.matrixWorld)));
   if(!part){keep.push(...ids);continue;}
   const key=part.id+':'+part.cloth;if(!groups.has(key))groups.set(key,{...part,indices:[]});groups.get(key)!.indices.push(...ids);
  }
  for(const part of groups.values()){
   let piece=this.pieces.get(part.id);
   if(!piece){const root=new THREE.Group(),original=new THREE.Group();root.name=part.id;root.userData.editorId=part.id;root.add(original);this.model.add(root);piece={root,original,cloth:[],originalColors:[],style:'original'};this.pieces.set(part.id,piece);}
   const slice=g.clone();slice.setIndex(part.indices);const geo=slice.toNonIndexed();slice.dispose();geo.applyMatrix4(mesh.matrixWorld);geo.computeBoundingSphere();
   const material=mesh.material.clone();const object=new THREE.Mesh(geo,material);object.name=keep.length?'Editable_'+part.id:mesh.name;piece.original.add(object);
   if(part.cloth){piece.cloth.push(material);piece.originalColors.push(material.color.clone());}
  }
  if(keep.length){g.setIndex(keep);g.computeBoundingSphere();}else{mesh.removeFromParent();g.dispose();}
 }
 pick(ray:THREE.Raycaster){
  const hit=ray.intersectObject(this.model,true).find(h=>(()=>{let o:THREE.Object3D|null=h.object;while(o){if(!o.visible)return false;o=o.parent;}return true;})());
  if(!hit||hit.distance>7)return null;
  let o:THREE.Object3D|null=hit.object;while(o){if(o.userData.editorId)return o.userData.editorId as string;o=o.parent;}return null;
 }
 select(selection:Selection|null){
  this.selected=selection;for(const h of this.outlines){h.removeFromParent();h.geometry.dispose();(h.material as THREE.Material).dispose();}this.outlines=[];
  if(!selection)return;
  for(const obj of targets(selection)){const p=this.pieces.get(obj.id);if(!p)continue;const h=new THREE.BoxHelper(p.replacement||p.original,0x67e8b0);h.userData.editorOutline=true;h.raycast=()=>{};this.model.add(h);this.outlines.push(h);}
 }
 apply(value:Variant){
  const variant=validateVariant(value);
  for(const [id,piece] of this.pieces){
   const change=variant[id]||{},style=change.furniture||'original';
   if(style!==piece.style){
    if(piece.replacement){piece.replacement.removeFromParent();this.disposeGroup(piece.replacement);piece.replacement=undefined;}
    piece.original.visible=style==='original';
    if(style!=='original'){
     piece.replacement=id==='3kk-living-sofa'?this.sofa(style):this.chair(id,style);piece.root.add(piece.replacement);
    }
    piece.style=style;
   }
   if(id==='3kk-living-sofa'&&this.sofaBounds){
    const factor=Number(change.size||100)/100,center=this.sofaBounds.getCenter(new THREE.Vector3());
    piece.root.scale.set(1,1,factor);piece.root.position.set(0,0,center.z*(1-factor));
    piece.root.updateMatrixWorld(true);
    this.sofaObstacle=factor>1?new THREE.Box3().setFromObject(piece.replacement||piece.original):undefined;
   }
   const color=MATERIALS.find(m=>m.id===change.material)?.color||'#ffffff';
   piece.cloth.forEach((m,i)=>{m.color.copy(piece.originalColors[i]).multiply(new THREE.Color(color));});
   piece.replacement?.traverse(o=>{if(o instanceof THREE.Mesh&&o.userData.fabric)(o.material as THREE.MeshStandardMaterial).color.set(change.material&&change.material!=='original'?color:'#bcb7ac');});
  }
  this.variant=variant;this.model.updateMatrixWorld(true);this.select(this.selected);
 }
 // The original navigation grid remains conservative; this adds the enlarged footprint.
 canTravel(x:number,z:number,tx:number,tz:number){
  const b=this.sofaObstacle;if(!b)return true;
  const n=Math.max(1,Math.ceil(Math.hypot(tx-x,tz-z)/.06));
  for(let i=0;i<=n;i++){
   const px=x+(tx-x)*i/n,pz=z+(tz-z)*i/n;
   if(px>b.min.x-.18&&px<b.max.x+.18&&pz>b.min.z-.18&&pz<b.max.z+.18)return false;
  }
  return true;
 }
 private sofa(style:string){
  const b=this.sofaBounds!,center=b.getCenter(new THREE.Vector3()),span=b.getSize(new THREE.Vector3()).z;
  const group=new THREE.Group();group.position.set(b.min.x,0,center.z);
  const fabric=new THREE.MeshStandardMaterial({color:'#bcb7ac',roughness:.96});
  const piping=new THREE.MeshStandardMaterial({color:'#a9a398',roughness:1});
  const metal=new THREE.MeshStandardMaterial({color:'#27282a',metalness:.45,roughness:.4});
  const rounded=(size:[number,number,number],pos:[number,number,number],mat:THREE.MeshStandardMaterial,r:number)=>{
   const mesh=new THREE.Mesh(new RoundedBoxGeometry(...size,4,r),mat);mesh.position.set(...pos);mesh.userData.fabric=mat===fabric;group.add(mesh);return mesh;
  };
  const modular=style==='sofa-modular',width=span-.12,arm=modular?.24:.13,seatWidth=(width-2*arm-.04)/3;
  const depth=modular?1.06:.96,baseY=modular?.22:.28;
  rounded([depth,.24,width],[depth/2,baseY,0],fabric,modular?.11:.055);
  for(const zz of [-width/2+.12,width/2-.12])for(const xx of [.16,depth-.13])rounded([.035,.18,.035],[xx,.11,zz],metal,.01);
  // Three individual seats with fine inset piping and gently reclined back cushions.
  for(let i=0;i<3;i++){
   const z=(i-1)*(seatWidth+.012),chaise=modular&&i===2,d=chaise?1.60:depth-.18;
   if(chaise)rounded([1.60,.24,seatWidth],[.80,baseY,z],fabric,.10);
   rounded([d,.018,seatWidth],[.18+d/2,.421,z],piping,.008);
   rounded([d,.19,seatWidth],[.18+d/2,.48,z],fabric,modular?.085:.045);
   const back=rounded([.20,.47,seatWidth],[.16,.74,z],fabric,modular?.095:.06);back.rotation.z=.10;
  }
  for(const z of [-width/2+arm/2,width/2-arm/2])rounded([depth,.49,arm],[depth/2,.48,z],fabric,modular?.115:.055);
  // Two smaller loose cushions give each variant a distinct silhouette.
  for(const z of [-width*.28,width*.28]){const cushion=rounded([.13,.33,.38],[.34,.77,z],fabric,.055);cushion.rotation.z=.22;cushion.rotation.x=z<0?.10:-.10;}
  return group;
 }
 private chair(id:string,style:string){
  const index=Number(id.split('-').at(-1))-1,[x,z,yaw]=CHAIR_PLACES[index];
  const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=yaw;
  const fabric=new THREE.MeshStandardMaterial({color:'#bcb7ac',roughness:.95});
  const oak=new THREE.MeshStandardMaterial({color:'#aa8052',roughness:.65});
  const box=(size:[number,number,number],pos:[number,number,number],material:THREE.MeshStandardMaterial,r:number)=>{const o=new THREE.Mesh(new RoundedBoxGeometry(...size,3,r),material);o.position.set(...pos);o.userData.fabric=material===fabric;group.add(o);return o;};
  box([.47,.085,.44],[0,.48,0],style==='oak-chair'?oak:fabric,.035);
  for(const xx of [-.17,.17])for(const zz of [-.15,.15]){const leg=box([.035,.44,.035],[xx,.235,zz],oak,.008);leg.rotation.z=-xx*.45;leg.rotation.x=zz*.45;}
  if(style==='soft-chair'){
   const back=box([.47,.37,.09],[0,.69,-.20],fabric,.043);back.rotation.x=-.10;
   for(const xx of [-.223,.223])box([.055,.16,.30],[xx,.58,-.06],fabric,.025);
  }else{
   const top=box([.46,.11,.045],[0,.82,-.21],oak,.02);top.rotation.x=-.1;
   for(const xx of [-.18,-.09,0,.09,.18])box([.018,.31,.022],[xx,.64,-.20],oak,.008);
  }
  return group;
 }
 private disposeGroup(root:THREE.Group){const mats=new Set<THREE.Material>();root.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();mats.add(o.material);}});mats.forEach(m=>m.dispose());}
 dispose(){this.select(null);}
}

