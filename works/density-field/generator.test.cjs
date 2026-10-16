const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('./generator.js'),share=require('../../assets/share.js');
test('zero amount is uniform and all density disks stay positive and inside margins',()=>{const zero=G.geometry({...G.defaults,amount:0});assert(zero.every(p=>p.r===zero[0].r));assert(Math.abs((zero[1].x-zero[0].x)-(zero[2].x-zero[1].x))<1e-9);
for(const columns of [3,40])for(const rows of [3,30])for(const centerX of [0,1])for(const centerY of [0,1])for(const spread of [0.1,0.5])for(const point of G.geometry({...G.defaults,columns,rows,centerX,centerY,spread,amount:1,size:1,margin:20})){assert(point.r>0);assert(point.x-point.r>=20&&point.x+point.r<=880&&point.y-point.r>=20&&point.y+point.r<=580);}
assert.equal(G.geometry({...G.defaults,columns:40,rows:30}).length,1200);const s=G.normalize({...G.defaults,amount:1,palette:'dusk'});assert.equal(G.svg(s),G.svg(share.decode(share.encode(s,G),G)));assert(!/NaN|Infinity/.test(G.svg({amount:NaN,spread:0,columns:999})));});

const {createHash}=require('node:crypto'),fixture=require('./share-v1.json');
test('saved generator-1 share URL preserves SVG geometry and palette',()=>{assert.equal(createHash('sha256').update(G.svg(share.decode(fixture.fragment,G))).digest('hex'),fixture.svgSha256);});
