import test from 'node:test';
import assert from 'node:assert/strict';
import {routeFromPoint} from '../src/location-route.mjs';

const stations=[{id:'a',name:'반월당',line:'2호선',order:10,lat:35.866,lon:128.59},{id:'b',name:'영남대',line:'2호선',order:29,lat:35.836,lon:128.752}];
const route={from:'반월당',to:'영남대',line:'2호선',homeWalk:10,ride:35};
test('saved point near campus updates origin and uses walking calculation',()=>{const next=routeFromPoint(route,{lat:35.836,lon:128.752,accuracy:15},stations);assert.equal(next.from,'영남대');assert.equal(next.walkOnly,true);assert.equal(next.homeWalk,1)});
test('saved point near a different station updates rail direction and time',()=>{const next=routeFromPoint(route,{lat:35.866,lon:128.59,accuracy:15},stations);assert.equal(next.from,'반월당');assert.equal(next.walkOnly,false);assert.equal(next.ride,48)});
test('inaccurate location is not applied',()=>{assert.equal(routeFromPoint(route,{lat:35.836,lon:128.752,accuracy:400},stations),null)});
