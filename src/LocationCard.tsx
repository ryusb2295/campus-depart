import {useState} from 'react';
import {LocateFixed,MapPin,Check,ChevronRight} from 'lucide-react';
import {distanceMeters,estimateWalkMinutes} from './geo.mjs';
import stationData from './daegu-stations.json';

type Point={lat:number;lon:number;accuracy:number;time:number};
export type Nearby={id:string;name:string;line:string;order:number;meters:number};
function readHome():Point|null{try{const p=JSON.parse(localStorage.getItem('ng-origin-point')||'null');return p&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)?p:null}catch{return null}}
function nearestStation(point:Point):Nearby|null{
 const nearest=stationData.stations.map(station=>({...station,meters:distanceMeters(point,station)})).sort((a,b)=>a.meters-b.meters)[0];
 return nearest||null;
}
function localityLabel(data:{principalSubdivision?:string;city?:string;locality?:string}){
 return [...new Set([data.principalSubdivision,data.city,data.locality].filter(Boolean))].join(' ');
}
export function LocationCard({station,onEdit,onApply}:{station:string;onEdit:()=>void;onApply:(point:Point)=>void}){
 const [point,setPoint]=useState<Point|null>(null);
 const [home,setHome]=useState<Point|null>(readHome);
 const [nearby,setNearby]=useState<Nearby|null>(null);
 const [area,setArea]=useState('');
 const [status,setStatus]=useState('');
 const [busy,setBusy]=useState(false);
 function locate(){
  if(!window.isSecureContext){setStatus('위치 확인에는 HTTPS 접속이 필요해요.');return}
  if(!navigator.geolocation){setStatus('위치 기능을 지원하지 않는 브라우저예요.');return}
  setBusy(true);setStatus('현재 위치를 확인하고 있어요…');setArea('');setNearby(null);
  navigator.geolocation.getCurrentPosition(async p=>{
   const current={lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy,time:Date.now()};
   setPoint(current);setNearby(nearestStation(current));setBusy(false);
   if(current.accuracy>300){setStatus(`위치 오차가 약 ${Math.round(current.accuracy)}m예요. 가까운 역은 참고용으로 확인해 주세요.`)}
   else setStatus('현재 위치 주변을 확인했어요.');
   try{
    const url=new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
    url.search=new URLSearchParams({latitude:String(current.lat),longitude:String(current.lon),localityLanguage:'ko'}).toString();
    const response=await fetch(url,{signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw Error('주소 조회 실패');
    const label=localityLabel(await response.json());
    setArea(label||'주변 지역 이름을 찾지 못했어요.');
   }catch{setArea('주변 지역 이름을 가져오지 못했어요. 가까운 역은 아래에서 확인할 수 있어요.')}
  },e=>{setBusy(false);setStatus(e.code===1?'위치 권한이 꺼져 있어요. 브라우저에서 허용해 주세요.':e.code===3?'위치 확인 시간이 초과됐어요. 다시 시도해 주세요.':'위치를 확인할 수 없어요. 휴대폰 위치 설정을 확인해 주세요.')},{enableHighAccuracy:true,timeout:12000,maximumAge:0});
 }
 const gap=point&&home?distanceMeters(point,home):null;
 return <details className="location-card"><summary className="location-top"><span className="location-pin"><MapPin size={18}/></span><div><small>출발 기준</small><strong>저장한 경로 · {station}역</strong></div><ChevronRight className="location-chevron" size={18}/></summary>
  <p>현재 위치 주변과 가까운 역을 확인해요.</p>
  <div className="location-actions"><button disabled={busy} className="locate-action" onClick={locate}><LocateFixed size={16} className={busy?'spin':''}/>{busy?'위치 확인 중':'현재 위치 확인'}</button><button className="text-action" onClick={onEdit}>경로 설정</button></div>
  {status&&<div role="status" className="location-result">{status}</div>}
  {point&&<div className="location-details"><strong className="location-area">{area||'주변 지역을 찾는 중…'}</strong>{nearby&&<div className="location-nearest"><small>가장 가까운 대구 지하철역</small><strong>{nearby.name}역 <span>{nearby.line}</span></strong><span>직선거리 약 {Math.round(nearby.meters)}m · 예상 도보 {estimateWalkMinutes(nearby.meters)}분</span></div>}<span>위치 오차 약 {Math.round(point.accuracy)}m · {new Date(point.time).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})} 확인</span>{gap!==null&&<span>{gap>300?`저장한 출발지에서 약 ${(gap/1000).toFixed(1)}km 떨어져 있어요.`:'저장한 출발지 근처예요.'}</span>}<button disabled={point.accuracy>150||!nearby} onClick={()=>{if(!nearby)return;try{localStorage.setItem('ng-origin-point',JSON.stringify(point));setHome(point);onApply(point);setStatus('현재 위치를 출발지와 출발시간 계산에 적용했어요.')}catch{setStatus('출발지를 저장하지 못했어요.')}}}><Check size={14}/> 이 위치를 출발지로 적용</button></div>}
  {home&&<button className="forget-location" onClick={()=>{try{localStorage.removeItem('ng-origin-point');setHome(null);setStatus('저장한 출발지를 삭제했어요.')}catch{setStatus('저장한 출발지를 삭제하지 못했어요.')}}}>저장한 출발지 삭제</button>}
  <small className="location-footnote">지역 이름은 주소 조회 서비스로 확인하며, 도로명주소는 제공하지 않아요. 도보시간은 직선거리 추정치예요.</small>
 </details>
}
