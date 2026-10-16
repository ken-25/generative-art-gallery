(() => {
 'use strict';const C=typeof module!=='undefined'?require('../../assets/study-core.js'):StudyCore;
 const vertices=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],edges=[];
 for(let a=0;a<6;a++)for(let b=a+1;b<6;b++)if(Math.floor(a/2)!==Math.floor(b/2))edges.push([a,b]);
 const defaults={cells:6,edges:7,connected:'yes',yaw:30,pitch:20,variation:15,margin:40,width:1.7,palette:'dusk',seed:'edge-001'};
 const schema={cells:{label:'セル数',min:1,max:10,step:1},edges:{label:'辺数',min:1,max:12,step:1},connected:{label:'連結条件',options:{yes:'つながる辺を選ぶ',no:'自由に選ぶ'}},yaw:{label:'投影角',min:-180,max:180,step:1},pitch:{label:'仰角',min:-90,max:90,step:1},variation:{label:'セル間の角度変化',min:0,max:60,step:1},margin:{label:'余白',min:20,max:100,step:1},width:{label:'線幅',min:0.5,max:4,step:0.1},palette:C.palette};
 function geometry(s){const rng=C.rng(s.seed),result=[],cell=(900-2*s.margin)/s.cells,scale=Math.min(cell*0.4,180);
  for(let i=0;i<s.cells;i++){const chosen=[],seen=new Set([Math.floor(rng()*6)]);for(let j=0;j<s.edges;j++){const candidates=edges.map((e,id)=>({e,id})).filter(({e,id})=>!chosen.includes(id)&&(s.connected==='no'||seen.has(e[0])||seen.has(e[1])));const pick=candidates[Math.floor(rng()*candidates.length)];chosen.push(pick.id);pick.e.forEach(v=>seen.add(v));}
   const yaw=(s.yaw+i*s.variation)*Math.PI/180,pitch=s.pitch*Math.PI/180;
   const projected=vertices.map(([x,y,z])=>{const xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=-x*Math.sin(yaw)+z*Math.cos(yaw),yy=y*Math.cos(pitch)-zz*Math.sin(pitch);return [s.margin+cell*(i+0.5)+xx*scale,300+yy*scale];});
   result.push({ids:chosen,edges:chosen.map(id=>edges[id]),points:projected});
  }return result;
 }
 const G=C.create({slug:'octahedral-paths',title:'辺をたどる影',defaults,schema,geometry,draw:(cells,s,p)=>cells.map((c,i)=>c.edges.map(([a,b])=>`<path d="M${c.points[a].join(' ')}L${c.points[b].join(' ')}" fill="none" stroke="${p[1+i%2]}" stroke-width="${s.width}"/>`).join('')).join('')});
 if(typeof module!=='undefined')module.exports=G;if(typeof window!=='undefined')window.StudyGenerator=G;
})();
