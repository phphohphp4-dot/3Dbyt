from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
root=Path('blender-output/quest-web');dest=Path('blender-output/Mikulovice_Quest3S_zahrada.zip')
files=[root/n for n in ['index.html','tour.js','style.css','CTETE-ME.txt']]+[p for p in (root/'mikulovice').rglob('*') if p.is_file() and p.suffix!='.padding-stamp']
with ZipFile(dest,'w',ZIP_DEFLATED,compresslevel=6) as z:
 for p in files:z.write(p,p.relative_to(root).as_posix())
with ZipFile(dest) as z:
 assert len([n for n in z.namelist() if n.startswith('mikulovice/lights-off/') and n.endswith('.png')])==18
 assert not any(n.startswith('preview/') for n in z.namelist())
 assert z.testzip() is None
print('VERIFIED_PACKAGE',dest.resolve(),dest.stat().st_size,'files',len(files))
