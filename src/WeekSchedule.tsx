import {CalendarDays,Clock,MapPin,Plus,ChevronRight,ImagePlus} from 'lucide-react';

type Course={id:string;day:number;name:string;start:string;end:string;room:string};
const labels=['일','월','화','수','목','금','토'];
const toMinutes=(time:string)=>{const [hour,minute]=time.split(':').map(Number);return hour*60+minute};

export function WeekSchedule({courses,day,onDay,onEdit,onAdd,onPhoto}:{courses:Course[];day:number;onDay:(n:number)=>void;onEdit:(c:Course)=>void;onAdd:()=>void;onPhoto:()=>void}){
 const list=courses.filter(c=>c.day===day).sort((a,b)=>a.start.localeCompare(b.start));
 const days=[1,2,3,4,5,...([6,0] as const).filter(d=>courses.some(c=>c.day===d))];
 const firstHour=Math.min(9,...courses.map(c=>Math.floor(toMinutes(c.start)/60)));
 const lastHour=Math.max(18,...courses.map(c=>Math.ceil(toMinutes(c.end)/60)));
 const pixelsPerHour=54;
 const gridHeight=(lastHour-firstHour)*pixelsPerHour;
 return <section className="phone-schedule">
  <div className="schedule-note"><CalendarDays size={19}/><div><strong>이번 주 수업</strong><p>요일을 선택해 수업과 강의실을 확인하세요.</p></div><span className="schedule-note-count">{courses.length}개</span></div>
  <button className="photo-import-trigger" onClick={onPhoto}><ImagePlus size={17}/> 에타 시간표 사진으로 등록</button>
  <div className="day-picker" aria-label="시간표 요일 선택">{[1,2,3,4,5,6,0].map(d=><button key={d} aria-pressed={day===d} className={day===d?'chosen':''} onClick={()=>onDay(d)}><span>{labels[d]}</span><i className={courses.some(c=>c.day===d)?'has-class':''}/></button>)}</div>
  <div className="day-heading"><h2>{labels[day]}요일 <span>{list.length}개 수업</span></h2><button className="text-action" onClick={onAdd}><Plus size={15}/>추가</button></div>
  {list.length?<div className="agenda-list">{list.map((c,i)=><button className={`agenda-course agenda-${i%3}`} key={c.id} onClick={()=>onEdit(c)}><div className="agenda-time"><strong>{c.start}</strong><span>{c.end}</span></div><div className="agenda-content"><span className="agenda-label">{i===0?'첫 수업':`${i+1}번째 수업`}</span><h3>{c.name}</h3><p><MapPin size={13}/>{c.room}</p><small><Clock size={12}/>{c.start} – {c.end}</small></div><ChevronRight size={17}/></button>)}</div>:<div className="free-day"><CalendarDays size={42}/><h3>{courses.length?'오늘은 공강이에요':'시간표를 등록해 주세요'}</h3><p>{courses.length?'수업이 없는 날입니다.':'에타 시간표 사진을 올리거나 수업을 직접 추가할 수 있어요.'}</p><button onClick={courses.length?onAdd:onPhoto}>{courses.length?'수업 추가하기':'시간표 사진 등록하기'}</button></div>}
  <details className="schedule-overview"><summary>한 주 시간표 보기</summary><div className="week-grid" style={{gridTemplateColumns:`34px repeat(${days.length}, minmax(0, 1fr))`}}><div className="week-corner"/>{days.map(d=><div className="week-day-label" key={d}>{labels[d]}</div>)}<div className="week-times" style={{height:gridHeight}}>{Array.from({length:lastHour-firstHour+1},(_,i)=><span key={i} style={{top:i*pixelsPerHour}}>{String(firstHour+i).padStart(2,'0')}</span>)}</div>{days.map(d=><div className="week-day-column" key={d} style={{height:gridHeight,backgroundSize:`100% ${pixelsPerHour}px`}}>{courses.filter(c=>c.day===d).map(c=>{const top=(toMinutes(c.start)-firstHour*60)/60*pixelsPerHour;const height=Math.max(24,(toMinutes(c.end)-toMinutes(c.start))/60*pixelsPerHour);return <button className="week-course" key={c.id} style={{top,height}} onClick={()=>onEdit(c)} title={`${c.name} · ${c.start}–${c.end} · ${c.room}`} aria-label={`${labels[d]}요일 ${c.start}부터 ${c.end}까지 ${c.name}, ${c.room}. 수정하기`}><span>{c.start}</span><b>{c.name}</b><small>{c.room}</small></button>})}</div>)}</div><p className="week-grid-hint">수업을 누르면 수정할 수 있어요.</p></details>
  <p className="muted">수업을 누르면 시간과 강의실을 수정할 수 있어요.</p>
 </section>
}
