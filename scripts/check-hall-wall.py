import bpy
from mathutils import Vector
s=bpy.context.scene;dg=bpy.context.evaluated_depsgraph_get()
for co in [(9.6,4.8,1.5),(9.6,5.2,1.5)]:
 hit,loc,n,idx,o,m=s.ray_cast(dg,Vector(co),Vector((1,0,0)),distance=1)
 print('HALL_WALL',co,hit,o.name if hit else None,tuple(loc))
