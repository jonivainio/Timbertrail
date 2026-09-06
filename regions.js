/* Authored region graph and independently restorable cabin components. */
(function(root){'use strict';
const maps={
 forest:{name:'Forest',point:[27,30],spawn:565,animals:[['rabbit',1510],['grouse',5480],['deer',2810],['bear',4660]],exits:{right:{map:'river',x:95}},description:'The old forest trail and Aarni’s cabin.'},
 river:{name:'Aarni River Trail',point:[35,35],spawn:95,animals:[['rabbit',1280],['grouse',4620],['deer',5520]],exits:{left:{map:'forest',x:6270}},description:'Follow the forest path to the river. A quiet trail branches toward Sienilampi.'},
 pond:{name:'Sienilampi',point:[34.5,41],spawn:6250,animals:[['rabbit',5440],['rabbit',4190]],exits:{right:{map:'river',x:3250}},description:'A forgotten lakeside cabin, a weathered jetty, and still water.'}
};
// Component rectangles are shared by drawing, hover hit-tests and restoration.
// Coordinates relative to the cabin's centre and foundation.
// The complete facade includes its doors and windows, avoiding mismatched overlays.
const cabin={x:5520,scale:.84,setback:100,clearing:{left:760,right:850},doorBox:[-35,-108,69,108],parts:{
 roof:{name:'Roof',box:[-160,-226,320,108],need:{firewood:12,wood:8,cord:4},duration:4.5},
 facade:{name:'Facade',box:[-165,-118,330,126],need:{firewood:14,wood:16,cord:5,fiber:4},duration:6},
 yard:{name:'Yard',box:[-370,8,740,150],need:{stone:8,wood:4},duration:3}
}};
const aarni={x:3380,setback:28};
const pond={shore:3940,pierEnd:3700,walkMin:3718,chair:3734,drink:3820,spring:5810,surface:352,backgroundLift:64};
const trail={x:3250,backdropX:1717,backdropY:320};
// Shared screen/world projection for the distant cabin hotspot; same parallax as panorama.
const trailBox=cam=>{const bx=Math.round(Math.max(0,Math.min(1,cam/(6400-960)))*(3280-960));return [cam+trail.backdropX-bx-65,trail.backdropY-105,138,84];};
const regionKeys=['picked','structures','drops','falling','animals','cabinRepairs'];
const canTravel=(s,id)=>!!maps[id]&&(id===s.currentMap||s.visited?.[id]||({forest:['river'],river:['forest','pond'],pond:['river']}[s.currentMap]||[]).includes(id));
root.PERegions={maps,cabin,aarni,pond,trail,trailBox,regionKeys,canTravel};if(typeof module!=='undefined')module.exports=root.PERegions;
})(typeof window==='undefined'?globalThis:window);
