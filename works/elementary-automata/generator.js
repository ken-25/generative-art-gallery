(() => {
 'use strict';const C=typeof module!=='undefined'?require('../../assets/study-core.js'):StudyCore;
 const defaults={preset:'custom',rule:30,init:'single',density:0.5,columns:201,generations:100,palette:'fern',seed:'eca-001'};
 const schema={preset:{label:'ルール',options:{'30':'ルール30','90':'ルール90','110':'ルール110','184':'ルール184',custom:'番号を指定'}},rule:{label:'ルール番号',min:0,max:255,step:1},init:{label:'初期状態',options:{single:'中央の1セル',random:'ランダム'}},density:{label:'初期密度',min:0.05,max:0.95,step:0.05},columns:{label:'列数',min:16,max:256,step:1},generations:{label:'世代数',min:16,max:256,step:1},palette:C.palette};
 const ruleOf=s=>s.preset==='custom'?s.rule:Number(s.preset);
 // Bit 4l+2c+r of the rule number gives the next state of a cell whose left, centre and right neighbours are l, c, r.
 const next=(rule,l,c,r)=>(rule>>(4*l+2*c+r))&1;
 function geometry(s){
  const rule=ruleOf(s),n=s.columns,rng=C.rng(s.seed);
  let row=new Uint8Array(n);if(s.init==='single')row[n>>1]=1;else for(let i=0;i<n;i++)row[i]=rng()<s.density?1:0;
  const rows=[row];
  // Periodic boundary: the first and last columns are neighbours.
  for(let t=1;t<s.generations;t++){const r=new Uint8Array(n);for(let i=0;i<n;i++)r[i]=next(rule,row[(i+n-1)%n],row[i],row[(i+1)%n]);rows.push(row=r);}
  return {rule,rows};
 }
 function draw(g,s,p){
  const n=s.columns,size=Math.min(860/n,560/s.generations),x=(900-size*n)/2,y=(600-size*s.generations)/2,runs=[[],[]];
  // Consecutive live cells in a row become one rectangle in cell units.
  g.rows.forEach((row,t)=>{let i=0;while(i<n){if(!row[i]){i++;continue;}let j=i;while(j<n&&row[j])j++;runs[t?0:1].push(`M${i} ${t}h${j-i}v1h-${j-i}z`);i=j;}});
  const k=Math.round(size*1e6)/1e6;
  return `<g transform="translate(${Math.round(x*1e3)/1e3} ${Math.round(y*1e3)/1e3}) scale(${k})" shape-rendering="crispEdges"><rect width="${n}" height="${s.generations}" fill="${C.mix(p[0],p[1],0.06)}"/>${runs.map((r,i)=>r.length?`<path d="${r.join('')}" fill="${p[1+i]}"/>`:'').join('')}</g>`;
 }
 const G=C.create({slug:'elementary-automata',title:'三つの隣から',defaults,schema,geometry,draw});
 if(typeof module!=='undefined')module.exports=G;if(typeof window!=='undefined')window.StudyGenerator=G;
})();
