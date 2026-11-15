import test from 'node:test';
import assert from 'node:assert/strict';
import {detectTimetableBlocks} from '../src/etta-grid.mjs';

test('reads day columns and course times from a colored timetable grid',()=>{
 const width=420,height=650,data=new Uint8ClampedArray(width*height*4);
 function rect(x0,y0,x1,y1,r,g,b){for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*width+x)*4;data[i]=r;data[i+1]=g;data[i+2]=b;data[i+3]=255}}
 rect(0,0,width,height,255,255,255);
 for(let day=0;day<=5;day++)rect(30+day*76,80,31+day*76,630,225,225,225);
 for(let hour=0;hour<=10;hour++)rect(30,80+hour*50,410,81+hour*50,225,225,225);
 rect(33,82,103,229,241,229,229);
 rect(109,282,179,354,229,242,214);
 const courses=detectTimetableBlocks({width,height,data});
 assert.deepEqual(courses.map(({day,start,end})=>({day,start,end})),[{day:1,start:'09:00',end:'12:00'},{day:2,start:'13:00',end:'14:30'}]);
});
