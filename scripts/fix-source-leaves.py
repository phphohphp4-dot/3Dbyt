import bpy,bmesh
count=0
for o in bpy.context.scene.objects:
 if o.type=='MESH' and o.name.startswith('EXT shrub leaves'):
  bm=bmesh.new();bm.from_mesh(o.data)
  faces=[f for f in bm.faces if f.normal.z<0]
  bmesh.ops.reverse_faces(bm,faces=faces);count+=len(faces)
  bm.to_mesh(o.data);bm.free()
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('SOURCE_LEAVES_FIXED',count)
