import bpy
root='H:/hajduskova/code AI/VR web/blender-output/textures/'
oak=bpy.data.images.load(root+'oak_veneer_05.jpg',check_existing=True)
fabric=bpy.data.images.load(root+'rough_linen.jpg',check_existing=True)
for name in ['V02 honey oak','V02 horizontal oak veneer']:
 m=bpy.data.materials[name];nt=m.node_tree;p=next(n for n in nt.nodes if n.type=='BSDF_PRINCIPLED')
 tc=nt.nodes.new('ShaderNodeTexCoord');tex=nt.nodes.new('ShaderNodeTexImage');tex.image=oak;tex.projection='BOX';tex.projection_blend=.15
 nt.links.new(tc.outputs['Generated'],tex.inputs['Vector']);nt.links.new(tex.outputs['Color'],p.inputs['Base Color']);p.inputs['Roughness'].default_value=.48
# Floor grain follows the long axis, using a narrow slice of the photographic oak.
floor=bpy.data.materials['V02 honey oak'].copy();floor.name='Refined photographed oak flooring';nt=floor.node_tree;p=next(n for n in nt.nodes if n.type=='BSDF_PRINCIPLED')
tc=nt.nodes.new('ShaderNodeTexCoord');sep=nt.nodes.new('ShaderNodeSeparateXYZ');comb=nt.nodes.new('ShaderNodeCombineXYZ');mul=nt.nodes.new('ShaderNodeMath');mul.operation='MULTIPLY';mul.inputs[1].default_value=.15
nt.links.new(tc.outputs['Generated'],sep.inputs[0]);nt.links.new(sep.outputs['Y'],comb.inputs['X']);nt.links.new(sep.outputs['X'],mul.inputs[0]);nt.links.new(mul.outputs[0],comb.inputs['Y'])
tex=nt.nodes.new('ShaderNodeTexImage');tex.image=oak;nt.links.new(comb.outputs[0],tex.inputs[0]);nt.links.new(tex.outputs['Color'],p.inputs['Base Color'])
for o in bpy.context.scene.objects:
 if o.name.startswith('Oak floor board'):o.data.materials.clear();o.data.materials.append(floor)
for name in ['Refined pearl grey linen','Refined ivory cushion','Refined sand cushion','Refined oatmeal rug']:
 m=bpy.data.materials[name];nt=m.node_tree;p=next(n for n in nt.nodes if n.type=='BSDF_PRINCIPLED');base=m.diffuse_color[:]
 tint={'Refined pearl grey linen':(.47,.46,.43),'Refined ivory cushion':(.73,.70,.64),'Refined sand cushion':(.39,.30,.22),'Refined oatmeal rug':(.42,.38,.32)}[name]
 tc=nt.nodes.new('ShaderNodeTexCoord');v=nt.nodes.new('ShaderNodeVectorMath');v.operation='SCALE';v.inputs['Scale'].default_value=3;nt.links.new(tc.outputs['Generated'],v.inputs[0])
 tex=nt.nodes.new('ShaderNodeTexImage');tex.image=fabric;tex.projection='BOX';tex.projection_blend=.3;nt.links.new(v.outputs[0],tex.inputs[0]);grey=nt.nodes.new('ShaderNodeRGBToBW');nt.links.new(tex.outputs['Color'],grey.inputs[0])
 ramp=nt.nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=tuple(c*.87 for c in tint)+(1,);ramp.color_ramp.elements[1].position=.45;ramp.color_ramp.elements[1].color=tuple(c*1.06 for c in tint)+(1,);nt.links.new(grey.outputs[0],ramp.inputs[0]);nt.links.new(ramp.outputs[0],p.inputs['Base Color'])
 bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.12;bump.inputs['Distance'].default_value=.0004;nt.links.new(grey.outputs[0],bump.inputs['Height']);nt.links.new(bump.outputs[0],p.inputs['Normal'])
