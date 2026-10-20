from pathlib import Path
p=Path('lib/tour-customizer.ts');s=p.read_text(encoding='utf-8')
s=s.replace(' private variant:Variant={};',' private variant:Variant={};\n private sofaBounds?:THREE.Box3;\n private sofaObstacle?:THREE.Box3;')
s=s.replace('  // Rugs are a whole', "  const sofa=this.pieces.get('3kk-living-sofa');if(sofa)this.sofaBounds=new THREE.Box3().setFromObject(sofa.original);\n  // Rugs are a whole")
s=s.replace('piece.replacement=this.chair(id,style);', "piece.replacement=id==='3kk-living-sofa'?this.sofa(style):this.chair(id,style);")
s=s.replace("   const color=MATERIALS", """   if(id==='3kk-living-sofa'&&this.sofaBounds){
    const factor=Number(change.size||100)/100,center=this.sofaBounds.getCenter(new THREE.Vector3());
    piece.root.scale.set(1,1,factor);piece.root.position.set(0,0,center.z*(1-factor));
    piece.root.updateMatrixWorld(true);
    this.sofaObstacle=new THREE.Box3().setFromObject(piece.replacement||piece.original);
   }
   const color=MATERIALS""")
pos=s.index(' private chair(')
s=s[:pos]+""" // The original navigation grid remains conservative; this adds the enlarged footprint.
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
"""+s[pos:]
p.write_text(s,encoding='utf-8')
p=Path('components/3d/QuestTour.tsx');s=p.read_text(encoding='utf-8')
s=s.replace('return canTravel(nav,x,z,xx,zz)&&', 'return canTravel(nav,x,z,xx,zz)&&(!editor.current||editor.current.canTravel(x,z,xx,zz))&&')
s=s.replace('!canStand(nav,hit.point.x,hit.point.z)||','!canStand(nav,hit.point.x,hit.point.z)||(editor.current&&!editor.current.canTravel(hit.point.x,hit.point.z,hit.point.x,hit.point.z))||')
p.write_text(s,encoding='utf-8')
