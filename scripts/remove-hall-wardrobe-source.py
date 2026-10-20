import bpy,json,pathlib
from mathutils import Vector
ROOT=pathlib.Path('H:/hajduskova/code AI/VR web')
dg=bpy.context.evaluated_depsgraph_get();points=[];names=[]
for o in list(bpy.context.scene.objects):
 if o.name.startswith('3kk entrance wardrobe'):
  names.append(o.name);ev=o.evaluated_get(dg);me=ev.to_mesh();points.extend([tuple(ev.matrix_world@v.co) for v in me.vertices]);ev.to_mesh_clear()
assert len(names)==7,names
(ROOT/'blender-output/removed-hall-wardrobe.json').write_text(json.dumps({'names':names,'points':points}))
print('REMOVE',names,'BOUNDS',[(min(p[i] for p in points),max(p[i] for p in points)) for i in range(3)],flush=True)
for name in names:bpy.data.objects.remove(bpy.data.objects[name],do_unlink=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender-output/mikulovice_complete_source.blend'))
