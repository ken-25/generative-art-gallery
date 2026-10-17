const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('./generator.js'),share=require('../../assets/share.js');
const W=240,H=160;
test('attached cells are unique, inside the lattice and 4-connected to the seed',()=>{
 for(const s of [G.defaults,{...G.defaults,origin:'line',target:600,stickiness:0.3,seed:'x'}]){
  const g=G.geometry(s),keys=new Set(g.cells.map(([x,y])=>x+','+y));assert.equal(keys.size,g.cells.length);
  for(const [x,y]of g.cells)assert(x>=0&&y>=0&&x<W&&y<H);
  // Each attached particle touched an earlier cell when it stuck.
  g.cells.forEach(([x,y],i)=>{if(i<g.seeds)return;assert(g.cells.slice(0,i).some(([u,v])=>Math.abs(u-x)+Math.abs(v-y)===1),'connected '+i);});
  assert.equal(g.seeds,s.origin==='line'?17:1);
 }
});
test('stopping is reproducible from the seed and the step budget, and partial results say so',()=>{
 const a=G.geometry(G.defaults),b=G.geometry(G.defaults);assert.deepEqual(a.cells,b.cells);assert.equal(a.steps,b.steps);assert.equal(a.reason,'target');assert.equal(a.attached,G.defaults.target);
 assert.notDeepEqual(G.geometry({...G.defaults,seed:'other'}).cells,a.cells);assert.match(G.note(G.defaults),/目標の1200粒子がすべて付着/);
 const budget={...G.defaults,target:1500,stickiness:0.1},g=G.geometry(budget);
 assert.equal(g.reason,'budget');assert.equal(g.steps,4000000);assert(g.attached<1500);assert.equal(G.note(budget),`計算量の上限に達したため、${g.attached}粒子（目標1500）で止めています。`);
 const edge={...G.defaults,seed:'c'},e=G.geometry(edge);assert.equal(e.reason,'edge');assert.match(G.note(edge),new RegExp(`${e.attached}粒子（目標1200）`));
 // Chunked and direct runs agree.
 const s={...G.defaults,target:300,seed:'chunk'},direct=G.geometry(s).cells;G.geometry(G.defaults);
 const job=G.task(s);let n=1;while(!job.step())n++;assert(n>1);assert.equal(G.task(s),null);assert.deepEqual(G.geometry(s).cells,direct);
});
test('normalisation, drawing and share URLs',()=>{
 assert(!/NaN|Infinity/.test(G.svg({target:NaN,stickiness:Infinity,origin:'x'})));assert.equal(G.normalize({target:1e9}).target,1500);
 assert.equal((G.svg({...G.defaults,target:50}).match(/h1v1h-1z/g)||[]).length,51);
 const s=G.normalize({...G.defaults,target:150,origin:'line',seed:'粒#',palette:'clay'});assert.equal(G.svg(s),G.svg(share.decode(share.encode(s,G),G)));
});
const {createHash}=require('node:crypto'),fixture=require('./share-v1.json');
test('saved generator-1 share URL preserves SVG geometry and palette',()=>{assert.equal(createHash('sha256').update(G.svg(share.decode(fixture.fragment,G))).digest('hex'),fixture.svgSha256);});
