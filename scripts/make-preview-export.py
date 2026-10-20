from pathlib import Path
p=Path('scripts/prepare-quest-complete.py').read_text('utf-8')
start=p.index('for o,img,key in pending:\n # Reload')
tail=p[start:]
tail=tail[:tail.index("triangles=sum")]
header='''import bpy,pathlib
ROOT=pathlib.Path('H:/hajduskova/code AI/VR web');OUT=ROOT/'public/mikulovice-complete';s=bpy.context.scene
pending=[(o,None,o.name[3:]) for o in s.objects if o.type=='MESH' and o.name.startswith('VR_')]
for o,img,key in pending:
 assert (OUT/(key+'.png')).exists(),key+' not baked yet'
baked=[o for o,img,key in pending]
glass=[o for o in s.objects if o.type=='MESH' and not o.name.startswith('VR_') and not o.hide_render and not any(c.hide_render for c in o.users_collection)]
'''
Path('scripts/export-complete-preview.py').write_text(header+tail+"\nprint('PREVIEW_EXPORTED',flush=True)\n",encoding='utf-8')
p=Path('scripts/build-quest-static.cjs');s=p.read_text('utf-8');s=s.replace("out=path.join(root,'blender-output/quest-web');", "out=process.argv[2]?path.resolve(process.argv[2]):path.join(root,'blender-output/quest-web');\nconst assets=process.argv[3]?path.resolve(process.argv[3]):path.join(root,'public/mikulovice');")
s=s.replace("fs.copyFileSync(path.join(root,'public/mikulovice',f),", "fs.copyFileSync(fs.existsSync(path.join(assets,f))?path.join(assets,f):path.join(root,'public/mikulovice',f),")
s=s.replace("path.join(root,'public/mikulovice/lights-off')", "path.join(assets,'lights-off')")
p.write_text(s,encoding='utf-8')
