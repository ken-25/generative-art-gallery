const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('./generator.js'),share=require('../../assets/share.js');
test('trails stop, stay bounded and never backtrack at zero probability',()=>{for(const direction of ['right','down']){const paths=G.geometry({...G.defaults,bands:12,steps:250,back:0,direction});for(const points of paths){assert(points.length<=251);for(let i=0;i<points.length;i++){const [x,y]=points[i];assert(x>=30&&x<=870&&y>=30&&y<=570);if(i)assert(points[i][direction==='right'?0:1]>=points[i-1][direction==='right'?0:1]);}}}
assert(G.geometry({...G.defaults,steps:0}).every(p=>p.length===1));const s=G.normalize({...G.defaults,seed:'日本語#',back:0.45,palette:'dusk'});assert.equal(G.svg(s),G.svg(share.decode(share.encode(s,G),G)));assert.notEqual(G.svg(s),G.svg({...s,seed:'other'}));assert(!/NaN|Infinity/.test(G.svg({steps:Infinity,length:-999,width:NaN})));});

const {createHash}=require('node:crypto'),fixture=require('./share-v1.json');
test('saved generator-1 share URL preserves SVG geometry and palette',()=>{assert.equal(createHash('sha256').update(G.svg(share.decode(fixture.fragment,G))).digest('hex'),fixture.svgSha256);});
