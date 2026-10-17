const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('./generator.js'),share=require('../../assets/share.js');
const close=(a,b)=>Math.abs(a-b)<1e-6;
test('generation 0 is the trunk; generation 1 rewrites every bud in parallel',()=>{
 for(const rule of ['fork','alternate','whorl']){
  const g0=G.geometry({...G.defaults,rule,generations:0});assert.equal(g0.segments.length,1);assert.equal(g0.symbols,2);
  const g1=G.geometry({...G.defaults,rule,generations:1});assert.equal(g1.segments.length,{fork:2,alternate:3,whorl:2}[rule]);
 }
 // fork: the number of tips doubles each generation, so segments = 2^g (trunk counted once per generation step).
 for(let g=1;g<=8;g++)assert.equal(G.geometry({...G.defaults,rule:'fork',generations:g}).segments.length,2**g);
});
test('angle 0 keeps every branch vertical; brackets restore position and heading',()=>{
 for(const q of G.geometry({...G.defaults,generations:5,angle:0}).segments)assert(close(q.x1,q.x2));
 // fork generation 2: F F [+ F[+X][-X]] [- F[+X][-X]] — both branches start where the trunk ends, mirrored.
 const [a,b,left,right]=G.geometry({...G.defaults,rule:'fork',generations:2,angle:30,shrink:1}).segments;
 assert(close(left.x1,b.x2)&&close(left.y1,b.y2)&&close(right.x1,b.x2)&&close(right.y1,b.y2));assert(close(a.x2,b.x1));
 assert(close(left.x2-left.x1,-(right.x2-right.x1))&&close(left.y2-left.y1,right.y2-right.y1));
 assert(close(Math.atan2(left.x2-left.x1,-(left.y2-left.y1)),-Math.PI/6));
 assert.equal(left.depth,1);assert.equal(b.depth,0);
});
test('generations change the structure; oversized expansions stop with a reason; everything fits',()=>{
 assert.notEqual(G.svg({...G.defaults,generations:4}),G.svg({...G.defaults,generations:5}));
 const big=G.geometry({...G.defaults,rule:'whorl',generations:12});assert.equal(big.limited,true);assert(big.reached<12&&big.segments.length<=12000);assert.match(G.note({...G.defaults,rule:'whorl',generations:12}),new RegExp(big.reached+'世代目で止めています'));
 assert.equal(G.note(G.defaults),'');
 for(const rule of ['fork','alternate','whorl'])for(const angle of [0,45,90])for(const q of G.geometry({rule,generations:12,angle,shrink:1}).segments)for(const v of [q.x1,q.x2])assert(v>=0&&v<=900);
 assert(!/NaN|Infinity/.test(G.svg({generations:NaN,angle:Infinity,shrink:-1,rule:'x'})));
 const s=G.normalize({...G.defaults,rule:'fork',angle:33,palette:'dusk'});assert.equal(G.svg(s),G.svg(share.decode(share.encode(s,G),G)));
});
const {createHash}=require('node:crypto'),fixture=require('./share-v1.json');
test('saved generator-1 share URL preserves SVG geometry and palette',()=>{assert.equal(createHash('sha256').update(G.svg(share.decode(fixture.fragment,G))).digest('hex'),fixture.svgSha256);});
