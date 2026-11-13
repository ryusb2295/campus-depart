import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const cache = new Map();
export async function transitHandler(req,res,next) {
 const input=new URL(req.url,'http://localhost');
 if(input.pathname!='/api/transit'){if(next)return next();return false;}
 res.setHeader('Access-Control-Allow-Origin','*');
 try {
  const station=input.searchParams.get('station')?.trim();
  const line=input.searchParams.get('line'), direction=input.searchParams.get('direction'), type=input.searchParams.get('type');
  if(!station||station.length>40||!['1','2','3'].includes(line)||!['UP','DOWN'].includes(direction)||!['WEEKDAY','SAT','HOLIDAY'].includes(type)){res.writeHead(400);res.end('Invalid transit query');return;}
  const key=JSON.stringify([station,line,direction,type]);let item=cache.get(key);
  if(!item||Date.now()-item.time>3600000){
   const url=new URL('https://www.dtro.or.kr/open_content_new/ko/OpenApi/stationTime.php');
   for(const [k,v] of Object.entries({STT_NM:station,LINE_NO:line,LINE_CD:line,SCHEDULE_METH:direction,SCHEDULE_TYPE:type}))url.searchParams.set(k,v);
   const response=await fetch(url,{signal:AbortSignal.timeout(12000)});
   if(!response.ok)throw Error('Upstream HTTP '+response.status);
   const bytes=await response.arrayBuffer();const charset=response.headers.get('content-type')||'';
   const xml=new TextDecoder(/euc-kr|ks_c_5601/i.test(charset)?'euc-kr':'utf-8').decode(bytes);
   if(!/<SCHEDULE(?:\s|>)/i.test(xml))throw Error('No schedule returned');
   item={time:Date.now(),xml};cache.set(key,item);
  }
  res.writeHead(200,{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'no-store'});res.end(item.xml);
 }catch{res.writeHead(502,{'Content-Type':'text/plain; charset=utf-8'});res.end('대구교통공사 시간표를 가져오지 못했어요. 네트워크와 역 설정을 확인하고 다시 시도해 주세요.');}
 return true;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve('transit-server.mjs')){
 const root=resolve('dist');
 createServer(async(req,res)=>{if(await transitHandler(req,res))return;try{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=resolve(root,'.'+path); if(file!==root&&!file.startsWith(root+String.fromCharCode(92))&&!file.startsWith(root+'/')){res.writeHead(403);res.end();return;}
 if(!extname(file))file=resolve(root,'index.html');
 const data=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'})[extname(file)]||'application/octet-stream');res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}}).listen(Number(process.env.PORT)||4173,'0.0.0.0');
}
