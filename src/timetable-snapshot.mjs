export function snapshotTimes(snapshot,route,type,stations){
 const clean=name=>String(name||'').replace(/\([^)]*\)/g,'').replace(/역$/,'').trim();
 const station=stations.find(item=>item.line===route.line&&clean(item.name)===clean(route.from));
 if(!station)return [];
 const entry=snapshot?.entries?.[`${station.id}|${type}|${route.direction||'DOWN'}`];
 if(!entry)return [];
 const isYeongnam=route.line==='2호선'&&clean(route.to)==='영남대'&&(route.direction||'DOWN')==='DOWN';
 const values=isYeongnam?entry.yeongnam:entry.all;
 return [...new Set((values||[]).map(value=>{const [hour,minute]=value.split(':').map(Number);return hour*60+minute}))].filter(Number.isFinite).sort((a,b)=>a-b);
}
