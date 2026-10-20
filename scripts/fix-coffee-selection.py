from pathlib import Path
p=Path('lib/tour-customizer.ts');s=p.read_text(encoding='utf-8-sig')
s=s.replace("   if(mesh.name.startsWith('VR_living_floor'))", """   if(mesh.name.startsWith('VR_living_details'))this.split(mesh,points=>{
    // Extract only this table's top and sled base. Books and the cup stay independent.
    const within=points.every(p=>p.x>=2.509&&p.x<=3.371&&p.z>=-7.881&&p.z<=-6.579&&p.y>=.046&&p.y<=.468);
    if(!within)return null;
    return {id:'3kk-living-coffee-table',cloth:points.every(p=>p.y>=.391)};
   });
   if(mesh.name.startsWith('VR_living_floor'))""")
s=s.replace('=>{id:string;cloth:boolean})','=>{id:string;cloth:boolean}|null)')
s=s.replace('  const count=index?.count??position.count;', '  const keep:number[]=[];\n  const count=index?.count??position.count;')
s=s.replace("   const key=part.id+':'+part.cloth;", "   if(!part){keep.push(...ids);continue;}\n   const key=part.id+':'+part.cloth;")
s=s.replace('object.name=mesh.name;', "object.name=keep.length?'Editable_'+part.id:mesh.name;")
s=s.replace('  mesh.removeFromParent();g.dispose();', '  if(keep.length){g.setIndex(keep);g.computeBoundingSphere();}else{mesh.removeFromParent();g.dispose();}')
p.write_text(s,encoding='utf-8')
p=Path('lib/tour-catalog.ts');s=p.read_text(encoding='utf-8-sig')
s=s.replace(" {id:'3kk-living-floor'", " {id:'3kk-living-coffee-table',label:'Konferenční stolek',room:ROOM,kind:'coffee-table'},\n {id:'3kk-living-floor'")
s=s.replace("kinds:['chair','sofa','rug','floor']", "kinds:['chair','sofa','rug','floor','coffee-table']")
s=s.replace("kinds:['floor']", "kinds:['floor','coffee-table']")
s=s.replace(" {id:'linen-charcoal'", " {id:'linen-pink',label:'Pudrově růžová látka',kinds:['chair','sofa','rug'],color:'#d9a4b2'},\n {id:'linen-charcoal'")
s=s.replace(" const query=normalize(text);", """ const query=normalize(text);
 const colorQuery=query.replace(/^(?:prosim )?(?:zmen(?:it)?(?: barvu)? na |dej(?: to| ho| ji)? |obarvi na |chci )/,'');
 const aliases:[RegExp,string][]=[[/^ruzov(?:y|a|e|ou)$/, 'linen-pink'],[/^sed(?:y|a|e|ou)$/, 'linen-grey'],[/^(?:salvejov|zelen)(?:y|a|e|ou)$/, 'linen-sage'],[/^(?:piskov|bezov)(?:y|a|e|ou)$/, 'linen-sand'],[/^(?:antracitov|cern)(?:y|a|e|ou)$/, 'linen-charcoal'],[/^(?:tmavy )?orech$/, 'walnut'],[/^(?:prirodni )?dub$/, 'oak']];
 const alias=aliases.find(([pattern])=>pattern.test(colorQuery));
 if(alias){const choice:Choice={type:'material',optionId:alias[1]};validateChoice(selection,choice);return choice;}
""")
p.write_text(s,encoding='utf-8')
p=Path('components/3d/TourEditor.tsx');s=p.read_text(encoding='utf-8-sig').replace('židli, pohovku, koberec nebo podlahu','židli, pohovku, konferenční stolek, koberec nebo podlahu');s=s.replace('Například: Šalvějová látka','Například: růžový nebo tmavý ořech');s=s.replace('>Materiál</legend>', ">{object.kind==='coffee-table'?'Povrch desky':'Materiál'}</legend>");p.write_text(s,encoding='utf-8')
p=Path('lib/tour-editor-server.ts');s=p.read_text(encoding='utf-8-sig').replace('napište přesný název, například „Šalvějová látka“','napište barvu, například „růžový“, nebo název materiálu „tmavý ořech“');p.write_text(s,encoding='utf-8')
p=Path('scripts/test-tour-geometry.cjs');s=p.read_text(encoding='utf-8-sig').replace('(chairs|floor|sofa)','(chairs|floor|sofa|details)').replace('pieces.size,9','pieces.size,10').replace('9 isolated objects','10 isolated objects');s += '''
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
''';p.write_text(s,encoding='utf-8')
