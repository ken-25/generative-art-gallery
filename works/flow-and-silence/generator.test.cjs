const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('./generator.js'),share=require('../../assets/share.js');
test('mask changes preserve base field and remove only intersections monotonically',()=>{const zero=G.geometry({...G.defaults,maskWidth:0}),narrow=G.geometry({...G.defaults,maskWidth:40}),wide=G.geometry({...G.defaults,maskWidth:200});assert.equal(zero.base.length,zero.visible.length);assert.deepEqual(zero.base,wide.base);assert(narrow.visible.length>=wide.visible.length);assert(wide.visible.length<zero.visible.length);
const straight=G.geometry({...G.defaults,flow:0,jitter:0,spread:0});for(const l of straight.base){assert(Math.abs(l.angle)<1e-12);assert.equal(l.length,G.defaults.length);}
for(const l of G.geometry({...G.defaults,count:2000,length:36,spread:0.5}).base)for(const [x,y]of [l.a,l.b])assert(x>=30&&x<=870&&y>=30&&y<=570);
const s=G.normalize({...G.defaults,seed:'流れ#',maskAngle:90,palette:'clay'});assert.equal(G.svg(s),G.svg(share.decode(share.encode(s,G),G)));assert(!/NaN|Infinity/.test(G.svg({count:Infinity,flow:NaN})));});

const {createHash}=require('node:crypto'),fixture=require('./share-v1.json');
test('saved generator-1 share URL preserves SVG geometry and palette',()=>{assert.equal(createHash('sha256').update(G.svg(share.decode(fixture.fragment,G))).digest('hex'),fixture.svgSha256);});
