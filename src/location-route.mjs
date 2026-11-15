import {distanceMeters,estimateWalkMinutes} from './geo.mjs';
import {estimateRideMinutes} from './route-estimate.mjs';

export function routeFromPoint(route,point,stations){
 if(!point||!Number.isFinite(point.lat)||!Number.isFinite(point.lon)||point.accuracy>150)return null;
 const closest=stations.map(station=>({...station,meters:distanceMeters(point,station)})).sort((a,b)=>a.meters-b.meters)[0];
 if(!closest)return null;
 const destination=stations.find(station=>station.name===route.to);
 const sameLine=destination?.line===closest.line;
 const walkOnly=!!destination&&destination.id===closest.id;
 return {...route,from:closest.name,line:closest.line,homeWalk:estimateWalkMinutes(closest.meters),direction:sameLine&&destination.order<closest.order?'UP':'DOWN',ride:sameLine&&!walkOnly?estimateRideMinutes(closest.order,destination.order,closest.line):route.ride,walkOnly,originPointApplied:true};
}
