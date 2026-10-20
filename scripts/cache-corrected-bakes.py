from pathlib import Path
p=Path('scripts/prepare-quest-complete.py');s=p.read_text('utf-8')
s=s.replace("size=4096 if key in ['living_details','exterior_details','exterior_ground'] else 2048", "size=4096 if key=='living_details' else (1024 if key=='exterior_ground' else 2048)")
s=s.replace("s.cycles.samples=32 if not key.startswith('exterior') else 16", "s.cycles.samples=24 if key.startswith(('living_','bedroom_','bathroom_')) else 12")
s=s.replace(" bpy.ops.object.bake(type='COMBINED',pass_filter={'DIRECT','INDIRECT','COLOR','DIFFUSE','EMIT'})\n img.save_render(str(OUT/(key+'.png')),scene=s)", " if not (OUT/(key+'.png')).exists():\n  bpy.ops.object.bake(type='COMBINED',pass_filter={'DIRECT','INDIRECT','COLOR','DIFFUSE','EMIT'})\n  img.save_render(str(OUT/(key+'.png')),scene=s)")
s=s.replace('s.cycles.samples=24\n print(\'OFF_BAKE', 's.cycles.samples=12\n print(\'OFF_BAKE')
p.write_text(s,encoding='utf-8')
for name in ['east_north','living_details']:
 p=Path('public/mikulovice-complete')/(name+'.png')
 if p.exists():p.rename(p.with_suffix('.before-smooth.png'))
