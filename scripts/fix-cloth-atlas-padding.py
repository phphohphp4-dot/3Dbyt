import bpy,numpy as np,pathlib
ROOT=pathlib.Path('H:/hajduskova/code AI/VR web');OUT=ROOT/'public/mikulovice-complete'
def raster(mask,coords):
 h,w=mask.shape;a,b,c=np.asarray(coords)*[w,h]-.5
 lo=np.maximum(np.floor(np.minimum(np.minimum(a,b),c)).astype(int),0);hi=np.minimum(np.ceil(np.maximum(np.maximum(a,b),c)).astype(int)+1,[w,h])
 if np.any(hi<=lo):return
 den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
 if abs(den)<1e-8:return
 yy,xx=np.mgrid[lo[1]:hi[1],lo[0]:hi[0]]
 u=((b[1]-c[1])*(xx-c[0])+(c[0]-b[0])*(yy-c[1]))/den
 v=((c[1]-a[1])*(xx-c[0])+(a[0]-c[0])*(yy-c[1]))/den
 mask[lo[1]:hi[1],lo[0]:hi[0]]|=(u>=-.001)&(v>=-.001)&(u+v<=1.001)
def shift(a,dy,dx):
 out=np.roll(a,(dy,dx),(0,1))
 if dy>0:out[:dy]=0
 if dy<0:out[dy:]=0
 if dx>0:out[:,:dx]=0
 if dx<0:out[:,dx:]=0
 return out
for o in bpy.context.scene.objects:
 if not o.name.startswith('VR_bedroom_'):continue
 key=o.name[3:];o.data.calc_loop_triangles();uv=o.data.uv_layers.active.data
 allmask=np.zeros((2048,2048),bool);white=allmask.copy()
 for t in o.data.loop_triangles:
  coords=[uv[i].uv[:] for i in t.loops];raster(allmask,coords)
  if o.data.materials[t.material_index].name.startswith('V02 ivory woven cotton'):raster(white,coords)
 core=white.copy()
 for i in range(2):
  for dy,dx in [(0,1),(0,-1),(1,0),(-1,0)]:core&=shift(white if i==0 else core.copy(),dy,dx)
 for folder in [OUT,OUT/'lights-off']:
  file=folder/(key+'.png');stamp=folder/(key+'.padding-stamp')
  if not file.exists() or (stamp.exists() and stamp.read_text()==str(file.stat().st_mtime_ns)):continue
  im=bpy.data.images.load(str(file),check_existing=False);pixels=np.empty(2048*2048*4,np.float32);im.pixels.foreach_get(pixels);pixels=pixels.reshape(2048,2048,4)
  valid=core.copy();allowed=white|~allmask
  for step in range(9):
   count=np.zeros((2048,2048),np.float32);total=np.zeros((2048,2048,3),np.float32)
   for dy,dx in [(0,1),(0,-1),(1,0),(-1,0)]:
    neighbor=shift(valid,dy,dx);count+=neighbor;total+=shift(pixels[:,:,:3],dy,dx)*neighbor[:,:,None]
   fill=(~valid)&allowed&(count>0);pixels[fill,:3]=total[fill]/count[fill,None];valid|=fill
  im.pixels.foreach_set(pixels.ravel());im.filepath_raw=str(file);im.file_format='PNG';im.save();bpy.data.images.remove(im);stamp.write_text(str(file.stat().st_mtime_ns))
  print('PADDED',file,flush=True)
