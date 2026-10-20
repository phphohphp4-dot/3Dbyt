from pathlib import Path
p=Path('lib/tour-customizer.ts');s=p.read_text(encoding='utf-8').replace('this.sofaObstacle=new THREE.Box3().setFromObject(piece.replacement||piece.original);','this.sofaObstacle=factor>1?new THREE.Box3().setFromObject(piece.replacement||piece.original):undefined;');p.write_text(s,encoding='utf-8')
p=Path('scripts/test-tour-geometry.cjs');s=p.read_text(encoding='utf-8');s+='''
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
''';p.write_text(s,encoding='utf-8')
p=Path('scripts/test-tour-editor.cjs');s=p.read_text(encoding='utf-8');marker=" console.log('PASS: per-client"
i=s.index(marker);s=s[:i]+''' const d=await session(),sofaSelection={objectId:'3kk-living-sofa',scope:'one'};
 r=await post({action:'chat',revision:0,selection:sofaSelection,text:'udělej gauč menší'},d.cookie);assert.equal(r.status,200);assert.equal(r.data.variant[sofaSelection.objectId].size,'90');
 r=await post({action:'chat',revision:1,selection:sofaSelection,text:'modernější'},d.cookie);assert.equal(r.data.revision,1);assert.match(r.data.message,/rovnou pohovku/);
 r=await post({action:'chat',revision:1,selection:sofaSelection,text:'rovný gauč'},d.cookie);assert.equal(r.data.variant[sofaSelection.objectId].furniture,'sofa-linear');assert.equal(r.data.variant[sofaSelection.objectId].size,'90');assert.equal(Object.keys(r.data.variant).length,1);
 r=await post({action:'apply',revision:2,selection:sofaSelection,choice:{type:'size',optionId:'100000'}},d.cookie);assert.equal(r.status,400);
 r=await post({action:'apply',revision:2,selection,choice:{type:'furniture',optionId:'sofa-linear'}},d.cookie);assert.equal(r.status,400);
 r=await post({action:'undo',revision:2},d.cookie);assert.equal(r.data.variant[sofaSelection.objectId].furniture,undefined);assert.equal(r.data.variant[sofaSelection.objectId].size,'90');
 console.log('PASS: sofa size/style chat, ambiguous suggestion without mutation, incompatible/oversized changes rejected, undo preserves previous size.');
'''+s[i:];p.write_text(s,encoding='utf-8')
