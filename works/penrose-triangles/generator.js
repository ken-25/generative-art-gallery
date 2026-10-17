(() => {
 'use strict';const C=typeof module!=='undefined'?require('../../assets/study-core.js'):StudyCore;
 const defaults={depth:6,zoom:1.4,rotation:0,outline:0.6,palette:'fern'};
 const schema={depth:{label:'置換の深さ',min:0,max:7,step:1},zoom:{label:'表示範囲',min:0.5,max:3,step:0.05},rotation:{label:'回転',min:0,max:359,step:1},outline:{label:'輪郭線の太さ',min:0,max:2,step:0.1},palette:C.palette};
 const PHI=(1+Math.sqrt(5))/2,RADIUS=600;
 // Golden triangles as [type, A, B, C] with apex A: type 0 is acute (36° at A), type 1 is obtuse (108° at A).
 const lerp=(p,q,t)=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];
 function subdivide([type,A,B,Cc]){
  if(type===0){const P=lerp(A,B,1/PHI);return [[0,Cc,P,B],[1,P,Cc,A]];}
  const Q=lerp(B,A,1/PHI),R=lerp(B,Cc,1/PHI);return [[1,R,Cc,A],[1,Q,R,B],[0,R,Q,A]];
 }
 const visible=([,a,b,c])=>Math.max(a[0],b[0],c[0])>=0&&Math.min(a[0],b[0],c[0])<=900&&Math.max(a[1],b[1],c[1])>=0&&Math.min(a[1],b[1],c[1])<=600;
 function geometry(s){
  // A wheel of ten acute triangles around the centre, alternately mirrored, forms a finite decagonal patch.
  const r=RADIUS*s.zoom,turn=s.rotation*Math.PI/180,at=a=>[450+r*Math.cos(a+turn),300+r*Math.sin(a+turn)];
  let tiles=Array.from({length:10},(_,i)=>{const b=at((2*i-1)*Math.PI/10),c=at((2*i+1)*Math.PI/10);return i%2?[0,[450,300],b,c]:[0,[450,300],c,b];});
  // Children lie inside their parent, so a parent wholly outside the frame can be dropped before subdividing.
  for(let d=0;d<s.depth;d++)tiles=tiles.filter(visible).flatMap(subdivide);
  return {tiles:tiles.filter(visible),radius:r};
 }
 const round=v=>Math.round(v*10)/10;
 function draw(g,s,p){
  return [0,1].map(type=>{const list=g.tiles.filter(t=>t[0]===type);return list.length?`<path d="${list.map(([,a,b,c])=>`M${round(a[0])} ${round(a[1])}L${round(b[0])} ${round(b[1])}L${round(c[0])} ${round(c[1])}Z`).join('')}" fill="${p[1+type]}"${s.outline?` stroke="${p[0]}" stroke-width="${s.outline}" stroke-linejoin="round"`:''}/>`:'';}).join('');
 }
 const G=C.create({slug:'penrose-triangles',title:'繰り返さない秩序',defaults,schema,geometry,draw});
 if(typeof module!=='undefined')module.exports=G;if(typeof window!=='undefined')window.StudyGenerator=G;
})();
