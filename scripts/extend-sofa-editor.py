from pathlib import Path
p=Path('lib/tour-catalog.ts');s=p.read_text(encoding='utf-8')
s=s.replace("{id:'original',label:'Původní židle',kinds:['chair']}","{id:'original',label:'Původní nábytek',kinds:['chair','sofa']}")
s=s.replace("export type Selection", """export const SIZES = [70,80,90,100,110].map(n=>({id:String(n),label:`Šířka ${n} %`,kinds:['sofa']}));
export const normalizeCommand=(s:string)=>s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().trim().replace(/[.!]$/,'');
export function sofaSuggestion(text:string,selection:Selection){
 const q=normalizeCommand(text);
 return targets(selection)[0].kind==='sofa'&&/^(?:(?:udelej|chci|dej|vymen)(?: mi)? )?(?:(?:ten |tu )?(?:gauc|pohovku|ho|ji) )?(?:modernejsi|jiny|jinou)(?: (?:gauc|pohovku))?$/.test(q);
}
export type Selection""")
s=s.replace(" {id:'soft-chair'", " {id:'sofa-linear',label:'Moderní rovná pohovka',kinds:['sofa']},\n {id:'sofa-modular',label:'Oblá modulová pohovka',kinds:['sofa']},\n {id:'soft-chair'")
s=s.replace("type:'material'|'furniture'", "type:'material'|'furniture'|'size'").replace("furniture?:string}","furniture?:string;size?:string}")
s=s.replace("['material','furniture'].includes(choice.type)","['material','furniture','size'].includes(choice.type)")
s=s.replace("Povolena je pouze změna materiálu nebo výměna nábytku.","Povolena je změna materiálu, rozměrů nebo výměna nábytku.")
s=s.replace("choice.type==='material'?MATERIALS:FURNITURE", "choice.type==='material'?MATERIALS:choice.type==='size'?SIZES:FURNITURE")
s=s.replace("type!=='material'&&type!=='furniture'", "type!=='material'&&type!=='furniture'&&type!=='size'")
s=s.replace("selection:Selection):Choice|null", "selection:Selection,current:Variant={}):Choice|null")
start=s.index(' // Exact catalog commands only.')
end=s.index(' const colorQuery=',start)
s=s[:start]+""" // Parse whole commands only; never infer another target or room from text.
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
"""+s[end:]
s=s.replace("['material','furniture'] as const", "['material','furniture','size'] as const").replace("type==='material'?MATERIALS:FURNITURE", "type==='material'?MATERIALS:type==='size'?SIZES:FURNITURE")
p.write_text(s,encoding='utf-8')
p=Path('lib/tour-editor-server.ts');s=p.read_text(encoding='utf-8').replace('selectionLabel,MATERIALS,FURNITURE','selectionLabel,sofaSuggestion,MATERIALS,FURNITURE,SIZES')
s=s.replace('catalogCommand(body.text,selection)', 'catalogCommand(body.text,selection,session.variant)')
s=s.replace("    if(!choice){", """    if(!choice&&sofaSuggestion(body.text,selection))return reply({...snapshot(),message:'Mohu nabídnout moderní rovnou pohovku s úzkými područkami, nebo oblou modulovou pohovku s lenoškou. Níže vyberte tvar, případně napište „rovný gauč“ nebo „modulový gauč“. Zatím jsem nic nezměnil.'},200,cookie);
    if(!choice){""")
s=s.replace('Vyberte variantu níže nebo napište barvu, například „růžový“, nebo název materiálu „tmavý ořech“.','Fungují například „zmenši gauč“, „větší“, „rovný gauč“, „modulový gauč“ a barvy. Vyberte nejprve odpovídající kus. Další varianty jsou níže.')
s=s.replace("enum:['material','furniture','clarify']", "enum:['material','furniture','size','clarify']")
s=s.replace('Dostupný nábytek:', 'Aktuální úprava: ${JSON.stringify(session.variant[selection.objectId]||{})}. Rozměry: ${JSON.stringify(SIZES.filter(x=>x.kinds.includes(object.kind)))}. size je absolutní šířka vůči původnímu modelu; menší/větší je krok 10 procentních bodů proti aktuální šířce, nejvýše v nabízeném rozsahu. Dostupný nábytek:')
p.write_text(s,encoding='utf-8')
p=Path('components/3d/TourEditor.tsx');s=p.read_text(encoding='utf-8').replace('MATERIALS,FURNITURE,','MATERIALS,FURNITURE,SIZES,')
s=s.replace('Například: růžový nebo tmavý ořech','Například: zmenši gauč, modernější, růžový')
s=s.replace("object.kind==='chair'&&<><p", "['chair','sofa'].includes(object.kind)&&<><p").replace('>Vyměnit židli</p>', '>Vyměnit nábytek</p>').replace('FURNITURE.map(f=>', 'FURNITURE.filter(f=>f.kinds.includes(object.kind)).map(f=>')
s=s.replace('</div></>}</fieldset>', """</div></>}{object.kind==='sofa'&&<><p style={{fontSize:14,margin:'14px 0 8px'}}>Šířka pohovky · {snapshot?.variant[object.id]?.size||100} %</p><p style={{fontSize:12,color:'#94a3b8'}}>Mění se šířka podél stěny. Výška sedáku a hloubka zůstávají stejné.</p><div style={{display:'flex',flexWrap:'wrap',gap:6}}>{SIZES.map(s=><button key={s.id} style={buttonStyle} aria-pressed={(snapshot?.variant[object.id]?.size||'100')===s.id} onClick={()=>void send('apply',{type:'size',optionId:s.id})}>{s.label}</button>)}</div></>}</fieldset>""")
p.write_text(s,encoding='utf-8')
