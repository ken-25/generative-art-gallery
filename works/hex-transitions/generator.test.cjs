const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('./generator.js'),share=require('../../assets/share.js');
test('transition rows normalize, zero rows stay, and deterministic cycles repeat',()=>{
for(const states of [2,3,4]){const s={...G.defaults,states};for(let i=0;i<4;i++)for(let j=0;j<4;j++)s[`w${i}${j}`]=0;
assert(G.geometry(s).cells.every(c=>c.state===0));for(let i=0;i<states;i++)s[`w${i}${(i+1)%states}`]=100;const g=G.geometry(s);assert(g.matrix.every(row=>Math.abs(row.reduce((a,b)=>a+b,0)-1)<1e-10));g.cells.forEach((c,i)=>assert.equal(c.state,i%states));for(const c of g.cells)for(const [x,y]of c.points)assert(x>=30-1e-8&&x<=870+1e-8&&y>=30-1e-8&&y<=570+1e-8);}
const s=G.normalize({...G.defaults,states:4,seed:'状態 # &',palette:'dusk'});assert.equal(G.svg(s),G.svg(share.decode(share.encode(s,G),G)));assert(!/NaN|Infinity/.test(G.svg({states:999,w00:NaN})));});

const {createHash}=require('node:crypto'),fixture=require('./share-v1.json');
test('saved generator-1 share URL preserves SVG geometry and palette',()=>{assert.equal(createHash('sha256').update(G.svg(share.decode(fixture.fragment,G))).digest('hex'),fixture.svgSha256);});
