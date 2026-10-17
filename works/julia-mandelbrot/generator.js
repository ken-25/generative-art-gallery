(() => {
 'use strict';const C=typeof module!=='undefined'?require('../../assets/study-core.js'):StudyCore;
 const defaults={cRe:-0.745,cIm:0.12,centerX:0,centerY:0,zoom:1,iterations:128,palette:'dusk'};
 const schema={cRe:{label:'cの実部',min:-2,max:0.6,step:0.005},cIm:{label:'cの虚部',min:-1.2,max:1.2,step:0.005},centerX:{label:'表示中心の実部',min:-2,max:2,step:0.01},centerY:{label:'表示中心の虚部',min:-2,max:2,step:0.01},zoom:{label:'拡大率',min:1,max:64,step:0.5},iterations:{label:'最大反復数',min:16,max:256,step:8},palette:C.palette};
 // Two square panes of N×N cells: the parameter plane (fixed overview) and the Julia set of the chosen c.
 const N=200,CELL=2,PANES=[[40,100],[460,100]],MANDEL={x:-0.6,y:0,half:1.5},JULIA_HALF=1.6,LEVELS=10,ROWS=8;
 const escapeRadius=(re,im)=>Math.max(2,Math.sqrt(re*re+im*im));
 // Iterate z -> z^2 + c and return the step at which |z| exceeds R, or 0 if it stays bounded for max steps.
 function escape(zr,zi,cr,ci,R2,max){for(let n=1;n<=max;n++){const t=zr*zr-zi*zi+cr;zi=2*zr*zi+ci;zr=t;if(zr*zr+zi*zi>R2)return n;}return 0;}
 const coordinate=(view,i)=>view.x-view.half+(i+0.5)*2*view.half/N;
 function* simulate(s){
  const mandel=new Uint16Array(N*N),julia=new Uint16Array(N*N),view={x:s.centerX,y:s.centerY,half:JULIA_HALF/s.zoom},R=escapeRadius(s.cRe,s.cIm);
  for(let row=0;row<N;row++){
   // Screen rows grow downward, so the imaginary axis points up.
   const mi=MANDEL.y+MANDEL.half-(row+0.5)*2*MANDEL.half/N,ji=view.y+view.half-(row+0.5)*2*view.half/N;
   for(let col=0;col<N;col++){
    // Mandelbrot: start at z=0 and vary c per cell. Julia: fixed c and vary the starting z per cell.
    mandel[row*N+col]=escape(0,0,coordinate(MANDEL,col),mi,4,s.iterations);
    julia[row*N+col]=escape(coordinate(view,col),ji,s.cRe,s.cIm,R*R,s.iterations);
   }
   if(row%ROWS===ROWS-1)yield;
  }
  return {mandel,julia,view,escapeRadius:R};
 }
 const level=(n,max)=>n?Math.min(LEVELS,1+Math.floor((LEVELS-1)*Math.log(n)/Math.log(max))):0;
 function geometry(s,sim){return {...sim,marker:[(s.cRe-MANDEL.x+MANDEL.half)/(2*MANDEL.half)*N,(MANDEL.y+MANDEL.half-s.cIm)/(2*MANDEL.half)*N]};}
 function draw(g,s,p){
  const colors=Array.from({length:LEVELS+1},(_,l)=>l?C.mix(p[0],p[2],0.12+0.88*(l-1)/(LEVELS-1)):p[1]);
  const pane=(counts,[x,y])=>{const runs=Array.from({length:LEVELS+1},()=>[]);
   // Merge equal neighbours on each row into one rectangle, in cell units.
   for(let row=0;row<N;row++){let start=0;for(let col=1;col<=N;col++){const l=level(counts[row*N+start],s.iterations);if(col===N||level(counts[row*N+col],s.iterations)!==l){runs[l].push(`M${start} ${row}h${col-start}v1h-${col-start}z`);start=col;}}}
   return `<g transform="translate(${x} ${y}) scale(${CELL})" shape-rendering="crispEdges"><rect width="${N}" height="${N}" fill="${colors[1]}"/>${runs.map((r,l)=>r.length&&l!==1?`<path d="${r.join('')}" fill="${colors[l]}"/>`:'').join('')}</g>`;};
  const [mx,my]=g.marker,inside=mx>=0&&mx<=N&&my>=0&&my<=N;
  const r=v=>Math.round(v*100)/100,cross=`<circle cx="${r(mx)}" cy="${r(my)}" r="3.5"/><path d="M${r(mx)} ${r(my-8)}v4M${r(mx)} ${r(my+4)}v4M${r(mx-8)} ${r(my)}h4M${r(mx+4)} ${r(my)}h4"/>`;
  // The chosen c, outlined in the background colour so it reads on both the set and its surroundings.
  const marker=inside?`<g transform="translate(${PANES[0][0]} ${PANES[0][1]}) scale(${CELL})" fill="none"><g stroke="${p[0]}" stroke-width="1.6">${cross}</g><g stroke="${p[2]}" stroke-width="0.7">${cross}</g></g>`:'';
  return pane(g.mandel,PANES[0])+pane(g.julia,PANES[1])+marker;
 }
 const G=C.create({slug:'julia-mandelbrot',title:'ふたつの複素平面',defaults,schema,geometry,draw,simulate,simulationKeys:['cRe','cIm','centerX','centerY','zoom','iterations']});
 if(typeof module!=='undefined')module.exports=G;if(typeof window!=='undefined')window.StudyGenerator=G;
})();
