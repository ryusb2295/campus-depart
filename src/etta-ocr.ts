import {detectTimetableBlocks} from './etta-grid.mjs';

export type DraftCourse={id:string;day:number;name:string;start:string;end:string;room:string;raw:string};

function readText(text:string){
 const lines=text.split(/\n+/).map(line=>line.trim().replace(/\s{2,}/g,' ')).filter(Boolean);
 if(!lines.length)return {name:'',room:''};
 let name=lines[0].replace(/[|©]+/g,'').trim();
 if(lines[1]&&name.length<8&&lines[1].length<=3&&!/[0-9]|관|실|교수/.test(lines[1]))name+=lines[1];
 const rest=lines.slice(1).join(' ');
 const room=rest.match(/(?:[A-Za-z]\d{1,3}[- ]?\d{2,4}|[가-힣A-Za-z0-9]+(?:관|실|호)[가-힣A-Za-z0-9 ]{0,12})/)?.[0]||'';
 return {name,room};
}

export async function recognizeSchedulePhoto(file:File,onProgress:(message:string)=>void):Promise<DraftCourse[]>{
 const bitmap=await createImageBitmap(file);
 const scale=Math.min(1,1200/bitmap.width,3000/bitmap.height);
 const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
 const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)throw Error('사진을 읽을 수 없어요.');
 context.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 const blocks=detectTimetableBlocks(context.getImageData(0,0,canvas.width,canvas.height));
 if(!blocks.length)throw Error('수업 칸을 찾지 못했어요. 요일과 시간 눈금이 보이게 시간표 전체를 캡처해 주세요.');
 onProgress(`수업 칸 ${blocks.length}개를 찾았어요. 글자를 읽는 중…`);
 const {createWorker,PSM}=await import('tesseract.js');
 const worker=await createWorker(['kor','eng']);
 const drafts:DraftCourse[]=[];
 try{
  await worker.setParameters({tessedit_pageseg_mode:PSM.SINGLE_BLOCK});
  for(const [index,block] of blocks.entries()){
   onProgress(`${index+1}/${blocks.length}번째 수업을 읽는 중…`);
   const crop=document.createElement('canvas');const factor=Math.max(2,Math.min(4,Math.ceil(320/block.box.width)));
   crop.width=Math.max(1,Math.round(block.box.width*factor));crop.height=Math.max(1,Math.round(block.box.height*factor));
   const cropContext=crop.getContext('2d');if(!cropContext)continue;
   cropContext.imageSmoothingEnabled=false;
   cropContext.drawImage(canvas,block.box.left,block.box.top,block.box.width,block.box.height,0,0,crop.width,crop.height);
   const result=await worker.recognize(crop);
   const parsed=readText(result.data.text);
   drafts.push({id:crypto.randomUUID(),day:block.day,name:parsed.name,start:block.start,end:block.end,room:parsed.room,raw:result.data.text.trim()});
  }
 }finally{await worker.terminate()}
 return drafts;
}
