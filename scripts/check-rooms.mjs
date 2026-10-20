import fs from 'node:fs';
import assert from 'node:assert/strict';
import {canStand,nearestStanding} from '../lib/quest-navigation.ts';
const g=JSON.parse(fs.readFileSync(process.argv[2]||'public/mikulovice/navigation.json','utf8'));
const spawn=nearestStanding(g,3.65,-5.35);
const idx=(x,z)=>Math.floor((z-g.oz)/g.step)*g.nx+Math.floor((x-g.ox)/g.step);
const seen=new Set([idx(...spawn)]), queue=[...seen];
for(let i=0;i<queue.length;i++){const p=queue[i],x=p%g.nx,z=Math.floor(p/g.nx);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,zz=z+dz,q=zz*g.nx+xx;if(xx>=0&&xx<g.nx&&zz>=0&&zz<g.nz&&g.cells[q]&&!seen.has(q)){seen.add(q);queue.push(q);}}}
for(const [name,x,z] of [['3kk living',3.2,-6.3],['north bedroom',6.45,-6.55],['south bedroom',6,-3.5],['hall',11.6,-1.2],['2kk living',16,-7],['2kk living entry',14.2,-5.1],['2kk bedroom',15.55,-3.45],['bath west',9.2,-1.5],['bath east',13.8,-1.4],['terrace west',2.6,-10.3],['terrace east',14,-10.2],['garden',6.5,-14],['front forecourt',8,4.5],['west side path',-.8,-5],['east side path',19.3,-5],['main threshold',11.5,-.24]]){const p=nearestStanding(g,x,z);assert.ok(Math.hypot(p[0]-x,p[1]-z)<.4,name+' has a nearby walkable floor');assert.ok(seen.has(idx(...p)),name+' must remain reachable');console.log(name,p,'reachable',true);}
console.log('Walkable component',seen.size,'/',g.cells.filter(Boolean).length);


