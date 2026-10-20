import bpy,json
rows=[dict(name=o.name,loc=list(o.location),dim=list(o.dimensions)) for o in bpy.context.scene.objects if any(c.name.startswith('08 ') for c in o.users_collection)]
open(r'H:/hajduskova/code AI/VR web/blender-output/living-inventory.json','w').write(json.dumps(rows))
