(() => {
 'use strict';const C=typeof module!=='undefined'?require('../../assets/study-core.js'):StudyCore;
 const defaults={count:800,directions:4,angle:17,mean:18,spread:0.45,densityA:1,densityB:3,densityC:2,width:1.2,palette:'dusk',seed:'distribution-001',w0:3,w1:1,w2:2,w3:1,w4:1,w5:1};
 const schema={count:{label:'線分数',min:0,max:3000,step:1},directions:{label:'方向数',min:1,max:6,step:1},angle:{label:'基準角度',min:0,max:179,step:1},mean:{label:'平均線長',min:2,max:50,step:1},spread:{label:'線長のばらつき',min:0,max:1,step:0.05},densityA:{label:'左領域の密度重み',min:0,max:10,step:1},densityB:{label:'中央領域の密度重み',min:0,max:10,step:1},densityC:{label:'右領域の密度重み',min:0,max:10,step:1},width:{label:'線幅',min:0.5,max:3,step:0.1},palette:C.palette};
 for(let i=0;i<6;i++)schema[`w${i}`]={label:`方向${i+1}の重み`,min:0,max:100,step:1};
 function geometry(s){const rng=C.rng(s.seed),weights=Array.from({length:s.directions},(_,i)=>s[`w${i}`]),densities=[s.densityA,s.densityB,s.densityC],sum=weights.reduce((a,b)=>a+b,0),total=densities.reduce((a,b)=>a+b,0);if(!sum||!total)return [];
  const choose=(w,total)=>{let pick=rng()*total;for(let i=0;i<w.length;i++){pick-=w[i];if(pick<0)return i;}return w.findLastIndex(n=>n>0);};const lines=[];
  for(let i=0;i<s.count;i++){const direction=choose(weights,sum),region=choose(densities,total),x=60+region*260+rng()*260,y=60+rng()*480,angle=(s.angle+direction*180/s.directions)*Math.PI/180,length=s.mean*(1+(rng()*2-1)*s.spread),dx=Math.cos(angle)*length/2,dy=Math.sin(angle)*length/2;lines.push({direction,region,length,a:[x-dx,y-dy],b:[x+dx,y+dy]});}return lines;
 }
 const G=C.create({slug:'probability-segments',title:'三つの分布',defaults,schema,geometry,draw:(lines,s,p)=>lines.map(l=>`<path d="M${l.a.join(' ')}L${l.b.join(' ')}" stroke="${p[1+l.region%2]}" stroke-width="${s.width}"/>`).join('')});
 if(typeof module!=='undefined')module.exports=G;if(typeof window!=='undefined')window.StudyGenerator=G;
})();
