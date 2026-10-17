(() => {
 'use strict';const C=typeof module!=='undefined'?require('../../assets/study-core.js'):StudyCore;
 const defaults={R:96,r:60,d:54,rotation:0,curves:3,phase:15,width:1.2,palette:'fern'};
 const schema={R:{label:'固定円の半径',min:2,max:120,step:1},r:{label:'転がる円の半径',min:1,max:119,step:1},d:{label:'描点の距離',min:0,max:120,step:1},rotation:{label:'回転',min:0,max:359,step:1},curves:{label:'曲線の数',min:1,max:6,step:1},phase:{label:'曲線ごとの位相差',min:0,max:180,step:1},width:{label:'線幅',min:0.4,max:4,step:0.1},palette:C.palette};
 const MAX_POINTS=6000,MIN_POINTS=96,SEGMENT=2,RADIUS=270;
 const gcd=(a,b)=>b?gcd(b,a%b):a;
 // Hypotrochoid: a point at distance d from the centre of a circle of radius r rolling inside a fixed circle of radius R.
 const point=(R,r,d,t)=>[(R-r)*Math.cos(t)+d*Math.cos((R-r)*t/r),(R-r)*Math.sin(t)-d*Math.sin((R-r)*t/r)];
 function geometry(s){
  if(!(s.r<s.R))return {curves:[],rejected:true};
  const {R,r,d}=s,period=2*Math.PI*r/gcd(R,r),scale=RADIUS/(R-r+d);
  // Bound the arc length by the largest speed so neighbouring samples stay about SEGMENT units apart on screen.
  const speed=(R-r)+d*(R-r)/r,n=Math.min(MAX_POINTS,Math.max(MIN_POINTS,Math.ceil(period*speed*scale/SEGMENT)));
  const base=Array.from({length:n+1},(_,i)=>point(R,r,d,i===n?period:period*i/n));
  const curves=Array.from({length:s.curves},(_,k)=>{const a=(s.rotation+k*s.phase)*Math.PI/180,c=Math.cos(a),sn=Math.sin(a);
   return base.map(([x,y])=>[450+scale*(x*c-y*sn),300+scale*(x*sn+y*c)]);});
  return {curves,period,samples:n,scale};
 }
 const round=v=>Math.round(v*10)/10;
 const G=C.create({slug:'rolling-circles',title:'転がる円の軌跡',defaults,schema,geometry,
  draw:(g,s,p)=>g.curves.map((c,k)=>`<path d="M${c.map(q=>round(q[0])+' '+round(q[1])).join('L')}" fill="none" stroke="${p[1+k%2]}" stroke-width="${s.width}" stroke-linejoin="round" stroke-opacity="0.9"/>`).join(''),
  note:g=>g.rejected?'転がる円の半径は、固定円の半径より小さくしてください。この組み合わせでは線を描きません。':''});
 if(typeof module!=='undefined')module.exports=G;if(typeof window!=='undefined')window.StudyGenerator=G;
})();
