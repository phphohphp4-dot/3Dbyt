"""Apply the small Openstudio integration without touching unrelated edits.
Usage: python apply.py PATH_TO_OPENSTUDIO_APP [BACKUP_DIRECTORY]
"""
from pathlib import Path
import sys
root=Path(sys.argv[1]).resolve()
source=Path(__file__).parent
replacements={
 'src/App.tsx':[("import Index from \"./pages/Index\";", "import Index from \"./pages/Index\";\nimport SpatialStudio from './pages/SpatialStudio';"),('<Route path="/" element={<Index />} />','<Route path="/" element={<Index />} />\n              <Route path="/3d-prohlidky" element={<SpatialStudio />} />')],
 'src/components/layout/Header.tsx': [('  LayoutGrid,','  LayoutGrid,\n  Cuboid,'),('  { to: "/examples", label: "Ukázky", icon: LayoutGrid, end: false },','  { to: "/examples", label: "Ukázky", icon: LayoutGrid, end: false },\n  { to: "/3d-prohlidky", label: "3D prohlídky", icon: Cuboid, end: false },')],
 'src/components/layout/Footer.tsx':[('              <li><Link to="/profi-staging"','              <li><Link to="/3d-prohlidky" className="text-white/60 hover:text-white transition-colors">3D prohlídky z půdorysu</Link></li>\n              <li><Link to="/profi-staging"')],
 'src/pages/Index.tsx':[('              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">','              <div className="mt-6 flex justify-center"><Link to="/3d-prohlidky"><Button variant="outline" size="lg" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">3D prohlídka z půdorysu<ArrowRight className="h-4 w-4" /></Button></Link></div>\n              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">')]
}
prepared={}
for relative,changes in replacements.items():
 path=root/relative
 text=path.read_text(encoding='utf-8-sig')
 for old,new in changes:
  if new in text:continue
  if text.count(old)!=1:raise SystemExit('Unexpected source; review before applying: '+relative)
  text=text.replace(old,new,1)
 prepared[relative]=text
page='src/pages/SpatialStudio.tsx';content=(source/'SpatialStudio.tsx').read_text(encoding='utf-8-sig')
if (root/page).exists() and (root/page).read_text(encoding='utf-8-sig')!=content:raise SystemExit('Existing SpatialStudio.tsx differs; review manually.')
prepared[page]=content
for relative,text in prepared.items():
 path=root/relative
 if len(sys.argv)>2 and path.exists():
  backup=Path(sys.argv[2]).resolve()/relative;backup.parent.mkdir(parents=True,exist_ok=True)
  if not backup.exists():backup.write_bytes(path.read_bytes())
 path.parent.mkdir(parents=True,exist_ok=True)
 path.write_text(text,encoding='utf-8')
 print('Updated',relative)
