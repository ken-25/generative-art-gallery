(() => {
 'use strict';const C=typeof module!=='undefined'?require('../../assets/study-core.js'):StudyCore;
 const defaults={depth:4,minArea:2500,bias:0.5,density:0.45,contrast:0.5,margin:36,palette:'fern',seed:'region-001'};
 const schema={depth:{label:'分割深さ',min:0,max:8,step:1},minArea:{label:'最小領域面積',min:200,max:30000,step:100},bias:{label:'分割方向の偏り',min:0,max:1,step:0.05},density:{label:'線密度',min:0,max:1,step:0.05},contrast:{label:'偶数領域の相対密度',min:0,max:1,step:0.05},margin:{label:'余白',min:20,max:100,step:1},palette:C.palette};
 const area=t=>Math.abs((t[1][0]-t[0][0])*(t[2][1]-t[0][1])-(t[2][0]-t[0][0])*(t[1][1]-t[0][1]))/2;
 function geometry(s){const r=C.rng(s.seed),m=s.margin,leaves=[];
  const split=(t,d)=>{const a=area(t);if(!d||a<s.minArea*2.5){leaves.push(t);return;}
   const edge=r()<s.bias?0:Math.floor(r()*3),v=t[edge],w=t[(edge+1)%3],op=t[(edge+2)%3],q=0.4+r()*0.2,p=[v[0]+(w[0]-v[0])*q,v[1]+(w[1]-v[1])*q];
   const one=[v,p,op],two=[p,w,op];if(Math.min(area(one),area(two))<s.minArea){leaves.push(t);return;}split(one,d-1);split(two,d-1);
  };
  if(!s.depth)leaves.push([[m,m],[900-m,m],[900-m,600-m],[m,600-m]]);
  else {split([[m,m],[900-m,m],[m,600-m]],s.depth-1);split([[900-m,m],[900-m,600-m],[m,600-m]],s.depth-1);}
  const lines=[];leaves.forEach((t,index)=>{const triangle=t.slice(0,3);const a=t.length===4?(900-2*m)*(600-2*m):area(t),count=Math.min(50,Math.floor(a*s.density*(index%2?s.contrast:1)/900));for(let j=0;j<count;j++){
   let x,y;if(t.length===4){x=m+r()*(900-2*m);y=m+r()*(600-2*m);}else{let u=r(),v=r();if(u+v>1){u=1-u;v=1-v;}x=triangle[0][0]+u*(triangle[1][0]-triangle[0][0])+v*(triangle[2][0]-triangle[0][0]);y=triangle[0][1]+u*(triangle[1][1]-triangle[0][1])+v*(triangle[2][1]-triangle[0][1]);}
   const angle=(r()-0.5)*Math.PI+s.bias*Math.PI;lines.push({x,y,dx:Math.cos(angle)*9,dy:Math.sin(angle)*9,region:index});
  }});return {regions:leaves,lines};
 }
 const G=C.create({slug:'recursive-regions',title:'分かれる余白',schema,defaults,geometry,draw:(g,s,p)=>g.regions.map((t,i)=>`<defs><clipPath id="region-${i}"><polygon points="${t.map(v=>v.join(',')).join(' ')}"/></clipPath></defs><polygon points="${t.map(v=>v.join(',')).join(' ')}" fill="none" stroke="${p[2]}" stroke-width="0.6"/>`).join('')+g.lines.map(l=>`<path clip-path="url(#region-${l.region})" d="M${l.x} ${l.y}l${l.dx} ${l.dy}" stroke="${p[1]}" stroke-width="1.3"/>`).join('')});
 if(typeof module!=='undefined')module.exports=G;if(typeof window!=='undefined')window.StudyGenerator=G;
})();
