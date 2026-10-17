(() => {
 'use strict';const C=typeof module!=='undefined'?require('../../assets/study-core.js'):StudyCore;
 const defaults={system:'branch',points:12000,ratio:0.6,spread:38,w0:2,w1:4,w2:4,palette:'fern',seed:'ifs-001'};
 const schema={system:{label:'変換系',options:{triangle:'三角形',branch:'枝'}},points:{label:'点の数',min:500,max:20000,step:500},ratio:{label:'縮小率',min:0.3,max:0.7,step:0.01},spread:{label:'枝の開き',min:0,max:80,step:1},w0:{label:'変換1の重み',min:0,max:10,step:1},w1:{label:'変換2の重み',min:0,max:10,step:1},w2:{label:'変換3の重み',min:0,max:10,step:1},palette:C.palette};
 const BURN_IN=20,MARGIN=30;
 // Each map is p -> A·p + b with a matrix whose norm stays below 1, so the attractor is bounded.
 function maps(s){
  if(s.system==='triangle'){const v=[[0,-1],[Math.sqrt(3)/2,0.5],[-Math.sqrt(3)/2,0.5]],k=s.ratio;return v.map(([x,y])=>[k,0,0,k,(1-k)*x,(1-k)*y]);}
  const a=s.spread*Math.PI/180,k=s.ratio,c=Math.cos(a)*k,sn=Math.sin(a)*k;
  // Trunk: a thin vertical copy; branches: rotated, shrunk copies attached at the top of the trunk.
  return [[0.03,0,0,0.42,0,0],[c,-sn,sn,c,0,0.4],[c,sn,-sn,c,0,0.4]];
 }
 function geometry(s){
  const rng=C.rng(s.seed),m=maps(s),weights=[s.w0,s.w1,s.w2],total=weights.reduce((a,b)=>a+b,0),points=[];
  if(!total)return {points,maps:m,choices:[]};
  const choices=[];let x=0,y=0;
  for(let i=0;i<BURN_IN+s.points;i++){
   let r=rng()*total,j=0;while(j<2&&(r-=weights[j])>=0)j++;while(!weights[j])j--;
   const [a,b,c,d,e,f]=m[j];[x,y]=[a*x+b*y+e,c*x+d*y+f];choices.push(j);
   if(i>=BURN_IN)points.push([x,y,j]);
  }
  return {points,maps:m,choices};
 }
 function draw(g,s,p){
  if(!g.points.length)return '';
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const [x,y]of g.points){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  // Branch systems grow upward from y=0, so flip y; the triangle is drawn as computed.
  const flip=s.system==='branch'?-1:1,k=Math.min((900-2*MARGIN)/Math.max(x1-x0,0.05),(600-2*MARGIN)/Math.max(y1-y0,0.05));
  const ox=450-k*(x0+x1)/2,oy=300-flip*k*(y0+y1)/2,colors=[C.mix(p[1],p[2],0.5),p[1],p[2]],cells=[new Set(),new Set(),new Set()];
  // Points landing in the same unit cell are drawn once, which keeps the SVG small.
  for(const [x,y,j]of g.points)cells[j].add(Math.floor(ox+k*x)+','+Math.floor(oy+flip*k*y));
  return `<g shape-rendering="crispEdges">${cells.map((set,j)=>set.size?`<path d="${[...set].map(c=>{const [x,y]=c.split(',');return `M${x} ${y}h1.4v1.4h-1.4z`;}).join('')}" fill="${colors[j]}"/>`:'').join('')}</g>`;
 }
 const G=C.create({slug:'chaos-game',title:'選んで縮む点',defaults,schema,geometry,draw,
  note:g=>g.points.length?'':'すべての重みが0のため、点を描きません。'});
 if(typeof module!=='undefined')module.exports=G;if(typeof window!=='undefined')window.StudyGenerator=G;
})();
