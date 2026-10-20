import bpy,pathlib
ROOT=pathlib.Path('H:/hajduskova/code AI/VR web');OUT=ROOT/'public/mikulovice-complete';s=bpy.context.scene
p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='HIP';p.get_devices()
for d in p.devices:d.use=d.type=='HIP'
s.cycles.device='GPU';s.render.bake.margin=8;s.render.image_settings.file_format='PNG'
keys=['architecture_east_south','architecture_east_north','ceilings']
for off in [False,True]:
 if off:
  for o in s.objects:
   if o.type=='LIGHT' and o.data.type!='SUN' and 'daylight' not in o.name.lower():o.data.energy=0
  for mat in bpy.data.materials:
   if not mat.use_nodes:continue
   for n in mat.node_tree.nodes:
    if n.type=='EMISSION':n.inputs['Strength'].default_value=0
    if n.type=='BSDF_PRINCIPLED':n.inputs['Emission Strength'].default_value=0
 for key in keys:
  o=s.objects['VR_'+key];bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
  s.cycles.samples=8
  print('REBAKE',key,'off',off,flush=True)
  bpy.ops.object.bake(type='COMBINED',pass_filter={'DIRECT','INDIRECT','COLOR','DIFFUSE','EMIT'})
  img=o.data.materials[0].node_tree.nodes.active.image
  img.save_render(str(OUT/('lights-off' if off else '')/(key+'.png')),scene=s)
print('HALL_REBAKE_DONE',flush=True)
