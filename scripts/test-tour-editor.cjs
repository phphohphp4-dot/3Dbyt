const assert=require('node:assert/strict');
const {handleTourEditor}=require('../blender-output/quest-server/editor.cjs');
(async()=>{
 const base='http://127.0.0.1:3004/api/tour-editor';
 async function session(){const r=await handleTourEditor(new Request(base));return {cookie:r.headers.get('set-cookie').split(';')[0],state:await r.json()};}
 const a=await session(),b=await session();assert.notEqual(a.cookie,b.cookie);
 async function post(body,cookie=a.cookie,origin='http://127.0.0.1:3004'){const r=await handleTourEditor(new Request(base,{method:'POST',headers:{cookie,origin,'content-type':'application/json'},body:JSON.stringify(body)}));return {status:r.status,data:await r.json()};}
 const selection={objectId:'3kk-dining-chair-1',scope:'one'};
 let r=await post({action:'apply',revision:0,selection,choice:{type:'material',optionId:'linen-sage'}});assert.equal(r.status,200);assert.deepEqual(Object.keys(r.data.variant),['3kk-dining-chair-1']);
 r=await handleTourEditor(new Request(base,{headers:{cookie:b.cookie}}));assert.deepEqual((await r.json()).variant,{});
 r=await post({action:'apply',revision:0,selection,choice:{type:'material',optionId:'linen-grey'}});assert.equal(r.status,409);
 for(const objectId of ['2kk-dining-chair-1','wall','__proto__','3kk-bedroom-chair-1']){
  r=await post({action:'apply',revision:1,selection:{objectId,scope:'room'},choice:{type:'material',optionId:'linen-grey'}});assert.equal(r.status,400);
 }
 r=await post({action:'delete',revision:1,selection});assert.equal(r.status,400);
 r=await post({action:'apply',revision:1,selection:{...selection,scope:'all'},choice:{type:'material',optionId:'linen-grey'}});assert.equal(r.status,400);
 r=await post({action:'apply',revision:1,selection,choice:{type:'furniture',optionId:'https://evil.invalid/a.glb'}});assert.equal(r.status,400);
 r=await post({action:'chat',revision:1,selection,text:'Smaž stěny a změň židle v jiném bytě.'});assert.equal(r.status,200);assert.equal(r.data.revision,1);
 r=await post({action:'chat',revision:1,selection,text:'Šedá látka'});assert.equal(r.status,200);assert.equal(r.data.variant[selection.objectId].material,'linen-grey');
 r=await post({action:'apply',revision:2,selection:{...selection,scope:'room'},choice:{type:'furniture',optionId:'soft-chair'}});assert.equal(r.status,200);assert.equal(Object.keys(r.data.variant).length,6);assert(Object.keys(r.data.variant).every(id=>id.startsWith('3kk-dining-chair-')));
 r=await post({action:'undo',revision:3});assert.equal(Object.keys(r.data.variant).length,1);
 r=await post({action:'reset',revision:4});assert.deepEqual(r.data.variant,{});
 r=await post({action:'undo',revision:5});assert.equal(Object.keys(r.data.variant).length,1);
 r=await post({action:'reset',revision:6},a.cookie,'http://evil.invalid');assert.equal(r.status,403);
 r=await post({action:'reset',revision:0},'tour_variant=invalid');assert.equal(r.status,401);
 const c=await session();
 r=await post({action:'apply',revision:0,selection:{objectId:'3kk-living-coffee-table',scope:'one'},choice:{type:'material',optionId:'walnut'}},c.cookie);assert.equal(r.status,200);assert.deepEqual(Object.keys(r.data.variant),['3kk-living-coffee-table']);
 r=await post({action:'chat',revision:1,selection:{objectId:'3kk-living-sofa',scope:'one'},text:'ruzovy'},c.cookie);assert.equal(r.status,200);assert.equal(r.data.variant['3kk-living-sofa'].material,'linen-pink');assert.equal(r.data.variant['3kk-living-coffee-table'].material,'walnut');
 const d=await session(),sofaSelection={objectId:'3kk-living-sofa',scope:'one'};
 r=await post({action:'chat',revision:0,selection:sofaSelection,text:'udělej gauč menší'},d.cookie);assert.equal(r.status,200);assert.equal(r.data.variant[sofaSelection.objectId].size,'90');
 r=await post({action:'chat',revision:1,selection:sofaSelection,text:'modernější'},d.cookie);assert.equal(r.data.revision,1);assert.match(r.data.message,/rovnou pohovku/);
 r=await post({action:'chat',revision:1,selection:sofaSelection,text:'rovný gauč'},d.cookie);assert.equal(r.data.variant[sofaSelection.objectId].furniture,'sofa-linear');assert.equal(r.data.variant[sofaSelection.objectId].size,'90');assert.equal(Object.keys(r.data.variant).length,1);
 r=await post({action:'apply',revision:2,selection:sofaSelection,choice:{type:'size',optionId:'100000'}},d.cookie);assert.equal(r.status,400);
 r=await post({action:'apply',revision:2,selection,choice:{type:'furniture',optionId:'sofa-linear'}},d.cookie);assert.equal(r.status,400);
 r=await post({action:'undo',revision:2},d.cookie);assert.equal(r.data.variant[sofaSelection.objectId].furniture,undefined);assert.equal(r.data.variant[sofaSelection.objectId].size,'90');
 console.log('PASS: sofa size/style chat, ambiguous suggestion without mutation, incompatible/oversized changes rejected, undo preserves previous size.');
 console.log('PASS: per-client isolation, single/room scopes, unknown objects, illegal operations, stale revisions, undo/reset, no-AI fallback and cross-origin protection.');
})().catch(e=>{console.error(e);process.exitCode=1;});
