const fs=require('node:fs');const p='public/mikulovice/mikulovice-quest.glb',b=fs.readFileSync(p),n=b.readUInt32LE(12),g=JSON.parse(b.subarray(20,20+n));
const nav=JSON.parse(fs.readFileSync('public/mikulovice/navigation.json'));
const report=JSON.parse(fs.readFileSync('public/mikulovice/build-report.json'));
report.triangles=g.meshes.reduce((sum,m)=>sum+m.primitives.reduce((a,p)=>a+g.accessors[p.indices].count/3,0),0);report.navigableCells=nav.cells.filter(Boolean).length;report.bytes=b.length;report.materials=g.materials.length;report.primitives=g.meshes.reduce((a,m)=>a+m.primitives.length,0);report.unlitMaterials=g.materials.filter(m=>m.extensions?.KHR_materials_unlit).length;report.textureImages=g.images.length;
if(report.unlitMaterials!==report.atlases)throw Error('Baked unlit materials missing');
if(g.images.some(i=>i.uri))throw Error('Textures must be embedded');
if(g.meshes.some(m=>m.name==='Cube'))throw Error('Unrelated default scene exported');
fs.writeFileSync('public/mikulovice/build-report.json',JSON.stringify(report,null,2));console.log(report);
