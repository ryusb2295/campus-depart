import test from 'node:test';import assert from 'node:assert/strict';import {planTrip,minutes,clock} from '../src/planner.mjs';
const route={homeWalk:10,platform:3,campusWalk:15,buffer:10};const course={start:'09:00'};const trains=[{departure:480,arrival:510},{departure:486,arrival:516},{departure:492,arrival:522},{departure:498,arrival:528}];
test('selects latest arrival before walking and buffer deadline',()=>{const p=planTrip(course,route,trains);assert.equal(p.departure,480);assert.equal(p.leave,467);assert.equal(p.margin,15)});
test('missing the train uses next departure and reports actual lateness',()=>{const p=planTrip(course,route,trains,3);assert.equal(p.departure,498);assert.equal(p.late,3)});
test('no class or no matching train is handled',()=>{assert.equal(planTrip(null,route,trains),null);assert.equal(planTrip({start:'07:00'},route,trains),null);assert.equal(planTrip(course,route,trains,99),null)});
test('time conversion preserves midnight boundaries',()=>{assert.equal(minutes('09:30'),570);assert.equal(clock(1445),'00:05');assert.equal(clock(-1),'23:59')});
