import bpy,json,pathlib
ROOT=pathlib.Path('H:/hajduskova/code AI/VR web');OUT=ROOT/'public/mikulovice-complete';s=bpy.context.scene
p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='HIP';p.get_devices()
for d in p.devices:d.use=d.type=='HIP'
s.cycles.device='GPU'
s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB';s.render.image_settings.color_depth='8'
s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.view_settings.exposure=-.25
pending=[];baked=[]
for o in s.objects:
 if o.type!='MESH' or not o.name.startswith('VR_'):continue
 key=o.name[3:];img=o.data.materials[0].node_tree.nodes.active.image
 if key=='exterior_ground':img.scale(1024,1024)
 if key=='exterior_details':img.scale(2048,2048)
 pending.append((o,img,key));baked.append(o)
glass=[o for o in s.objects if o.type=='MESH' and not o.name.startswith('VR_') and not o.hide_render and not any(c.hide_render for c in o.users_collection)]
cells=json.loads((OUT/'navigation.json').read_text())['cells']
print('RESUME_GROUPS',[(key,len(o.data.polygons)) for o,img,key in pending],flush=True)
# Keep a float bake until AgX has compressed highlight values into display range.
for o,img,key in pending:
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 s.cycles.samples=32 if not key.startswith('exterior') else 16
 print('BAKE',key,len(o.data.polygons),flush=True)
 if not (OUT/(key+'.png')).exists():
  bpy.ops.object.bake(type='COMBINED',pass_filter={'DIRECT','INDIRECT','COLOR','DIFFUSE','EMIT'})
  img.save_render(str(OUT/(key+'.png')),scene=s)
 print('BAKED',key,flush=True)
# Daylight-only variants use precisely the same geometry and UVs.
for o in s.objects:
 if o.type=='LIGHT' and o.data.type!='SUN' and 'daylight' not in o.name.lower():o.data.energy=0
for m in bpy.data.materials:
 if not m.use_nodes:continue
 for n in m.node_tree.nodes:
  if n.type=='EMISSION':n.inputs['Strength'].default_value=0
  if n.type=='BSDF_PRINCIPLED':n.inputs['Emission Strength'].default_value=0
for o,img,key in pending:
 if key.startswith('exterior') or key=='terraces':continue
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;s.cycles.samples=16
 print('OFF_BAKE',key,flush=True)
 bpy.ops.object.bake(type='COMBINED',pass_filter={'DIRECT','INDIRECT','COLOR','DIFFUSE','EMIT'})
 img.save_render(str(OUT/'lights-off'/(key+'.png')),scene=s)
 print('OFF_BAKED',key,flush=True)
for o,img,key in pending:
 # Reload display-referred image as sRGB; GLB must not contain raw linear highlights.
 img=bpy.data.images.load(str(OUT/(key+'.png')),check_existing=False);img.colorspace_settings.name='sRGB'
 mat=bpy.data.materials.new('Baked_'+key);mat.use_nodes=True;nt=mat.node_tree;nt.nodes.clear()
 out=nt.nodes.new('ShaderNodeOutputMaterial');emit=nt.nodes.new('ShaderNodeEmission');tex=nt.nodes.new('ShaderNodeTexImage');tex.image=img
 nt.links.new(tex.outputs['Color'],emit.inputs['Color']);nt.links.new(emit.outputs[0],out.inputs['Surface'])
 o.data.materials.clear();o.data.materials.append(mat)
 for poly in o.data.polygons:poly.material_index=0
 img.pack()
# Glazing uses cheap alpha instead of refraction.
for o in glass:
 m=bpy.data.materials.new('VR glass');m.use_nodes=True;p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(.72,.82,.86,1);p.inputs['Alpha'].default_value=.06;p.inputs['Roughness'].default_value=.2
 m.surface_render_method='DITHERED';o.data.materials.clear();o.data.materials.append(m)
if glass:
 bpy.ops.object.select_all(action='DESELECT')
 for o in glass:o.select_set(True)
 bpy.context.view_layer.objects.active=glass[0];bpy.ops.object.join();g=bpy.context.object
 material=g.data.materials[0];g.data.materials.clear();g.data.materials.append(material)
 for p in g.data.polygons:p.material_index=0
 glass=[g]
bpy.ops.object.select_all(action='DESELECT')
for o in baked+glass:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'mikulovice-quest.glb'),export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True,export_cameras=False,export_lights=False,export_extras=False)
triangles=sum(len(p.vertices)-2 for o in baked+glass for p in o.data.polygons)
report=dict(meshes=len(baked)+len(glass),triangles=triangles,atlases=len(baked),navigableCells=sum(cells),bakedLighting=True)
(OUT/'build-report.json').write_text(json.dumps(report,indent=2))

bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender-output/mikulovice_quest_complete.blend'))
print('QUEST_COMPLETE',report,flush=True)






