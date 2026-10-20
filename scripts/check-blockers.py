import bpy
from mathutils import Vector
s=bpy.context.scene
names=['Bedroom north','Bedroom south','3kk entrance','3kk bath','2kk entrance','2kk living','2kk bedroom','2kk bath','Storage']
for o in list(s.objects):
 if any(o.name==n or o.name==n+' handle' for n in names):bpy.data.objects.remove(o,do_unlink=True)
bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get()
for label,x,y in [('south',6.05,4.71),('westentry',10.08,3.3),('eastentry',12.82,3.3),('eastliving',14.22,4.85)]:
 print(label,flush=True)
 for xx,yy in [(x,y),(x-.25,y),(x+.25,y),(x,y-.25),(x,y+.25)]:
  for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]:
   hit,loc,n,idx,obj,mat=s.ray_cast(dg,Vector((xx,yy,1.5)),Vector((dx,dy,0)),distance=.23)
   if hit:print(round(xx,2),round(yy,2),obj.name,flush=True)

