export function estimateRideMinutes(fromOrder,toOrder,line){
 const stops=Math.abs(Number(fromOrder)-Number(toOrder));
 if(!Number.isInteger(stops)||stops<1||stops>50)throw Error('역 간 거리를 계산할 수 없어요.');
 return Math.ceil(stops*(line==='3호선'?2:2.5));
}
