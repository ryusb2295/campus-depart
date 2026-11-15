export function distanceMeters(a,b){
 const rad=Math.PI/180;
 const dLat=(b.lat-a.lat)*rad,dLon=(b.lon-a.lon)*rad;
 const h=Math.sin(dLat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLon/2)**2;
 return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}
export function estimateWalkMinutes(meters){
 if(!Number.isFinite(meters)||meters<0)throw Error('거리 계산 실패');
 return Math.max(1,Math.ceil(meters*1.3/72));
}
