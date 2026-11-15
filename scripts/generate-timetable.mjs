import {readFileSync,writeFileSync} from 'node:fs';
import {tagoUrl,tagoItems,departureTimes,dayCode,directionCode} from '../src/tago.mjs';

const key=process.env.TAGO_SERVICE_KEY||readFileSync('.env.local','utf8').match(/^TAGO_SERVICE_KEY=(.*)$/m)?.[1]?.trim();
if(!key)throw Error('TAGO_SERVICE_KEY is required');
const stations=JSON.parse(readFileSync('src/daegu-stations.json','utf8')).stations;
const jobs=stations.flatMap(station=>['WEEKDAY','SAT','HOLIDAY'].flatMap(type=>['UP','DOWN'].map(direction=>({station,type,direction}))));
const entries={};
const failures=[];
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function get(job){
 const {station,type,direction}=job;
 const url=tagoUrl('GetSubwaySttnAcctoSchdulList',{subwayStationId:station.id,dailyTypeCode:dayCode(type),upDownTypeCode:directionCode(direction),numOfRows:'1000',pageNo:'1'},key);
 for(let attempt=0;attempt<3;attempt++){
  try{
   const response=await fetch(url,{signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw Error(`HTTP ${response.status}`);
   const items=tagoItems(await response.json());
   if(!items.length)return;
   let all=[];try{all=departureTimes(items)}catch{return}
   const toYeongnam=items.filter(item=>String(item.endSubwayStationNm||'').replace(/역$/,'')==='영남대');
   let yeongnam=[];try{yeongnam=departureTimes(toYeongnam)}catch{}
   entries[`${station.id}|${type}|${direction}`]={all,yeongnam};
   return;
  }catch(error){if(attempt===2)failures.push(`${station.id}|${type}|${direction}: ${error.message}`);else await wait(600*(attempt+1))}
 }
}
let next=0;
async function worker(){while(next<jobs.length){const job=jobs[next++];await get(job);await wait(120)}}
await Promise.all(Array.from({length:3},worker));
if(failures.length){console.error(failures.slice(0,10).join('\n'));throw Error(`${failures.length} timetable requests failed`)}
const output={source:'https://www.data.go.kr/data/15098554/openapi.do',generatedAt:new Date().toISOString(),entries};
writeFileSync('public/timetable-snapshot.json',JSON.stringify(output));
console.log(`Saved ${Object.keys(entries).length} timetables from ${jobs.length} requests`);
