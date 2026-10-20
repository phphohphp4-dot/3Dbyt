import bpy,bmesh
s=bpy.context.scene
for o in s.objects:
 if o.type=='CURVE' and any(t in o.name.lower() for t in ['hose','basin tap','towel rail','faucet']):
  for sp in list(o.data.splines):
   if sp.type!='POLY' or len(sp.points)<3:continue
   coords=[p.co.xyz.copy() for p in sp.points];cyclic=sp.use_cyclic_u
   o.data.splines.remove(sp);sp=o.data.splines.new('BEZIER');sp.bezier_points.add(len(coords)-1);sp.use_cyclic_u=cyclic
   for p,co in zip(sp.bezier_points,coords):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
  o.data.resolution_u=12;o.data.bevel_resolution=3
  print('SMOOTH',o.name,flush=True)
 if o.name.startswith('EXT roof') and o.type=='MESH' and o.data.polygons[0].normal.z<0:
  bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.reverse_faces(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
