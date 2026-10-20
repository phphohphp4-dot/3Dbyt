import bpy,json
s=bpy.context.scene
for o in s.objects:
 if o.type=='CURVE' and any(v in o.name.lower() for v in ['tap','hose','rail']):
  print(o.name,[(p.type,len(p.points),len(p.bezier_points)) for p in o.data.splines],flush=True)
