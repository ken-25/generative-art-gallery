const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('./generator.js'),share=require('../../assets/share.js');
const rows=s=>G.geometry({...G.defaults,...s}).rows.map(r=>[...r]);
test('every rule 0-255 maps each of the 8 neighbourhoods to its bit 4l+2c+r',()=>{
 for(let rule=0;rule<256;rule++)for(let b=0;b<8;b++){
  // A row of 7 zeros with the neighbourhood (l,c,r) placed at columns 2..4; column 3 must become bit b of the rule.
  const row=new Uint8Array(7);row[2]=b>>2&1;row[3]=b>>1&1;row[4]=b&1;
  assert.equal(G.advance(row,rule)[3],rule>>b&1,`rule ${rule}, neighbourhood ${b}`);
 }
 // The boundary is periodic: column 0's left neighbour is the last column.
 assert.deepEqual([...G.advance(Uint8Array.from([0,0,0,0,1]),2)],[0,0,0,1,0]);assert.deepEqual([...G.advance(Uint8Array.from([1,0,0,0,0]),2)],[0,0,0,0,1]);
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
