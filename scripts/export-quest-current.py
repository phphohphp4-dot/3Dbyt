import pathlib,bpy
root=pathlib.Path('H:/hajduskova/code AI/VR web')
exec((root/'scripts/export-complete-preview.py').read_text(encoding='utf-8-sig'))
bpy.ops.wm.save_as_mainfile(filepath=str(root/'blender-output/mikulovice_quest_complete.blend'))
