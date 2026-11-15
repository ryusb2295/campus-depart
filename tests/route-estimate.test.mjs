import test from 'node:test';
import assert from 'node:assert/strict';
import {estimateRideMinutes} from '../src/route-estimate.mjs';
test('estimates a conservative ride duration from station order',()=>{
 assert.equal(estimateRideMinutes(16,30,'2호선'),35);
 assert.equal(estimateRideMinutes(1,6,'3호선'),10);
 assert.throws(()=>estimateRideMinutes('bad',30,'2호선'));
});
