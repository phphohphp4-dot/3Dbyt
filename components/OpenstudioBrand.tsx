'use client';
/* eslint-disable @next/next/no-img-element */
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {Menu,X} from 'lucide-react';

const links=[['/','Domů'],['/cenik','Ceník'],['/examples','Ukázky'],['/3d-prohlidky','3D prohlídky'],['/navod','Návod'],['/kontakt','Kontakt']];
function hostUrl(){
 if(typeof window!=='undefined'&&['localhost','127.0.0.1'].includes(window.location.hostname))return `http://${window.location.hostname}:8080`;
 return 'https://www.openstudio.cz';
}
export function OpenstudioLogo(){return <img className="os-logo" src="/branding/openstudio-logo.png" alt="Openstudio logo"/>;}
export function OpenstudioHeader(){
 const[open,setOpen]=useState(false),[origin,setOrigin]=useState('https://www.openstudio.cz');const toggle=useRef<HTMLButtonElement>(null);
 useEffect(()=>{const timer=setTimeout(()=>setOrigin(hostUrl()),0);return()=>clearTimeout(timer);},[]);
 useEffect(()=>{if(!open)return;const close=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);toggle.current?.focus();}};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close);},[open]);
 const navigation=<>{links.map(([path,label])=><a key={path} href={path==='/3d-prohlidky'?'#':origin+path} aria-current={path==='/3d-prohlidky'?'page':undefined} onClick={()=>setOpen(false)}>{label}</a>)}</>;
 return<header className="os-site-header"><div className="os-header-inner"><a href={origin+'/'} className="os-logo-link" aria-label="Openstudio — Domů"><OpenstudioLogo/></a><nav className="os-desktop-nav" aria-label="Hlavní navigace">{navigation}</nav><div className="os-account"><a href={origin+'/login'}>Přihlásit se</a><a className="os-register" href={origin+'/register'}>Registrace</a></div><button ref={toggle} className="os-menu-toggle" aria-label={open?'Zavřít menu':'Otevřít menu'} aria-expanded={open} aria-controls="openstudio-mobile-menu" onClick={()=>setOpen(v=>!v)}>{open?<X size={24}/>:<Menu size={24}/>}</button></div>{open&&<nav id="openstudio-mobile-menu" className="os-mobile-nav" aria-label="Mobilní navigace">{navigation}<a href={origin+'/login'}>Přihlásit se</a><a href={origin+'/register'}>Registrace</a></nav>}</header>;
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
