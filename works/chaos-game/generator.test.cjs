const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('./generator.js'),share=require('../../assets/share.js');
test('the same seed repeats the choice sequence and points; another seed does not',()=>{
 const a=G.geometry(G.defaults),b=G.geometry(G.defaults),c=G.geometry({...G.defaults,seed:'other'});
 assert.deepEqual(a.choices,b.choices);assert.deepEqual(a.points,b.points);assert.notDeepEqual(a.choices,c.choices);
 assert.equal(a.points.length,G.defaults.points);assert.equal(a.choices.length,G.defaults.points+20);
});
test('weights are relative; a zero weight is never chosen; all zero draws nothing',()=>{
 const scaled=G.geometry({...G.defaults,w0:1,w1:2,w2:2}),base=G.geometry(G.defaults);assert.deepEqual(scaled.choices,base.choices);
 for(const w of [[0,5,5],[5,0,5],[5,5,0],[0,0,7]]){const g=G.geometry({...G.defaults,w0:w[0],w1:w[1],w2:w[2]});for(let j=0;j<3;j++)if(!w[j])assert(!g.choices.includes(j));}
 const counts=[0,0,0];for(const j of G.geometry({...G.defaults,points:20000,w0:1,w1:1,w2:2}).choices)counts[j]++;assert(Math.abs(counts[2]/20020-0.5)<0.02);
 const empty={...G.defaults,w0:0,w1:0,w2:0};assert.equal(G.geometry(empty).points.length,0);assert.match(G.note(empty),/重みが0/);assert(!/<path/.test(G.svg(empty)));
});
test('every map contracts, so points stay bounded at the extremes and within the viewBox',()=>{
 for(const system of ['triangle','branch'])for(const ratio of [0.3,0.7])for(const spread of [0,80]){
  const g=G.geometry({...G.defaults,system,ratio,spread,points:20000});
  // Largest singular value of each linear part must stay below 1.
  for(const [a,b,c,d]of g.maps){const t=a*a+b*b+c*c+d*d,det=a*d-b*c;assert(Math.sqrt((t+Math.sqrt(Math.max(0,t*t-4*det*det)))/2)<1);}
  for(const [x,y]of g.points)assert(Math.abs(x)<5&&Math.abs(y)<5);
  for(const [,x,y]of G.svg({...G.defaults,system,ratio,spread}).matchAll(/M(\d+) (\d+)h/g))assert(+x>=0&&+x<=900&&+y>=0&&+y<=600);
 }
 assert(!/NaN|Infinity/.test(G.svg({points:NaN,ratio:Infinity,w0:-1,system:'x'})));
 const s=G.normalize({...G.defaults,system:'triangle',seed:'点#',palette:'clay'});assert.equal(G.svg(s),G.svg(share.decode(share.encode(s,G),G)));
});
const {createHash}=require('node:crypto'),fixture=require('./share-v1.json');
test('saved generator-1 share URL preserves SVG geometry and palette',()=>{assert.equal(createHash('sha256').update(G.svg(share.decode(fixture.fragment,G))).digest('hex'),fixture.svgSha256);});
