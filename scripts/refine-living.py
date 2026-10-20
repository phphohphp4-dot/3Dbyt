import bpy, math, random, bmesh
from mathutils import Vector
s=bpy.context.scene
C=s.collection.children['08 Detailed 3kk interior']
for o in list(C.objects):
 if o.name.startswith(('Sofa ','Chaise ','Loose woven pillow','Pillow edge','Draped throw','Chair upholstered','Chair curved','Chair low arm','Chair oak foot','Wool area rug','Rug fringe')):bpy.data.objects.remove(o,do_unlink=True)
def mat(n,c):
 m=bpy.data.materials.new(n);m.use_nodes=True;p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=.78
 return m
fabric=mat('Refined pearl grey linen',(.48,.475,.45));ivory=mat('Refined ivory cushion',(.72,.69,.63));taupe=mat('Refined sand cushion',(.38,.30,.23));rug=mat('Refined oatmeal rug',(.43,.39,.32));black=mat('Refined soft black',(.018,.021,.023))
for m in [fabric,ivory,taupe,rug]:
 nt=m.node_tree;p=next(n for n in nt.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Sheen Weight'].default_value=.3
 tc=nt.nodes.new('ShaderNodeTexCoord');noise=nt.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=190;noise.inputs['Detail'].default_value=2;nt.links.new(tc.outputs['Generated'],noise.inputs['Vector'])
 ramp=nt.nodes.new('ShaderNodeValToRGB');base=p.inputs['Base Color'].default_value[:]
 ramp.color_ramp.elements[0].color=tuple(v*.90 for v in base[:3])+(1,);ramp.color_ramp.elements[1].color=tuple(v*1.06 for v in base[:3])+(1,)
 nt.links.new(noise.outputs['Fac'],ramp.inputs[0]);nt.links.new(ramp.outputs[0],p.inputs['Base Color'])
 bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.10;bump.inputs['Distance'].default_value=.0005;nt.links.new(noise.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs[0],p.inputs['Normal'])
def rounded(n,loc,dim,m,r):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name='Refined '+n
 for c in list(o.users_collection):c.objects.unlink(o)
 C.objects.link(o);o.dimensions=dim;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 b=o.modifiers.new('Soft tailored corners','BEVEL');b.width=r;b.segments=6;bpy.ops.object.modifier_apply(modifier=b.name)
 for p in o.data.polygons:p.use_smooth=True
 wn=o.modifiers.new('Stable surface normals','WEIGHTED_NORMAL');wn.keep_sharp=True;wn.weight=30;bpy.ops.object.modifier_apply(modifier=wn.name)
 return o
# Low, continuous frame with gently rounded cushions; no overlapping chaise pads.
rounded('sofa base',(1.13,7.16,.26),(1.10,2.93,.25),fabric,.08)
rounded('sofa back',(.66,7.16,.67),(.24,2.93,.72),fabric,.105)
for y in [5.73,8.59]:rounded('sofa arm',(1.14,y,.55),(1.12,.18,.58),fabric,.075)
for y in [7.16,8.06]:
 rounded('sofa seat',(1.20,y,.46),(.90,.88,.20),fabric,.085)
 o=rounded('sofa back pad',(.85,y,.78),(.25,.88,.52),fabric,.10);o.rotation_euler.y=-.10
rounded('sofa chaise base',(1.56,6.25,.26),(1.95,1.02,.25),fabric,.08)
rounded('sofa chaise seat',(1.60,6.25,.46),(1.86,.91,.20),fabric,.085)
o=rounded('sofa back pad',(.85,6.25,.78),(.25,.88,.52),fabric,.10);o.rotation_euler.y=-.10
for x,y in [(.76,5.87),(2.32,5.87),(.76,8.44),(1.49,8.44)]:rounded('sofa foot',(x,y,.105),(.055,.055,.18),black,.009)
# Soft plump throw cushions, separate from the seat upholstery.
for j,(y,z) in enumerate([(6.68,.83),(7.52,.85),(8.18,.82)]):
 o=rounded('loose cushion',(1.04,y,z),(.21,.44,.43),taupe if j==1 else ivory,.095);o.rotation_euler=(.08 if j==1 else -.10,-.20,.08)
rounded('rug',(2.36,7.11,.028),(3.35,3.34,.014),rug,.006)
# Sculpted wrap-around dining chair shells, instead of stacked rectangular arms.
wood=bpy.data.materials['V02 honey oak']
for cx,cy,a in [(1.25,1.85,math.pi/2),(1.25,2.65,math.pi/2),(2.79,1.85,-math.pi/2),(2.79,2.65,-math.pi/2),(2.02,1.05,math.pi),(2.02,3.45,0)]:
 parts=[];parts.append(rounded('chair seat',(0,0,.47),(.48,.47,.105),fabric,.047))
 verts=[];faces=[];segments=32
 for i in range(segments+1):
  t=-math.pi*.57+i*math.pi*1.14/segments
  for j in range(5):
   v=j/4;x=.255*math.sin(t)*(1+.07*v);y=.215*math.cos(t)+.025*v;z=.48+v*(.43-.15*(abs(t)/(math.pi*.57))**2)
   verts.append((x,y,z))
 for i in range(segments):
  for j in range(4):k=i*5+j;faces.append((k,k+5,k+6,k+1))
 me=bpy.data.meshes.new('Tailored chair shell');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('Refined chair shell',me);C.objects.link(o);me.materials.append(fabric)
 for p in me.polygons:p.use_smooth=True
 sol=o.modifiers.new('Padded shell thickness','SOLIDIFY');sol.thickness=.045
 bev=o.modifiers.new('Rounded shell edge','BEVEL');bev.width=.021;bev.segments=4;parts.append(o)
 for dx in [-.17,.17]:
  for dy in [-.16,.16]:
   foot=rounded('chair tapered leg',(dx,dy,.235),(.038,.04,.44),wood,.007);foot.rotation_euler=(dy*.6,-dx*.6,0);parts.append(foot)
 for o in parts:
  x,y=o.location.x,o.location.y;o.location.x=cx+x*math.cos(a)-y*math.sin(a);o.location.y=cy+x*math.sin(a)+y*math.cos(a);o.rotation_euler.z+=a
# Less orange oak, subtle grain and narrow floor joints.
for name in ['V02 honey oak','V02 horizontal oak veneer']:
 m=bpy.data.materials[name]
 for n in m.node_tree.nodes:
  if n.type=='VALTORGB':n.color_ramp.elements[0].color=(.25,.155,.078,1);n.color_ramp.elements[1].color=(.48,.335,.19,1)
  if n.type=='BUMP':n.inputs['Strength'].default_value=.09;n.inputs['Distance'].default_value=.0007
for o in C.objects:
 if o.name.startswith('Oak floor board'):o.scale.x*=1.014;o.scale.y*=1.001
 if o.name.startswith('Coffee table oak top'):
  o.data.materials.clear();o.data.materials.append(wood)
# Soften existing coarse fabric bump and strong ceiling reflection.
for name in ['V02 greige upholstery','V02 ivory woven cotton','V02 warm sheer','V02 oatmeal wool']:
 for n in bpy.data.materials[name].node_tree.nodes:
  if n.type=='BUMP':n.inputs['Strength'].default_value=.08;n.inputs['Distance'].default_value=.0005
for o in s.objects:
 if o.type=='LIGHT' and o.name in ['Terrace daylight','West window daylight','Dining window daylight']:
  o.data.energy*=.72;o.data.size*=1.3;o.data.color=(1,.94,.84)
 if o.type=='LIGHT' and o.data.type=='SUN':o.data.angle=.18;o.data.energy*=.7
# Matte ceiling removes the unnaturally sharp bright reflection.
ceiling=mat('Refined matte ceiling',(.78,.77,.74))
for o in s.objects:
 if o.name=='Living ceiling at 2.6m':o.data.materials.clear();o.data.materials.append(ceiling)
# Recalculate normals on all new meshes.
for o in C.objects:
 if o.type=='MESH' and o.name.startswith('Refined '):
  bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(o.data);bm.free()
bpy.ops.wm.save_as_mainfile(filepath='H:/hajduskova/code AI/VR web/blender-output/mikulovice_living_refined.blend')
print('REFINED_SOURCE_READY',flush=True)
