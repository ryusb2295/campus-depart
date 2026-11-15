import test from 'node:test';
import assert from 'node:assert/strict';
import {tagoUrl,tagoItems,stationId,departureTimes,dayCode,directionCode} from '../src/tago.mjs';
import {transitHandler} from '../transit-server.mjs';
test('constructs TAGO requests without double encoding a provided encoded key',()=>{
 const url=tagoUrl('GetKwrdFndSubwaySttnList',{subwayStationName:'반월당'},'abc%2Bdef%3D');
 assert.equal(url.searchParams.get('serviceKey'),'abc+def=');
 assert.equal(url.searchParams.get('subwayStationName'),'반월당');
});
test('selects exact station and line from a TAGO response',()=>{
 const items=tagoItems({response:{header:{resultCode:'00'},body:{items:{item:[{subwayStationName:'반월당',subwayRouteName:'1호선',subwayStationId:'one'},{subwayStationName:'반월당',subwayRouteName:'2호선',subwayStationId:'two'}]}}}});
 assert.equal(stationId(items,'반월당','2'),'two');
 assert.throws(()=>stationId(items,'영남대','2'));
});
test('normalizes timetable times and codes',()=>{
 assert.deepEqual(departureTimes([{arrtime:'8:04:00'},{arrtime:'08:04:30'},{lefttime:'09:10:00'},{depTime:'054400'}]),['05:44','08:04','09:10']);
 assert.equal(dayCode('WEEKDAY'),'01');assert.equal(dayCode('SAT'),'02');assert.equal(dayCode('HOLIDAY'),'03');
 assert.equal(directionCode('DOWN'),'D');
 assert.throws(()=>tagoItems({response:{header:{resultCode:'03'}}}));
});
test('proxy resolves station ID before requesting a weekday timetable',async()=>{
 const originalFetch=globalThis.fetch,originalKey=process.env.TAGO_SERVICE_KEY;
 process.env.TAGO_SERVICE_KEY='test-key';
 const called=[];globalThis.fetch=async url=>{called.push(String(url));return {ok:true,json:async()=>called.length===1?{response:{header:{resultCode:'00'},body:{items:{item:[{subwayStationName:'반월당',subwayRouteName:'2호선',subwayStationId:'DG230'}]}}}}:{response:{header:{resultCode:'00'},body:{items:{item:[{arrtime:'08:30:00'},{arrtime:'08:37:00'}]}}}}};};
 let status,body;try{await transitHandler({url:'/api/transit?station=%EB%B0%98%EC%9B%94%EB%8B%B9&line=2&direction=DOWN&type=WEEKDAY'},{setHeader:()=>{},writeHead:s=>status=s,end:b=>body=b});}finally{globalThis.fetch=originalFetch;if(originalKey===undefined)delete process.env.TAGO_SERVICE_KEY;else process.env.TAGO_SERVICE_KEY=originalKey}
 assert.equal(status,200);assert.match(body,/08:30,08:37/);
 assert.match(called[0],/GetKwrdFndSubwaySttnList/);assert.match(called[1],/GetSubwaySttnAcctoSchdulList/);
 assert.equal(new URL(called[1]).searchParams.get('subwayStationId'),'DG230');
 assert.equal(new URL(called[1]).searchParams.get('upDownTypeCode'),'D');
});
test('station list includes partial-name matches and Daegu line labels',async()=>{
 const originalFetch=globalThis.fetch,originalKey=process.env.TAGO_SERVICE_KEY;
 process.env.TAGO_SERVICE_KEY='test-key';
 globalThis.fetch=async()=>({ok:true,json:async()=>({response:{header:{resultCode:'00'},body:{items:{item:[{subwayStationId:'MTRDG10123',subwayStationName:'서부정류장(관문시장)',subwayRouteName:'1호선'},{subwayStationId:'MTRS11133',subwayStationName:'서울역',subwayRouteName:'1호선'}]}}}})});
 let status,body;try{await transitHandler({url:'/api/stations'},{setHeader:()=>{},writeHead:s=>status=s,end:b=>body=b});}finally{globalThis.fetch=originalFetch;if(originalKey===undefined)delete process.env.TAGO_SERVICE_KEY;else process.env.TAGO_SERVICE_KEY=originalKey}
 assert.equal(status,200);const stations=JSON.parse(body);assert.equal(stations.length,1);assert.equal(stations[0].name,'서부정류장(관문시장)');assert.equal(stations[0].line,'1호선');assert.ok(Number.isFinite(stations[0].lat));assert.ok(Number.isInteger(stations[0].order));
});
