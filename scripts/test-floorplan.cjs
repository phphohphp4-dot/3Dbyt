const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
function load(file){const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const m={exports:{}};new Function('require','module','exports',source)(name=>name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts')):require(name),m,m.exports);return m.exports;}
const f=load('lib/floorplan.ts'),s=load('lib/floorplan-scene.ts');
const width=600,height=400,data=new Uint8ClampedArray(width*height*4).fill(255);
function rect(x,y,w,h){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++){const p=(j*width+i)*4;data[p]=data[p+1]=data[p+2]=20;}}
rect(50,40,500,8);rect(50,352,500,8);rect(50,40,8,320);rect(542,40,8,320);rect(295,40,8,320);
const walls=f.detectPlanWalls(data,width,height);assert.equal(walls.length,5,'Trace four perimeter walls plus one partition, not duplicate edge lines');
const p={version:1,name:'Test',image:'data:image/png;base64,AAAA',pixelWidth:width,pixelHeight:height,walls,openings:[],width:10,height:2.7,thickness:.18,wallColor:'#f1eee7',floorColor:'#c6a784',updated:new Date().toISOString()};
f.validateFloorProject(p);const partition=walls.find(w=>w.a.x>290&&w.a.x<310&&w.a.y<50);assert(partition);
let scene=s.buildFloorScene(p);assert(scene.root.getObjectByName('Strop'));assert(scene.root.getObjectByName('Plocha_strecha'));assert.equal(scene.canStand(0,0),false,'Partition blocks walking');s.disposeFloorScene(scene.root);
p.openings=[{id:'door',wallId:partition.id,t:.5,width:.9}];const intervals=f.solidIntervals(p,partition);assert.equal(intervals.length,2);scene=s.buildFloorScene(p);assert.equal(scene.canStand(0,0),true,'Door is actually traversable');assert.equal(scene.canStand(0,1.5),false,'Remaining partition still blocks');assert.equal(scene.canStand(20,20),false,'Cannot leave model bounds');assert(scene.canWalk);s.disposeFloorScene(scene.root);
const doubled={...p,width:20};assert.equal(f.planScale(doubled),2*f.planScale(p));
for(const patch of[{width:NaN},{height:100},{walls:[]},{image:'https://example.com/private.png'},{wallColor:'url(x)'},{openings:[{id:'x',wallId:'missing',t:.5,width:.9}]},{walls:[...walls,walls[0]]}])assert.throws(()=>f.validateFloorProject({...p,...patch}));
const blank=new Uint8ClampedArray(width*height*4).fill(255);assert.equal(f.detectPlanWalls(blank,width,height).length,0);assert.equal(f.detectPlanWalls(new Uint8ClampedArray(width*height*4),width,height).length,0,'Transparent pixels are white');
console.log('PASS: raster wall detection, no duplicate walls, real 3D geometry, scale, door collision, bounds, malformed project rejection.');
// Coloured hatching over pale masonry, plus thin blue dimensions, must not become walls.
const hatched=new Uint8ClampedArray(data);
for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;let base=data[i]===20?212:255;hatched[i]=hatched[i+1]=hatched[i+2]=base;if((x+y)%9<2){hatched[i]=Math.round(base*.45+245*.55);hatched[i+1]=Math.round(base*.45+90*.55);hatched[i+2]=hatched[i+1];}if(y===95){hatched[i]=65;hatched[i+1]=115;hatched[i+2]=145;}}
const annotated=f.detectPlanWalls(hatched,width,height);assert.equal(annotated.length,5,'Grey masonry under red hatching is recognized without blue dimension lines');
const realFile='blender-output/user-plan.rgba';if(fs.existsSync(realFile)){const actual=f.detectPlanWalls(new Uint8ClampedArray(fs.readFileSync(realFile)),800,685);const at=(x,y)=>actual.some(w=>f.distanceToWall({x,y},w).distance<12);assert(at(464,430),'Long bedroom partition');assert(at(255,220),'Kitchen/hall partition');assert(at(175,450),'Bathroom wall');assert(at(630,366),'Bedroom/wardrobe partition');assert(!at(365,400),'Red hatching in empty room is not a wall');console.log('PASS: actual annotated plan main partitions and grey/red regression.');}
const jbase={...p,width:10,pixelWidth:600,pixelHeight:400,openings:[],walls:[{id:'bottom',a:{x:50,y:350},b:{x:550,y:350}},{id:'top',a:{x:50,y:50},b:{x:550,y:50}},{id:'left',a:{x:50,y:50},b:{x:50,y:350}},{id:'right',a:{x:550,y:50},b:{x:550,y:350}},{id:'partition',a:{x:300,y:57},b:{x:300,y:343}}]};
const joined=f.joinWallJunctions(jbase);assert.equal(joined.walls[4].a.y,50,'T junction meets upper wall');assert.equal(joined.walls[4].b.y,350,'T junction meets lower wall');assert.equal(jbase.walls[4].a.y,57,'Joining does not mutate original project');assert.deepEqual(f.joinWallJunctions(joined),joined,'Joining is idempotent');
const corner={...jbase,walls:[...jbase.walls.slice(0,4),{id:'h',a:{x:150,y:150},b:{x:243,y:150}},{id:'v',a:{x:250,y:157},b:{x:250,y:280}}]};const cj=f.joinWallJunctions(corner);assert.deepEqual(cj.walls[4].b,{x:250,y:150});assert.deepEqual(cj.walls[5].a,{x:250,y:150});
const doorGap={...jbase,walls:[...jbase.walls.slice(0,4),{id:'h1',a:{x:80,y:200},b:{x:260,y:200}},{id:'h2',a:{x:305,y:200},b:{x:520,y:200}}]};const dj=f.joinWallJunctions(doorGap);assert.equal(dj.walls[5].a.x-dj.walls[4].b.x,45,'90 cm raster door remains open');
const tiny={...jbase,walls:[...jbase.walls.slice(0,4),{id:'h1',a:{x:80,y:200},b:{x:260,y:200}},{id:'h2',a:{x:267,y:200},b:{x:520,y:200}}]};const tj=f.joinWallJunctions(tiny);assert.equal(tj.walls[4].b.x,tj.walls[5].a.x,'Short collinear gap closes');
const explicit={...jbase,openings:[{id:'d',wallId:'partition',t:.5,width:.9}]};const ej=f.joinWallJunctions(explicit);const built=s.buildFloorScene(ej);assert(built.canStand(0,0),'Explicit door remains walkable after joins');s.disposeFloorScene(built.root);
const roomProject={...joined,rooms:[{id:'r',name:'Ložnice',type:'bedroom',position:{x:200,y:200}}]};assert.deepEqual(f.validateFloorProject(JSON.parse(JSON.stringify(roomProject))).rooms,roomProject.rooms);for(const badRoom of [{...roomProject.rooms[0],type:'invalid'},{...roomProject.rooms[0],position:{x:-2,y:0}},{...roomProject.rooms[0],name:''}])assert.throws(()=>f.validateFloorProject({...joined,rooms:[badRoom]}));
console.log('PASS: T/L joints, collinear cracks, unchanged door gaps, door collision, nonmutation, idempotence, room roundtrip and validation.');

const windowProject={...p,openings:[{id:'window',wallId:partition.id,t:.5,width:1.2,kind:'window',height:1.3,sill:.9}]};
f.validateFloorProject(windowProject);scene=s.buildFloorScene(windowProject);assert(!scene.canStand(0,0),'Window blocks walking even though glass is transparent');assert(scene.root.getObjectByName('Sklo'));assert(scene.root.getObjectByName('Parapet'));s.disposeFloorScene(scene.root);
const closed={...p,openings:[{...p.openings[0],open:false}]};scene=s.buildFloorScene(closed);assert(!scene.canStand(0,0),'Closed leaf blocks walking');assert(scene.toggleDoor(scene.root.getObjectByName('Dverni_kridlo')));assert(scene.canStand(0,0),'Clicking leaf opens the passage');s.disposeFloorScene(scene.root);
const placed=f.placeOpening(doorGap,{x:282,y:200},'door','new');assert.equal(placed.walls.length,doorGap.walls.length+1);assert.equal(placed.openings.length,1);assert(Math.abs(placed.openings[0].width-.9)<.001);assert.throws(()=>f.placeOpening(placed,{x:282,y:200},'window','duplicate'));assert.equal(f.openingGaps(placed).length,0,'Bridge is not proposed again');
assert.throws(()=>f.editOpening(windowProject,'window',{height:2.5,sill:.9}));assert.throws(()=>f.editOpening(windowProject,'window',{width:7}));
const tall=f.editOpening(windowProject,'window',{height:2.2,sill:0});assert.equal(tall.openings[0].sill,0);assert.deepEqual(f.validateFloorProject(JSON.parse(JSON.stringify(tall))).openings,tall.openings);
const child={...roomProject,rooms:[{...roomProject.rooms[0],type:'children',name:'Dětský pokoj'}]};assert.equal(f.validateFloorProject(child).rooms[0].type,'children');
scene=s.buildFloorScene({...p,roof:'gable',roofRise:1.8});assert(scene.root.getObjectByName('Sedlova_strecha'));assert(scene.root.getObjectByName('Strop'));s.disposeFloorScene(scene.root);
console.log('PASS: window glass/frame/collision, door leaf open/close collision, gap placement, duplicate prevention, dimensions, tall window persistence, roof and children room.');

const edit=load('lib/floorplan-editing.ts');
const original=JSON.stringify(placed),run=edit.openingRun(placed,'new');
assert.equal(run.walls.length,5,'Opening host joins both touching collinear wall pieces');
assert.equal(JSON.stringify(placed),original,'Editing normalization never mutates original');
assert.deepEqual(edit.openingRun(run,'new'),run,'Run normalization is idempotent');
const rw=run.walls.find(w=>w.id===run.openings[0].wallId);
assert.deepEqual(f.wallPoint(rw,run.openings[0].t),{x:282.5,y:200},'Opening retains world position');
const wide=edit.adjustOpening(placed,'new',{width:1.2});assert.equal(wide.openings[0].width,1.2,'Width can exceed the original detected gap');
const moved=edit.dragOpening(placed,'new',{x:400,y:203},'move');
const mw=moved.walls.find(w=>w.id===moved.openings[0].wallId);
assert(Math.abs(f.wallPoint(mw,moved.openings[0].t).x-400)<.001,'Drag crosses old wall seam');
const resized=edit.dragOpening(moved,'new',{x:440,y:200},'end');
assert(Math.abs(resized.openings[0].width-1.25)<.001,'End handle resizes without moving opposite edge');
assert(Math.abs(resized.openings[0].t*f.wallLength(mw)*f.planScale(resized)-resized.openings[0].width/2-(moved.openings[0].t*f.wallLength(mw)*f.planScale(moved)-.45))<.001);
const clamped=edit.dragOpening(moved,'new',{x:999,y:200},'move');
assert(Math.abs(clamped.openings[0].t*f.wallLength(mw)*f.planScale(clamped)+.45-f.wallLength(mw)*f.planScale(clamped))<.001,'Drag stays inside host');
const occupied={...moved,openings:[...moved.openings,{id:'other',wallId:mw.id,t:.2,width:.9}]};
assert.throws(()=>edit.adjustOpening(occupied,'new',{t:.2}),'Overlapping openings rejected');
const relocated=edit.relocateOpening(moved,'new',{x:200,y:50},'top');
assert.equal(relocated.openings[0].wallId,'top');assert.equal(relocated.openings[0].width,.9);assert.equal(relocated.openings[0].kind,'door');
assert.deepEqual(f.wallPoint(relocated.walls.find(w=>w.id==='top'),relocated.openings[0].t),{x:200,y:50});
assert.deepEqual(edit.snapWallPoint(jbase,{x:54,y:155}).point,{x:50,y:155},'Start snaps to existing wall');
assert.deepEqual(edit.snapWallPoint(jbase,{x:296,y:199},{x:150,y:200}).point,{x:300,y:200},'T junction snaps exactly to wall centerline');
assert.equal(edit.snapWallPoint(jbase,{x:280,y:199},{x:150,y:200}).snapped,false,'Far walls do not pull cursor');
assert.equal(edit.snapWallPoint(explicit,{x:296,y:200},{x:150,y:200}).snapped,false,'Snap does not anchor inside a doorway');
console.log('PASS: opening run, seam-crossing drag, resize anchored edge, clamp, overlap rejection, relocation, exact T snap and doorway exclusion.');
