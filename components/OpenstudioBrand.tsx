'use client';
/* eslint-disable @next/next/no-img-element */
import {useEffect,type ReactNode} from 'react';
import {ArrowLeft,ArrowUpRight} from 'lucide-react';

export function OpenstudioLogo(){return <img className="os-logo" src="/branding/openstudio-logo.png" alt="Openstudio logo"/>;}
export function OpenstudioHeader({onBack,onUpload}:{onBack?:()=>void;onUpload?:()=>void}){
 return <header className="fp-nav os-site-header"><a href="#" className="os-logo-link" aria-label="Openstudio — úvod" onClick={onBack}><OpenstudioLogo/></a>{onBack?<><span className="intake-header-label">PŮDORYS / MÍSTO / ZADÁNÍ</span><button className="fp-text-button" onClick={onBack}><ArrowLeft size={16}/>Zpět na úvod</button></>:<><nav aria-label="Hlavní navigace"><a href="#jak">Jak to funguje</a><a href="#projekt">Ukázkový projekt</a></nav>{onUpload?<button className="fp-primary" onClick={onUpload}>Nahrát půdorys<ArrowUpRight size={17}/></button>:<a className="fp-primary" href="#nahrat-pudorys">Nahrát půdorys<ArrowUpRight size={17}/></a>}</>}</header>;
}
// Embedded pages use Openstudio's actual Header (including its existing account state).
// No authentication tokens, client files or profile details pass through postMessage.
export function OpenstudioShell({children}:{children:ReactNode}){
 useEffect(()=>{
  const embedded=window.parent!==window&&new URLSearchParams(window.location.search).get('embed')==='openstudio';
  if(!embedded)return;
  let parentOrigin='';try{parentOrigin=new URL(document.referrer).origin;}catch{return;}
  const allowed=['https://www.openstudio.cz','https://openstudio.cz','http://127.0.0.1:8080','http://localhost:8080'];
  if(!allowed.includes(parentOrigin))return;
  document.documentElement.classList.add('os-embedded');
  window.parent.postMessage({type:'openstudio:spatial-ready'},parentOrigin);
  return()=>document.documentElement.classList.remove('os-embedded');
 },[]);
 return <div className="openstudio-skin">{children}</div>;
}
