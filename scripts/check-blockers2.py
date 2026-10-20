import bpy, json, math, pathlib, time
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=pathlib.Path('H:/hajduskova/code AI/VR web')
OUT=ROOT/'public/mikulovice'
s=bpy.context.scene
print('START',s.name,len(s.objects),flush=True)
for c in bpy.data.collections:
 if c.name.startswith(('09 ','16 ')):c.hide_viewport=False;c.hide_render=False
for o in s.objects:o.hide_set(False)
# Clear actual doorways while retaining the original source file.
for o in s.objects:
 if o.name.startswith('Entry mirror'):o.location.y+=.9
 if o.name.startswith(('Bedroom framed art','Bedroom art mount','Bedroom abstract relief')) and 4.2<o.location.y<4.9:o.location.x+=1.0
 if o.name.startswith(('Entry upholstered bench','Entry bench foot')) and o.location.x>12:o.location.y+=1.05
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
  if mod.type=='BEVEL':mod.segments=1
  if mod.type=='SUBSURF':mod.levels=0;mod.render_levels=0
 if o.type=='CURVE':o.data.resolution_u=4;o.data.bevel_resolution=0
 if o.type=='MESH' and len(o.data.polygons)>1800:
  d=o.modifiers.new('Quest simplification','DECIMATE');d.ratio=max(.18,1800/len(o.data.polygons))
 meshes.append(o)
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0]
bpy.ops.object.convert(target='MESH')
print('CONVERTED',len(meshes),flush=True)
dg=bpy.context.evaluated_depsgraph_get()
for label,x,y in [('eastliving',14.22,4.85),('eastbath',14.32,2.71)]:
 print(label,flush=True)
 hits=set()
 for xx in [x-.15,x,x+.15]:
  for yy in [y-.4,y-.2,y,y+.2,y+.4]:
   for h in [.28,.85,1.5]:
    for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]:
     hit,loc,n,idx,obj,mat=s.ray_cast(dg,Vector((xx,yy,h)),Vector((dx,dy,0)),distance=.23)
     if hit:hits.add(obj.name)
 print(sorted(hits),flush=True)
