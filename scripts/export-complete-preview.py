import bpy,pathlib
ROOT=pathlib.Path('H:/hajduskova/code AI/VR web');OUT=ROOT/'public/mikulovice-complete';s=bpy.context.scene
pending=[(o,None,o.name[3:]) for o in s.objects if o.type=='MESH' and o.name.startswith('VR_')]
for o,img,key in pending:
 assert (OUT/(key+'.png')).exists(),key+' not baked yet'
baked=[o for o,img,key in pending]
glass=[o for o in s.objects if o.type=='MESH' and not o.name.startswith('VR_') and not o.hide_render and not any(c.hide_render for c in o.users_collection)]
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

print('PREVIEW_EXPORTED',flush=True)
