(() => {
 'use strict';const C=typeof module!=='undefined'?require('../../assets/study-core.js'):StudyCore;
 const PRESETS=Object.freeze({spots:[0.0367,0.0649],maze:[0.029,0.057],coral:[0.0545,0.062]});
 const defaults={preset:'coral',feed:0.04,kill:0.06,seeds:6,iterations:3000,threshold:0.25,palette:'clay',seed:'gs-001'};
 const schema={preset:{label:'模様',options:{spots:'斑点',maze:'迷路',coral:'珊瑚',custom:'値を指定'}},feed:{label:'給餌率',min:0.01,max:0.1,step:0.0005},kill:{label:'除去率',min:0.04,max:0.07,step:0.0005},seeds:{label:'初期種の数',min:1,max:12,step:1},iterations:{label:'反復回数',min:200,max:4000,step:100},threshold:{label:'輪郭の閾値',min:0.1,max:0.5,step:0.01},palette:C.palette};
 // Fixed generator specification: 150×100 periodic grid, diffusion rates 1 and 0.5, time step 1, 3×3 Laplacian.
 const W=150,H=100,CELL=6,DA=1,DB=0.5,ADJ=0.2,DIAG=0.05,SEED_RADIUS=3,CHUNK=20;
 const rates=s=>s.preset==='custom'?[s.feed,s.kill]:PRESETS[s.preset];
 const clamp=v=>v<0?0:v>1?1:v;
 function* simulate(s){
  const [f,k]=rates(s),rng=C.rng(s.seed);let a=new Float64Array(W*H).fill(1),b=new Float64Array(W*H),na=new Float64Array(W*H),nb=new Float64Array(W*H);
  for(let n=0;n<s.seeds;n++){const cx=Math.floor(rng()*W),cy=Math.floor(rng()*H);
   for(let dy=-SEED_RADIUS;dy<=SEED_RADIUS;dy++)for(let dx=-SEED_RADIUS;dx<=SEED_RADIUS;dx++){const i=((cy+dy+H)%H)*W+(cx+dx+W)%W;a[i]=0.5;b[i]=1;}}
  const left=Int32Array.from({length:W},(_,x)=>(x+W-1)%W),right=Int32Array.from({length:W},(_,x)=>(x+1)%W);
  for(let t=0;t<s.iterations;t++){
   for(let y=0;y<H;y++){const up=((y+H-1)%H)*W,row=y*W,down=((y+1)%H)*W;
    for(let x=0;x<W;x++){const l=left[x],r=right[x],i=row+x,ai=a[i],bi=b[i];
     const la=ADJ*(a[up+x]+a[down+x]+a[row+l]+a[row+r])+DIAG*(a[up+l]+a[up+r]+a[down+l]+a[down+r])-ai;
     const lb=ADJ*(b[up+x]+b[down+x]+b[row+l]+b[row+r])+DIAG*(b[up+l]+b[up+r]+b[down+l]+b[down+r])-bi;
     const react=ai*bi*bi;na[i]=clamp(ai+DA*la-react+f*(1-ai));nb[i]=clamp(bi+DB*lb+react-(k+f)*bi);}}
   [a,na]=[na,a];[b,nb]=[nb,b];
   if(t%CHUNK===CHUNK-1)yield;
  }
  return {a,b,feed:f,kill:k};
 }
 // Marching squares on B over a grid padded with zeros, so every contour closes; saddles use the cell average.
 const TABLE=[[],[[3,0]],[[0,1]],[[3,1]],[[1,2]],null,[[0,2]],[[3,2]],[[2,3]],[[0,2]],null,[[1,2]],[[3,1]],[[0,1]],[[3,0]],[]];
 function contours(b,t){
  const value=(x,y)=>x<0||y<0||x>=W||y>=H?0:b[y*W+x],points=new Map(),links=new Map();
  const edge=(x,y,side)=>{// side 0 top,1 right,2 bottom,3 left of cell (x,y); shared edges get one id.
   const [ex,ey,vertical]=side===0?[x,y,0]:side===2?[x,y+1,0]:side===3?[x,y,1]:[x+1,y,1],id=((ey+1)*(W+2)+(ex+1))*2+vertical;
   if(!points.has(id)){const [x2,y2]=vertical?[ex,ey+1]:[ex+1,ey],v1=value(ex,ey),v2=value(x2,y2),u=(t-v1)/(v2-v1);points.set(id,[(ex+u*(x2-ex)+0.5)*CELL,(ey+u*(y2-ey)+0.5)*CELL]);}
   return id;};
  const link=(p,q)=>{for(const [m,n]of [[p,q],[q,p]]){if(!links.has(m))links.set(m,[]);links.get(m).push(n);}};
  for(let y=-1;y<H;y++)for(let x=-1;x<W;x++){
   const tl=value(x,y)>=t,tr=value(x+1,y)>=t,br=value(x+1,y+1)>=t,bl=value(x,y+1)>=t,c=tl|tr<<1|br<<2|bl<<3;
   let segs=TABLE[c];if(!segs){const centre=(value(x,y)+value(x+1,y)+value(x+1,y+1)+value(x,y+1))/4>=t;segs=(c===5)===centre?[[0,1],[2,3]]:[[3,0],[1,2]];}
   for(const [p,q]of segs)link(edge(x,y,p),edge(x,y,q));
  }
  const loops=[],seen=new Set();
  for(const start of links.keys()){if(seen.has(start))continue;const loop=[];let prev=-1,cur=start;
   while(!seen.has(cur)){seen.add(cur);loop.push(points.get(cur));const [n1,n2]=links.get(cur);const nxt=n1!==prev?n1:n2;prev=cur;cur=nxt;}
   loops.push(loop);}
  return loops;
 }
 function geometry(s,sim){return {...sim,loops:contours(sim.b,s.threshold)};}
 const round=v=>Math.round(v*10)/10;
 function draw(g,s,p){
  if(!g.loops.length)return '';
  return `<path d="${g.loops.map(l=>'M'+l.map(q=>round(q[0])+' '+round(q[1])).join('L')+'Z').join('')}" fill="${p[1]}" fill-rule="evenodd" stroke="${p[2]}" stroke-width="1" stroke-linejoin="round"/>`;
 }
 const G=C.create({slug:'reaction-diffusion',title:'反応と拡散の斑',defaults,schema,geometry,draw,simulate,simulationKeys:['preset','feed','kill','seeds','iterations','seed'],
  note:g=>g.loops.length?'':'閾値を超える領域がないため、輪郭はありません。'});
 if(typeof module!=='undefined')module.exports=G;if(typeof window!=='undefined')window.StudyGenerator=G;
})();
