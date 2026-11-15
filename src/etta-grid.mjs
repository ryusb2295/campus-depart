const pixel=(image,x,y)=>{const i=(Math.floor(y)*image.width+Math.floor(x))*4;return [image.data[i],image.data[i+1],image.data[i+2]]};
const neutralLine=([r,g,b])=>Math.max(r,g,b)-Math.min(r,g,b)<6&&Math.min(r,g,b)>175&&Math.min(r,g,b)<250;
const colored=([r,g,b])=>Math.max(r,g,b)-Math.min(r,g,b)>7&&Math.min(r,g,b)>115;
function peaks(scores,threshold){const result=[];let start=-1;for(let i=0;i<=scores.length;i++){if(i<scores.length&&scores[i]>=threshold){if(start<0)start=i}else if(start>=0){result.push(Math.round((start+i-1)/2));start=-1}}return result}
function boundaries(image){
 const scores=Array.from({length:image.width},(_,x)=>{let count=0,total=0;for(let y=Math.floor(image.height*.16);y<image.height*.86;y+=4){total++;if(neutralLine(pixel(image,x,y)))count++}return count/total});
 const lines=peaks(scores,.52).filter(x=>x>8&&x<image.width-8);
 let best=[];
 for(let i=0;i<lines.length;i++)for(let j=i+1;j<lines.length;j++){const width=lines[j]-lines[i];if(width<32||width>image.width/3)continue;const chain=[lines[i],lines[j]];for(let k=j+1;k<lines.length;k++){if(Math.abs(lines[k]-chain.at(-1)-width)<Math.max(5,width*.15))chain.push(lines[k])}if(chain.length>best.length)best=chain}
 return best.length>=5&&best.length<=8?best:Array.from({length:6},(_,i)=>Math.round(image.width*(.07+.91*i/5)));
}
function horizontalGrid(image,left,right){
 const scores=Array.from({length:image.height},(_,y)=>{let count=0,total=0;for(let x=left+4;x<right-4;x+=4){total++;if(neutralLine(pixel(image,x,y)))count++}return total?count/total:0});
 const lines=peaks(scores,.34).filter(y=>y>image.height*.07&&y<image.height*.94);
 let best={start:Math.round(image.height*.12),step:Math.round(image.width*.12),count:0};
 for(const start of lines)for(const other of lines){const step=other-start;if(step<30||step>150)continue;let count=1;for(let n=1;n<12;n++){if(lines.some(y=>Math.abs(y-(start+n*step))<Math.max(4,step*.09)))count++}if(count>best.count)best={start,step,count}}
 return best;
}
function runs(image,x,top,bottom){const result=[];let start=-1;let last=-1;for(let y=top;y<=bottom;y++){const hit=y<bottom&&colored(pixel(image,x,y));if(hit){if(start<0)start=y;last=y}else if(start>=0&&y-last>3){if(last-start>=16)result.push({top:start,bottom:last+1});start=-1}}if(start>=0&&last-start>=16)result.push({top:start,bottom:last+1});return result}
const clock=minutes=>`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
export function detectTimetableBlocks(image,firstHour=9){
 const cols=boundaries(image);const grid=horizontalGrid(image,cols[0],cols.at(-1));
 const top=grid.start,step=grid.step;
 const bottom=Math.min(image.height-2,top+step*15);
 const result=[];
 for(let dayIndex=0;dayIndex<cols.length-1;dayIndex++){
  const left=cols[dayIndex],right=cols[dayIndex+1];
  const samples=[left+Math.min(5,Math.floor((right-left)/8)),right-Math.min(5,Math.floor((right-left)/8))-1];
  const all=samples.flatMap(x=>runs(image,x,top+1,bottom));
  const merged=[];
  for(const run of all.sort((a,b)=>a.top-b.top)){const found=merged.find(item=>{const overlap=Math.min(item.bottom,run.bottom)-Math.max(item.top,run.top);return overlap>Math.min(item.bottom-item.top,run.bottom-run.top)*.65});if(found){found.top=Math.min(found.top,run.top);found.bottom=Math.max(found.bottom,run.bottom)}else merged.push({...run})}
  for(const run of merged){
   const start=Math.round((firstHour*60+(run.top-top)/step*60)/5)*5;
   const end=Math.round((firstHour*60+(run.bottom-top)/step*60)/5)*5;
   if(start<480||end>1260||end-start<35)continue;
   result.push({day:[1,2,3,4,5,6,0][dayIndex],start:clock(start),end:clock(end),box:{left:left+2,top:run.top+2,width:right-left-4,height:run.bottom-run.top-4}});
  }
 }
 return result;
}
