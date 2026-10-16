const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('./generator.js'),share=require('../../assets/share.js');
const area=t=>Math.abs(t.slice(1).reduce((n,v,i)=>n+(t[i][0]*v[1]-v[0]*t[i][1]),0)+t.at(-1)[0]*t[0][1]-t[0][0]*t.at(-1)[1])/2;
test('regions respect depth, area, bounds and density',()=>{
 assert.equal(G.geometry({...G.defaults,depth:0}).regions.length,1);
 const low=G.geometry({...G.defaults,depth:1}),high=G.geometry({...G.defaults,depth:8,minArea:200});assert(high.regions.length>low.regions.length);assert(high.regions.length<=256);
 for(const t of high.regions){assert(area(t)>=200-1e-6);for(const [x,y]of t){assert(x>=36&&x<=864&&y>=36&&y<=564);}}
 assert.equal(G.geometry({...G.defaults,density:0}).lines.length,0);assert(high.lines.length<=12800);
 const s=G.normalize({...G.defaults,seed:'日本語 & #',depth:8,palette:'dusk'});assert.equal(G.svg(s),G.svg(share.decode(share.encode(s,G),G)));
 assert.equal(G.svg(s),G.svg(s));assert.notEqual(G.svg(s),G.svg({...s,seed:'other'}));
 for(const input of [{depth:Infinity,minArea:NaN},{density:-1,margin:9999},{depth:'',seed:''}])assert(!/NaN|Infinity/.test(G.svg(input)));
});

const {createHash}=require('node:crypto'),fixture=require('./share-v1.json');
test('saved generator-1 share URL preserves SVG geometry and palette',()=>{assert.equal(createHash('sha256').update(G.svg(share.decode(fixture.fragment,G))).digest('hex'),fixture.svgSha256);});
