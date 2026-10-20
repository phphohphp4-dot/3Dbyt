import bpy, math, random, pathlib
from mathutils import Vector
ROOT=pathlib.Path('H:/hajduskova/code AI/VR web')
s=bpy.context.scene
random.seed(43)
# Separate source revision, original project is preserved.
for c in bpy.data.collections:
 if c.name.startswith(('09 ','16 ')): c.hide_render=False;c.hide_viewport=False
for o in s.objects:o.hide_set(False)
for o in list(s.objects):
 if o.name.startswith('3kk entrance wardrobe') or any(c.name.startswith(('11 ', '06 ')) for c in o.users_collection):bpy.data.objects.remove(o,do_unlink=True);continue
 if o.name.startswith(('Bedroom framed art','Bedroom art mount','Bedroom abstract relief')):
  if o.location.y>8:o.location.x-=1.55 # onto the solid wall beside the terrace opening
  elif 4.2<o.location.y<4.9:o.location.x+=1
 if o.name.startswith('Entry mirror'):o.location.y+=.9
 if o.name.startswith(('Entry upholstered bench','Entry bench foot')) and o.location.x>12:o.location.y+=1.05
 if o.name.startswith('2kk bathroom ') and any(w in o.name for w in ['vanity','drawer','basin','mirror','soap']):o.location.y-=.45
 if 'cotton duvet' in o.name:
  for p in o.data.polygons:p.use_smooth=True
  sub=o.modifiers.new('Smooth cloth folds','SUBSURF');sub.levels=1;sub.render_levels=1
  # put smoothing before thickness to avoid thick, jagged seam edges
  bpy.context.view_layer.objects.active=o
  bpy.ops.object.modifier_move_up(modifier=sub.name)
 if o.type=='CURVE':o.data.resolution_u=10;o.data.bevel_resolution=3
 if o.type=='LIGHT' and o.data.type!='SUN':
  if not any(c.name.startswith('08 ') for c in o.users_collection):o.data.energy*=.55
  if o.data.type=='AREA':o.data.size=max(o.data.size,.32)
 if 'ceiling' in o.name.lower() and o.type=='MESH':
  for m in o.data.materials:
   if m and m.use_nodes:
    for n in m.node_tree.nodes:
     if n.type=='BSDF_PRINCIPLED':n.inputs['Roughness'].default_value=.85
# Remove fixed panes from the door apertures; runtime supplies movable glazing.
for o in list(s.objects):
 if o.name.startswith('Terrace glazing glass') or o.name=='Main entrance glass':bpy.data.objects.remove(o,do_unlink=True)
 elif o.name.startswith('Terrace glazing frame') and any(abs(o.location.x-x)<.02 for x in [3.080808,6.939394,14.515152]):bpy.data.objects.remove(o,do_unlink=True)
# Smooth small equipment rather than decimating every object indiscriminately.
for o in s.objects:
 for mod in o.modifiers:
  if mod.type=='BEVEL':mod.segments=min(4,max(3,mod.segments))
# More restrained fabric surface normals eliminate black micro-creases.
for m in bpy.data.materials:
 if m.use_nodes:
  for n in m.node_tree.nodes:
   if n.type=='BUMP':n.inputs['Distance'].default_value=min(n.inputs['Distance'].default_value,.001);n.inputs['Strength'].default_value=min(n.inputs['Strength'].default_value,.14)

C=bpy.data.collections.new('18 Exterior and garden');s.collection.children.link(C)
def mat(n,col,rough=.75):
 m=bpy.data.materials.new(n);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*col,1);p.inputs['Roughness'].default_value=rough;return m
plaster=mat('Exterior mineral white',(.72,.70,.65));metal=mat('Exterior graphite',(.045,.055,.06),.4);stone=mat('Exterior warm limestone',(.37,.36,.32));soil=mat('Exterior planted soil',(.065,.05,.027));grass=mat('Exterior meadow',(.10,.17,.04));wood=bpy.data.materials.get('V02 horizontal oak veneer');linen=bpy.data.materials.get('Refined pearl grey linen')
for m,scale,amount in [(grass,85,.55),(stone,6,.12),(soil,26,.38),(plaster,170,.03)]:
 nt=m.node_tree;p=nt.nodes.get('Principled BSDF');tc=nt.nodes.new('ShaderNodeTexCoord');no=nt.nodes.new('ShaderNodeTexNoise');no.inputs['Scale'].default_value=scale;no.inputs['Detail'].default_value=3;nt.links.new(tc.outputs['Generated'],no.inputs[0]);r=nt.nodes.new('ShaderNodeValToRGB');col=p.inputs['Base Color'].default_value[:3];r.color_ramp.elements[0].color=tuple(v*(1-amount) for v in col)+(1,);r.color_ramp.elements[1].color=tuple(v*(1+amount) for v in col)+(1,);nt.links.new(no.outputs['Fac'],r.inputs[0]);nt.links.new(r.outputs[0],p.inputs['Base Color'])
def link(o,n,m):
 o.name=n
 for c in list(o.users_collection):c.objects.unlink(o)
 C.objects.link(o);o.data.materials.append(m);return o
def box(n,loc,dim,m,r=0):
 x,y,z=[v/2 for v in dim]
 vs=[(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)]
 me=bpy.data.meshes.new(n);me.from_pydata(vs,[],[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]);me.update();o=bpy.data.objects.new(n,me);C.objects.link(o);o.location=loc;me.materials.append(m)
 if r:b=o.modifiers.new('Rounded edges','BEVEL');b.width=r;b.segments=3;o.modifiers.new('Normals','WEIGHTED_NORMAL')
 return o
def mesh(n,verts,faces,m):
 me=bpy.data.meshes.new(n);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(n,me);C.objects.link(o);me.materials.append(m);return o
def rod(n,a,b,r,m):
 d=Vector(b)-Vector(a);bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=r,depth=d.length,location=(Vector(a)+Vector(b))/2);o=link(bpy.context.object,n,m);o.rotation_euler=d.to_track_quat('Z','Y').to_euler()
 for p in o.data.polygons:p.use_smooth=True
 return o
# Continuous level outdoor ground and a restrained front forecourt.
box('EXT lawn',(9.2,6,-.105),(26,28,.12),grass)
box('EXT front paving',(9.2,-3.1,-.04),(21.8,5.4,.04),stone)
box('EXT side path west',(-.85,5,-.035),(1.35,11,.04),stone)
box('EXT side path east',(19.25,5,-.035),(1.35,11,.04),stone)
box('EXT rear path',(9.2,12.5,-.035),(21.8,.95,.04),stone)
# Paving joints, mesh lines with subtle contrast (not heavy black outlines).
joint=mat('Exterior stone joints',(.19,.20,.18))
for y in range(11):box('EXT paving joint',(9.2,-5.75+y*.5,-.018),(21.8,.008,.003),joint)
for i in range(36):box('EXT paving joint',(-1.5+i*.6,-3.1,-.018),(.008,5.4,.003),joint)
# Narrow stone border at the building, entrance wood surround.
for y in [-.1,9.55]:box('EXT gravel strip',(9.2,y,-.025),(18.6,.32,.03),stone)
for x in [10.66,12.29]:box('EXT oak entry surround',(x,-.025,1.25),(.34,.15,2.5),wood,.008)
box('EXT oak entry header',(11.475,-.025,2.48),(1.97,.15,.26),wood,.008)
# Upper exterior follows the supplied references; it is a shell, not an invented upper-floor interior.
box('EXT upper facade',(9.2,4.727,3.6),(18.4,9.454,1.9),plaster)
# Windows in the opaque upper shell use dark reflective planes and frames.
window=mat('Exterior upper window',(.035,.065,.075),.18)
for y,side in [(-.012,-1),(9.467,1)]:
 for x in [2.5,5.4,8.3,11.2,14.1,16.6]:
  box('EXT upper window frame',(x,y,3.76),(1.15,.06,1.05),metal,.008)
  box('EXT upper window pane',(x,y+side*.035,3.76),(1.04,.02,.94),window)
  box('EXT upper window mullion',(x,y+side*.05,3.76),(.035,.025,1.0),metal)
  box('EXT window planter',(x,y+side*.17,3.18),(1.24,.28,.2),wood,.012)
# Gables and standing-seam roof, ridge parallel to the long elevation.
for x in [0,18.4]:mesh('EXT gable',[(x,0,4.55),(x,9.454,4.55),(x,4.727,7.45)],[(0,1,2)],plaster)
for front in [True,False]:
 edge=-.6 if front else 10.054
 mesh('EXT roof',[(-.55,edge,4.15),(18.95,edge,4.15),(18.95,4.727,7.50),(-.55,4.727,7.50)],[(0,1,2,3)],metal)
 for i in range(40):rod('EXT standing seam',(-.5+i*.5,edge,4.17),(-.5+i*.5,4.727,7.52),.012,metal)
 rod('EXT rain gutter',(-.5,edge,4.13),(18.9,edge,4.13),.055,metal)
 for x in [.15,18.25]:rod('EXT downpipe',(x,edge,4.10),(x,edge,.08),.037,metal)
# Lower roof overhangs trimmed in oak.
for y in [-.58,10.03]:box('EXT oak fascia',(9.2,y,4.10),(19.5,.09,.17),wood)
# Replace coarse terrace furniture with slatted oak tables and slim outdoor chairs.
for o in list(s.objects):
 if any(c.name.startswith('05 ') for c in o.users_collection) and o.location.z>.1:bpy.data.objects.remove(o,do_unlink=True)
for x,y,n in [(5.1,10.65,6),(15.65,10.65,2)]:
 w=1.7 if n==6 else .72
 for j in range(6):box('EXT teak table slat',(x,y+(j-2.5)*.127,.73),(w,.12,.045),wood,.008)
 for dx in [-w/2+.12,w/2-.12]:
  for dy in [-.29,.29]:box('EXT table leg',(x+dx,y+dy,.35),(.045,.045,.72),metal,.006)
 for cx,cy,rot in ([(x+dx,y+dy,0 if dy>0 else math.pi) for dx in ([-.56,0,.56] if n==6 else [0]) for dy in [-.67,.67]]):
  # rotation around each chair center; seat, back and armrests stay separate and clean.
  created=[]
  created.append(box('EXT chair seat',(cx,cy,.43),(.46,.44,.07),linen,.025))
  for k in range(4):created.append(box('EXT chair back slat',(cx,cy+.2,.56+k*.065),(.46,.035,.045),wood,.009))
  for dx in [-.19,.19]:
   for dy in [-.17,.17]:created.append(box('EXT chair leg',(cx+dx,cy+dy,.23),(.028,.028,.45),metal,.004))
   created.append(box('EXT chair arm',(cx+dx,cy,.65),(.035,.43,.035),wood,.009))
  for o in created:
   v=o.location-Vector((cx,cy,0));o.location=Vector((cx+v.x*math.cos(rot)-v.y*math.sin(rot),cy+v.x*math.sin(rot)+v.y*math.cos(rot),v.z));o.rotation_euler.z+=rot
# Plant beds at front and rear edges, with non-spherical layered foliage.
leafm=[mat('Exterior leaf '+str(i),c) for i,c in enumerate([(.055,.115,.025),(.10,.19,.04),(.18,.24,.065),(.08,.15,.065)])]
def shrub(x,y,r=.5,h=.8):
 vs=[];fs=[];mi=[]
 for i in range(150):
  a=random.random()*math.tau;t=random.random();rr=r*math.sqrt(random.random())*(.45+.55*math.sin(t*math.pi));z=.12+t*h
  pos=Vector((x+rr*math.cos(a),y+rr*math.sin(a),z));ang=random.random()*math.tau;l=random.uniform(.08,.16);u=Vector((math.cos(ang)*l,math.sin(ang)*l,.015));v=Vector((-math.sin(ang)*l*.43,math.cos(ang)*l*.43,l*.25));k=len(vs);vs.extend([pos-u,pos+v,pos+u,pos-v]);fs.append((k,k+1,k+2,k+3));mi.append(random.randrange(4))
 o=mesh('EXT shrub leaves',vs,fs,leafm[0]);[o.data.materials.append(m) for m in leafm[1:]]
 for p,i in zip(o.data.polygons,mi):p.material_index=i
for x,y,w,d in [(3,-1,4,1),(15.8,-1,3.2,1),(9,15.8,22,1.6)]:
 box('EXT planted border',(x,y,-.015),(w,d,.04),soil,.02)
 for i in range(max(2,int(w/.75))):shrub(x-w/2+.4+i*.75,y,random.uniform(.3,.5),random.uniform(.45,.9))
for x in [1.5,8.7,12.7,17]:
 box('EXT terrace planter',(x,10.5,.20),(.48,.48,.48),stone,.025);shrub(x,10.5,.38,1.05)
# Rear and side black metal fence; front left open to the forecourt.
for y in [17.0]:
 for z in [.16,1.08]:box('EXT fence rail',(9.2,y,z),(24,.035,.035),metal)
 for i in range(161):box('EXT fence picket',(-2.8+i*.15,y,.62),(.018,.018,1.12),metal)
for x in [-2.8,21.2]:
 for z in [.16,1.08]:box('EXT fence rail',(x,5.5,z),(.035,23,.035),metal)
 for i in range(154):box('EXT fence picket',(x,-6+i*.15,.62),(.018,.018,1.12),metal)
for x in range(-2,22,2):box('EXT fence post',(x,17,.61),(.05,.05,1.22),metal)
# Realistic daylight keeps the exterior readable without overexposing the indoor atlases.
s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.view_settings.exposure=-.25
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender-output/mikulovice_complete_source.blend'))
print('COMPLETE_SOURCE',len(s.objects),flush=True)
