import bpy,bmesh,json,pathlib
from mathutils import Vector
from mathutils.kdtree import KDTree
from mathutils.bvhtree import BVHTree
ROOT=pathlib.Path('H:/hajduskova/code AI/VR web');OUT=ROOT/'public/mikulovice-complete';s=bpy.context.scene
info=json.loads((ROOT/'blender-output/removed-hall-wardrobe.json').read_text());kd=KDTree(len(info['points']))
for i,co in enumerate(info['points']):kd.insert(co,i)
kd.balance();removed=0
for o in s.objects:
 if o.type!='MESH' or not o.name.startswith('VR_'):continue
 bm=bmesh.new();bm.from_mesh(o.data)
 selected=[v for v in bm.verts if kd.find(o.matrix_world@v.co)[2]<.00005]
 if selected:
  removed+=len(selected);print('REMOVED_VERTICES',o.name,len(selected),flush=True);bmesh.ops.delete(bm,geom=selected,context='VERTS');bm.to_mesh(o.data)
 bm.free()
assert removed>100,removed
meshes=[o for o in s.objects if o.type=='MESH' and not o.hide_render and not any(c.hide_render for c in o.users_collection)]
verts=[];faces=[]
for o in meshes:
 off=len(verts);verts.extend([o.matrix_world@v.co for v in o.data.vertices]);faces.extend([tuple(off+i for i in p.vertices) for p in o.data.polygons])
bvh=BVHTree.FromPolygons(verts,faces)
step=.12;nx=200;nz=190;ox=-2.8;oz=-16.8;cells=[]
for iz in range(nz):
 for ix in range(nx):
  x=ox+(ix+.5)*step;y=-(oz+(iz+.5)*step)
  inside=(-2.5<x<20.9 and -5.6<y<16.7)
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

bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender-output/complete_bake_prepared.blend'))
p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='HIP';p.get_devices()
for d in p.devices:d.use=d.type=='HIP'
s.cycles.device='GPU';s.render.bake.margin=8;s.render.image_settings.file_format='PNG'
keys=['architecture_west_south','architecture_west_north','west_south','west_north']
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
