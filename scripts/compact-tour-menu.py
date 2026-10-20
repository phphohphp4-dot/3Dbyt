from pathlib import Path
p=Path('components/3d/QuestTour.tsx');s=p.read_text('utf-8')
s=s.replace("const [status,setStatus]=useState('Načítám interiér…');", "const [status,setStatus]=useState('Načítám prohlídku…');\n const [menuOpen,setMenuOpen]=useState(true);")
s=s.replace('<section className="absolute bottom-5', '<section style={menuOpen?undefined:{width:\'auto\'}} className="absolute bottom-5')
s=s.replace('   <div className="flex flex-wrap justify-center gap-2">', '   {menuOpen?<><div className="flex flex-wrap justify-center gap-2">')
s=s.replace('onClick={()=>actions.current?.walk()}', 'onClick={()=>{actions.current?.walk();setMenuOpen(false);}}')
s=s.replace('   </details>\n  </section>', '   </details><button onClick={()=>setMenuOpen(false)} className="mt-2 text-xs text-slate-400">Skrýt ovládání</button></>:<button onClick={()=>setMenuOpen(true)} className="text-sm text-white">Ovládání prohlídky</button>}\n  </section>')
p.write_text(s,encoding='utf-8')
