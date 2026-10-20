import bpy
from pathlib import Path
ROOT=Path(r'H:/hajduskova/code AI/VR web')
exec((ROOT/'scripts/apply-real-textures.py').read_text(encoding='utf-8-sig'))
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender-output/mikulovice_living_textured.blend'))
