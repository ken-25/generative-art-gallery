const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('./generator.js'),share=require('../../assets/share.js');
test('edge sets are unique, connected when required, and projected within bounds',()=>{
for(const count of [1,7,12])for(const yaw of [-180,0,180])for(const pitch of [-90,0,90])for(const connected of ['yes','no'])for(const c of G.geometry({...G.defaults,edges:count,yaw,pitch,connected,cells:10})){
assert.equal(new Set(c.ids).size,count);if(connected==='yes'){const seen=new Set(c.edges[0]);let changed=true;while(changed){changed=false;for(const [a,b]of c.edges)if(seen.has(a)||seen.has(b)){if(!seen.has(a)||!seen.has(b))changed=true;seen.add(a);seen.add(b);}}assert(c.edges.every(([a,b])=>seen.has(a)&&seen.has(b)));}
for(const [x,y]of c.points)assert(x>=20&&x<=880&&y>=20&&y<=580);
}const s=G.normalize({...G.defaults,seed:'辺 & #',edges:12,palette:'clay'});assert.equal(G.svg(s),G.svg(share.decode(share.encode(s,G),G)));assert(!/NaN|Infinity/.test(G.svg({yaw:NaN,cells:999})));});

const {createHash}=require('node:crypto'),fixture=require('./share-v1.json');
test('saved generator-1 share URL preserves SVG geometry and palette',()=>{assert.equal(createHash('sha256').update(G.svg(share.decode(fixture.fragment,G))).digest('hex'),fixture.svgSha256);});
