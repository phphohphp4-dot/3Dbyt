from pathlib import Path
p=Path('scripts/refine-complete.py');s=p.read_text('utf-8-sig')
a=s.index(' bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=link');b=s.index('\n if r:',a)
s=s[:a]+''' x,y,z=[v/2 for v in dim]
 vs=[(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)]
 me=bpy.data.meshes.new(n);me.from_pydata(vs,[],[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]);me.update();o=bpy.data.objects.new(n,me);C.objects.link(o);o.location=loc;me.materials.append(m)'''+s[b:]
p.write_text(s,encoding='utf-8')
