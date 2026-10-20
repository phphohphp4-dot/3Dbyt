'use client';
import {useEffect,useRef,useState} from 'react';
import type {PDFDocumentProxy} from 'pdfjs-dist';
import {projectFromImage} from './FloorPlanStudio';
import type {FloorProject} from '@/lib/floorplan';

/** PDF is decoded locally; only the page the person selects becomes a project. */
export function PdfPlanPicker({file,onUse,onCancel}:{file:File;onUse:(p:FloorProject)=>void;onCancel:()=>void}){
 const[doc,setDoc]=useState<PDFDocumentProxy|null>(null),[page,setPage]=useState(1),[ready,setReady]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const preview=useRef<HTMLDivElement>(null),rendered=useRef<HTMLCanvasElement|null>(null);
 useEffect(()=>{let alive=true;let task:ReturnType<typeof import('pdfjs-dist').getDocument>|undefined;
  void(async()=>{try{const pdf=await import('pdfjs-dist');if(!alive)return;pdf.GlobalWorkerOptions.workerSrc='/pdfjs/pdf.worker.min.js';task=pdf.getDocument({data:new Uint8Array(await file.arrayBuffer()),cMapUrl:'/pdfjs/cmaps/',cMapPacked:true,standardFontDataUrl:'/pdfjs/standard_fonts/',wasmUrl:'/pdfjs/wasm/'});const next=await task.promise;if(alive)setDoc(next);}catch(e){if(alive)setError((e as Error).name==='PasswordException'?'PDF je chráněné heslem. Nahrajte odemčenou kopii, ke které máte přístup.':'PDF se nepodařilo otevřít. Soubor může být poškozený nebo není PDF.');}})();
  return()=>{alive=false;void task?.destroy();};
 },[file]);
 useEffect(()=>{if(!doc)return;let alive=true;let task:ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']>|undefined;
  void(async()=>{try{const pdfPage=await doc.getPage(page);if(!alive)return;const base=pdfPage.getViewport({scale:1});const viewport=pdfPage.getViewport({scale:Math.min(2,1400/Math.max(base.width,base.height))});const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);task=pdfPage.render({canvas,viewport,background:'white'});await task.promise;if(!alive)return;preview.current?.replaceChildren(canvas);rendered.current=canvas;setReady(true);}catch(e){if(alive&&(e as Error).name!=='RenderingCancelledException')setError('Tuto stránku nelze vykreslit. Zkuste jinou stránku.');}})();
  return()=>{alive=false;task?.cancel();};
 },[doc,page]);
 const choose=(n:number)=>{setReady(false);setError('');rendered.current=null;setPage(n);};
 const usePage=async()=>{if(!ready||!rendered.current)return;setBusy(true);try{const c=rendered.current;onUse(await projectFromImage(c,c.width,c.height,`${file.name.replace(/\.pdf$/i,'')} · strana ${page}`));}catch(e){setError((e as Error).message);setBusy(false);}};
 return <div className="fp-pdf-picker"><p><strong>{file.name}</strong></p>{doc?<label>Stránka s půdorysem <select aria-label="Stránka PDF" value={page} disabled={busy} onChange={e=>choose(Number(e.target.value))}>{Array.from({length:doc.numPages},(_,i)=><option key={i} value={i+1}>Strana {i+1} z {doc.numPages}</option>)}</select></label>:!error&&<p role="status">Otevírám PDF…</p>}<div ref={preview} className="fp-pdf-preview" aria-label={`Náhled PDF, strana ${page}`} aria-busy={!ready}/>{doc&&!ready&&!error&&<p role="status">Vykresluji stránku…</p>}{error&&<p role="alert" className="fp-error">{error}</p>}<div className="fp-pdf-actions"><button className="fp-outline" onClick={onCancel} disabled={busy}>Jiný soubor</button><button className="fp-primary" disabled={!ready||busy} onClick={usePage}>{busy?'Rozpoznávám stěny…':'Použít tuto stránku'}</button></div><p className="fp-small">PDF zůstává v prohlížeči. Rozpozná se pouze vybraná stránka; výsledek zkontrolujete nad výkresem.</p></div>;
}
