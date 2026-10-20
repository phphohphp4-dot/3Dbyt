import * as THREE from 'three';

/** Adds metre-scale surface detail while retaining the baked light and contact shadows. */
export async function addOutdoorSurfaceDetail(model:THREE.Group,base:string){
 const loader=new THREE.TextureLoader();
 const textures=await Promise.all(['grass_ground','concrete_pavement'].map(async name=>{
  const t=await loader.loadAsync(base+'/'+name+'.jpg');t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;
 }));
 model.traverse(o=>{
  if(!(o instanceof THREE.Mesh)||!o.name.startsWith('VR_exterior_ground'))return;
  const materials=Array.isArray(o.material)?o.material:[o.material];
  for(const m of materials){
   m.onBeforeCompile=(shader:THREE.WebGLProgramParametersWithUniforms)=>{
    shader.uniforms.grassDetail={value:textures[0]};shader.uniforms.pavingDetail={value:textures[1]};
    shader.vertexShader='varying vec3 vSurfaceWorld;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','vSurfaceWorld=(modelMatrix*vec4(transformed,1.0)).xyz;\n#include <project_vertex>');
    shader.fragmentShader='uniform sampler2D grassDetail;\nuniform sampler2D pavingDetail;\nvarying vec3 vSurfaceWorld;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
     bool paving=vSurfaceWorld.z>0.4 || vSurfaceWorld.x< -0.15 || vSurfaceWorld.x>18.65 || abs(vSurfaceWorld.z+12.5)<0.47;
     vec3 detail=paving?texture2D(pavingDetail,vSurfaceWorld.xz*.7).rgb:texture2D(grassDetail,vSurfaceWorld.xz*.4).rgb;
     float luminance=dot(detail,vec3(.2126,.7152,.0722));
     float variation=clamp(luminance/(paving?.32:.16),.58,1.55);
     diffuseColor.rgb*=mix(1.0,variation,.72);
    `);
   };
   m.customProgramCacheKey=()=> 'outdoor-detail-v1';m.needsUpdate=true;
  }
 });
 return ()=>textures.forEach(t=>t.dispose());
}
