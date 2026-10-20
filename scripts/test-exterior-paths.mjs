import fs from 'node:fs';
import assert from 'node:assert/strict';
import {canTravel} from '../lib/quest-navigation.ts';
import {panelBlocks} from '../lib/quest-interactions.ts';
const g=JSON.parse(fs.readFileSync('public/mikulovice-complete/navigation.json','utf8'));
for(const center of [3.080808,6.939394,14.515152]){
 const x=center-.43;
 assert.ok(canTravel(g,x,-8.6,x,-10),`Continuous terrace threshold at ${center}`);
 assert.ok(panelBlocks({x:center-.86,z:-9.19,width:.86,angle:0},x,-9.19),'Closed pane blocks threshold');
 assert.ok(!panelBlocks({x:center,z:-9.19,width:.86,angle:0},x,-9.19),'Open pane clears threshold');
 assert.ok(!panelBlocks({x:center,z:-9.247,width:.86,angle:0},x,-9.19),'Fixed pane leaves sufficient clearance');
}
assert.ok(canTravel(g,11.5,-.8,11.5,.8),'Main entry connects inside and forecourt');
console.log('All three terrace thresholds and main entrance are continuously traversable with doors open.');
