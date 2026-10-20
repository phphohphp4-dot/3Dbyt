from pathlib import Path
p=Path('lib/quest-interactions.ts');s=p.read_text('utf-8')
s=s.replace('private lightMaps:', 'private fixedPanels:HingedPanel[]=[];\n private lightMaps:')
s=s.replace('pane(cx,-9.247);const root=pane(cx-width,-9.19);','const fixed=pane(cx,-9.247);this.fixedPanels.push({x:cx,z:-9.247,width,angle:0});const root=pane(cx-width,-9.19);')
s=s.replace('root.userData.item=item;this.items.push(item);\n  }\n  // Two', 'root.userData.item=item;fixed.userData.item=item;this.items.push(item);\n  }\n  // Two')
s=s.replace("canTravel(x:number,z:number,xx:number,zz:number){const steps=", "canTravel(x:number,z:number,xx:number,zz:number){for(const p of this.fixedPanels){const n=Math.max(1,Math.ceil(Math.hypot(xx-x,zz-z)/.06));for(let i=0;i<=n;i++)if(panelBlocks(p,x+(xx-x)*i/n,z+(zz-z)*i/n))return false;}const steps=")
p.write_text(s,encoding='utf-8')
p=Path('scripts/check-rooms.mjs');s=p.read_text('utf-8');s=s.replace("['bath east',13.8,-1.4]", "['bath east',13.8,-1.4],['terrace west',2.6,-10.3],['terrace east',14,-10.2],['garden',6.5,-14],['front forecourt',8,4.5],['west side path',-.8,-5],['east side path',19.3,-5],['main threshold',11.5,-.24]")
s=s.replace("assert.ok(seen.has", "assert.ok(Math.hypot(p[0]-x,p[1]-z)<.4,name+' has a nearby walkable floor');assert.ok(seen.has")
p.write_text(s,encoding='utf-8')
p=Path('scripts/test-interactions.mjs');s=p.read_text('utf-8');s+='''
// A sliding leaf clears its opening without swinging into terrace furniture.
const sliderRoot=new THREE.Group();sliderRoot.position.set(3,0,-9);interactions.root.add(sliderRoot);
const slider={root:sliderRoot,label:'Terrace',width:.86,closed:0,open:.86,target:0,kind:'slider',baseX:3};interactions.items.push(slider);
assert.equal(interactions.canTravel(3.42,-8.5,3.42,-9.5),false);
slider.target=.86;for(let i=0;i<120;i++)interactions.update(1/60,new THREE.Vector3(3.42,1.65,-8));
assert.equal(interactions.canTravel(3.42,-8.5,3.42,-9.5),true);
slider.target=0;for(let i=0;i<120;i++)interactions.update(1/60,new THREE.Vector3(3.42,1.65,-8));
assert.equal(interactions.canTravel(3.42,-8.5,3.42,-9.5),false);
console.log('Terrace sliding door clearance and closed collision passed.');
''';p.write_text(s,encoding='utf-8')
