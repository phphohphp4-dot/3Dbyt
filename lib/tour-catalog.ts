export const ROOM = '3kk-living';
export const ROOM_LABEL = 'Byt 3+kk → obývací pokoj s jídelnou';
export const CHAIR_PLACES = [[1.25,-1.85,Math.PI/2],[1.25,-2.65,Math.PI/2],[2.79,-1.85,-Math.PI/2],[2.79,-2.65,-Math.PI/2],[2.02,-1.05,Math.PI],[2.02,-3.45,0]];
export const OBJECTS = [
 ...CHAIR_PLACES.map((_,i)=>({id:`3kk-dining-chair-${i+1}`,label:`Jídelní židle ${i+1}`,room:ROOM,kind:'chair'})),
 {id:'3kk-living-sofa',label:'Pohovka',room:ROOM,kind:'sofa'},
 {id:'3kk-living-rug',label:'Koberec',room:ROOM,kind:'rug'},
 {id:'3kk-living-coffee-table',label:'Konferenční stolek',room:ROOM,kind:'coffee-table'},
 {id:'3kk-living-floor',label:'Dřevěná podlaha',room:ROOM,kind:'floor'},
];
export const MATERIALS = [
 {id:'original',label:'Původní materiál',kinds:['chair','sofa','rug','floor','coffee-table'],color:'#ffffff'},
 {id:'linen-grey',label:'Šedá látka',kinds:['chair','sofa','rug'],color:'#889298'},
 {id:'linen-sand',label:'Písková látka',kinds:['chair','sofa','rug'],color:'#d6c5a6'},
 {id:'linen-sage',label:'Šalvějová látka',kinds:['chair','sofa','rug'],color:'#9cae94'},
 {id:'linen-pink',label:'Pudrově růžová látka',kinds:['chair','sofa','rug'],color:'#d9a4b2'},
 {id:'linen-charcoal',label:'Antracitová látka',kinds:['chair','sofa','rug'],color:'#515b63'},
 {id:'oak',label:'Přírodní dub',kinds:['floor','coffee-table'],color:'#ffffff'},
 {id:'walnut',label:'Tmavý ořech',kinds:['floor','coffee-table'],color:'#8a674a'},
];
export const FURNITURE = [
 {id:'original',label:'Původní nábytek',kinds:['chair','sofa']},
 {id:'sofa-linear',label:'Moderní rovná pohovka',kinds:['sofa']},
 {id:'sofa-modular',label:'Oblá modulová pohovka',kinds:['sofa']},
 {id:'soft-chair',label:'Čalouněná židle Soft',kinds:['chair']},
 {id:'oak-chair',label:'Dřevěná židle Oak',kinds:['chair']},
];
export const SIZES = [70,80,90,100,110].map(n=>({id:String(n),label:`Šířka ${n} %`,kinds:['sofa']}));
export const normalizeCommand=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[.!]$/,'');
export function sofaSuggestion(text:string,selection:Selection){
 const q=normalizeCommand(text);
 return targets(selection)[0].kind==='sofa'&&/^(?:(?:udelej|chci|dej|vymen)(?: mi)? )?(?:(?:ten |tu )?(?:gauc|pohovku|ho|ji) )?(?:modernejsi|jiny|jinou)(?: (?:gauc|pohovku))?$/.test(q);
}
export type Selection = {objectId:string;scope:'one'|'room'};
export type Choice = {type:'material'|'furniture'|'size';optionId:string};
export type Override = {material?:string;furniture?:string;size?:string};
export type Variant = Record<string,Override>;
export function targets(selection:Selection){
 if(!selection||!['one','room'].includes(selection.scope))throw new Error('Vyberte rozsah úpravy.');
 const object=OBJECTS.find(o=>o.id===selection.objectId);
 if(!object)throw new Error('Tento objekt není povolen k úpravám.');
 return selection.scope==='one'?[object]:OBJECTS.filter(o=>o.room===object.room&&o.kind===object.kind);
}
export function validateChoice(selection:Selection,choice:Choice){
 const objects=targets(selection);
 if(!choice||!['material','furniture','size'].includes(choice.type))throw new Error('Povolena je změna materiálu, rozměrů nebo výměna nábytku.');
 const options=choice.type==='material'?MATERIALS:choice.type==='size'?SIZES:FURNITURE;
 const option=options.find(o=>o.id===choice.optionId);
 if(!option||objects.some(o=>!option.kinds.includes(o.kind)))throw new Error('Tato varianta není pro vybraný nábytek povolena.');
 return {objects,option};
}
export function applyChoice(current:Variant,selection:Selection,choice:Choice):Variant{
 const {objects}=validateChoice(selection,choice);const next=structuredClone(current);
 for(const o of objects)next[o.id]={...next[o.id],[choice.type]:choice.optionId};
 return next;
}
export function validateVariant(value:unknown):Variant{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Neplatná varianta.');
 const result:Variant={};
 for(const [id,override] of Object.entries(value)){
  if(!override||typeof override!=='object'||Array.isArray(override))throw new Error('Neplatná úprava.');
  for(const [type,optionId] of Object.entries(override)){
   if(type!=='material'&&type!=='furniture'&&type!=='size')throw new Error('Neznámá úprava.');
   validateChoice({objectId:id,scope:'one'},{type,optionId:optionId as string});
  }
  result[id]={...override};
 }
 return result;
}
export function selectionLabel(s:Selection){const t=targets(s);return `${ROOM_LABEL} → ${t.length===1?t[0].label:`${t.length} židlí`}`;}
export function catalogCommand(text:string,selection:Selection,current:Variant={}):Choice|null{
 // Parse whole commands only; never infer another target or room from text.
 const normalize=normalizeCommand,query=normalize(text),kind=targets(selection)[0].kind;
 const smaller=/^(?:prosim )?(?:(?:udelej|dej|chci)(?: mi)? )?(?:(?:ten |tu )?(?:gauc|pohovku|ho|ji) )?mensi(?: (?:gauc|pohovku))?$/.test(query)||/^(?:prosim )?zmensi(?: (?:gauc|pohovku|ho|ji))?$/.test(query);
 const bigger=/^(?:prosim )?(?:(?:udelej|dej|chci)(?: mi)? )?(?:(?:ten |tu )?(?:gauc|pohovku|ho|ji) )?vetsi(?: (?:gauc|pohovku))?$/.test(query)||/^(?:prosim )?zvetsi(?: (?:gauc|pohovku|ho|ji))?$/.test(query);
 if(smaller||bigger){
  if(kind!=='sofa')throw new Error('Pro změnu rozměrů gauče nejprve označte pohovku.');
  const size=Number(current[selection.objectId]?.size||100)+(smaller?-10:10);
  if(size<70||size>110)throw new Error('Šířku lze upravit mezi 70 a 110 % původního modelu. Další změna se neprovedla.');
  return {type:'size',optionId:String(size)};
 }
 if(kind==='sofa'){
  if(/^(?:(?:dej|chci|vymen za) )?(?:moderni )?rovn(?:y gauc|ou pohovku)$/.test(query))return {type:'furniture',optionId:'sofa-linear'};
  if(/^(?:(?:dej|chci|vymen za) )?(?:oblou |obly )?modulov(?:y gauc|ou pohovku)$/.test(query))return {type:'furniture',optionId:'sofa-modular'};
 }
 const colorQuery=query.replace(/^(?:prosim )?(?:zmen(?:it)?(?: barvu)? na |dej(?: to| ho| ji)? |obarvi na |chci )/,'');
 const aliases:[RegExp,string][]=[[/^ruzov(?:y|a|e|ou)$/, 'linen-pink'],[/^sed(?:y|a|e|ou)$/, 'linen-grey'],[/^(?:salvejov|zelen)(?:y|a|e|ou)$/, 'linen-sage'],[/^(?:piskov|bezov)(?:y|a|e|ou)$/, 'linen-sand'],[/^(?:antracitov|cern)(?:y|a|e|ou)$/, 'linen-charcoal'],[/^(?:tmavy )?orech$/, 'walnut'],[/^(?:prirodni )?dub$/, 'oak']];
 const alias=aliases.find(([pattern])=>pattern.test(colorQuery));
 if(alias){const choice:Choice={type:'material',optionId:alias[1]};validateChoice(selection,choice);return choice;}

 for(const type of ['material','furniture','size'] as const)for(const option of type==='material'?MATERIALS:type==='size'?SIZES:FURNITURE){
  if([option.label,`použít ${option.label}`,`změnit na ${option.label}`].some(s=>normalize(s)===query)){
   const choice={type,optionId:option.id};validateChoice(selection,choice);return choice;
  }
 }
 return null;
}

