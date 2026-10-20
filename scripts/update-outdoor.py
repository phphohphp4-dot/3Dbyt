from pathlib import Path
p=Path('components/3d/QuestTour.tsx');s=p.read_text('utf-8');s=s.replace("import {TourInteractions}","import {addOutdoorSurfaceDetail} from '@/lib/quest-outdoor';\nimport {TourInteractions}")
s=s.replace('let interactions:TourInteractions|undefined;', 'let interactions:TourInteractions|undefined;let disposeOutdoor:(()=>void)|undefined;')
s=s.replace('nav=n;scene.add(model);', 'nav=n;scene.add(model);void addOutdoorSurfaceDetail(model,assetBase).then(cleanup=>{if(disposed)cleanup();else disposeOutdoor=cleanup;}).catch(()=>{});')
s=s.replace('disposed=true;interactions?.dispose();','disposed=true;disposeOutdoor?.();interactions?.dispose();')
p.write_text(s,encoding='utf-8')
p=Path('scripts/build-quest-static.cjs');s=p.read_text('utf-8-sig').replace("'oak.jpg'","'oak.jpg','aerial_grass_rock.jpg','concrete_pavement.jpg'");p.write_text(s,encoding='utf-8')
p=Path('scripts/optimize-quest-glb.cjs');s=p.read_text('utf-8-sig').replace('m.doubleSided=false;','m.doubleSided=m.name.includes("exterior_shell")||m.name.includes("exterior_foliage");');p.write_text(s,encoding='utf-8')
p=Path('public/mikulovice/CREDITS.txt');s=p.read_text('utf-8-sig');s+='\nOutdoor grass: https://polyhaven.com/a/aerial_grass_rock (CC0)\nOutdoor paving: https://polyhaven.com/a/concrete_pavement (CC0)\n';p.write_text(s,encoding='utf-8')
