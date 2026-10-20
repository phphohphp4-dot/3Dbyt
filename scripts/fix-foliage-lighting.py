import bpy,bmesh,pathlib
ROOT=pathlib.Path('H:/hajduskova/code AI/VR web');s=bpy.context.scene;o=s.objects['VR_exterior_foliage'];bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.reverse_faces(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='HIP';p.get_devices()
for d in p.devices:d.use=d.type=='HIP'
s.cycles.device='GPU';s.cycles.samples=12;s.render.bake.margin_type='EXTEND'
bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
bpy.ops.object.bake(type='COMBINED',pass_filter={'DIRECT','INDIRECT','COLOR','DIFFUSE','EMIT'})
img=o.data.materials[0].node_tree.nodes.active.image;img.save_render(str(ROOT/'public/mikulovice-complete/exterior_foliage.png'),scene=s)
print('FOLIAGE_CORRECTED',flush=True)
