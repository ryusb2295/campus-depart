import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshotTimes} from '../src/timetable-snapshot.mjs';
import {readFileSync} from 'node:fs';
import {planTrip} from '../src/planner.mjs';

const stations=[{id:'MTRDG20215',name:'반월당',line:'2호선'}];
const snapshot={entries:{'MTRDG20215|WEEKDAY|DOWN':{all:['09:00','09:06'],yeongnam:['09:06']}}};
test('uses only Yeongnam-bound trains for the campus route',()=>{assert.deepEqual(snapshotTimes(snapshot,{from:'반월당',to:'영남대',line:'2호선',direction:'DOWN'},'WEEKDAY',stations),[546])});
test('missing station timetable does not invent train times',()=>{assert.deepEqual(snapshotTimes(snapshot,{from:'없는역',to:'영남대',line:'2호선',direction:'DOWN'},'WEEKDAY',stations),[])});
test('bundled weekday timetable calculates a departure for Monday classes',()=>{
 const bundled=JSON.parse(readFileSync(new URL('../public/timetable-snapshot.json',import.meta.url),'utf8'));
 const allStations=JSON.parse(readFileSync(new URL('../src/daegu-stations.json',import.meta.url),'utf8')).stations;
 const route={from:'반월당',to:'영남대',line:'2호선',direction:'DOWN',homeWalk:10,campusWalk:15,platform:3,buffer:10,ride:35};
 const times=snapshotTimes(bundled,route,'WEEKDAY',allStations);
 assert.ok(times.length>10);
 assert.ok(planTrip({start:'10:30'},route,times.map(departure=>({departure,arrival:departure+route.ride}))));
});
