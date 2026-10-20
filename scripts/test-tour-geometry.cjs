const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const THREE=require('three'),{TourCustomizer}=require('../lib/tour-customizer.ts');
const data=fs.readFileSync('public/mikulovice/mikulovice-quest.glb');const jsonLength=data.readUInt32LE(12),gltf=JSON.parse(data.subarray(20,20+jsonLength));const bin=data.subarray(28+jsonLength);
function attribute(id){const a=gltf.accessors[id],v=gltf.bufferViews[a.bufferView],size={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];const C={5126:Float32Array,5125:Uint32Array,5123:Uint16Array,5121:Uint8Array}[a.componentType];const out=new C(a.count*size),stride=v.byteStride||size*C.BYTES_PER_ELEMENT;for(let i=0;i<a.count;i++)for(let k=0;k<size;k++){const start=(v.byteOffset||0)+(a.byteOffset||0)+i*stride+k*C.BYTES_PER_ELEMENT;out[i*size+k]=a.componentType===5126?bin.readFloatLE(start):bin.readUIntLE(start,C.BYTES_PER_ELEMENT);}return new THREE.BufferAttribute(out,size);}
const model=new THREE.Group();let shared;
for(const n of gltf.nodes){if(!/VR_living_(chairs|floor|sofa|details)/.test(n.name))continue;const p=gltf.meshes[n.mesh].primitives[0],geometry=new THREE.BufferGeometry();for(const [name,id] of Object.entries(p.attributes)){const key={POSITION:'position',NORMAL:'normal',TEXCOORD_0:'uv'}[name];if(key)geometry.setAttribute(key,attribute(id));}geometry.setIndex(attribute(p.indices));const mat=new THREE.MeshBasicMaterial({color:0xffffff});if(n.name==='VR_living_chairs')shared=mat;const mesh=new THREE.Mesh(geometry,mat);mesh.name=n.name;if(n.translation)mesh.position.fromArray(n.translation);if(n.rotation)mesh.quaternion.fromArray(n.rotation);if(n.scale)mesh.scale.fromArray(n.scale);model.add(mesh);}
const other=new THREE.Mesh(new THREE.BoxGeometry(.5,.8,.5),shared);other.name='Other room chair';other.position.set(16,.4,-5);model.add(other);
function count(){let n=0;model.traverse(o=>{if(o instanceof THREE.Mesh)n+=(o.geometry.index?.count||o.geometry.getAttribute('position').count)/3;});return n;}
const before=count(),customizer=new TourCustomizer(model);assert.equal(count(),before,'No triangles lost during extraction');assert.equal(customizer.pieces.size,10);
const p1=customizer.pieces.get('3kk-dining-chair-1'),p2=customizer.pieces.get('3kk-dining-chair-2');assert.notEqual(p1.cloth[0],p2.cloth[0]);
customizer.apply({'3kk-dining-chair-1':{material:'linen-sage'}});assert.notEqual(p1.cloth[0].color.getHex(),0xffffff);assert.equal(p2.cloth[0].color.getHex(),0xffffff);assert.equal(other.material.color.getHex(),0xffffff);
customizer.apply({'3kk-dining-chair-1':{furniture:'soft-chair',material:'linen-grey'}});assert.equal(p1.original.visible,false);assert(p1.replacement);assert.equal(p2.original.visible,true);
customizer.apply({});assert.equal(p1.original.visible,true);assert.equal(p1.replacement,undefined);assert.equal(p1.cloth[0].color.getHex(),0xffffff);assert.equal(count(),before);
for(const [id,p] of customizer.pieces){const box=new THREE.Box3().setFromObject(p.root);assert(!box.isEmpty());console.log(id,box.getSize(new THREE.Vector3()).toArray().map(x=>x.toFixed(2)).join(' x '));}
console.log('PASS: actual GLB triangle preservation, 10 isolated objects, shared-material isolation, replacement and full restoration.');

const table=customizer.pieces.get('3kk-living-coffee-table');assert(table);assert(table.cloth.length);
const rest=model.getObjectByName('VR_living_details');assert(rest,'Kitchen and table accessories remain in their source mesh');
const tableBounds=new THREE.Box3().setFromObject(table.root);assert(tableBounds.max.y<.469);assert(tableBounds.min.y>.046);
model.updateMatrixWorld(true);
const ray=new THREE.Raycaster(new THREE.Vector3(2.65,1.4,-7.0),new THREE.Vector3(0,-1,0));assert.equal(customizer.pick(ray),'3kk-living-coffee-table');
const baseMaterials=[];table.original.traverse(o=>{if(o instanceof THREE.Mesh&&!table.cloth.includes(o.material))baseMaterials.push(o.material);});
customizer.apply({'3kk-living-coffee-table':{material:'walnut'}});assert.notEqual(table.cloth[0].color.getHex(),0xffffff);assert.equal(rest.material.color.getHex(),0xffffff);assert(baseMaterials.every(m=>m.color.getHex()===0xffffff));assert.equal(p1.cloth[0].color.getHex(),0xffffff);
customizer.apply({});assert.equal(table.cloth[0].color.getHex(),0xffffff);
const {catalogCommand}=require('../lib/tour-catalog.ts');
for(const text of ['růžový','ruzovy','růžová','dej ho růžový'])assert.equal(catalogCommand(text,{objectId:'3kk-living-sofa',scope:'one'}).optionId,'linen-pink');
assert.equal(catalogCommand('obarvi všechny pokoje růžově',{objectId:'3kk-living-sofa',scope:'one'}),null);
console.log('PASS: coffee-table ray selection, top-only finish, unchanged base/accessories/kitchen/chairs, Czech color aliases and scope rejection.');

const sofa=customizer.pieces.get('3kk-living-sofa'),sofaOriginal=new THREE.Box3().setFromObject(sofa.original),sofaSize=sofaOriginal.getSize(new THREE.Vector3());
customizer.apply({'3kk-living-sofa':{size:'80',material:'linen-pink'}});
const smallerBounds=new THREE.Box3().setFromObject(sofa.original),smallerSize=smallerBounds.getSize(new THREE.Vector3());
assert(Math.abs(smallerSize.z-sofaSize.z*.8)<1e-5);assert(Math.abs(smallerSize.y-sofaSize.y)<1e-5);assert(Math.abs(smallerSize.x-sofaSize.x)<1e-5);
assert.equal(p1.cloth[0].color.getHex(),0xffffff);assert.equal(table.cloth[0].color.getHex(),0xffffff);
for(const furniture of ['sofa-linear','sofa-modular']){
 customizer.apply({'3kk-living-sofa':{furniture,size:'80',material:'linen-pink'}});
 assert.equal(sofa.original.visible,false);assert(sofa.replacement);assert(sofa.replacement.children.length>10);
 const box=new THREE.Box3().setFromObject(sofa.replacement);assert(box.min.x>=sofaOriginal.min.x-.001);assert(box.max.x<sofaOriginal.max.x);assert(box.min.y>0);
 const center=box.getCenter(new THREE.Vector3());assert.equal(customizer.pick(new THREE.Raycaster(new THREE.Vector3(center.x,2,center.z),new THREE.Vector3(0,-1,0))),'3kk-living-sofa');
}
customizer.apply({'3kk-living-sofa':{size:'110'}});const enlarged=new THREE.Box3().setFromObject(sofa.original);assert(enlarged.getSize(new THREE.Vector3()).z>sofaSize.z);assert.equal(customizer.canTravel(enlarged.min.x+.3,enlarged.min.z+.05,enlarged.min.x+.3,enlarged.min.z+.05),false);
customizer.apply({});assert.equal(sofa.replacement,undefined);assert.equal(sofa.original.visible,true);assert.equal(count(),before);assert(sofa.root.scale.equals(new THREE.Vector3(1,1,1)));assert(new THREE.Box3().setFromObject(sofa.original).equals(sofaOriginal));
const selectedSofa={objectId:'3kk-living-sofa',scope:'one'};
assert.equal(catalogCommand('udělej gauč menší',selectedSofa).optionId,'90');
assert.equal(catalogCommand('větší',selectedSofa,{'3kk-living-sofa':{size:'80'}}).optionId,'90');
assert.equal(catalogCommand('rovný gauč',selectedSofa).optionId,'sofa-linear');
assert.equal(catalogCommand('modulový gauč',selectedSofa).optionId,'sofa-modular');
assert.equal(catalogCommand('zmenši gauč v jiné místnosti',selectedSofa),null);
assert.throws(()=>catalogCommand('větší',selectedSofa,{'3kk-living-sofa':{size:'110'}}));
assert.throws(()=>catalogCommand('zmenši gauč',{objectId:'3kk-dining-chair-1',scope:'one'}));
console.log('PASS: real sofa resizing, unchanged seat height/depth, two replacement geometries, ray selection, size collision, restoration and command limits.');
