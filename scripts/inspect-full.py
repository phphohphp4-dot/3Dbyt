import bpy,json
from mathutils import Vector
rows=[]
for o in bpy.context.scene.objects:
 rows.append(dict(name=o.name,type=o.type,loc=list(o.location),dim=list(o.dimensions),rot=list(o.rotation_euler),verts=len(o.data.vertices) if o.type=='MESH' else 0,polys=len(o.data.polygons) if o.type=='MESH' else 0,mods=[(m.type,getattr(m,'segments',None),getattr(m,'levels',None)) for m in o.modifiers],materials=[m.name if m else None for m in o.data.materials] if hasattr(o.data,'materials') else [],collection=[c.name for c in o.users_collection]))
open(r'H:/hajduskova/code AI/VR web/blender-output/full-inventory.json','w').write(json.dumps(rows))
