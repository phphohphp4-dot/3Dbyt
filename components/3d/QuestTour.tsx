'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {TourEditor} from './TourEditor';
import {TourCustomizer} from '@/lib/tour-customizer';
import {type Selection,type Variant} from '@/lib/tour-catalog';
import {addOutdoorSurfaceDetail} from '@/lib/quest-outdoor';
import {TourInteractions} from '@/lib/quest-interactions';
import {HDRLoader} from 'three/examples/jsm/loaders/HDRLoader.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {canStand,canTravel,nearestStanding,type NavigationGrid} from '@/lib/quest-navigation';

export function QuestTour({assetBase='/mikulovice',allowEditing=false}:{assetBase?:string;allowEditing?:boolean}){
 const editor=useRef<TourCustomizer|null>(null),editing=useRef(false),editorBusy=useRef(false);
 const [editorOpen,setEditorOpen]=useState(false),[selection,setSelection]=useState<Selection|null>(null);
 const select=useCallback((s:Selection|null)=>{if(editorBusy.current)return;setSelection(s);editor.current?.select(s);},[]);
 const apply=useCallback((v:Variant)=>editor.current?.apply(v),[]);
 const busy=useCallback((v:boolean)=>{editorBusy.current=v;},[]);
 const closeEditor=()=>{editing.current=false;setEditorOpen(false);select(null);};
 const host=useRef<HTMLDivElement>(null);
 const actions=useRef<{enter:()=>void;reset:()=>void;walk:()=>void;lights:()=>void;go:(place:string)=>void}|null>(null);
 const [lightsOn,setLightsOn]=useState(true),[interactionsReady,setInteractionsReady]=useState(false);
 const [status,setStatus]=useState('Načítám prohlídku…');
 const [menuOpen,setMenuOpen]=useState(true);
 const [ready,setReady]=useState(false),[xrSupported,setXrSupported]=useState(false),[inVR,setInVR]=useState(false);
 useEffect(()=>{
  const container=host.current;if(!container)return;
  let disposed=false,loaded=false,nav:NavigationGrid,model:THREE.Group;
  let interactions:TourInteractions|undefined;let disposeOutdoor:(()=>void)|undefined;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#a8bfca');scene.add(new THREE.HemisphereLight(0xffffff,0x777777,1));
  let forest:THREE.DataTexture|undefined;
  new HDRLoader().loadAsync(assetBase+'/forest.hdr').then(texture=>{
   if(disposed){texture.dispose();return;}forest=texture;texture.mapping=THREE.EquirectangularReflectionMapping;
   scene.background=texture;scene.environment=texture;scene.backgroundIntensity=.65;scene.environmentIntensity=.4;
  }).catch(()=>{/* Keep the neutral sky if the optional panorama is unavailable. */});
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local-floor');renderer.xr.setFoveation(1);
  container.appendChild(renderer.domElement);
  const camera=new THREE.PerspectiveCamera(70,1,.05,80);camera.position.set(0,1.65,0);
  const rig=new THREE.Group();rig.add(camera);scene.add(rig);
  const keys=new Set<string>();let yaw=0,pitch=0,drag=false,lastTime=0,snapReady=true,frames=0,measure=0,lastAim=0;
  const head=new THREE.Vector3(),direction=new THREE.Vector3(),right=new THREE.Vector3(),matrix=new THREE.Matrix4();
  const ray=new THREE.Raycaster();ray.far=8;
  const marker=new THREE.Mesh(new THREE.RingGeometry(.12,.19,24),new THREE.MeshBasicMaterial({color:0x63e5b1,side:THREE.DoubleSide}));
  marker.rotation.x=-Math.PI/2;marker.visible=false;scene.add(marker);
  const fade=new THREE.Mesh(new THREE.SphereGeometry(.12,12,8),new THREE.MeshBasicMaterial({color:0x161616,side:THREE.BackSide,transparent:true,opacity:0,depthTest:false}));
  fade.renderOrder=999;camera.add(fade);
  const controllers=[renderer.xr.getController(0),renderer.xr.getController(1)];
  function teleport(c:THREE.Group){
   if(!loaded)return null;
   c.updateWorldMatrix(true,false);matrix.extractRotation(c.matrixWorld);
   ray.ray.origin.setFromMatrixPosition(c.matrixWorld);ray.ray.direction.set(0,0,-1).applyMatrix4(matrix);
   const hit=ray.intersectObjects(interactions?[model,interactions.root]:[model],true)[0];
   if(!hit||hit.point.y>.12||hit.point.y<-.18||!canStand(nav,hit.point.x,hit.point.z)||(editor.current&&!editor.current.canTravel(hit.point.x,hit.point.z,hit.point.x,hit.point.z))||(interactions&&!interactions.canTravel(hit.point.x,hit.point.z,hit.point.x,hit.point.z)))return null;
   return hit.point;
  }
  function headPosition(){camera.updateWorldMatrix(true,false);camera.getWorldPosition(head);return head;}
  function relocate(x:number,z:number){headPosition();rig.position.x+=x-head.x;rig.position.z+=z-head.z;}
  const listeners=controllers.map(c=>{
   rig.add(c);const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-1)]),new THREE.LineBasicMaterial({color:0x86f0ca}));line.scale.z=5;c.add(line);
   const select=()=>{teleport(c);if(interactions?.activate(ray,headPosition()))return;const p=teleport(c);if(p)relocate(p.x,p.z);};c.addEventListener('select',select);return select;
  });
  function reset(){if(!loaded)return;const [x,z]=nearestStanding(nav,3.65,-5.35);rig.rotation.set(0,0,0);rig.position.set(x,0,z);yaw=.85;pitch=-.12;camera.rotation.set(pitch,yaw,0,'YXZ');if(renderer.xr.isPresenting)relocate(x,z);setStatus('Obývací pokoj');}
  function travel(x:number,z:number,xx:number,zz:number){return canTravel(nav,x,z,xx,zz)&&(!editor.current||editor.current.canTravel(x,z,xx,zz))&&(!interactions||interactions.canTravel(x,z,xx,zz));}
  function move(dx:number,dz:number){headPosition();if(travel(head.x,head.z,head.x+dx,head.z+dz)){rig.position.x+=dx;rig.position.z+=dz;}else if(travel(head.x,head.z,head.x+dx,head.z)){rig.position.x+=dx;}else if(travel(head.x,head.z,head.x,head.z+dz)){rig.position.z+=dz;}}
  async function enter(){try{if(!navigator.xr)throw new Error('VR potřebuje prohlížeč v Questu a HTTPS.');const session=await navigator.xr.requestSession('immersive-vr',{requiredFeatures:['local-floor'],optionalFeatures:['bounded-floor']});if(disposed){await session.end();return;}await renderer.xr.setSession(session);}catch(e){setStatus(e instanceof Error?e.message:'VR se nepodařilo spustit.');}}
  function go(place:string){
   if(!loaded)return;
   const destinations:Record<string,[number,number,number,number]>={terrace:[2.7,-10.3,-.8,-.13],garden:[6.5,-14.1,2.85,.05],front:[8,4.6,0,.12],bedroom:[6.3,-7.1,-1.45,-.14],bathroom:[9,-2.18,-2.7,-.30],hall:[9,-3.5,-.22,-.12],dining:[3.65,-4.2,2.50,-.35]};
   const d=destinations[place];if(!d)return;const [x,z]=nearestStanding(nav,d[0],d[1]);rig.rotation.set(0,0,0);rig.position.set(x,0,z);yaw=d[2];pitch=d[3];camera.rotation.set(pitch,yaw,0,'YXZ');setStatus({terrace:'Terasa 3kk',garden:'Zadní zahrada',front:'Před domem',bedroom:'Ložnice',bathroom:'Koupelna',hall:'Chodba',dining:'Jídelna 3kk'}[place]||'');
  }
  actions.current={go,enter:()=>void enter(),reset,lights:()=>interactions?.toggleLights(),walk:()=>{void renderer.domElement.requestPointerLock();}};
  const onStart=()=>{camera.position.set(0,0,0);setInVR(true);setStatus('VR spuštěno');};
  const onEnd=()=>{camera.position.set(0,1.65,0);camera.rotation.set(0,0,0);yaw=0;pitch=0;setInVR(false);};
  renderer.xr.addEventListener('sessionstart',onStart);renderer.xr.addEventListener('sessionend',onEnd);
  if(window.isSecureContext&&navigator.xr)navigator.xr.isSessionSupported('immersive-vr').then(v=>{if(!disposed)setXrSupported(v);});
  const resize=()=>{renderer.setSize(container.clientWidth,container.clientHeight);camera.aspect=container.clientWidth/container.clientHeight;camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  const activateCenter=()=>{if(!loaded)return;ray.setFromCamera(new THREE.Vector2(),camera);interactions?.activate(ray,headPosition());};
  const down=(e:KeyboardEvent)=>{if(e.target instanceof HTMLElement&&(e.target.closest('input,textarea,select,button')||e.target.isContentEditable))return;if(e.code==='KeyE'&&!e.repeat)activateCenter();if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){keys.add(e.code);e.preventDefault();}};
  const up=(e:KeyboardEvent)=>keys.delete(e.code);const blur=()=>{keys.clear();drag=false;};
  let pointerStart:THREE.Vector2|null=null;
  const pointerDown=(e:PointerEvent)=>{drag=true;pointerStart=new THREE.Vector2(e.clientX,e.clientY);};
  const pointerUp=(e:PointerEvent)=>{drag=false;if(pointerStart&&pointerStart.distanceTo(new THREE.Vector2(e.clientX,e.clientY))<5&&loaded&&!renderer.xr.isPresenting){
   const rect=renderer.domElement.getBoundingClientRect();const p=document.pointerLockElement===renderer.domElement?new THREE.Vector2():new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
   ray.setFromCamera(p,camera);if(editing.current){if(!editorBusy.current){const id=editor.current?.pick(ray);select(id?{objectId:id,scope:'one'}:null);}}else interactions?.activate(ray,headPosition());
  }pointerStart=null;};
  const pointerMove=(e:PointerEvent)=>{if(loaded&&!drag&&!renderer.xr.isPresenting){const rect=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);renderer.domElement.style.cursor=(editing.current?editor.current?.pick(ray):interactions?.pick(ray))?'pointer':'grab';}if(renderer.xr.isPresenting||(!drag&&document.pointerLockElement!==renderer.domElement))return;yaw-=e.movementX*.002;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.002,-1.35,1.35);camera.rotation.set(pitch,yaw,0,'YXZ');};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);window.addEventListener('pointerup',pointerUp);window.addEventListener('pointermove',pointerMove);renderer.domElement.addEventListener('pointerdown',pointerDown);
  Promise.all([new GLTFLoader().loadAsync(assetBase+'/mikulovice-quest.glb'),fetch(assetBase+'/navigation.json').then(r=>{if(!r.ok)throw new Error('Chybí navigace.');return r.json();})]).then(([g,n])=>{
   if(disposed){g.scene.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});return;}
   model=g.scene;model.traverse(o=>{if(o instanceof THREE.Mesh){for(const m of Array.isArray(o.material)?o.material:[o.material]){if(m.name.startsWith('Baked_'))m.toneMapped=false;if(m.map)m.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}}});nav=n;scene.add(model);editor.current=new TourCustomizer(model);void addOutdoorSurfaceDetail(model,assetBase).then(cleanup=>{if(disposed)cleanup();else disposeOutdoor=cleanup;}).catch(()=>{});model.updateMatrixWorld(true);loaded=true;reset();setReady(true);setStatus('Připraveno · načítám interakce');
   interactions=new TourInteractions(scene,model,assetBase,message=>{setStatus(message);setLightsOn(interactions?.lightsOn??true);});
   interactions.load().then(()=>{if(!disposed){setInteractionsReady(true);setStatus('Připraveno · kliknutím otevřete dveře či skříňku');}}).catch(e=>{if(!disposed)setStatus('Interakce se nepodařilo načíst: '+e.message);});
  }).catch(e=>{if(!disposed)setStatus('Načtení selhalo: '+e.message);});
  renderer.setAnimationLoop((time)=>{
   const dt=Math.min((time-lastTime)/1000,.04);lastTime=time;
   if(loaded){
    camera.updateWorldMatrix(true,false);camera.getWorldDirection(direction);direction.y=0;direction.normalize();right.crossVectors(direction,new THREE.Vector3(0,1,0));
    let mx=0,my=0;
    const session=renderer.xr.getSession();
    if(session){
     for(const source of session.inputSources){const a=source.gamepad?.axes;if(!a)continue;
      const sx=a.length>=4?a[2]:a[0],sy=a.length>=4?a[3]:a[1];
      if(source.handedness==='left'){mx=Math.abs(sx)>.18?sx:0;my=Math.abs(sy)>.18?-sy:0;}
      if(source.handedness==='right'){
       if(Math.abs(sx)<.25)snapReady=true;
       if(Math.abs(sx)>.7&&snapReady){headPosition();const before=head.clone();rig.rotation.y-=Math.sign(sx)*Math.PI/6;rig.updateMatrixWorld(true);headPosition();rig.position.x+=before.x-head.x;rig.position.z+=before.z-head.z;snapReady=false;}
      }
     }
     if(time-lastAim>100){lastAim=time;marker.visible=false;for(const c of controllers){if(!c.visible)continue;const p=teleport(c);if(p){marker.position.set(p.x,.025,p.z);marker.visible=true;break;}}}
    }else{mx=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));my=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));}
    const length=Math.max(1,Math.hypot(mx,my));move((direction.x*my+right.x*mx)*dt*1.3/length,(direction.z*my+right.z*mx)*dt*1.3/length);
    headPosition();fade.material.opacity=session&&(!canStand(nav,head.x,head.z)||(interactions&&!interactions.canTravel(head.x,head.z,head.x,head.z)))?.96:0;
   }
   if(loaded)interactions?.update(dt,headPosition());
   renderer.render(scene,camera);frames++;
   if(time-measure>2000){container.dataset.openPanels=String(interactions?.openCount??0);container.dataset.lights=interactions?.lightsOn===false?'off':'on';container.dataset.fps=String(Math.round(frames*1000/(time-measure)));container.dataset.drawCalls=String(renderer.info.render.calls);container.dataset.triangles=String(renderer.info.render.triangles);frames=0;measure=time;}
  });
  return()=>{disposed=true;editor.current?.dispose();editor.current=null;disposeOutdoor?.();interactions?.dispose();actions.current=null;renderer.setAnimationLoop(null);void renderer.xr.getSession()?.end();observer.disconnect();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);window.removeEventListener('pointerup',pointerUp);window.removeEventListener('pointermove',pointerMove);renderer.domElement.removeEventListener('pointerdown',pointerDown);controllers.forEach((c,i)=>c.removeEventListener('select',listeners[i]));renderer.xr.removeEventListener('sessionstart',onStart);renderer.xr.removeEventListener('sessionend',onEnd);const materials=new Set<THREE.Material>();scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});materials.forEach(m=>{for(const value of Object.values(m))if(value instanceof THREE.Texture)value.dispose();m.dispose();});forest?.dispose();renderer.dispose();renderer.domElement.remove();};
 },[assetBase,select]);
 return <main className="fixed inset-0 bg-slate-950 text-white">
  <div ref={host} className="absolute inset-0" aria-label="3D interiér Mikulovice"/>
  {!inVR&&<><header className="pointer-events-none absolute left-5 top-5 rounded-2xl bg-slate-950/85 p-4"><p className="text-xs uppercase tracking-[.2em] text-emerald-300">Mikulovice · Quest 3S</p><h1 className="text-xl font-semibold">Projděte si svůj byt</h1><p role="status" className="mt-1 text-sm text-slate-300">{status}</p></header>
  {allowEditing&&!editorOpen&&<button disabled={!interactionsReady} onClick={()=>{editing.current=true;setEditorOpen(true);setMenuOpen(false);document.exitPointerLock();}} style={{position:'absolute',right:16,top:16,padding:'12px 18px',borderRadius:12,background:'#047857',color:'white',fontWeight:600}}>Upravit interiér</button>}
  {editorOpen&&<TourEditor selection={selection} onSelect={select} onApply={apply} onBusy={busy} onClose={closeEditor}/>}
  <section style={menuOpen?undefined:{width:'auto'}} className="absolute bottom-5 left-1/2 w-[min(94%,620px)] -translate-x-1/2 rounded-2xl bg-slate-950/90 p-4 text-center">
   {menuOpen?<><div className="flex flex-wrap justify-center gap-2"><button disabled={!ready||!xrSupported} onClick={()=>actions.current?.enter()} className="rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-40">Vstoupit do VR</button><button disabled={!ready} onClick={()=>{actions.current?.walk();setMenuOpen(false);}} className="rounded-xl bg-slate-700 px-4 py-3">Procházet na PC</button><button disabled={!ready} onClick={()=>actions.current?.reset()} className="rounded-xl bg-slate-700 px-4 py-3">Zpět do obýváku</button><button disabled={!interactionsReady} onClick={()=>actions.current?.lights()} className="rounded-xl bg-slate-700 px-4 py-3">{lightsOn?'Zhasnout světla':'Rozsvítit světla'}</button></div>
   <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-300">Přejít do <select aria-label="Místo v prohlídce" defaultValue="" onChange={e=>{actions.current?.go(e.target.value);e.target.value='';}} disabled={!ready} className="rounded-lg bg-slate-700 px-3 py-2 text-white"><option value="" disabled>Vyberte místo</option><option value="dining">Jídelna</option><option value="terrace">Terasa</option><option value="garden">Zadní zahrada</option><option value="front">Před domem</option><option value="bedroom">Ložnice</option><option value="bathroom">Koupelna</option><option value="hall">Chodba</option></select></label>
   <details className="mt-2 text-sm text-slate-300"><summary className="cursor-pointer">Ovládání prohlídky</summary><p>Dveře včetně posuvných terasových a dvě horní kuchyňské skříňky: kliknutí nebo klávesa E při zamíření na PC; spoušť ovladače v Questu. Vypínač je vedle TV stěny. Quest: namiřte na podlahu a stiskněte spoušť pro teleport. Levá páčka: chůze. Pravá páčka: otočení po 30°.</p>
   <p className="mt-1 text-xs text-slate-400">PC: táhněte myší pro rozhlížení · WASD / šipky pro chůzi · Esc uvolní myš.</p>
   {!xrSupported&&<p className="mt-2 text-xs text-amber-200">VR se zpřístupní v prohlížeči Questu na zabezpečené adrese HTTPS.</p>}
   </details><button onClick={()=>setMenuOpen(false)} className="mt-2 text-xs text-slate-400">Skrýt ovládání</button></>:<button onClick={()=>setMenuOpen(true)} className="text-sm text-white">Ovládání prohlídky</button>}
  </section></>}
 </main>;
}





