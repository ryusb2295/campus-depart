import {useEffect,useState} from 'react';
import {ArrowRight,ChevronDown,LocateFixed,MapPin} from 'lucide-react';
import {Button} from '@astryxdesign/core/Button';
import {estimateRideMinutes} from './route-estimate.mjs';
import {distanceMeters,estimateWalkMinutes} from './geo.mjs';
import stationData from './daegu-stations.json';

export type RouteConfig={from:string;to:string;line:string;direction?:string;serviceType?:string;homeWalk:number;campusWalk:number;platform:number;buffer:number;ride:number;school:string;walkOnly?:boolean;originPointApplied?:boolean};
type Station={id:string;name:string;line:string;order:number;lat:number;lon:number};
const clean=(name:string)=>name.replace(/\([^)]*\)/g,'').replace(/역$/,'').trim();
const findStation=(stations:Station[],name:string,line:string)=>stations.find(s=>s.line===line&&clean(s.name)===clean(name));
const terminalByLine:Record<string,{UP:string;DOWN:string}>={'1호선':{UP:'설화명곡',DOWN:'하양'},'2호선':{UP:'문양',DOWN:'영남대'},'3호선':{UP:'칠곡경대병원',DOWN:'용지'}};
export function directionName(line:string,direction:string){return `${terminalByLine[line]?.[direction as 'UP'|'DOWN']||'목적지'} 방면`}
function StationPicker({label,value,onValue,onSelect,stations,selected}:{label:string;value:string;onValue:(v:string)=>void;onSelect:(s:Station|null)=>void;stations:Station[];selected:Station|null}){
 const [open,setOpen]=useState(false),[browse,setBrowse]=useState(false),[line,setLine]=useState('전체');
 const query=value.trim().toLocaleLowerCase();
 const matches=stations.filter(s=>(line==='전체'||s.line===line)&&(!query||s.name.toLocaleLowerCase().includes(query)));
 const visible=browse?matches:matches.slice(0,6);
 return <div className="station-picker" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false)}}><label>{label}<input autoComplete="off" value={value} onFocus={()=>setOpen(true)} onChange={e=>{onValue(e.target.value);onSelect(null);setOpen(true);setBrowse(false)}} placeholder="역 이름을 입력하세요" aria-expanded={open} aria-autocomplete="list"/></label>{selected&&<span className="station-picked">{selected.line}</span>}{open&&<div className="station-options" role="listbox"><div className="station-filter">{['전체','1호선','2호선','3호선'].map(x=><button key={x} type="button" className={line===x?'active':''} onClick={()=>{setLine(x);setBrowse(true)}}>{x}</button>)}</div><div className="station-results">{visible.map(s=><button type="button" role="option" aria-selected={selected?.id===s.id} key={s.id} onClick={()=>{onValue(s.name);onSelect(s);setOpen(false);setBrowse(false)}}><MapPin size={15}/><span>{s.name}</span><small>{s.line}</small></button>)}{!visible.length&&<p>일치하는 역이 없어요.</p>}</div>{matches.length>6&&!browse&&<button className="station-all" type="button" onClick={()=>setBrowse(true)}>역 {matches.length}개 모두 보기 <ChevronDown size={14}/></button>}</div>}</div>
}
export function RouteForm({route,onSave}:{route:RouteConfig;onSave:(route:RouteConfig)=>void}){
 const [stations,setStations]=useState<Station[]>(stationData.stations),[error,setError]=useState('');
 const [from,setFrom]=useState(route.from),[to,setTo]=useState(route.to);
 const [fromStation,setFromStation]=useState<Station|null>(()=>findStation(stationData.stations,route.from,route.line)||null),[toStation,setToStation]=useState<Station|null>(()=>findStation(stationData.stations,route.to,route.line)||null);
 const [buffer,setBuffer]=useState(route.buffer<=5?5:route.buffer>=20?20:10);
 const [point,setPoint]=useState<{lat:number;lon:number}|null>(null),[locating,setLocating]=useState(false),[locationStatus,setLocationStatus]=useState('');
 useEffect(()=>{const controller=new AbortController();const url=(import.meta.env.VITE_TRANSIT_API_URL||'/api/transit').replace(/\/api\/transit$/,'/api/stations');fetch(url,{signal:controller.signal}).then(async r=>{if(!r.ok)throw Error('역 목록 갱신 실패');return r.json()}).then((items:Station[])=>{if(items.length){setStations(items);setFromStation(current=>current?findStation(items,current.name,current.line)||current:null);setToStation(current=>current?findStation(items,current.name,current.line)||current:null)}}).catch(e=>{if(e.name!=='AbortError'&&!stationData.stations.length)setError('역 목록을 가져오지 못했어요.')});return()=>controller.abort()},[]);
 const sameLine=fromStation&&toStation&&fromStation.line===toStation.line;
 const sameStation=fromStation&&toStation&&fromStation.id===toStation.id;
 const inferred=sameLine?(fromStation.order<toStation.order?'DOWN':'UP'):route.direction||'DOWN';
 const direction=inferred;
 const ride=sameLine&&!sameStation?estimateRideMinutes(fromStation.order,toStation.order,fromStation.line):route.ride;
 const homeWalk=fromStation&&point?estimateWalkMinutes(distanceMeters(point,fromStation)):route.homeWalk;
 function locate(){
  if(!window.isSecureContext||!navigator.geolocation){setLocationStatus('위치 확인은 HTTPS 연결과 브라우저 위치 권한이 필요해요.');return}
  setLocating(true);setLocationStatus('현재 위치를 확인하는 중…');
  navigator.geolocation.getCurrentPosition(({coords})=>{
   setLocating(false);
   if(coords.accuracy>300){setLocationStatus(`위치 오차가 약 ${Math.round(coords.accuracy)}m라 가까운 역을 정확히 고르기 어려워요. 역 목록에서 골라 주세요.`);return}
   const current={lat:coords.latitude,lon:coords.longitude};
   const closest=stations.map(station=>({station,meters:distanceMeters(current,station)})).sort((a,b)=>a.meters-b.meters)[0];
   if(!closest){setLocationStatus('역 좌표를 불러오지 못했어요.');return}
   setPoint(current);setFromStation(closest.station);setFrom(closest.station.name);
   setLocationStatus(`${closest.station.name}이(가) 가장 가까워 보여요. 직선거리 약 ${Math.round(closest.meters)}m · 예상 도보 ${estimateWalkMinutes(closest.meters)}분. 실제 보행로에 따라 달라질 수 있어요.`);
  },error=>{setLocating(false);setLocationStatus(error.code===1?'위치 권한이 꺼져 있어요. 브라우저에서 허용하거나 역을 직접 골라 주세요.':'위치를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.')},{enableHighAccuracy:true,timeout:12000,maximumAge:0});
 }
 return <section className="card form-card route-form">
  <p className="route-intro">두 역을 고르면 출발시간을 계산해요.</p>
  {error&&<p className="station-error" role="alert">{error}</p>}
  <button className="route-locate" type="button" disabled={locating} onClick={locate}><LocateFixed size={16}/>{locating?'위치 확인 중…':'현재 위치로 찾기'}</button>
  {locationStatus&&<p className="route-location-status" role="status">{locationStatus}</p>}
  <div className="route-quick-fields">
   <StationPicker label="어느 역에서 타나요?" value={from} onValue={setFrom} onSelect={setFromStation} stations={stations} selected={fromStation}/>
   <span className="route-between"><ArrowRight size={17}/></span>
   <StationPicker label="어느 역에서 내리나요?" value={to} onValue={setTo} onSelect={setToStation} stations={stations} selected={toStation}/>
  </div>
  {sameLine&&!sameStation?<div className="route-auto-plan"><strong>{fromStation.line} · {directionName(fromStation.line,direction)}</strong><span>열차 약 {ride}분 · 역까지 걷기 약 {homeWalk}분 · 강의실까지 {route.campusWalk}분</span></div>:<p className="route-warning" role="status">{sameStation?'출발역과 도착역이 같아요.':fromStation&&toStation?'서로 다른 호선이에요. 환승 경로 계산은 아직 지원하지 않아요.':'목록에서 출발역과 도착역을 선택해 주세요.'}</p>}
  <div className="route-buffer"><span>출발 여유</span><div>{[{value:5,label:'딱 맞게'},{value:10,label:'보통'},{value:20,label:'여유롭게'}].map(option=><button type="button" key={option.value} className={buffer===option.value?'selected':''} onClick={()=>setBuffer(option.value)}>{option.label}</button>)}</div></div>
  <p className="route-estimate-note">위치 기반 도보시간은 직선거리 추정치예요. 강의실까지의 도보시간과 열차 지연은 자동 반영되지 않아요.</p>
  <Button label="경로 저장" variant="primary" isDisabled={!sameLine||!!sameStation} onClick={()=>{if(!sameLine||sameStation)return;onSave({...route,from:fromStation.name,to:toStation.name,line:fromStation.line,direction,homeWalk,buffer,ride,walkOnly:false,originPointApplied:true})}}/>
 </section>
}
