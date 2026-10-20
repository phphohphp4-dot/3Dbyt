import json
from pathlib import Path
p=Path('public/mikulovice-complete/navigation.json');g=json.loads(p.read_text());blocked=0
beds=[(1,5,-1.5,-.5),(14.2,17.4,-1.5,-.5),(-2,20,15,16.6)]
for iz in range(g['nz']):
 for ix in range(g['nx']):
  k=iz*g['nx']+ix;x=g['ox']+(ix+.5)*g['step'];y=-(g['oz']+(iz+.5)*g['step'])
  if g['cells'][k] and any(a-.22<x<b+.22 and c-.22<y<d+.22 for a,b,c,d in beds):g['cells'][k]=0;blocked+=1
p.write_text(json.dumps(g));print('Planting-bed collision cells:',blocked)
