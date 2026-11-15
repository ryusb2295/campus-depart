import {useEffect,useRef,useState} from 'react';
import {ImagePlus,Trash2,X} from 'lucide-react';
import {recognizeSchedulePhoto} from './etta-ocr';
import type {DraftCourse} from './etta-ocr';

type Course={id:string;day:number;name:string;start:string;end:string;room:string};
const days=['일','월','화','수','목','금','토'];
const minute=(value:string)=>{const [hour,part]=value.split(':').map(Number);return hour*60+part};

export function PhotoImport({onClose,onImport}:{onClose:()=>void;onImport:(courses:Course[],replace:boolean)=>string|null}){
 const [drafts,setDrafts]=useState<DraftCourse[]>([]);
 const [imageUrl,setImageUrl]=useState('');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [replace,setReplace]=useState(true);
 const requestId=useRef(0);
 useEffect(()=>()=>{requestId.current++},[]);
 useEffect(()=>()=>{if(imageUrl)URL.revokeObjectURL(imageUrl)},[imageUrl]);
 async function read(file:File){
  const currentId=++requestId.current;
  setBusy(false);
  setDrafts([]);
  setImageUrl('');
  if(!file.type.startsWith('image/')){setMessage('이미지 파일을 선택해 주세요.');return}
  if(file.size>15*1024*1024){setMessage('15MB 이하 사진을 선택해 주세요.');return}
  setImageUrl(URL.createObjectURL(file));setBusy(true);setMessage('사진에서 시간표를 찾는 중…');
  try{const courses=await recognizeSchedulePhoto(file,text=>{if(requestId.current===currentId)setMessage(text)});if(requestId.current!==currentId)return;setDrafts(courses);setMessage(`${courses.length}개 수업을 찾았어요. 이름과 시간을 확인해 주세요.`)}
  catch(error){if(requestId.current===currentId)setMessage(error instanceof Error?error.message:'사진을 읽지 못했어요. 다른 캡처로 다시 시도해 주세요.')}
  finally{if(requestId.current===currentId)setBusy(false)}
 }
 function update(id:string,key:keyof DraftCourse,value:string|number){setDrafts(items=>items.map(item=>item.id===id?{...item,[key]:value}:item))}
 function save(){
  const courses=drafts.map(({id,day,name,start,end,room})=>({id,day,name:name.trim(),start,end,room:room.trim()}));
  if(!courses.length){setMessage('등록할 수업이 없어요.');return}
  if(courses.some(c=>!c.name||!/^\d{2}:\d{2}$/.test(c.start)||!/^\d{2}:\d{2}$/.test(c.end)||minute(c.start)<480||minute(c.end)>1260||minute(c.end)<=minute(c.start))){setMessage('수업 이름과 시간을 확인해 주세요. 시간은 08:00~21:00 사이로 입력해 주세요.');return}
  for(const [index,course] of courses.entries())if(courses.some((other,j)=>j!==index&&other.day===course.day&&minute(course.start)<minute(other.end)&&minute(course.end)>minute(other.start))){setMessage('같은 요일에 시간이 겹치는 수업이 있어요.');return}
  const error=onImport(courses,replace);if(error){setMessage(error);return}onClose();
 }
 return <div className="modal-overlay photo-overlay" onClick={onClose}><section className="modal photo-modal" role="dialog" aria-modal="true" aria-labelledby="photo-title" onClick={event=>event.stopPropagation()}>
  <div className="section-header"><div><h2 id="photo-title">에타 시간표 사진 등록</h2><p>요일과 시간 눈금이 모두 보이는 캡처를 골라 주세요.</p></div><button className="icon-button" aria-label="닫기" onClick={onClose}><X size={20}/></button></div>
  <label className="photo-pick"><ImagePlus size={19}/><span>시간표 사진 선택</span><input type="file" accept="image/*" onChange={event=>{const file=event.target.files?.[0];if(file)void read(file);event.target.value=''}}/></label>
  {imageUrl&&<img className="photo-preview" src={imageUrl} alt="선택한 시간표 캡처"/>}
  {message&&<p className="photo-message" role="status">{message}</p>}
  {drafts.length>0&&<><div className="photo-review-heading"><strong>인식 결과 {drafts.length}개</strong><small>틀린 글자와 시간은 여기서 고칠 수 있어요.</small></div><div className="photo-drafts">{drafts.map((course,index)=><div className="photo-draft" key={course.id}><div className="photo-draft-top"><strong>{index+1}번째 수업</strong><button aria-label="수업 삭제" onClick={()=>setDrafts(items=>items.filter(item=>item.id!==course.id))}><Trash2 size={16}/></button></div><label>과목명<input value={course.name} onChange={event=>update(course.id,'name',event.target.value)} placeholder="과목명을 확인해 주세요"/></label><div className="photo-draft-grid"><label>요일<select value={course.day} onChange={event=>update(course.id,'day',Number(event.target.value))}>{[1,2,3,4,5,6,0].map(day=><option key={day} value={day}>{days[day]}요일</option>)}</select></label><label>강의실<input value={course.room} onChange={event=>update(course.id,'room',event.target.value)} placeholder="선택 입력"/></label><label>시작<input type="time" value={course.start} onChange={event=>update(course.id,'start',event.target.value)}/></label><label>종료<input type="time" value={course.end} onChange={event=>update(course.id,'end',event.target.value)}/></label></div>{course.raw&&<small className="photo-raw">읽힌 글자: {course.raw.replace(/\s+/g,' ').slice(0,90)}</small>}</div>)}</div><button className="photo-add-row" onClick={()=>setDrafts(items=>[...items,{id:crypto.randomUUID(),day:1,name:'',start:'09:00',end:'10:00',room:'',raw:''}])}>빠진 수업 추가하기</button><div className="photo-mode"><label><input type="radio" checked={replace} onChange={()=>setReplace(true)}/> 기존 시간표 교체</label><label><input type="radio" checked={!replace} onChange={()=>setReplace(false)}/> 기존 수업에 추가</label></div><button className="photo-save" disabled={busy} onClick={save}>확인한 수업 저장</button></>}
 </section></div>;
}
