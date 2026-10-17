(() => {
 'use strict';const C=typeof module!=='undefined'?require('../../assets/study-core.js'):StudyCore;
 const defaults={sites:90,iterations:4,style:'both',markers:'show',palette:'clay',seed:'voronoi-001'};
 const schema={sites:{label:'母点の数',min:2,max:200,step:1},iterations:{label:'緩和の回数',min:0,max:20,step:1},style:{label:'描き方',options:{fill:'塗り',outline:'輪郭',both:'塗りと輪郭'}},markers:{label:'母点の表示',options:{show:'表示',hide:'非表示'}},palette:C.palette};
 const W=900,H=600,SAME=1e-9,LEVELS=5;
 // Keep the part of a convex polygon where n·x <= c (Sutherland–Hodgman for one half-plane).
 function clip(poly,nx,ny,c){const out=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],dp=nx*p[0]+ny*p[1]-c,dq=nx*q[0]+ny*q[1]-c;
  if(dp<=0)out.push(p);if((dp<0&&dq>0)||(dp>0&&dq<0)){const t=dp/(dp-dq);out.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}}return out;}
 // Each cell is the frame rectangle cut by the bisector with every other site; a repeated site leaves its later copies empty.
 function cells(sites){
  return sites.map((p,i)=>{
   let poly=[[0,0],[W,0],[W,H],[0,H]];
   const others=sites.map((q,j)=>[j,(q[0]-p[0])**2+(q[1]-p[1])**2]).filter(([j])=>j!==i).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
   for(const [j,d2]of others){
    if(d2<SAME*SAME){if(j<i)return [];continue;}
    // A bisector farther than twice the farthest vertex cannot cut the cell any more.
    const reach=Math.max(...poly.map(v=>(v[0]-p[0])**2+(v[1]-p[1])**2));if(d2>4*reach)break;
    const q=sites[j];poly=clip(poly,q[0]-p[0],q[1]-p[1],(q[0]*q[0]+q[1]*q[1]-p[0]*p[0]-p[1]*p[1])/2);if(!poly.length)return [];
   }
   return poly;
  });
 }
 function centroid(poly){let a=0,x=0,y=0;for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],k=p[0]*q[1]-q[0]*p[1];a+=k;x+=(p[0]+q[0])*k;y+=(p[1]+q[1])*k;}return Math.abs(a)>1e-12?{area:Math.abs(a)/2,x:x/(3*a),y:y/(3*a)}:null;}
 function* simulate(s){
  const rng=C.rng(s.seed);let sites=Array.from({length:s.sites},()=>[rng()*W,rng()*H]);const tones=sites.map(()=>Math.floor(rng()*LEVELS)),initial=sites;
  let polys=cells(sites);
  // Lloyd relaxation: move every site to the centroid of its cell, then recompute the cells.
  for(let k=0;k<s.iterations;k++){yield;sites=sites.map((p,i)=>{const c=centroid(polys[i]);return c?[c.x,c.y]:p;});polys=cells(sites);}
  return {initial,sites,cells:polys,tones};
 }
 const geometry=(s,sim)=>sim;
 const round=v=>Math.round(v*10)/10,path=list=>list.map(c=>'M'+c.map(v=>round(v[0])+' '+round(v[1])).join('L')+'Z').join('');
 function draw(g,s,p){
  const filled=s.style!=='outline',lined=s.style!=='fill',ok=g.cells.map(c=>c.length>=3);let out='';
  if(filled)for(let l=0;l<LEVELS;l++){const list=g.cells.filter((c,i)=>ok[i]&&g.tones[i]===l);if(list.length)out+=`<path d="${path(list)}" fill="${C.mix(p[1],p[2],l/(LEVELS-1))}"${lined?` stroke="${p[0]}" stroke-width="1.6" stroke-linejoin="round"`:''}/>`;}
  else out+=`<path d="${path(g.cells.filter((c,i)=>ok[i]))}" fill="none" stroke="${p[1]}" stroke-width="1.2" stroke-linejoin="round"/>`;
  if(s.markers==='show')out+=`<path d="${g.sites.map(([x,y])=>`M${round(x-2.2)} ${round(y)}a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0`).join('')}" fill="${filled?p[0]:p[2]}"/>`;
  return out;
 }
 const G=C.create({slug:'voronoi-relaxation',title:'近い点の領域',defaults,schema,geometry,draw,simulate,simulationKeys:['sites','iterations','seed']});
 if(typeof module!=='undefined')module.exports={...G,cells,centroid};if(typeof window!=='undefined')window.StudyGenerator=G;
})();
