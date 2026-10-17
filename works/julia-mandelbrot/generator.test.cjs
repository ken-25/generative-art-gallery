const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('./generator.js'),share=require('../../assets/share.js');
const N=200,cell=(view,re,im)=>{const step=2*view.half/N;return Math.floor((view.y+view.half-im)/step)*N+Math.floor((re-(view.x-view.half))/step);};
test('Julia set for c=0 is the closed unit disk',()=>{
 const g=G.geometry({...G.defaults,cRe:0,cIm:0,zoom:1,centerX:0,centerY:0});
 for(let row=0;row<N;row++)for(let col=0;col<N;col++){
  const step=2*g.view.half/N,re=-g.view.half+(col+0.5)*step,im=g.view.half-(row+0.5)*step,r=Math.hypot(re,im),n=g.julia[row*N+col];
  if(r<0.98)assert.equal(n,0,`inside ${re},${im}`);if(r>1.02)assert(n>0,`outside ${re},${im}`);
 }
});
test('Mandelbrot starts at z=0 and varies c; Julia fixes c and varies z',()=>{
 const a=G.geometry(G.defaults),b=G.geometry({...G.defaults,cRe:0.3,cIm:-0.5}),M={x:-0.6,y:0,half:1.5};
 assert.deepEqual(a.mandel,b.mandel);assert.notDeepEqual(a.julia,b.julia);
 assert.equal(a.mandel[cell(M,-1,0)],0);assert.equal(a.mandel[cell(M,-0.1,0.1)],0);assert(a.mandel[cell(M,0.5,0)]>0);assert(a.mandel[cell(M,-2.05,0.5)]===1);
 // The escape radius covers |c| when c lies outside the radius-2 disk.
 assert.equal(a.escapeRadius,2);assert.equal(G.geometry({...G.defaults,cRe:-2,cIm:1.2}).escapeRadius,Math.hypot(2,1.2));
 assert.equal(G.geometry({...G.defaults,cRe:-2,cIm:1.2}).julia.every(n=>n>0),true);
});
test('view, chunked computation and normalisation are deterministic and finite',()=>{
 const zoomed=G.geometry({...G.defaults,zoom:8,centerX:-0.3,centerY:0.2});assert.equal(zoomed.view.half,0.2);assert.notDeepEqual(zoomed.julia,G.geometry(G.defaults).julia);
 const s={...G.defaults,cRe:-0.4,cIm:0.6,iterations:64},direct=G.svg(s);G.svg(G.defaults);
 const job=G.task(s);let steps=0;while(!job.step())steps++;assert(steps>10);assert.equal(G.task(s),null);assert.equal(G.svg(s),direct);
 const fresh={...s,cRe:-0.405};const cancelled=G.task(fresh);cancelled.step();cancelled.cancel();assert.notEqual(G.task(fresh),null);assert.equal(G.svg(fresh),G.svg(fresh));
 assert(!/NaN|Infinity/.test(G.svg({cRe:NaN,cIm:Infinity,zoom:0,iterations:1e9})));
 const n=G.normalize({...G.defaults,cRe:-0.123,zoom:3.5,palette:'clay'});assert.equal(G.svg(n),G.svg(share.decode(share.encode(n,G),G)));
});
const {createHash}=require('node:crypto'),fixture=require('./share-v1.json');
test('saved generator-1 share URL preserves SVG geometry and palette',()=>{assert.equal(createHash('sha256').update(G.svg(share.decode(fixture.fragment,G))).digest('hex'),fixture.svgSha256);});
