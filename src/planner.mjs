export const minutes = value => {const [h,m]=value.split(':').map(Number);return h*60+m;};
export const clock = value => {const n=((Math.round(value)%1440)+1440)%1440;return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;};
export function planTrip(course,route,trains,skip=0){
 if(!course)return null;
 if(route.walkOnly){
  const atClass=minutes(course.start)-route.buffer;
  return {walkOnly:true,leave:atClass-route.homeWalk-route.campusWalk,atClass,late:0,margin:route.buffer};
 }
 const deadline=minutes(course.start)-route.campusWalk-route.buffer;
 const candidates=trains.filter(t=>t.arrival<=deadline).sort((a,b)=>b.departure-a.departure);
 const baseline=candidates[0];if(!baseline)return null;
 const later=trains.filter(t=>t.departure>=baseline.departure).sort((a,b)=>a.departure-b.departure);
 const train=later[skip];if(!train)return null;
 const atClass=train.arrival+route.campusWalk;
 return {...train,leave:train.departure-route.homeWalk-route.platform,atClass,late:Math.max(0,atClass-minutes(course.start)),margin:minutes(course.start)-atClass};
}
// Deliberately synthetic schedule. Never presented as official transit data.
export function demoTrains(ride){return Array.from({length:151},(_,i)=>({departure:330+i*6,arrival:330+i*6+ride})).filter(t=>t.arrival<1440);}
