(() => {
 'use strict';const C=typeof module!=='undefined'?require('../../assets/study-core.js'):StudyCore;
 const defaults={count:700,flow:1.2,jitter:0.3,length:20,spread:0.35,maskWidth:70,maskAngle:25,maskPosition:0,width:1.2,palette:'fern',seed:'flow-001'};
 const schema={count:{label:'線分数',min:0,max:2000,step:1},flow:{label:'流れの強さ',min:0,max:3,step:0.05},jitter:{label:'角度揺らぎ',min:0,max:1,step:0.05},length:{label:'平均線長',min:2,max:36,step:1},spread:{label:'線長のばらつき',min:0,max:0.5,step:0.05},maskWidth:{label:'空白帯の幅',min:0,max:300,step:1},maskAngle:{label:'空白帯の法線角度',min:0,max:179,step:1},maskPosition:{label:'空白帯の位置',min:-400,max:400,step:5},width:{label:'線幅',min:0.5,max:3,step:0.1},palette:C.palette};
 function geometry(s){const rng=C.rng(s.seed),base=[];for(let i=0;i<s.count;i++){const x=60+rng()*780,y=60+rng()*480,angle=s.flow*(Math.sin(y/73)+0.6*Math.cos(x/117))+(rng()-0.5)*s.jitter*Math.PI,length=s.length*(1+(rng()*2-1)*s.spread),dx=Math.cos(angle)*length/2,dy=Math.sin(angle)*length/2;base.push({index:i,a:[x-dx,y-dy],b:[x+dx,y+dy],angle,length});}
 const normal=s.maskAngle*Math.PI/180,nx=Math.cos(normal),ny=Math.sin(normal);const visible=base.filter(l=>{if(!s.maskWidth)return true;const a=(l.a[0]-450)*nx+(l.a[1]-300)*ny-s.maskPosition,b=(l.b[0]-450)*nx+(l.b[1]-300)*ny-s.maskPosition;return Math.max(a,b)<-s.maskWidth/2-s.width/2||Math.min(a,b)>s.maskWidth/2+s.width/2;});return {base,visible};}
 const G=C.create({slug:'flow-and-silence',title:'流れと静けさ',defaults,schema,geometry,draw:(g,s,p)=>g.visible.map((l,i)=>`<path d="M${l.a.join(' ')}L${l.b.join(' ')}" stroke="${p[1+l.index%2]}" stroke-width="${s.width}"/>`).join('')});
 if(typeof module!=='undefined')module.exports=G;if(typeof window!=='undefined')window.StudyGenerator=G;
})();
