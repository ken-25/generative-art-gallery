(() => {
 'use strict';const C=typeof module!=='undefined'?require('../../assets/study-core.js'):StudyCore;
 const defaults={rho:28,x0:1,y0:1,z0:1,projection:'xz',points:12000,width:0.7,palette:'dusk'};
 const schema={rho:{label:'ρ',min:0.5,max:60,step:0.5},x0:{label:'初期位置x',min:-20,max:20,step:0.1},y0:{label:'初期位置y',min:-20,max:20,step:0.1},z0:{label:'初期位置z',min:-10,max:50,step:0.1},projection:{label:'投影面',options:{xz:'x–z（横から）',xy:'x–y（上から）',yz:'y–z（正面から）'}},points:{label:'軌道の点数',min:1000,max:20000,step:500},width:{label:'線幅',min:0.3,max:3,step:0.1},palette:C.palette};
 // Standard σ and β; a fixed RK4 step; the first TRANSIENT steps are integrated but not drawn.
 const SIGMA=10,BETA=8/3,DT=0.005,TRANSIENT=1000,LIMIT=1e6,MIN_EXTENT=2,MARGIN=40,BANDS=8;
 const field=(rho,[x,y,z])=>[SIGMA*(y-x),x*(rho-z)-y,x*y-BETA*z];
 function step(rho,p,h=DT){
  const add=(a,b,k)=>a.map((v,i)=>v+k*b[i]),k1=field(rho,p),k2=field(rho,add(p,k1,h/2)),k3=field(rho,add(p,k2,h/2)),k4=field(rho,add(p,k3,h));
  return p.map((v,i)=>v+h/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]));
 }
 const AXES={xz:[0,2],xy:[0,1],yz:[1,2]};
 function geometry(s){
  let p=[s.x0,s.y0,s.z0],diverged=false;const orbit=[];
  for(let i=0;i<TRANSIENT+s.points;i++){
   p=step(s.rho,p);if(!p.every(v=>Number.isFinite(v)&&Math.abs(v)<LIMIT)){diverged=true;break;}
   if(i>=TRANSIENT)orbit.push(p);
  }
  const [a,b]=AXES[s.projection],flat=orbit.map(q=>[q[a],q[b]]);
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const [x,y]of flat){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  // Fit the projected orbit, but never magnify an extent below MIN_EXTENT so a settled orbit stays small.
  const k=flat.length?Math.min((900-2*MARGIN)/Math.max(x1-x0,MIN_EXTENT),(600-2*MARGIN)/Math.max(y1-y0,MIN_EXTENT)):1;
  const screen=flat.map(([x,y])=>[450+k*(x-(x0+x1)/2),300-k*(y-(y0+y1)/2)]);
  return {orbit,screen,diverged,last:p};
 }
 const round=v=>Math.round(v*10)/10;
 function draw(g,s,p){
  if(!g.screen.length)return '';
  const n=g.screen.length,size=Math.ceil(n/BANDS);let out='';
  for(let band=0;band*size<n;band++){
   const pts=g.screen.slice(band*size,Math.min(n,(band+1)*size+1));let [px,py]=[round(pts[0][0]),round(pts[0][1])],d=`M${px} ${py}`;
   // Repeated points add nothing; a lone point is kept as a dot by the round line cap.
   for(const [x,y]of pts.slice(1)){const [qx,qy]=[round(x),round(y)];if(qx===px&&qy===py)continue;d+=`l${round(qx-px)} ${round(qy-py)}`;[px,py]=[qx,qy];}
   if(!d.includes('l'))d+='l0 0';
   out+=`<path d="${d}" fill="none" stroke="${C.mix(p[1],p[2],band/(BANDS-1))}" stroke-width="${s.width}" stroke-linejoin="round" stroke-linecap="round" stroke-opacity="0.85"/>`;
  }
  return out;
 }
 const settled=g=>g.orbit.length>1&&g.orbit.every(q=>Math.hypot(q[0]-g.last[0],q[1]-g.last[1],q[2]-g.last[2])<1e-6);
 const G=C.create({slug:'lorenz-orbit',title:'ローレンツの軌道',defaults,schema,geometry,draw,
  note:g=>g.diverged?'値が発散したため、そこで計算を止めています。':settled(g)?'軌道は平衡点にとどまっています。':''});
 if(typeof module!=='undefined')module.exports={...G,step};if(typeof window!=='undefined')window.StudyGenerator=G;
})();
