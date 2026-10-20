import bpy,json
from mathutils import Vector
s=bpy.context.scene
rows=[]
for o in s.objects:
 if o.type=='LIGHT' or any(w in o.name.lower() for w in ['door','drawer','cabinet','entrance','bedroom north','bedroom south','3kk bath','2kk bath','2kk living','2kk bedroom','storage']):
  rows.append(dict(name=o.name,type=o.type,loc=list(o.location),dim=list(o.dimensions),rot=list(o.rotation_euler),collection=[c.name for c in o.users_collection],energy=o.data.energy if o.type=='LIGHT' else None))
open(r'H:/hajduskova/code AI/VR web/blender-output/interaction-inventory.json','w').write(json.dumps(rows,indent=2))
