from pathlib import Path
p=Path('components/3d/QuestTour.tsx');s=p.read_text(encoding='utf-8-sig')
s=s.replace('useEffect,useRef,useState','useCallback,useEffect,useRef,useState')
s=s.replace("import * as THREE from 'three';", "import * as THREE from 'three';\nimport {TourEditor} from './TourEditor';\nimport {TourCustomizer} from '@/lib/tour-customizer';\nimport {type Selection,type Variant} from '@/lib/tour-catalog';")
s=s.replace(' const host=useRef', ''' const editor=useRef<TourCustomizer|null>(null),editing=useRef(false),editorBusy=useRef(false);
 const [editorOpen,setEditorOpen]=useState(false),[selection,setSelection]=useState<Selection|null>(null);
 const select=useCallback((s:Selection|null)=>{if(editorBusy.current)return;setSelection(s);editor.current?.select(s);},[]);
 const apply=useCallback((v:Variant)=>editor.current?.apply(v),[]);
 const busy=useCallback((v:boolean)=>{editorBusy.current=v;},[]);
 const closeEditor=()=>{editing.current=false;setEditorOpen(false);select(null);};
 const host=useRef''')
s=s.replace("hall:[9,-3.5,-.22,-.12]", "hall:[9,-3.5,-.22,-.12],dining:[3.65,-4.2,.63,-.35]")
s=s.replace("hall:'Chodba'", "hall:'Chodba',dining:'Jídelna 3kk'")
s=s.replace("const down=(e:KeyboardEvent)=>{", "const down=(e:KeyboardEvent)=>{if(e.target instanceof HTMLElement&&(e.target.closest('input,textarea,select,button')||e.target.isContentEditable))return;")
s=s.replace("ray.setFromCamera(p,camera);interactions?.activate(ray,headPosition());", "ray.setFromCamera(p,camera);if(editing.current){if(!editorBusy.current){const id=editor.current?.pick(ray);select(id?{objectId:id,scope:'one'}:null);}}else interactions?.activate(ray,headPosition());")
s=s.replace("nav=n;scene.add(model);", "nav=n;scene.add(model);editor.current=new TourCustomizer(model);")
s=s.replace("disposed=true;disposeOutdoor?.();", "disposed=true;editor.current?.dispose();editor.current=null;disposeOutdoor?.();")
s=s.replace(" },[assetBase]);", " },[assetBase,select]);")
s=s.replace("  <section style={menuOpen?", "  {!editorOpen&&<button disabled={!interactionsReady} onClick={()=>{editing.current=true;setEditorOpen(true);setMenuOpen(false);document.exitPointerLock();actions.current?.go('dining');}} style={{position:'absolute',right:16,top:16,padding:'12px 18px',borderRadius:12,background:'#047857',color:'white',fontWeight:600}}>Upravit interiér</button>}\n  {editorOpen&&<TourEditor selection={selection} onSelect={select} onApply={apply} onBusy={busy} onClose={closeEditor}/>}\n  <section style={menuOpen?")
s=s.replace('<option value="terrace">', '<option value="dining">Jídelna</option><option value="terrace">')
p.write_text(s,encoding='utf-8')
