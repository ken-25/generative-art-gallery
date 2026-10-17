const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('./generator.js'),share=require('../../assets/share.js');
const rows=s=>G.geometry({...G.defaults,...s}).rows.map(r=>[...r]);
test('rule bits follow the 4l+2c+r neighbourhood order',()=>{
 // A rule with a single bit set turns a cell on only for that neighbourhood.
 for(let b=0;b<8;b++){
  const l=b>>2&1,c=b>>1&1,r=b&1,n=16,start=new Array(n).fill(0);start[7]=l;start[8]=c;start[9]=r;
  const [first,second]=rows({preset:'custom',rule:1<<b,init:'random',density:0.05,columns:n,generations:16,seed:'x'});
  const expected=first.map((_,i)=>((first[(i+n-1)%n]<<2|first[i]<<1|first[(i+1)%n])===b)?1:0);assert.deepEqual(second,expected,'bit '+b);
 }
 assert.equal(G.geometry({...G.defaults,preset:'110'}).rule,110);assert.equal(G.geometry({...G.defaults,preset:'custom',rule:77}).rule,77);
});
test('rule 0, 255 and 90 behave as known',()=>{
 const zero=rows({preset:'custom',rule:0,init:'random',columns:64,generations:20});assert(zero[0].some(Boolean));for(const r of zero.slice(1))assert(r.every(v=>v===0));
 const full=rows({preset:'custom',rule:255,init:'random',columns:64,generations:20});for(const r of full.slice(1))assert(r.every(v=>v===1));
 // Rule 90 from one cell is Pascal's triangle mod 2: cell (t, centre+x) is C(t,(t+x)/2) mod 2.
 const n=129,ninety=rows({preset:'90',init:'single',columns:n,generations:64}),centre=n>>1;
 for(let t=0;t<64;t++)for(let x=-t;x<=t;x++){const k=(t+x)/2,v=Number.isInteger(k)&&(k&t)===k?1:0;assert.equal(ninety[t][centre+x],v,`${t},${x}`);}
});
test('periodic boundary, seeds and output',()=>{
 // A single cell at the left edge under rule 90 reaches the right edge on the next generation.
 const edge=G.geometry({...G.defaults,preset:'custom',rule:90,init:'single',columns:16,generations:16}).rows;assert.equal(edge[0][8],1);
 const wrap=rows({preset:'custom',rule:2,init:'single',columns:16,generations:16});assert.equal(wrap[9][15],1);
 assert.deepEqual(rows({init:'random'}),rows({init:'random'}));assert.notDeepEqual(rows({init:'random'}),rows({init:'random',seed:'eca-002'}));assert.deepEqual(rows({init:'single'}),rows({init:'single',seed:'eca-002'}));
 assert(!/NaN|Infinity/.test(G.svg({columns:NaN,generations:Infinity,rule:-3,preset:'7'})));assert.equal(G.normalize({preset:'7'}).preset,'custom');
 const s=G.normalize({...G.defaults,preset:'184',init:'random',seed:'セル#',palette:'dusk'});assert.equal(G.svg(s),G.svg(share.decode(share.encode(s,G),G)));
});
const {createHash}=require('node:crypto'),fixture=require('./share-v1.json');
test('saved generator-1 share URL preserves SVG geometry and palette',()=>{assert.equal(createHash('sha256').update(G.svg(share.decode(fixture.fragment,G))).digest('hex'),fixture.svgSha256);});
