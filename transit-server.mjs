import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {tagoUrl,tagoItems,stationId,departureTimes,dayCode,directionCode} from './src/tago.mjs';
const cache = new Map();
const coordinates=JSON.parse(readFileSync(new URL('./src/station-coords.json',import.meta.url),'utf8')).stations;
const stationName=value=>String(value||'').replace(/\([^)]*\)/g,'').replace(/역$/,'').trim();
function serviceKey(){
 if(process.env.TAGO_SERVICE_KEY)return process.env.TAGO_SERVICE_KEY.trim();
 try{const env=readFileSync(resolve('.env.local'),'utf8');return env.match(/^TAGO_SERVICE_KEY=(.*)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g,'')||''}catch{return ''}
}
async function tagoRequest(operation,params,key){
 const response=await fetch(tagoUrl(operation,params,key),{signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error('TAGO HTTP '+response.status);
 return tagoItems(await response.json());
}
export async function transitHandler(req,res,next) {
 const input=new URL(req.url,'http://localhost');
 if(input.pathname!='/api/transit'&&input.pathname!='/api/stations'){if(next)return next();return false;}
 res.setHeader('Access-Control-Allow-Origin','*');
 try {
  if(input.pathname==='/api/stations'){
   let stations=cache.get('stations');
   if(!stations||Date.now()-stations.time>86400000){
    const secret=serviceKey();if(!secret)throw Error('missing-key');
    const all=[];
    for(let page=1;page<=3;page++){
     const batch=await tagoRequest('GetKwrdFndSubwaySttnList',{subwayStationName:'',numOfRows:'1000',pageNo:String(page)},secret);
     all.push(...batch);if(batch.length<1000)break;
    }
    stations={time:Date.now(),items:all.filter(x=>/^MTRDG[123]/.test(String(x.subwayStationId||''))).map(x=>{const coord=coordinates.find(c=>c.line===x.subwayRouteName&&stationName(c.name)===stationName(x.subwayStationName));return coord?{id:String(x.subwayStationId),name:String(x.subwayStationName),line:String(x.subwayRouteName),order:coord.order,lat:coord.lat,lon:coord.lon}:null}).filter(Boolean)};
    cache.set('stations',stations);
   }
   res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=3600'});res.end(JSON.stringify(stations.items));return true;
  }
  const station=input.searchParams.get('station')?.trim();
  const line=input.searchParams.get('line'), direction=input.searchParams.get('direction'), type=input.searchParams.get('type'), destination=input.searchParams.get('destination')?.trim()||'';
  if(!station||station.length>40||destination.length>40||!['1','2','3'].includes(line)||!['UP','DOWN'].includes(direction)||!['WEEKDAY','SAT','HOLIDAY'].includes(type)){res.writeHead(400);res.end('Invalid transit query');return;}
  const key=JSON.stringify([station,line,direction,type,destination]);let item=cache.get(key);
  if(!item||Date.now()-item.time>3600000){
   const secret=serviceKey();if(!secret)throw Error('missing-key');
   const found=await tagoRequest('GetKwrdFndSubwaySttnList',{subwayStationName:station,numOfRows:'100',pageNo:'1'},secret);
   const id=stationId(found,station,line);
   const schedule=await tagoRequest('GetSubwaySttnAcctoSchdulList',{subwayStationId:id,dailyTypeCode:dayCode(type),upDownTypeCode:directionCode(direction),numOfRows:'1000',pageNo:'1'},secret);
   const requiresTerminal=line==='2'&&destination.replace(/역$/,'')==='영남대';
   const relevant=requiresTerminal?schedule.filter(x=>String(x.endSubwayStationNm||'').replace(/역$/,'')==='영남대'):schedule;
   const xml='<SCHEDULE>'+departureTimes(relevant).join(',')+'</SCHEDULE>';
   item={time:Date.now(),xml};cache.set(key,item);
  }
  res.writeHead(200,{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'no-store'});res.end(item.xml);
 }catch(error){res.writeHead(502,{'Content-Type':'text/plain; charset=utf-8'});res.end(error instanceof Error&&error.message==='missing-key'?'TAGO 인증키가 서버에 설정되지 않았어요. .env.local에 TAGO_SERVICE_KEY를 입력해 주세요.':error instanceof Error?error.message:'TAGO 시간표를 가져오지 못했어요.');}
 return true;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve('transit-server.mjs')){
 const root=resolve('dist');
 createServer(async(req,res)=>{if(await transitHandler(req,res))return;try{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=resolve(root,'.'+path); if(file!==root&&!file.startsWith(root+String.fromCharCode(92))&&!file.startsWith(root+'/')){res.writeHead(403);res.end();return;}
 if(!extname(file))file=resolve(root,'index.html');
 const data=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'})[extname(file)]||'application/octet-stream');res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}}).listen(Number(process.env.PORT)||4173,'0.0.0.0');
}
