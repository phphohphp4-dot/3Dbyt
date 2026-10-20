import bpy
s=bpy.context.scene
for o in s.objects:
 if ('entrance' in o.name.lower() or 'bedroom south' in o.name.lower() or 'wall' in o.name.lower()) and o.type=='MESH':print(o.name,tuple(round(v,2) for v in o.location),tuple(round(v,2) for v in o.dimensions),flush=True)
