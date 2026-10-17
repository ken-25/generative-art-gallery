const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('./generator.js'),share=require('../../assets/share.js');
const area=pts=>Math.abs(pts.reduce((a,p,i)=>{const q=pts[(i+1)%pts.length];return a+p[0]*q[1]-q[0]*p[1];},0))/2;
test('fields stay finite and within [0,1] across the parameter range',()=>{
 for(const [feed,kill]of [[0.01,0.04],[0.1,0.07],[0.1,0.04],[0.01,0.07]]){
  const g=G.geometry({...G.defaults,preset:'custom',feed,kill,iterations:1500,seeds:12});
  for(const f of [g.a,g.b])assert(f.every(v=>Number.isFinite(v)&&v>=0&&v<=1),feed+'/'+kill);
 }
 assert.deepEqual([G.geometry({...G.defaults,preset:'maze'}).feed,G.geometry({...G.defaults,preset:'maze'}).kill],[0.029,0.057]);
});
test('same seed and settings reproduce the field; chunked and direct runs agree',()=>{
 const s={...G.defaults,iterations:600},direct=G.geometry(s);
 const other=G.geometry({...s,seed:'gs-002'});assert.notDeepEqual(direct.b,other.b);
 const job=G.task(s);let chunks=1;while(!job.step())chunks++;assert.equal(chunks,31);assert.deepEqual(G.geometry(s).b,direct.b);
 // A new setting cancels the running job; its partial state is never used.
 const next={...s,iterations:700},stale=G.task(next);stale.step();stale.cancel();assert.notEqual(G.task(next),null);
 assert.equal(G.svg({...s,threshold:0.3,palette:'fern'}).includes('<path'),true);
});
test('threshold contours close, enclose the cells above the threshold, and may be empty',()=>{
 const s={...G.defaults,seeds:1,iterations:200,threshold:0.2},g=G.geometry(s),above=g.b.filter(v=>v>=0.2).length;
 assert(above>0&&g.loops.length>=1);for(const l of g.loops)assert(l.length>=4);
 const enclosed=g.loops.reduce((a,l)=>a+area(l),0);assert(Math.abs(enclosed/(above*36)-1)<0.15,enclosed+' vs '+above*36);
 const max=Math.max(...G.geometry(G.defaults).b),empty={...G.defaults,threshold:0.5};
 if(max<0.5){assert.equal(G.geometry(empty).loops.length,0);assert.match(G.note(empty),/輪郭はありません/);}
 const none={...G.defaults,preset:'custom',feed:0.1,kill:0.07,iterations:2000};assert.equal(G.geometry(none).b.every(v=>v<0.1),true);assert.equal(G.geometry(none).loops.length,0);assert(!/<path/.test(G.svg(none)));
 assert(!/NaN|Infinity/.test(G.svg({iterations:NaN,feed:Infinity,threshold:-1,preset:'x'})));
 const n=G.normalize({...G.defaults,preset:'spots',seed:'斑#',iterations:400,palette:'dusk'});assert.equal(G.svg(n),G.svg(share.decode(share.encode(n,G),G)));
});
const {createHash}=require('node:crypto'),fixture=require('./share-v1.json');
test('saved generator-1 share URL preserves SVG geometry and palette',()=>{assert.equal(createHash('sha256').update(G.svg(share.decode(fixture.fragment,G))).digest('hex'),fixture.svgSha256);});
