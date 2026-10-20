import {useEffect,useRef,useState} from 'react';
import {Header} from '@/components/layout/Header';
import {Button} from '@/components/ui/button';
import {Link} from 'react-router-dom';
import {Loader2,ArrowLeft,ExternalLink} from 'lucide-react';

// Configure the deployed HTTPS service in VITE_3D_STUDIO_URL.
// A published Openstudio must never send visitors to their own localhost.
const configured=import.meta.env.VITE_3D_STUDIO_URL?.trim();
const endpoint=configured||(import.meta.env.DEV?`http://${window.location.hostname}:3004/`:'');
function studioUrl(){try{const url=new URL(endpoint);if(!['http:','https:'].includes(url.protocol)||(!import.meta.env.DEV&&url.protocol!=='https:'))return null;url.searchParams.set('embed','openstudio');return url;}catch{return null;}}
const target=studioUrl();
export default function SpatialStudio(){
 const frame=useRef<HTMLIFrameElement>(null);const[ready,setReady]=useState(false),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  if(!target)return;
  const timer=setTimeout(()=>setFailed(true),15000);
  const receive=(e:MessageEvent)=>{if(e.origin===target.origin&&e.source===frame.current?.contentWindow&&e.data?.type==='openstudio:spatial-ready'){clearTimeout(timer);setReady(true);setFailed(false);}};
  window.addEventListener('message',receive);return()=>{clearTimeout(timer);window.removeEventListener('message',receive);};
 },[attempt]);
 return <div className="min-h-screen bg-white"><Header/><main className="relative h-[calc(100dvh-64px)]">
 {!target?<section className="container py-20 max-w-2xl"><h1 className="text-3xl font-bold mb-4">3D prohlídky</h1><p className="text-muted-foreground mb-6">Online příjem podkladů připravujeme. S požadavkem na 3D prohlídku se zatím obraťte na náš tým.</p><Button asChild><Link to="/kontakt">Kontaktovat Openstudio</Link></Button></section>:<>
 <iframe key={attempt} ref={frame} src={target.href} title="Openstudio — 3D prohlídky a nahrání půdorysu" className="block h-full w-full border-0" allow="fullscreen; xr-spatial-tracking" referrerPolicy="strict-origin-when-cross-origin"/>
 {!ready&&<section className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-white px-6 text-center" aria-live="polite">{failed?<><h1 className="text-2xl font-semibold">3D studio se nepodařilo načíst</h1><p className="max-w-md text-muted-foreground">Zkuste znovu načíst stránku nebo otevřete studio samostatně.</p><div className="flex flex-wrap justify-center gap-3"><Button onClick={()=>{setReady(false);setFailed(false);setAttempt(v=>v+1);}}>Zkusit znovu</Button><Button variant="outline" asChild><a href={endpoint} target="_blank" rel="noreferrer">Otevřít samostatně<ExternalLink className="ml-2 h-4 w-4"/></a></Button></div><Link to="/" className="flex items-center gap-2 text-primary"><ArrowLeft className="h-4 w-4"/>Zpět na Openstudio</Link></>:<><Loader2 className="h-7 w-7 animate-spin text-primary"/><p className="text-muted-foreground">Otevíráme 3D studio…</p></>}</section>}
 </>}
 </main></div>;
}
