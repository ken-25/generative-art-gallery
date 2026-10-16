(() => {
 'use strict';const C=typeof module!=='undefined'?require('../../assets/study-core.js'):StudyCore;
 const defaults={states:3,columns:20,rows:12,scan:'snake',palette:'fern',seed:'state-001'};
 const schema={states:{label:'状態数',min:2,max:4,step:1},columns:{label:'列数',min:3,max:30,step:1},rows:{label:'行数',min:3,max:20,step:1},scan:{label:'走査方向',options:{row:'行順',column:'列順',snake:'折り返し'}},palette:C.palette};
 for(let i=0;i<4;i++)for(let j=0;j<4;j++){const key=`w${i}${j}`;defaults[key]=i===j?6:1;schema[key]={label:`状態${i} → ${j} の重み`,min:0,max:100,step:1};}
 function geometry(s){const random=C.rng(s.seed),matrix=[];for(let i=0;i<s.states;i++){let row=Array.from({length:s.states},(_,j)=>s[`w${i}${j}`]),sum=row.reduce((a,b)=>a+b,0);if(!sum){row=row.map((_,j)=>Number(i===j));sum=1;}matrix.push(row.map(n=>n/sum));}
  const order=[];if(s.scan==='column'){for(let c=0;c<s.columns;c++)for(let r=0;r<s.rows;r++)order.push([r,c]);}else for(let r=0;r<s.rows;r++)for(let c=0;c<s.columns;c++)order.push([r,s.scan==='snake'&&r%2?s.columns-1-c:c]);
  const radius=Math.min(840/(Math.sqrt(3)*(s.columns+0.5)),540/(1.5*s.rows+0.5)),cells=[];let state=0;
  for(const [row,col]of order){const x=30+Math.sqrt(3)*radius*(col+0.5+(row%2)*0.5),y=30+radius+row*radius*1.5;cells.push({state,row,col,points:Array.from({length:6},(_,k)=>[x+radius*Math.cos((k*60-30)*Math.PI/180),y+radius*Math.sin((k*60-30)*Math.PI/180)])});let pick=random(),next=s.states-1;for(let j=0;j<s.states;j++){pick-=matrix[state][j];if(pick<0){next=j;break;}}state=next;}
  return {matrix,cells};
 }
 const G=C.create({slug:'hex-transitions',title:'色のつづき',defaults,schema,geometry,draw:(g,s,p)=>g.cells.map(c=>`<polygon points="${c.points.map(v=>v.join(',')).join(' ')}" fill="${[p[1],p[2],p[0],'#a68d75'][c.state]}" stroke="${p[0]}" stroke-width="0.8"/>`).join('')});
 if(typeof module!=='undefined')module.exports=G;if(typeof window!=='undefined')window.StudyGenerator=G;
})();
