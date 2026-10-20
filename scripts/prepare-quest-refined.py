import bpy, json, math, pathlib, time
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=pathlib.Path('H:/hajduskova/code AI/VR web')
OUT=ROOT/'public/mikulovice-refined'
s=bpy.context.scene
exec((ROOT/'scripts/apply-real-textures.py').read_text('utf-8-sig'))
print('START',s.name,len(s.objects),flush=True)
for c in bpy.data.collections:
 if c.name.startswith(('09 ','16 ')):c.hide_viewport=False;c.hide_render=False
for o in s.objects:o.hide_set(False)
# Clear actual doorways while retaining the original source file.
for o in s.objects:
 if o.name.startswith('Entry mirror'):o.location.y+=.9
 if o.name.startswith(('Bedroom framed art','Bedroom art mount','Bedroom abstract relief')) and 4.2<o.location.y<4.9:o.location.x+=1.0
 if o.name.startswith(('Entry upholstered bench','Entry bench foot')) and o.location.x>12:o.location.y+=1.05
for o in s.objects:
 if o.name.startswith('2kk bathroom ') and any(w in o.name for w in ['vanity','drawer','basin','mirror','soap']):o.location.y-=.45
# Door leaves are omitted in the walk-through; openings remain navigable.
doors=['Bedroom north','Bedroom south','3kk entrance','3kk bath','2kk entrance','2kk living','2kk bedroom','2kk bath','Storage']
for o in list(s.objects):
 if any(o.name==n or o.name==n+' handle' for n in doors):bpy.data.objects.remove(o,do_unlink=True)
for c in list(bpy.data.collections):
 if c.name.startswith(('06 ',)):c.hide_render=True
meshes=[]
for o in list(s.objects):
 if o.type not in {'MESH','CURVE'} or o.hide_render or any(c.hide_render for c in o.users_collection):continue
 if any(c.name.startswith('11 ') for c in o.users_collection) and o.location.z>0.1:continue
 o.hide_viewport=False
 for mod in o.modifiers:
  if mod.type=='BEVEL':mod.segments=4 if any(c.name.startswith('08 ') for c in o.users_collection) else 1
  if mod.type=='SUBSURF':mod.levels=0;mod.render_levels=0
 if o.type=='CURVE':o.data.resolution_u=4;o.data.bevel_resolution=0
 if o.type=='MESH' and len(o.data.polygons)>1800 and not o.name.startswith('Refined '):
  d=o.modifiers.new('Quest simplification','DECIMATE');d.ratio=max(.18,1800/len(o.data.polygons))
 meshes.append(o)
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0]
bpy.ops.object.convert(target='MESH')
print('CONVERTED',len(meshes),flush=True)
# Preserve per-object generated texture coordinates through joining.
for o in meshes:
 attr=o.data.attributes.get('OriginalGenerated') or o.data.attributes.new('OriginalGenerated','FLOAT_VECTOR','POINT')
 lo=Vector((min(v.co.x for v in o.data.vertices),min(v.co.y for v in o.data.vertices),min(v.co.z for v in o.data.vertices)))
 hi=Vector((max(v.co.x for v in o.data.vertices),max(v.co.y for v in o.data.vertices),max(v.co.z for v in o.data.vertices)))
 for v,d in zip(o.data.vertices,attr.data):d.vector=tuple((v.co[i]-lo[i])/max(hi[i]-lo[i],.00001) for i in range(3))
for mat in bpy.data.materials:
 if not mat.use_nodes:continue
 nt=mat.node_tree
 for n in list(nt.nodes):
  if n.type=='TEX_COORD' and n.outputs.get('Generated') and n.outputs['Generated'].is_linked:
   attr=nt.nodes.new('ShaderNodeAttribute');attr.attribute_name='OriginalGenerated'
   for link in list(n.outputs['Generated'].links):nt.links.new(attr.outputs['Vector'],link.to_socket)
# Collision map in glTF coordinates (x, -Blender y). Vertical ray segments detect nearby surfaces.
verts=[];faces=[]
for o in meshes:
 off=len(verts);verts.extend([o.matrix_world@v.co for v in o.data.vertices]);faces.extend([tuple(off+i for i in p.vertices) for p in o.data.polygons])
bvh=BVHTree.FromPolygons(verts,faces)
step=.12;nx=155;nz=102;ox=0;oz=-12.12;cells=[]
for iz in range(nz):
 for ix in range(nx):
  x=ox+(ix+.5)*step;y=-(oz+(iz+.5)*step)
  inside=(.45<x<17.96 and .48<y<8.98) or (1.95<x<8.12 and 9.05<y<11.65) or (13.35<x<16.45 and 9.05<y<11.65)
  free=inside
  if free:
   floor=bvh.ray_cast(Vector((x,y,1.65)),Vector((0,0,-1)),1.9)[0]
   free=floor is not None and -.18<floor.z<.14
  if free:
   for h in (.28,.85,1.5):
    if bvh.ray_cast(Vector((x,y,h)),Vector((0,0,1)),.18)[0] is not None:free=False;break
    for dx,dy in [(1,0),(-1,0),(0,1),(0,-1),(.707,.707),(-.707,.707),(.707,-.707),(-.707,-.707)]:
     if bvh.ray_cast(Vector((x,y,h)),Vector((dx,dy,0)),.22)[0] is not None:free=False;break
    if not free:break
  cells.append(1 if free else 0)
(OUT/'navigation.json').write_text(json.dumps(dict(step=step,nx=nx,nz=nz,ox=ox,oz=oz,cells=cells)),encoding='utf8')
print('NAV',sum(cells),flush=True)
# Separate transparent glazing from baked opaque surfaces.
glass=[];groups={}
for o in meshes:
 if any('glass' in m.name.lower() or 'glazing' in m.name.lower() for m in o.data.materials if m) and ('glass' in o.name.lower() or 'glazing' in o.name.lower()):
  glass.append(o);continue
 x,y=o.location.x,o.location.y
 k=('west' if x<10 else 'east')+('_north' if y>5 else '_south')
 if any(c.name.startswith('01 ') for c in o.users_collection):k='architecture_'+k
 if any(c.name.startswith(('09 ','16 ')) for c in o.users_collection):k='ceilings'
 if y>9.5 or x<0 or x>18.4:k='outside'
 if any(c.name.startswith('08 ') for c in o.users_collection):
  k='living_details'
  if o.name.startswith('Oak floor board'):k='living_floor'
  if o.name.startswith(('Refined sofa','Refined loose','Refined rug')):k='living_sofa'
  if o.name.startswith('Refined chair'):k='living_chairs'
 groups.setdefault(k,[]).append(o)
# Bake actual material colors and lighting into atlases, eliminating dynamic lights in Quest.
s.render.engine='CYCLES';s.cycles.samples=12;s.cycles.use_denoising=True
try:
 p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='HIP';p.get_devices()
 for d in p.devices:d.use=d.type=='HIP'
 s.cycles.device='GPU'
except Exception:s.cycles.device='CPU'
s.render.bake.margin=12
baked=[];pending=[]
for key,objects in groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object;o.name='VR_'+key
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=(.008 if key.startswith("architecture_") or key=="ceilings" else .001));bpy.ops.object.mode_set(mode='OBJECT')
 size=4096 if key=='living_details' else (2048 if key!='outside' else 1024)
 cached=False # Full rebuild by default: no stale texture reuse.
 img=bpy.data.images.load(str(OUT/(key+'.jpg'))) if cached else bpy.data.images.new('Bake_'+key,width=size,height=size,alpha=False)
 # Copy materials so each group has an independent bake destination.
 for i,m in enumerate(o.data.materials):
  if not m:continue
  m=m.copy();o.data.materials[i]=m;m.use_nodes=True
  n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=img;m.node_tree.nodes.active=n
 s.cycles.samples=48 if key.startswith('living_') else 12
 print('BAKE',key,len(o.data.polygons),flush=True)
 if not cached:bpy.ops.object.bake(type='COMBINED',pass_filter={'DIRECT','INDIRECT','COLOR','DIFFUSE','EMIT'})
 img.filepath_raw=str(OUT/(key+'.png'));img.file_format='PNG';img.save()
 pending.append((o,img,key))
 baked.append(o)
 print('BAKED',key,flush=True)
for o,img,key in pending:
 mat=bpy.data.materials.new('Baked_'+key);mat.use_nodes=True;nt=mat.node_tree;nt.nodes.clear()
 out=nt.nodes.new('ShaderNodeOutputMaterial');emit=nt.nodes.new('ShaderNodeEmission');tex=nt.nodes.new('ShaderNodeTexImage');tex.image=img
 nt.links.new(tex.outputs['Color'],emit.inputs['Color']);nt.links.new(emit.outputs[0],out.inputs['Surface'])
 o.data.materials.clear();o.data.materials.append(mat)
 for p in o.data.polygons:p.material_index=0
# Glazing uses cheap alpha instead of refraction.
for o in glass:
 m=bpy.data.materials.new('VR glass');m.use_nodes=True;p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(.5,.65,.7,1);p.inputs['Alpha'].default_value=.12;p.inputs['Roughness'].default_value=.2
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
for o,img,key in pending:img.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender-output/mikulovice_quest_refined.blend'))
print('QUEST_COMPLETE',report,flush=True)






