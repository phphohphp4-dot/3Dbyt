// Convert baked emission materials into glTF's standard unlit materials.
const fs=require('node:fs'),p=process.argv[2]||'public/mikulovice/mikulovice-quest.glb',b=fs.readFileSync(p);
const oldLength=b.readUInt32LE(12),g=JSON.parse(b.subarray(20,20+oldLength));
for(const m of g.materials){if(!m.name.startsWith('Baked_')||!m.emissiveTexture)continue;
 m.pbrMetallicRoughness={baseColorTexture:m.emissiveTexture,baseColorFactor:[1,1,1,1],metallicFactor:0,roughnessFactor:1};
 m.extensions={KHR_materials_unlit:{}};m.doubleSided=m.name.includes("exterior_shell")||m.name.includes("exterior_foliage");delete m.emissiveFactor;delete m.emissiveTexture;
}
g.extensionsUsed=[...new Set([...(g.extensionsUsed||[]),'KHR_materials_unlit'])];
const j=Buffer.from(JSON.stringify(g)),padded=Buffer.alloc(Math.ceil(j.length/4)*4,32);j.copy(padded);
const rest=b.subarray(20+oldLength),header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(20+padded.length+rest.length,8);header.writeUInt32LE(padded.length,12);header.writeUInt32LE(0x4e4f534a,16);
fs.writeFileSync(p,Buffer.concat([header,padded,rest]));console.log('Unlit atlas materials ready.');
