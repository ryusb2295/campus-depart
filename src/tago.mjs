const base='https://apis.data.go.kr/1613000/SubwayInfo/';
export function tagoUrl(operation,params,key){
 const url=new URL(operation,base);
 url.search=new URLSearchParams({serviceKey:decodeURIComponent(key),_type:'json',...params}).toString();
 return url;
}
export function tagoItems(data){
 const response=data?.response;
 if(!response||String(response.header?.resultCode)!=='00')throw Error('TAGO 응답 오류');
 const item=response.body?.items?.item;
 return Array.isArray(item)?item:item?[item]:[];
}
export function stationId(items,station,line){
 const match=items.find(x=>String(x.subwayStationName||'').replace(/역$/,'')===station.replace(/역$/,'')&&String(x.subwayRouteName||'').replace(/[^0-9]/g,'')===line);
 if(!match?.subwayStationId)throw Error('역 이름과 호선에 일치하는 TAGO 역 ID가 없어요.');
 return String(match.subwayStationId);
}
export function departureTimes(items){
 const times=items.map(x=>String(x.depTime??x.deptime??x.leftTime??x.lefttime??x.arrTime??x.arrtime??'').trim())
  .filter(x=>/^(?:(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?|(?:[01]\d|2[0-3])[0-5]\d[0-5]\d)$/.test(x))
  .map(x=>{if(!x.includes(':'))return `${x.slice(0,2)}:${x.slice(2,4)}`;const [h,m]=x.split(':');return `${h.padStart(2,'0')}:${m}`});
 const result=[...new Set(times)].sort();
 if(!result.length)throw Error('TAGO 시간표에 유효한 열차시각이 없어요.');
 return result;
}
export function dayCode(type){return {WEEKDAY:'01',SAT:'02',HOLIDAY:'03'}[type]}
export function directionCode(direction){return {UP:'U',DOWN:'D'}[direction]}
