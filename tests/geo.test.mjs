import test from 'node:test';
import assert from 'node:assert/strict';
import {distanceMeters,estimateWalkMinutes} from '../src/geo.mjs';
test('estimates walking time from straight-line distance with a route allowance',()=>{
 assert.equal(Math.round(distanceMeters({lat:35.864592,lon:128.593334},{lat:35.864592,lon:128.593334})),0);
 assert.equal(estimateWalkMinutes(720),13);
 assert.throws(()=>estimateWalkMinutes(-1));
});
