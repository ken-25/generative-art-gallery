(() => {
 'use strict';const C=typeof module!=='undefined'?require('../../assets/study-core.js'):StudyCore;
 const defaults={columns:24,rows:16,centerX:0.35,centerY:0.55,spread:0.22,peaks:2,amount:0.6,size:0.6,margin:40,palette:'clay'};
 const schema={columns:{label:'列数',min:3,max:40,step:1},rows:{label:'行数',min:3,max:30,step:1},centerX:{label:'山の横位置',min:0,max:1,step:0.05},centerY:{label:'山の縦位置',min:0,max:1,step:0.05},spread:{label:'山の広がり',min:0.1,max:0.5,step:0.01},peaks:{label:'密度の山の数',min:1,max:3,step:1},amount:{label:'変形量',min:0,max:1,step:0.05},size:{label:'要素サイズ',min:0.1,max:1,step:0.05},margin:{label:'余白',min:20,max:100,step:1},palette:C.palette};
 function geometry(s){const points=[],dx=(900-2*s.margin)/s.columns,dy=(600-2*s.margin)/s.rows,maxRadius=Math.min(dx,dy)*0.16*s.size;
  for(let row=0;row<s.rows;row++)for(let col=0;col<s.columns;col++){const u=(col+0.5)/s.columns,v=(row+0.5)/s.rows;let field=0,gx=0,gy=0;
   for(let k=0;k<s.peaks;k++){const cx=k===0?s.centerX:(s.centerX+k*0.37)%1,cy=k===0?s.centerY:(s.centerY+k*0.29)%1,xx=u-cx,yy=v-cy,g=Math.exp(-(xx*xx+yy*yy)/(2*s.spread*s.spread));field+=g;gx-=xx*g;gy-=yy*g;}
   field=Math.min(1,field);const x=s.margin+(col+0.5)*dx+Math.max(-dx*0.15,Math.min(dx*0.15,gx*dx*s.amount)),y=s.margin+(row+0.5)*dy+Math.max(-dy*0.15,Math.min(dy*0.15,gy*dy*s.amount)),r=maxRadius*(1+s.amount*field);
   points.push({x,y,r,field});
  }return points;
 }
 const G=C.create({slug:'density-field',title:'密度の丘',defaults,schema,geometry,draw:(points,s,p)=>points.map(c=>`<circle cx="${c.x}" cy="${c.y}" r="${c.r}" fill="${s.amount*c.field>0.5?p[1]:p[2]}"/>`).join('')});
 if(typeof module!=='undefined')module.exports=G;if(typeof window!=='undefined')window.StudyGenerator=G;
})();
