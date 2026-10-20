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

