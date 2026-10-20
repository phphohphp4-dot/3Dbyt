export type HousePlacement={lat:number;lng:number;width:number;length:number;rotation:number};
export type IntakeRecord={id:string;created:string;name:string;email:string;note:string;filename:string;mime:string;placement:HousePlacement;status:'new'};
export function validPlacement(v:unknown):HousePlacement{
 const p=v as HousePlacement;
 if(!p||![p.lat,p.lng,p.width,p.length,p.rotation].every(Number.isFinite)||Math.abs(p.lat)>80||Math.abs(p.lng)>180||p.width<2||p.width>200||p.length<2||p.length>200||p.rotation<0||p.rotation>=360)throw new Error('Zkontrolujte umístění a rozměry domu (2–200 m).');
 return{lat:p.lat,lng:p.lng,width:p.width,length:p.length,rotation:p.rotation};
}
/** Local east/north metric offsets projected onto a sphere; dimensions stay in metres at every map zoom. */
export function houseCorners(p:HousePlacement):[number,number][]{
 const angle=p.rotation*Math.PI/180,r=6378137,cosLat=Math.cos(p.lat*Math.PI/180);
 return[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx,sy])=>{const x=sx*p.width/2,y=sy*p.length/2,east=x*Math.cos(angle)+y*Math.sin(angle),north=-x*Math.sin(angle)+y*Math.cos(angle);return[p.lat+north/r*180/Math.PI,p.lng+east/(r*cosLat)*180/Math.PI];});
}
