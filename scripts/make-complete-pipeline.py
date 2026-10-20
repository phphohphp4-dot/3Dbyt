from pathlib import Path
p=Path('scripts/prepare-quest-refined.py').read_text('utf-8-sig')
start=p.index('# Preserve per-object')
end=p.index('# Bake actual')
core=p[start:end]
core=core.replace('step=.12;nx=155;nz=102;ox=0;oz=-12.12;cells=[]','step=.12;nx=200;nz=190;ox=-2.8;oz=-16.8;cells=[]')
a=core.index('  inside=');b=core.index('\n  free=inside',a)
core=core[:a]+'  inside=(-2.5<x<20.9 and -5.6<y<16.7)'+core[b:]
core=core.replace(" and -.18<floor.z<.14", " and -.18<floor.z<.14")
core=core.replace(" if y>9.5 or x<0 or x>18.4:k='outside'", " if any(c.name.startswith('05 ') for c in o.users_collection):k='terraces'\n if any(c.name.startswith('12 ') for c in o.users_collection):k='bedroom_'+('east' if x>12 else ('north' if y>5 else 'south'))\n if any(c.name.startswith('13 ') for c in o.users_collection):k='bathroom_'+('east' if x>12 else 'west')\n if any(c.name.startswith('18 ') for c in o.users_collection):\n  k='exterior_details'\n  if o.name.startswith(('EXT lawn','EXT front paving','EXT side path','EXT rear path','EXT paving joint','EXT planted border','EXT gravel strip')):k='exterior_ground'\n  elif o.name.startswith(('EXT upper','EXT gable','EXT roof','EXT standing','EXT rain','EXT down','EXT oak fascia','EXT window')):k='exterior_shell'\n  elif o.name.startswith('EXT shrub'):k='exterior_foliage'")
header='''import bpy, json, math, pathlib, time
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=pathlib.Path('H:/hajduskova/code AI/VR web')
OUT=ROOT/'public/mikulovice-complete';OUT.mkdir(exist_ok=True)
(OUT/'lights-off').mkdir(exist_ok=True)
s=bpy.context.scene
for o in s.objects:o.hide_set(False)
doors=['Bedroom north','Bedroom south','3kk entrance','3kk bath','2kk entrance','2kk living','2kk bedroom','2kk bath','Storage']
for o in list(s.objects):
 if any(o.name==n or o.name==n+' handle' for n in doors) or o.name=='Main entrance frame.001':bpy.data.objects.remove(o,do_unlink=True)
meshes=[]
for o in list(s.objects):
 if o.type not in {'MESH','CURVE'} or o.hide_render or any(c.hide_render for c in o.users_collection):continue
 if 'shower nozzle' in o.name:
  d=o.modifiers.new('Small nozzle reduction','DECIMATE');d.ratio=.12
 meshes.append(o)
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.convert(target='MESH')
print('CONVERTED',len(meshes),flush=True)
'''
bake='''
s.render.engine='CYCLES';s.cycles.samples=32
p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='HIP';p.get_devices()
for d in p.devices:d.use=d.type=='HIP'
s.cycles.device='GPU';s.render.bake.margin=8
s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB';s.render.image_settings.color_depth='8'
s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.view_settings.exposure=-.25
baked=[];pending=[]
for key,objects in groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object;o.name='VR_'+key
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=(.004 if key.startswith('architecture_') or key=='ceilings' else .001));bpy.ops.object.mode_set(mode='OBJECT')
 size=4096 if key in ['living_details','exterior_details','exterior_ground'] else 2048
 img=bpy.data.images.new('Bake_'+key,width=size,height=size,alpha=False,float_buffer=True)
 for i,m in enumerate(o.data.materials):
  if not m:continue
  m=m.copy();o.data.materials[i]=m;m.use_nodes=True
  n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=img;m.node_tree.nodes.active=n
 pending.append((o,img,key));baked.append(o)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender-output/complete_bake_prepared.blend'))
# Keep a float bake until AgX has compressed highlight values into display range.
for o,img,key in pending:
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 s.cycles.samples=32 if not key.startswith('exterior') else 16
 print('BAKE',key,len(o.data.polygons),flush=True)
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
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;s.cycles.samples=24
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
'''
tail=p[p.index('# Glazing uses'):]
tail=tail.replace("(.5,.65,.7,1)","(.72,.82,.86,1)").replace("default_value=.12","default_value=.06")
tail=tail.replace("for o,img,key in pending:img.pack()",'').replace('mikulovice_quest_refined.blend','mikulovice_quest_complete.blend')
Path('scripts/prepare-quest-complete.py').write_text(header+core+bake+tail,encoding='utf-8')
