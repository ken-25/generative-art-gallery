(() => {
 'use strict';const C=typeof module!=='undefined'?require('../../assets/study-core.js'):StudyCore;
 const defaults={bands:6,steps:80,direction:'right',back:0.15,length:10,bend:0.7,spacing:0.85,width:1.3,palette:'clay',seed:'trail-001'};
 const schema={bands:{label:'帯数',min:1,max:12,step:1},steps:{label:'一帯の最大歩数',min:0,max:250,step:1},direction:{label:'進行方向',options:{right:'右',down:'下'}},back:{label:'戻り確率',min:0,max:1,step:0.05},length:{label:'一歩の長さ',min:2,max:18,step:1},bend:{label:'折れ幅',min:0,max:2,step:0.05},spacing:{label:'帯の間隔',min:0.3,max:1,step:0.05},width:{label:'線幅',min:0.5,max:4,step:0.1},palette:C.palette};
 function geometry(s){const rng=C.rng(s.seed),along=s.direction==='right'?840:540,across=s.direction==='right'?540:840,band=across/s.bands,paths=[];
  for(let i=0;i<s.bands;i++){let u=30,v=30+across/2+(i-(s.bands-1)/2)*band*s.spacing;const center=v,points=[[u,v]];
   for(let j=0;j<s.steps;j++){const speed=s.length*(0.75+0.25*Math.sin(j*0.12+i)),next=u+speed*(rng()<s.back?-1:1);if(next<30||next>along+30)break;
    u=next;v=Math.max(center-band*s.spacing*0.42,Math.min(center+band*s.spacing*0.42,v+(rng()-0.5)*s.length*s.bend));points.push([u,v]);}
   paths.push(s.direction==='right'?points:points.map(([x,y])=>[y,x]));
  }return paths;
 }
 const G=C.create({slug:'line-trails',title:'線の航跡',defaults,schema,geometry,draw:(paths,s,p)=>paths.map((v,i)=>`<path d="${v.map(([x,y],j)=>`${j?'L':'M'}${x} ${y}`).join('')}" fill="none" stroke="${p[1+i%2]}" stroke-width="${s.width}" stroke-linejoin="round"/>`).join('')});
 if(typeof module!=='undefined')module.exports=G;if(typeof window!=='undefined')window.StudyGenerator=G;
})();
