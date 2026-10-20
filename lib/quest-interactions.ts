import * as THREE from 'three';

export type HingedPanel={x:number;z:number;width:number;angle:number};
export function panelBlocks(p:HingedPanel,x:number,z:number,r=.24){
 const dx=Math.cos(p.angle)*p.width,dz=-Math.sin(p.angle)*p.width;
 const t=Math.max(0,Math.min(1,((x-p.x)*dx+(z-p.z)*dz)/(p.width*p.width)));
 return Math.hypot(x-p.x-t*dx,z-p.z-t*dz)<r;
}
type Item={root:THREE.Group;label:string;width:number;closed:number;open:number;target:number;kind:'door'|'cabinet'|'slider';baseX?:number};
export class TourInteractions{
 root=new THREE.Group();items:Item[]=[];lightsOn=true;lightsReady=false;disposed=false;
 private fixedPanels:HingedPanel[]=[];
 private lightMaps:{mat:THREE.MeshBasicMaterial;on:THREE.Texture;off:THREE.Texture}[]=[];
 private switchMaterial=new THREE.MeshStandardMaterial({color:0xf0eee7,roughness:.5});
 private switchRocker=new THREE.Group();private textures:THREE.Texture[]=[];
 constructor(private scene:THREE.Scene,private model:THREE.Group,private base:string,private say:(s:string)=>void){scene.add(this.root);}
 async load(){
  // Preserve the original baked front and handle while replacing the solid interior.
  const fronts=new Map<number,THREE.Mesh>();
  this.model.updateMatrixWorld(true);
  this.model.traverse(o=>{if(!(o instanceof THREE.Mesh)||!o.name.startsWith('VR_living_details'))return;
   const g=o.geometry,p=g.getAttribute('position'),idx=g.getIndex(),count=idx?idx.count:p.count,keep:number[]=[],parts:number[][]=[[],[]];
   for(let i=0;i<count;i+=3){const ids=[0,1,2].map(j=>idx?idx.getX(i+j):i+j);
    const vs=ids.map(id=>new THREE.Vector3().fromBufferAttribute(p,id).applyMatrix4(o.matrixWorld));
    const center=vs.reduce((a,v)=>a.add(v),new THREE.Vector3()).multiplyScalar(1/3);
    const which=[1.45,2.05].findIndex(cy=>Math.abs(center.z+cy)<.298);
    const replace=which>=0&&center.x>4.275&&center.x<4.685&&center.y>1.532&&center.y<2.328;
    if(!replace){keep.push(...ids);continue;}
    const cy=[1.45,2.05][which];
    const front=vs.every(v=>v.x>=4.315&&v.x<=4.341&&Math.abs(v.z+cy)<.284&&v.y>=1.544&&v.y<=2.316);
    const pull=vs.every(v=>v.x>=4.286&&v.x<=4.314&&Math.abs(v.z+cy)<.137&&v.y>=1.582&&v.y<=1.598);
    if(front||pull)parts[which].push(...ids);
   }
   for(let j=0;j<2;j++){if(!parts[j].length)throw new Error('Cabinet front could not be separated');const sliced=g.clone();sliced.setIndex(parts[j]);const geo=sliced.toNonIndexed();sliced.dispose();geo.applyMatrix4(o.matrixWorld);geo.translate(-4.328,-1.93,[1.45,2.05][j]-.2825);geo.rotateY(-Math.PI/2);geo.computeBoundingSphere();fronts.set(j,new THREE.Mesh(geo,o.material));}
   g.setIndex(keep);g.computeBoundingSphere();
  });
  const oak=await new THREE.TextureLoader().loadAsync(this.base+'/oak.jpg');oak.colorSpace=THREE.SRGBColorSpace;oak.center.set(.5,.5);oak.rotation=Math.PI/2;this.textures.push(oak);
  if(this.disposed){oak.dispose();return;}
  const wood=new THREE.MeshBasicMaterial({map:oak,color:0xe6ddc8});
  const white=new THREE.MeshStandardMaterial({color:0xe7d3aa,roughness:.6});
  const inner=new THREE.MeshStandardMaterial({color:0xb9b2a2,roughness:.8});
  const metal=new THREE.MeshStandardMaterial({color:0x333536,metalness:.65,roughness:.35});
  const box=(parent:THREE.Object3D,d:number[],p:number[],m:THREE.Material)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(...d as [number,number,number]),m);mesh.position.set(...p as [number,number,number]);parent.add(mesh);return mesh;};
  const doors:[string,number,number,number,number,number][]=[
   ['Ložnice u terasy',5.6364,-6.0808,.82,0,Math.PI/2],['Druhá ložnice',5.6364,-4.7071,.82,0,-Math.PI/2],
   ['Vstup do 3kk',10.0808,-2.8889,.83,Math.PI,Math.PI/2],['Koupelna 3kk',9.0101,-2.7071,.8,0,Math.PI/2],
   ['Vstup do 2kk',12.8081,-2.8889,.83,0,Math.PI/2],['Obývák 2kk',13.8182,-4.8485,.81,0,-Math.PI/2],
   ['Ložnice 2kk',14.8687,-3.7778,.82,-Math.PI/2,0],['Koupelna 2kk',13.9192,-2.7071,.8,0,Math.PI/2],
   ['Úklidová místnost',11.7576,-4.1414,.72,0,-Math.PI/2],
   ['Hlavní vstup',10.951,-.2424,1.048,0,-Math.PI/2]
  ];
  for(const [label,x,z,width,closed,open] of doors){
   const root=new THREE.Group();root.position.set(x,0,z);this.root.add(root);
   box(root,[width,2.05,.042],[width/2,1.025,0],wood);
   const lintel=new THREE.Group();lintel.position.copy(root.position);lintel.rotation.y=closed;this.root.add(lintel);box(lintel,[width,.55,.12],[width/2,2.325,0],new THREE.MeshBasicMaterial({color:0xbeb8aa}));
   for(const side of [-1,1]){box(root,[.035,.16,.025],[width-.105,1.02,side*.035],metal);box(root,[.12,.018,.026],[width-.14,1.05,side*.058],metal);}
   const item:Item={root,label,width,closed,open,target:closed,kind:'door'};root.rotation.y=closed;root.userData.item=item;this.items.push(item);
  }
  // Sliding terrace panes: both visible glazing and collision move together.
  const glazing=new THREE.MeshStandardMaterial({color:0xb9d3dc,transparent:true,opacity:.09,roughness:.12,metalness:.05,depthWrite:false});
  for(const [index,cx] of [3.080808,6.939394,14.515152].entries()){
   const width=.86;
   const pane=(x:number,z:number)=>{
    const r=new THREE.Group();r.position.set(x,0,z);this.root.add(r);
    box(r,[width-.055,2.13,.008],[width/2,1.125,0],glazing);
    for(const xx of [.018,width-.018])box(r,[.036,2.21,.045],[xx,1.125,0],metal);
    for(const y of [.04,2.21])box(r,[width,.036,.045],[width/2,y,0],metal);
    return r;
   };
   const fixed=pane(cx,-9.247);this.fixedPanels.push({x:cx,z:-9.247,width,angle:0});const root=pane(cx-width,-9.19);
   box(root,[.025,.18,.035],[width-.09,1.05,.045],metal);
   const item:Item={root,label:['Terasa obývák','Terasa ložnice','Terasa 2kk'][index],width,closed:0,open:.86,target:0,kind:'slider',baseX:cx-width};
   root.userData.item=item;fixed.userData.item=item;this.items.push(item);
  }
  // Two upper kitchen cabinets replace solid mock-up boxes with hollow interiors.
  for(const [index,cy] of [1.45,2.05].entries()){
   const frame=new THREE.Group();frame.position.set(4.51,1.93,-cy);this.root.add(frame);
   box(frame,[.018,.79,.59],[.16,0,0],inner);
   for(const dy of [-.385,.385,0])box(frame,[.32,.018,.55],[0,dy,0],inner);
   for(const dz of [-.286,.286])box(frame,[.34,.79,.018],[0,0,dz],white);
   // A small stack of plates on the middle shelf.
   for(let j=0;j<3;j++){const plate=new THREE.Mesh(new THREE.CylinderGeometry(.095,.09,.012,24),white);plate.position.set(0,.022+j*.014,0);frame.add(plate);}
   const root=new THREE.Group();root.position.set(4.328,1.93,-cy+.2825);this.root.add(root);
   // Panel extends along local X; its closed rotation aligns it with the cabinet front.
   const front=fronts.get(index);if(!front)throw new Error('Missing cabinet front');root.add(front);box(root,[.562,.767,.002],[.2825,0,.014],new THREE.MeshBasicMaterial({color:0xaaa393}));
   const closed=Math.PI/2,open=Math.PI;
   const item:Item={root,label:'Horní skříňka '+(index+1),width:.565,closed,open,target:closed,kind:'cabinet'};root.rotation.y=closed;root.userData.item=item;this.items.push(item);
  }
  const sw=new THREE.Group();sw.position.set(4.64,1.15,-6.12);sw.rotation.y=-Math.PI/2;this.root.add(sw);sw.userData.lightSwitch=true;
  box(sw,[.09,.13,.018],[0,0,0],white);sw.add(this.switchRocker);box(this.switchRocker,[.067,.105,.016],[0,0,.017],this.switchMaterial);
  this.switchRocker.rotation.x=-.12;
  this.root.updateMatrixWorld(true);
  const loader=new THREE.TextureLoader();
  const jobs:Promise<void>[]=[];
  this.model.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const m=o.material;if(!(m instanceof THREE.MeshBasicMaterial)||!m.map)return;
   const key=m.name.replace('Baked_','');if(key.startsWith('exterior')||key==='terraces')return;
   jobs.push(loader.loadAsync(this.base+'/lights-off/'+key+'.png').then(off=>{if(this.disposed){off.dispose();return;}off.colorSpace=THREE.SRGBColorSpace;off.flipY=false;off.anisotropy=m.map!.anisotropy;this.textures.push(off);this.lightMaps.push({mat:m,on:m.map!,off});}));
  });
  await Promise.all(jobs);this.lightsReady=!this.disposed;
 }
 toggleLights(){if(!this.lightsReady){this.say('Varianta zhasnutého osvětlení se načítá…');return;}this.lightsOn=!this.lightsOn;for(const x of this.lightMaps){x.mat.map=this.lightsOn?x.on:x.off;x.mat.needsUpdate=true;}this.switchRocker.rotation.x=this.lightsOn?-.12:.12;this.switchMaterial.color.setHex(this.lightsOn?0xf0eee7:0xaaa9a4);this.say(this.lightsOn?'Světla rozsvícena':'Světla zhasnuta · denní světlo zůstává');}
 pick(ray:THREE.Raycaster){
  const hit=ray.intersectObjects([this.model,this.root],true)[0];if(!hit||hit.distance>2.8)return null;
  let o:THREE.Object3D|null=hit.object;while(o){if(o.userData.item||o.userData.lightSwitch)return o;o=o.parent;}return null;
 }
 activate(ray:THREE.Raycaster,head:THREE.Vector3){const o=this.pick(ray);if(!o)return false;if(o.userData.lightSwitch){this.toggleLights();return true;}
  const item=o.userData.item as Item;const opening=item.target===item.closed;
  const target=opening?item.open:item.closed;
  // Never swing a panel through the visitor's body.
  if(item.kind==='door')for(let i=0;i<=12;i++){const angle=item.root.rotation.y+(target-item.root.rotation.y)*i/12;if(panelBlocks({x:item.root.position.x,z:item.root.position.z,width:item.width,angle},head.x,head.z)){this.say('Ustupte trochu od dveří, aby se mohly bezpečně otevřít nebo zavřít.');return true;}}
  item.target=target;this.say(item.label+' · '+(opening?'otevírám':'zavírám'));return true;
 }
 canTravel(x:number,z:number,xx:number,zz:number){for(const p of this.fixedPanels){const n=Math.max(1,Math.ceil(Math.hypot(xx-x,zz-z)/.06));for(let i=0;i<=n;i++)if(panelBlocks(p,x+(xx-x)*i/n,z+(zz-z)*i/n))return false;}const steps=Math.max(1,Math.ceil(Math.hypot(xx-x,zz-z)/.06));for(let i=1;i<=steps;i++)for(const p of this.items){if(p.kind==='cabinet')continue;if(panelBlocks({x:p.root.position.x,z:p.root.position.z,width:p.width,angle:p.root.rotation.y},x+(xx-x)*i/steps,z+(zz-z)*i/steps))return false;}return true;}
 update(dt:number,head:THREE.Vector3){for(const item of this.items){if(item.kind==='slider'){const x=THREE.MathUtils.damp(item.root.position.x,item.baseX!+item.target,9,dt);if(!panelBlocks({x,z:item.root.position.z,width:item.width,angle:0},head.x,head.z))item.root.position.x=x;continue;}const current=item.root.rotation.y;const next=THREE.MathUtils.damp(current,item.target,9,dt);if(item.kind==='door'&&panelBlocks({x:item.root.position.x,z:item.root.position.z,width:item.width,angle:next},head.x,head.z))continue;item.root.rotation.y=Math.abs(next-item.target)<.001?item.target:next;}this.root.updateMatrixWorld(true);}
 get openCount(){return this.items.filter(i=>i.target===i.open).length;}
 dispose(){this.disposed=true;this.textures.forEach(t=>t.dispose());}
}


