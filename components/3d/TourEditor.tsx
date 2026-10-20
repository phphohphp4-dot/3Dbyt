'use client';
import {useEffect,useState} from 'react';
import {OBJECTS,MATERIALS,FURNITURE,SIZES,selectionLabel,targets,type Selection,type Variant,type Choice} from '@/lib/tour-catalog';

type Snapshot={variant:Variant;revision:number;canUndo:boolean;ai:boolean};
type Props={selection:Selection|null;onSelect:(s:Selection|null)=>void;onApply:(v:Variant)=>void;onClose:()=>void;onBusy:(v:boolean)=>void};
export function TourEditor({selection,onSelect,onApply,onClose,onBusy}:Props){
 const [snapshot,setSnapshot]=useState<Snapshot|null>(null),[busy,setBusy]=useState(false),[text,setText]=useState('');
 const [messages,setMessages]=useState<string[]>(['Klikněte na židli, pohovku, konferenční stolek, koberec nebo podlahu v obývacím pokoji 3+kk. Můžete také vybrat kus ze seznamu.']);
 const [error,setError]=useState('');
 useEffect(()=>{const abort=new AbortController();fetch('/api/tour-editor',{signal:abort.signal,cache:'no-store'}).then(async r=>{if(!r.ok)throw new Error();const s=await r.json();onApply(s.variant);setSnapshot(s);}).catch(()=>{if(!abort.signal.aborted)setError('Server editoru není dostupný. Otevřete prohlídku přes server s editorem.');});return()=>abort.abort();},[onApply]);
 const object=OBJECTS.find(o=>o.id===selection?.objectId);
 async function send(action:string,choice?:Choice){
  if(!snapshot||busy)return;
  const frozenSelection=selection?{...selection}:null,requestText=text.trim();
  if(action==='chat'&&!requestText)return;
  setBusy(true);onBusy(true);setError('');
  try{
   const response=await fetch('/api/tour-editor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,revision:snapshot.revision,selection:frozenSelection,choice,text:requestText}),signal:AbortSignal.timeout(30000)});
   const data=await response.json();
   if(!response.ok){if(data.variant){onApply(data.variant);setSnapshot(data);}throw new Error(data.error||'Úpravu se nepodařilo provést.');}
   onApply(data.variant);setSnapshot(data);setMessages(m=>[...m,...(action==='chat'?[`Vy: ${requestText}`]:[]),data.message].slice(-8));if(action==='chat')setText('');
  }catch(e){setError(e instanceof Error?e.message:'Spojení se přerušilo. Otevřete editor znovu pro načtení stavu.');}finally{setBusy(false);onBusy(false);}
 }
 const buttonStyle={background:'#334155',border:'1px solid #64748b',borderRadius:8,padding:'9px 11px',color:'white',fontSize:13,cursor:'pointer'};
 return <aside className="tour-editor-panel" aria-label="Úpravy interiéru" style={{position:'absolute',top:12,right:12,bottom:12,width:'min(370px, calc(100% - 24px))',overflowY:'auto',borderRadius:18,background:'rgba(15,23,42,.97)',padding:18,color:'#f8fafc',boxShadow:'0 12px 40px #0005',zIndex:20}}>
  <style>{`@media(max-width:700px){.tour-editor-panel{top:auto!important;bottom:0!important;right:0!important;width:100%!important;max-height:52vh;box-sizing:border-box;border-radius:18px 18px 0 0!important}}.tour-editor-panel button:disabled{opacity:.45;cursor:default!important}`}</style>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h2 style={{fontSize:20,fontWeight:650}}>Váš návrh interiéru</h2><button disabled={busy} onClick={onClose} aria-label="Zavřít editor" style={buttonStyle}>×</button></div>
  <p style={{fontSize:12,color:'#94a3b8',margin:'8px 0 16px'}}>Soukromá zkušební varianta v tomto prohlížeči · nejvýše 24 hodin, do restartu serveru. Původní návrh se nepřepisuje.</p>
  <label style={{display:'block',fontSize:13}}>Vybraný kus<select aria-label="Vybraný kus nábytku" disabled={busy} value={selection?.objectId||''} onChange={e=>onSelect(e.target.value?{objectId:e.target.value,scope:'one'}:null)} style={{display:'block',width:'100%',background:'#1e293b',color:'white',padding:10,borderRadius:8,marginTop:6}}><option value="">Klikněte na nábytek nebo vyberte…</option>{OBJECTS.map(o=><option key={o.id} value={o.id}>{o.label} · 3+kk</option>)}</select></label>
  {selection&&<><p style={{fontSize:13,color:'#6ee7b7',padding:'12px 0'}}>{selectionLabel(selection)}</p><fieldset disabled={busy} style={{border:'1px solid #475569',borderRadius:8,padding:10,marginBottom:14}}><legend style={{fontSize:12,padding:'0 4px'}}>Rozsah změny</legend><label style={{display:'block',fontSize:13}}><input type="radio" name="edit-scope" checked={selection.scope==='one'} onChange={()=>onSelect({...selection,scope:'one'})}/> Pouze označený kus</label>{object?.kind==='chair'&&<label style={{display:'block',fontSize:13,marginTop:8}}><input type="radio" name="edit-scope" checked={selection.scope==='room'} onChange={()=>onSelect({...selection,scope:'room'})}/> Všech 6 židlí v této místnosti</label>}</fieldset></>}
  <p style={{fontSize:12,color:'#cbd5e1',marginBottom:10}}>{snapshot?.ai?'AI asistent · změny pouze v označeném rozsahu':'Katalogové příkazy · volný AI rozhovor není připojený'}</p>
  <div aria-live="polite" role="log" style={{background:'#020617',borderRadius:10,padding:12,fontSize:13,lineHeight:1.5,maxHeight:160,overflowY:'auto'}}>{messages.map((m,i)=><p key={i} style={{margin:'0 0 8px'}}>{m}</p>)}</div>
  <form onSubmit={e=>{e.preventDefault();void send('chat');}} style={{margin:'12px 0'}}><label htmlFor="editor-request" style={{fontSize:12}}>Požadavek na vybraný nábytek</label><textarea id="editor-request" value={text} onChange={e=>setText(e.target.value)} disabled={busy||!snapshot||!selection} maxLength={1200} placeholder="Například: zmenši gauč, modernější, růžový" style={{width:'100%',minHeight:65,boxSizing:'border-box',background:'#1e293b',border:'1px solid #475569',borderRadius:8,padding:10,color:'white',margin:'5px 0'}}/><button style={{...buttonStyle,background:'#047857',width:'100%'}} disabled={busy||!snapshot||!selection||!text.trim()}>{busy?'Zpracovávám…':'Provést v označeném rozsahu'}</button></form>
  {error&&<p role="alert" style={{color:'#fda4af',fontSize:13}}>{error}</p>}
  {object&&<fieldset disabled={busy||!snapshot} style={{border:0,padding:0}}><legend style={{fontSize:14,marginBottom:8}}>{object.kind==='coffee-table'?'Povrch desky':'Materiál'}</legend><div style={{display:'flex',flexWrap:'wrap',gap:6}}>{MATERIALS.filter(m=>m.kinds.includes(object.kind)).map(m=><button key={m.id} style={buttonStyle} onClick={()=>void send('apply',{type:'material',optionId:m.id})}><span style={{display:'inline-block',width:10,height:10,borderRadius:5,background:m.color,marginRight:6}}/>{m.label}</button>)}</div>{['chair','sofa'].includes(object.kind)&&<><p style={{fontSize:14,margin:'14px 0 8px'}}>Vyměnit nábytek</p><div style={{display:'flex',flexWrap:'wrap',gap:6}}>{FURNITURE.filter(f=>f.kinds.includes(object.kind)).map(f=><button key={f.id} style={buttonStyle} onClick={()=>void send('apply',{type:'furniture',optionId:f.id})}>{f.label}</button>)}</div></>}{object.kind==='sofa'&&<><p style={{fontSize:14,margin:'14px 0 8px'}}>Šířka pohovky · {snapshot?.variant[object.id]?.size||100} %</p><p style={{fontSize:12,color:'#94a3b8'}}>Mění se šířka podél stěny. Výška sedáku a hloubka zůstávají stejné.</p><div style={{display:'flex',flexWrap:'wrap',gap:6}}>{SIZES.map(s=><button key={s.id} style={buttonStyle} aria-pressed={(snapshot?.variant[object.id]?.size||'100')===s.id} onClick={()=>void send('apply',{type:'size',optionId:s.id})}>{s.label}</button>)}</div></>}</fieldset>}
  <div style={{display:'flex',gap:6,marginTop:18}}><button style={buttonStyle} disabled={busy||!snapshot?.canUndo} onClick={()=>void send('undo')}>Vrátit změnu</button><button style={buttonStyle} disabled={busy||!snapshot||!Object.keys(snapshot.variant).length} onClick={()=>void send('reset')}>Původní návrh</button></div>
  {selection&&<p style={{fontSize:12,color:'#94a3b8',marginTop:10}}>Změna zasáhne {targets(selection).length} {targets(selection).length===1?'kus':'kusů'}. Další místnosti zůstanou beze změny.</p>}
 </aside>;
}
