(() => {
 'use strict';const C=typeof module!=='undefined'?require('../../assets/study-core.js'):StudyCore;
 const defaults={sites:4,rings:12,ink:22,water:18,drift:3,wave:16,wavelength:260,angle:20,tines:4,pull:45,palette:'dusk',seed:'ink-001'};
 const schema={sites:{label:'落とす場所の数',min:1,max:5,step:1},rings:{label:'墨の輪の数',min:1,max:15,step:1},ink:{label:'墨の滴の半径',min:4,max:36,step:1},water:{label:'水の滴の半径',min:0,max:36,step:1},drift:{label:'滴のずれ',min:0,max:12,step:0.5},wave:{label:'波の振幅',min:0,max:60,step:1},wavelength:{label:'波長',min:80,max:400,step:5},angle:{label:'流す向き',min:0,max:179,step:1},tines:{label:'櫛の本数',min:0,max:9,step:1},pull:{label:'櫛で引く距離',min:0,max:120,step:1},palette:C.palette};
 const SIDES=72,MAX_EDGE=5,MIN_EDGE=1.5,FAR_EDGE=40,DEPTH=6,TINE_FALLOFF=20;
 // Later flows move points by at most a few hundred units, so detail beyond this margin never returns into view.
 const outside=q=>q[0]<-400||q[0]>1300||q[1]<-400||q[1]>1000;
 // Push every point radially out of a new disk; the area outside the disk is preserved.
 const drop=(c,r)=>p=>{const dx=p[0]-c[0],dy=p[1]-c[1],d2=dx*dx+dy*dy;if(d2<1e-9)return [c[0]+r,c[1]];const k=Math.sqrt(1+r*r/d2);return [c[0]+dx*k,c[1]+dy*k];};
 // Apply a transform to a closed polygon: split edges that stretch, drop vertices that crowd together.
 function warp(poly,f){const out=[],n=poly.length,far=(a,b,l)=>(b[0]-a[0])**2+(b[1]-a[1])**2>l*l;let last;
  const keep=q=>{if(!last||far(last,q,outside(q)&&outside(last)?FAR_EDGE:MIN_EDGE)){out.push(q);last=q;}};
  const edge=(a,b,fa,fb,depth)=>{if(depth<DEPTH&&far(fa,fb,outside(fa)&&outside(fb)?FAR_EDGE:MAX_EDGE)){const m=[(a[0]+b[0])/2,(a[1]+b[1])/2],fm=f(m);edge(a,m,fa,fm,depth+1);keep(fm);edge(m,b,fm,fb,depth+1);}};
  const mapped=poly.map(f);for(let i=0;i<n;i++){keep(mapped[i]);edge(poly[i],poly[(i+1)%n],mapped[i],mapped[(i+1)%n],0);}return out;}
 function geometry(s){const rng=C.rng(s.seed),rings=[];
  const apply=f=>{for(const r of rings)r.points=warp(r.points,f);};
  for(let site=0;site<s.sites;site++){const center=[150+rng()*600,110+rng()*380];
   for(let i=0;i<s.rings;i++)for(const [ink,radius] of [[true,s.ink],[false,s.water]]){if(!radius)continue;
    const c=[center[0]+(rng()*2-1)*s.drift,center[1]+(rng()*2-1)*s.drift];apply(drop(c,radius));
    const points=Array.from({length:SIDES},(_,k)=>[c[0]+radius*Math.cos(2*Math.PI*k/SIDES),c[1]+radius*Math.sin(2*Math.PI*k/SIDES)]);rings.push({site,ink,points});}}
  const a=s.angle*Math.PI/180,m=[Math.cos(a),Math.sin(a)],n=[-m[1],m[0]],across=p=>(p[0]-450)*n[0]+(p[1]-300)*n[1];
  // Shears along the flow direction: each point moves by an amount that depends only on its cross-flow position.
  if(s.wave)apply(p=>{const t=s.wave*Math.sin(2*Math.PI*across(p)/s.wavelength);return [p[0]+t*m[0],p[1]+t*m[1]];});
  for(let i=0;i<s.tines&&s.pull;i++){const offset=(i+1-(s.tines+1)/2)*540/(s.tines+1),dir=i%2?-1:1;
   apply(p=>{const t=dir*s.pull*TINE_FALLOFF/(Math.abs(across(p)-offset)+TINE_FALLOFF);return [p[0]+t*m[0],p[1]+t*m[1]];});}
  return {rings,direction:m};}
 const round=v=>Math.round(v*10)/10,visible=pts=>{let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const [x,y]of pts){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}return x1>=0&&x0<=900&&y1>=0&&y0<=600;};
 const G=C.create({slug:'ink-on-water',title:'水面の墨',defaults,schema,geometry,draw:(g,s,p)=>g.rings.filter(r=>visible(r.points)).map(r=>`<path d="M${r.points.map(q=>round(q[0])+' '+round(q[1])).join('L')}Z" fill="${r.ink?p[1+r.site%2]:p[0]}"/>`).join('')});
 if(typeof module!=='undefined')module.exports=G;if(typeof window!=='undefined')window.StudyGenerator=G;
})();
