import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSchedule,parseManualTimes,scheduleType} from '../src/transit.mjs';
test('validates and sorts manually entered departures',()=>{
 assert.deepEqual(parseManualTimes('08:37, 08:30\n08:37'),[510,517]);
 assert.deepEqual(parseManualTimes(''),[]);
 assert.throws(()=>parseManualTimes('8:30'));
 assert.throws(()=>parseManualTimes('24:00'));
});
import {transitHandler} from '../transit-server.mjs';
test('parses XML schedule and rejects empty or error responses',()=>{
 assert.deepEqual(parseSchedule('<root><SCHEDULE><![CDATA[5:25, 08:04, 8:04, 23:16]]></SCHEDULE></root>'),[325,484,1396]);
 assert.throws(()=>parseSchedule('<html>Error</html>'));
 assert.throws(()=>parseSchedule('<root/>'));
});
test('selects Korean weekday service type',()=>{
 assert.equal(scheduleType('2026-11-14'),'SAT');
 assert.equal(scheduleType('2026-11-15'),'HOLIDAY');
 assert.equal(scheduleType('2026-11-16'),'WEEKDAY');
});
test('proxy rejects invalid line before making upstream request',async()=>{
 let status,body;await transitHandler({url:'/api/transit?station=test&line=9&direction=UP&type=WEEKDAY'},{setHeader:()=>{},writeHead:s=>status=s,end:b=>body=b});assert.equal(status,400);assert.equal(body,'Invalid transit query');
});
