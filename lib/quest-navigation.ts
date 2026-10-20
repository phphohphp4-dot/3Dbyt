export interface NavigationGrid {step:number; nx:number; nz:number; ox:number; oz:number; cells:number[]}
export function canStand(g:NavigationGrid,x:number,z:number):boolean {
 const ix=Math.floor((x-g.ox)/g.step), iz=Math.floor((z-g.oz)/g.step);
 return ix>=0&&iz>=0&&ix<g.nx&&iz<g.nz&&g.cells[iz*g.nx+ix]===1;
}
export function canTravel(g:NavigationGrid,x:number,z:number,tx:number,tz:number):boolean {
 const n=Math.max(1,Math.ceil(Math.hypot(tx-x,tz-z)/(g.step*.4)));
 for(let i=0;i<=n;i++) if(!canStand(g,x+(tx-x)*i/n,z+(tz-z)*i/n)) return false;
 return true;
}
export function nearestStanding(g:NavigationGrid,x:number,z:number):[number,number] {
 let best=Infinity, result:[number,number]|null=null;
 for(let iz=0;iz<g.nz;iz++)for(let ix=0;ix<g.nx;ix++)if(g.cells[iz*g.nx+ix]) {
  const px=g.ox+(ix+.5)*g.step,pz=g.oz+(iz+.5)*g.step,d=(px-x)**2+(pz-z)**2;
  if(d<best){best=d;result=[px,pz];}
 }
 if(!result)throw new Error('Model nemá dostupnou podlahu.');return result;
}
