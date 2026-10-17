(() => {
 'use strict';const C=typeof module!=='undefined'?require('../../assets/study-core.js'):StudyCore;
 const defaults={target:1200,stickiness:1,origin:'point',palette:'dusk',seed:'dla-001'};
 const schema={target:{label:'目標粒子数',min:50,max:1500,step:50},stickiness:{label:'付着確率',min:0.1,max:1,step:0.05},origin:{label:'中央の初期種',options:{point:'点',line:'短い線'}},palette:C.palette};
 // A 240×160 lattice; walkers start on a circle just outside the cluster and are dropped if they stray far.
 const W=240,H=160,CELL=3.75,CX=120,CY=80,LAUNCH_GAP=5,KILL_GAP=40,WALK_LIMIT=20000,STEP_BUDGET=4000000,CHUNK=200000,BANDS=6;
 const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
 function* simulate(s){
  const rng=C.rng(s.seed),grid=new Int32Array(W*H).fill(-1),cells=[];let radius=0;
  const occupy=(x,y)=>{grid[y*W+x]=cells.length;cells.push([x,y]);radius=Math.max(radius,Math.hypot(x-CX,y-CY));};
  if(s.origin==='line')for(let x=CX-8;x<=CX+8;x++)occupy(x,CY);else occupy(CX,CY);
  const seeds=cells.length,touching=(x,y)=>DIRS.some(([dx,dy])=>{const nx=x+dx,ny=y+dy;return nx>=0&&ny>=0&&nx<W&&ny<H&&grid[ny*W+nx]>=0;});
  let steps=0,relaunches=0,reason='target',since=0;
  while(cells.length-seeds<s.target){
   const launch=radius+LAUNCH_GAP;
   if(CX-launch<1||CY-launch<1||CX+launch>W-2||CY+launch>H-2){reason='edge';break;}
   const a=rng()*2*Math.PI;let x=Math.round(CX+launch*Math.cos(a)),y=Math.round(CY+launch*Math.sin(a)),stuck=false;
   for(let walk=0;walk<WALK_LIMIT&&steps<STEP_BUDGET;walk++){
    if(touching(x,y)&&rng()<s.stickiness){stuck=true;break;}
    const [dx,dy]=DIRS[Math.floor(rng()*4)],nx=x+dx,ny=y+dy;steps++;since++;
    if(nx<0||ny<0||nx>=W||ny>=H||Math.hypot(nx-CX,ny-CY)>launch+KILL_GAP)break;
    if(grid[ny*W+nx]<0){x=nx;y=ny;}
   }
   if(stuck)occupy(x,y);else relaunches++;
   if(steps>=STEP_BUDGET&&cells.length-seeds<s.target){reason='budget';break;}
   if(since>=CHUNK){since=0;yield;}
  }
  return {cells,seeds,attached:cells.length-seeds,steps,relaunches,reason};
 }
 const geometry=(s,sim)=>sim;
 function draw(g,s,p){
  const bands=Array.from({length:BANDS},()=>[]);
  g.cells.forEach(([x,y],i)=>bands[i<g.seeds?0:Math.min(BANDS-1,Math.floor((i-g.seeds)/Math.max(1,g.attached)*BANDS))].push(`M${x} ${y}h1v1h-1z`));
  return `<g transform="scale(${CELL})" shape-rendering="crispEdges">${bands.map((b,i)=>b.length?`<path d="${b.join('')}" fill="${C.mix(p[1],p[2],i/(BANDS-1))}"/>`:'').join('')}</g>`;
 }
 const G=C.create({slug:'diffusion-aggregation',title:'さまよって付く',defaults,schema,geometry,draw,simulate,simulationKeys:['target','stickiness','origin','seed'],
  note:(g,s)=>g.reason==='target'?`目標の${s.target}粒子がすべて付着しました。`:`${g.reason==='edge'?'塊が格子の端に近づいた':'計算量の上限に達した'}ため、${g.attached}粒子（目標${s.target}）で止めています。`});
 if(typeof module!=='undefined')module.exports=G;if(typeof window!=='undefined')window.StudyGenerator=G;
})();
