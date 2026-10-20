from pathlib import Path
p=Path('lib/quest-interactions.ts');s=p.read_text('utf-8-sig')
s=s.replace("kind:'door'|'cabinet'", "kind:'door'|'cabinet'|'slider';baseX?:number")
s=s.replace("['Koupelna 3kk',9.0101,-2.7071,.8,0,-Math.PI/2]", "['Koupelna 3kk',9.0101,-2.7071,.8,0,Math.PI/2]")
s=s.replace("['Koupelna 2kk',13.9192,-2.7071,.8,0,-Math.PI/2]", "['Koupelna 2kk',13.9192,-2.7071,.8,0,Math.PI/2]")
s=s.replace("['Úklidová místnost',11.7576,-4.1414,.72,0,-Math.PI/2]", "['Úklidová místnost',11.7576,-4.1414,.72,0,-Math.PI/2],\n   ['Hlavní vstup',10.951,-.2424,1.048,0,-Math.PI/2]")
pos=s.index('  // Two upper kitchen')
s=s[:pos]+'''  // Sliding terrace panes: both visible glazing and collision move together.
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
   pane(cx,-9.247);const root=pane(cx-width,-9.19);
   box(root,[.025,.18,.035],[width-.09,1.05,.045],metal);
   const item:Item={root,label:['Terasa obývák','Terasa ložnice','Terasa 2kk'][index],width,closed:0,open:.86,target:0,kind:'slider',baseX:cx-width};
   root.userData.item=item;this.items.push(item);
  }
''' +s[pos:]
s=s.replace("if(!key.startsWith('living_')&&!key.startsWith('architecture_west')&&key!=='ceilings')return;", "if(key.startsWith('exterior')||key==='terraces')return;")
s=s.replace("'Světla v obýváku rozsvícena':'Světla v obýváku zhasnuta · denní světlo zůstává'", "'Světla rozsvícena':'Světla zhasnuta · denní světlo zůstává'")
s=s.replace("if(p.kind!=='door')continue;", "if(p.kind==='cabinet')continue;")
old="update(dt:number,head:THREE.Vector3){for(const item of this.items){const current=item.root.rotation.y;"
s=s.replace(old,"update(dt:number,head:THREE.Vector3){for(const item of this.items){if(item.kind==='slider'){const x=THREE.MathUtils.damp(item.root.position.x,item.baseX!+item.target,9,dt);if(!panelBlocks({x,z:item.root.position.z,width:item.width,angle:0},head.x,head.z))item.root.position.x=x;continue;}const current=item.root.rotation.y;")
p.write_text(s,encoding='utf-8')
p=Path('components/3d/QuestTour.tsx');s=p.read_text('utf-8-sig')
s=s.replace('lights:()=>void}|null>','lights:()=>void;go:(place:string)=>void}|null>')
s=s.replace("  actions.current={enter:", """  function go(place:string){
   if(!loaded)return;
   const destinations:Record<string,[number,number,number,number]>={terrace:[2.7,-10.3,-.8,-.13],garden:[6.5,-14.1,2.85,.05],front:[8,4.6,0,.12],bedroom:[6.3,-7.1,-1.45,-.14],bathroom:[9,-2.18,-2.7,-.30]};
   const d=destinations[place];if(!d)return;const [x,z]=nearestStanding(nav,d[0],d[1]);rig.rotation.set(0,0,0);rig.position.set(x,0,z);yaw=d[2];pitch=d[3];camera.rotation.set(pitch,yaw,0,'YXZ');setStatus({terrace:'Terasa 3kk',garden:'Zadní zahrada',front:'Před domem',bedroom:'Ložnice',bathroom:'Koupelna'}[place]||'');
  }
  actions.current={go,enter:""")
s=s.replace('<details className="mt-2', '''<label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-300">Přejít do <select aria-label="Místo v prohlídce" defaultValue="" onChange={e=>{actions.current?.go(e.target.value);e.target.value='';}} disabled={!ready} className="rounded-lg bg-slate-700 px-3 py-2 text-white"><option value="" disabled>Vyberte místo</option value="terrace">Terasa</option><option value="garden">Zadní zahrada</option><option value="front">Před domem</option><option value="bedroom">Ložnice</option><option value="bathroom">Koupelna</option></select></label>
   <details className="mt-2''')
s=s.replace('Dveře a dvě horní kuchyňské skříňky:', 'Dveře včetně posuvných terasových a dvě horní kuchyňské skříňky:')
p.write_text(s,encoding='utf-8')
