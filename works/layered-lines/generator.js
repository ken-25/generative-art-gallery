(() => {
 'use strict';const C=typeof module!=='undefined'?require('../../assets/study-core.js'):StudyCore;
 const defaults={groups:3,angle:23,delta:37,spacing:14,phase:0.25,ratioA:2,ratioB:3,ratioC:4,width:1,palette:'fern'};
 const schema={groups:{label:'線群数',min:0,max:5,step:1},angle:{label:'基準角度',min:0,max:179,step:1},delta:{label:'線群ごとの角度差',min:1,max:179,step:1},spacing:{label:'線間隔',min:6,max:50,step:1},phase:{label:'位相',min:0,max:1,step:0.05},ratioA:{label:'左領域の幅比',min:1,max:6,step:1},ratioB:{label:'中央領域の幅比',min:1,max:6,step:1},ratioC:{label:'右領域の幅比',min:1,max:6,step:1},width:{label:'線幅',min:0.5,max:3,step:0.1},palette:C.palette};
 function geometry(s){let left=30;const ratios=[s.ratioA,s.ratioB,s.ratioC],sum=ratios.reduce((a,b)=>a+b,0);return ratios.map((ratio,region)=>{const width=840*ratio/sum,center=[left+width/2,300],diagonal=Math.hypot(width,540),lines=[];const rect={x:left,y:30,width,height:540};left+=width;
 for(let group=0;group<s.groups;group++){const angle=(s.angle+group*s.delta)*Math.PI/180,dx=Math.cos(angle),dy=Math.sin(angle),count=Math.ceil(diagonal/s.spacing)+2;for(let j=-count;j<=count;j++){const offset=(j+s.phase)*s.spacing,cx=center[0]-dy*offset,cy=center[1]+dx*offset;lines.push({a:[cx-dx*diagonal,cy-dy*diagonal],b:[cx+dx*diagonal,cy+dy*diagonal],angle,group});}}
 return {rect,lines};});}
 const G=C.create({slug:'layered-lines',title:'角度の重なり',defaults,schema,geometry,draw:(regions,s,p)=>regions.map(({rect:r,lines},i)=>`<defs><clipPath id="layer-${i}"><rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}"/></clipPath></defs><g clip-path="url(#layer-${i})" fill="none" stroke="${p[1+i%2]}" stroke-width="${s.width}">${lines.map(l=>`<path d="M${l.a.join(' ')}L${l.b.join(' ')}"/>`).join('')}</g>`).join('')});
 if(typeof module!=='undefined')module.exports=G;if(typeof window!=='undefined')window.StudyGenerator=G;
})();
