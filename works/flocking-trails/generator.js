(() => {
 'use strict';const C=typeof module!=='undefined'?require('../../assets/study-core.js'):StudyCore;
 const defaults={count:60,separation:1.5,alignment:1,cohesion:0.8,radius:50,steps:320,palette:'fern',seed:'boids-001'};
 const schema={count:{label:'個体数',min:1,max:120,step:1},separation:{label:'分離の重み',min:0,max:3,step:0.1},alignment:{label:'整列の重み',min:0,max:3,step:0.1},cohesion:{label:'結合の重み',min:0,max:3,step:0.1},radius:{label:'近傍半径',min:10,max:120,step:1},steps:{label:'軌跡の長さ',min:20,max:500,step:10},palette:C.palette};
 // The world is a 900×600 torus; speeds and steering are limited so trails stay smooth.
 const W=900,H=600,MAX_SPEED=3,MIN_SPEED=1,MAX_FORCE=0.05,MAX_ACCEL=0.15,CHUNK=20,DRAW_EVERY=2;
 const wrap=(d,size)=>d-size*Math.round(d/size);
 // Only correctly rounded operations (no Math.hypot or trigonometry), so chaotic trails match in every engine.
 const norm=(x,y)=>Math.sqrt(x*x+y*y);
 const limit=(x,y,max)=>{const m=norm(x,y);return m>max?[x*max/m,y*max/m]:[x,y];};
 // Steer toward a direction at full speed, as a force no larger than MAX_FORCE; no direction means no force.
 const steer=(x,y,vx,vy)=>{const m=norm(x,y);return m>1e-12?limit(x/m*MAX_SPEED-vx,y/m*MAX_SPEED-vy,MAX_FORCE):[0,0];};
 // One step for every boid, computed only from the previous state, then applied together.
 function step(boids,s){
  const r2=s.radius*s.radius,sep2=r2/4;
  return boids.map(b=>{
   let n=0,ax=0,ay=0,cx=0,cy=0,sx=0,sy=0;
   for(const o of boids){if(o===b)continue;const dx=wrap(o.x-b.x,W),dy=wrap(o.y-b.y,H),d2=dx*dx+dy*dy;if(d2>r2)continue;
    n++;ax+=o.vx;ay+=o.vy;cx+=dx;cy+=dy;if(d2<sep2&&d2>1e-12){sx-=dx/d2;sy-=dy/d2;}}
   let fx=0,fy=0;
   if(n){const [s1,s2]=steer(sx,sy,b.vx,b.vy),[a1,a2]=steer(ax,ay,b.vx,b.vy),[c1,c2]=steer(cx,cy,b.vx,b.vy);
    fx=s.separation*s1+s.alignment*a1+s.cohesion*c1;fy=s.separation*s2+s.alignment*a2+s.cohesion*c2;[fx,fy]=limit(fx,fy,MAX_ACCEL);}
   let vx=b.vx+fx,vy=b.vy+fy,m=norm(vx,vy);
   if(m>MAX_SPEED){vx*=MAX_SPEED/m;vy*=MAX_SPEED/m;}else if(m<MIN_SPEED){if(m>1e-12){vx*=MIN_SPEED/m;vy*=MIN_SPEED/m;}else{vx=b.vx;vy=b.vy;}}
   return {x:((b.x+vx)%W+W)%W,y:((b.y+vy)%H+H)%H,vx,vy};
  });
 }
 function* simulate(s){
  const rng=C.rng(s.seed);let boids=Array.from({length:s.count},()=>{const x=rng()*W,y=rng()*H,[ux,uy]=C.direction(rng);return {x,y,vx:2*ux,vy:2*uy};});
  const initial=boids,trails=boids.map(b=>[[b.x,b.y]]);
  for(let t=1;t<=s.steps;t++){boids=step(boids,s);boids.forEach((b,i)=>trails[i].push([b.x,b.y]));if(t%CHUNK===0)yield;}
  return {initial,trails};
 }
 // Break a trail where it wraps across an edge so no line crosses the picture.
 function pieces(trail){const out=[[trail[0]]];for(let i=1;i<trail.length;i++){const [x0,y0]=trail[i-1],[x,y]=trail[i];if(Math.abs(x-x0)>W/2||Math.abs(y-y0)>H/2)out.push([]);out.at(-1).push([x,y]);}return out.filter(p=>p.length>1);}
 const geometry=(s,sim)=>({...sim,pieces:sim.trails.map(pieces)});
 const round=v=>Math.round(v*10)/10;
 function draw(g,s,p){
  return g.pieces.map((list,i)=>`<path d="${list.map(piece=>{const pts=piece.filter((_,k)=>k%DRAW_EVERY===0||k===piece.length-1);let [px,py]=[round(pts[0][0]),round(pts[0][1])],d=`M${px} ${py}`;for(const [x,y]of pts.slice(1)){const [qx,qy]=[round(x),round(y)];d+=`l${round(qx-px)} ${round(qy-py)}`;[px,py]=[qx,qy];}return d;}).join('')}" fill="none" stroke="${p[1+i%2]}" stroke-width="0.9" stroke-opacity="0.6" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
 }
 const G=C.create({slug:'flocking-trails',title:'群れの軌跡',defaults,schema,geometry,draw,simulate,simulationKeys:['count','separation','alignment','cohesion','radius','steps','seed']});
 if(typeof module!=='undefined')module.exports={...G,step};if(typeof window!=='undefined')window.StudyGenerator=G;
})();
