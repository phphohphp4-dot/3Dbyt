from pathlib import Path
p=Path('scripts/prepare-quest-complete.py').read_text('utf-8')
tail=p[p.index('# Keep a float bake'):]
tail=tail.replace(" bpy.ops.object.bake(type='COMBINED',pass_filter={'DIRECT','INDIRECT','COLOR','DIFFUSE','EMIT'})\n img.save_render(str(OUT/(key+'.png')),scene=s)"," if not (OUT/(key+'.png')).exists():\n  bpy.ops.object.bake(type='COMBINED',pass_filter={'DIRECT','INDIRECT','COLOR','DIFFUSE','EMIT'})\n  img.save_render(str(OUT/(key+'.png')),scene=s)")
tail=tail.replace('s.cycles.samples=24','s.cycles.samples=16')
header='''import bpy,json,pathlib
ROOT=pathlib.Path('H:/hajduskova/code AI/VR web');OUT=ROOT/'public/mikulovice-complete';s=bpy.context.scene
p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='HIP';p.get_devices()
for d in p.devices:d.use=d.type=='HIP'
s.cycles.device='GPU'
s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB';s.render.image_settings.color_depth='8'
s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.view_settings.exposure=-.25
pending=[];baked=[]
for o in s.objects:
 if o.type!='MESH' or not o.name.startswith('VR_'):continue
 key=o.name[3:];img=o.data.materials[0].node_tree.nodes.active.image
 if key=='exterior_ground':img.scale(1024,1024)
 if key=='exterior_details':img.scale(2048,2048)
 pending.append((o,img,key));baked.append(o)
glass=[o for o in s.objects if o.type=='MESH' and not o.name.startswith('VR_') and not o.hide_render and not any(c.hide_render for c in o.users_collection)]
cells=json.loads((OUT/'navigation.json').read_text())['cells']
print('RESUME_GROUPS',[(key,len(o.data.polygons)) for o,img,key in pending],flush=True)
'''
Path('scripts/resume-quest-complete.py').write_text(header+tail,encoding='utf-8')
