(() => {
 'use strict';const C=typeof module!=='undefined'?require('../../assets/study-core.js'):StudyCore;
 const defaults={bands:4,stacks:5,layers:8,gap:6,rotation:16,shift:10,dropout:0.08,correlation:0.7,palette:'clay',seed:'nest-001'};
 const schema={bands:{label:'帯数',min:1,max:8,step:1},stacks:{label:'一帯の組数',min:1,max:8,step:1},layers:{label:'層数',min:1,max:14,step:1},gap:{label:'層間隔',min:2,max:16,step:1},rotation:{label:'回転の揺らぎ',min:0,max:45,step:1},shift:{label:'中心の変位',min:0,max:30,step:1},dropout:{label:'欠落率',min:0,max:1,step:0.01},correlation:{label:'層間の相関',min:0,max:1,step:0.05},palette:C.palette};
 function geometry(s){const rng=C.rng(s.seed),weights=Array.from({length:s.bands},(_,i)=>1+(i%3)*0.25),sum=weights.reduce((a,b)=>a+b,0),cellWidth=840/s.stacks,polygons=[];let top=30;
  for(let band=0;band<s.bands;band++){const height=540*weights[band]/sum;for(let stack=0;stack<s.stacks;stack++){const cx=30+(stack+0.5)*cellWidth,cy=top+height/2,outer=16+(s.layers-1)*s.gap,scale=Math.min(1,Math.min(cellWidth,height)*0.42/(outer+s.shift*1.5));let sx=(rng()*2-1)*s.shift,sy=(rng()*2-1)*s.shift,rotation=(rng()*2-1)*s.rotation;
   for(let layer=0;layer<s.layers;layer++){const clamp=(n,m)=>Math.max(-m,Math.min(m,n));sx=clamp(s.correlation*sx+(1-s.correlation)*(rng()*2-1)*s.shift,s.shift);sy=clamp(s.correlation*sy+(1-s.correlation)*(rng()*2-1)*s.shift,s.shift);rotation=clamp(s.correlation*rotation+(1-s.correlation)*(rng()*2-1)*s.rotation,s.rotation);const missing=rng()<s.dropout,radius=(outer-layer*s.gap)*scale,x=cx+sx*scale,y=cy+sy*scale;
    if(!missing)polygons.push({band,stack,layer,radius,center:[x,y],rotation,points:Array.from({length:6},(_,i)=>[x+radius*Math.cos((i*60+rotation)*Math.PI/180),y+radius*Math.sin((i*60+rotation)*Math.PI/180)])});
   }}top+=height;
  }return polygons;
 }
 const G=C.create({slug:'nested-hexagons',title:'重なる六つの辺',defaults,schema,geometry,draw:(polygons,s,p)=>polygons.map(c=>`<polygon points="${c.points.map(v=>v.join(',')).join(' ')}" fill="none" stroke="${p[1+c.band%2]}" stroke-width="0.8"/>`).join('')});
 if(typeof module!=='undefined')module.exports=G;if(typeof window!=='undefined')window.StudyGenerator=G;
})();
