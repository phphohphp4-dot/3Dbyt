import bpy
for image in bpy.data.images:
 if image.name.startswith('Bake_') or image.filepath.endswith('.jpg'):
  try:image.pack()
  except RuntimeError:pass
bpy.ops.wm.save_as_mainfile(filepath='H:/hajduskova/code AI/VR web/blender-output/mikulovice_quest.blend')
