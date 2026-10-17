(() => {
 'use strict';const C=typeof module!=='undefined'?require('../../assets/study-core.js'):StudyCore;
 // Each rule rewrites X (a bud) in parallel; F draws a branch, +/- turn, [ ] save and restore the turtle.
 const RULES=Object.freeze({
  fork:Object.freeze({axiom:'FX',X:'F[+X][-X]'}),
  alternate:Object.freeze({axiom:'FX',X:'F[+X]F[-X][X]'}),
  whorl:Object.freeze({axiom:'FX',X:'F[++X][X][--X]'})
 });
 const defaults={rule:'alternate',generations:6,angle:24,shrink:0.82,width:2.4,palette:'fern'};
 const schema={rule:{label:'規則',options:{fork:'二股',alternate:'互い違い',whorl:'三方'}},generations:{label:'世代数',min:0,max:12,step:1},angle:{label:'分岐角',min:0,max:90,step:1},shrink:{label:'枝長の縮小率',min:0.4,max:1,step:0.01},width:{label:'幹の線幅',min:0.5,max:6,step:0.1},palette:C.palette};
 const MAX_SYMBOLS=200000,MAX_SEGMENTS=12000,MARGIN=36;
 function expand(rule,generations){
  let word=rule.axiom,reached=0;
  for(let g=1;g<=generations;g++){
   // Count before building, so an oversized generation is never materialised.
   let symbols=0,segments=0;for(const ch of word){const out=rule[ch]??ch;symbols+=out.length;for(const c of out)if(c==='F')segments++;}
   if(symbols>MAX_SYMBOLS||segments>MAX_SEGMENTS)return {word,reached,limited:true};
   let next='';for(const ch of word)next+=rule[ch]??ch;word=next;reached=g;
  }
  return {word,reached,limited:false};
 }
 // Turtle: starts at the origin heading up; branch length is shrink^depth where depth counts open brackets.
 function turtle(word,angle,shrink){
  const turn=angle*Math.PI/180,stack=[],segments=[];let x=0,y=0,a=-Math.PI/2,depth=0;
  for(const ch of word){
   if(ch==='F'){const l=shrink**depth,nx=x+l*Math.cos(a),ny=y+l*Math.sin(a);segments.push({x1:x,y1:y,x2:nx,y2:ny,depth});x=nx;y=ny;}
   else if(ch==='+')a-=turn;else if(ch==='-')a+=turn;
   else if(ch==='['){stack.push([x,y,a,depth]);depth++;}
   else if(ch===']')[x,y,a,depth]=stack.pop();
  }
  return segments;
 }
 function geometry(s){
  const {word,reached,limited}=expand(RULES[s.rule],s.generations),raw=turtle(word,s.angle,s.shrink);
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const g of raw){x0=Math.min(x0,g.x1,g.x2);x1=Math.max(x1,g.x1,g.x2);y0=Math.min(y0,g.y1,g.y2);y1=Math.max(y1,g.y1,g.y2);}
  // Fit the whole plant into the frame; the base of the trunk stays at the bottom.
  const k=Math.min((900-2*MARGIN)/Math.max(x1-x0,1e-9),(600-2*MARGIN)/Math.max(y1-y0,1e-9)),ox=450-k*(x0+x1)/2,oy=600-MARGIN-k*y1;
  const segments=raw.map(g=>({x1:ox+k*g.x1,y1:oy+k*g.y1,x2:ox+k*g.x2,y2:oy+k*g.y2,depth:g.depth}));
  return {segments,reached,limited,symbols:word.length,scale:k};
 }
 const round=v=>Math.round(v*10)/10;
 function draw(g,s,p){
  const depths=new Map();for(const q of g.segments){if(!depths.has(q.depth))depths.set(q.depth,[]);depths.get(q.depth).push(q);}
  const deepest=Math.max(1,...depths.keys());
  return [...depths].sort((a,b)=>a[0]-b[0]).map(([depth,list])=>`<path d="${list.map(q=>`M${round(q.x1)} ${round(q.y1)}L${round(q.x2)} ${round(q.y2)}`).join('')}" fill="none" stroke="${C.mix(p[1],p[2],depth/deepest)}" stroke-width="${round(Math.max(0.3,s.width*s.shrink**depth)*100)/100}" stroke-linecap="round"/>`).join('');
 }
 const G=C.create({slug:'branching-rules',title:'書き換えて育つ枝',defaults,schema,geometry,draw,
  note:(g,s)=>g.limited?`展開した文字数または枝の数が上限を超えるため、${g.reached}世代目で止めています（${s.generations}世代は描きません）。`:''});
 if(typeof module!=='undefined')module.exports=G;if(typeof window!=='undefined')window.StudyGenerator=G;
})();
