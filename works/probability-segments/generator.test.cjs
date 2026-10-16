const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('./generator.js'),share=require('../../assets/share.js');
test('zero weights are excluded, empty distributions are blank, and lengths are bounded',()=>{assert.equal(G.geometry({...G.defaults,count:0}).length,0);assert.equal(G.geometry({...G.defaults,w0:0,w1:0,w2:0,w3:0,w4:0,w5:0}).length,0);assert.equal(G.geometry({...G.defaults,densityA:0,densityB:0,densityC:0}).length,0);
const only=G.geometry({...G.defaults,w0:0,w1:1,w2:0,w3:0,spread:0,densityA:0,densityB:1,densityC:0});assert(only.every(l=>l.direction===1&&l.region===1&&l.length===G.defaults.mean));const max=G.geometry({...G.defaults,count:3000,mean:50,spread:1});assert.equal(max.length,3000);for(const l of max){assert(l.length>=0&&l.length<=100);for(const [x,y]of [l.a,l.b])assert(x>=10&&x<=890&&y>=10&&y<=590);}
const s=G.normalize({...G.defaults,seed:'分布 # &',directions:6,palette:'clay'});assert.equal(G.svg(s),G.svg(share.decode(share.encode(s,G),G)));assert(!/NaN|Infinity/.test(G.svg({mean:NaN,directions:999,w0:-1})));});

const {createHash}=require('node:crypto'),fixture=require('./share-v1.json');
test('saved generator-1 share URL preserves SVG geometry and palette',()=>{assert.equal(createHash('sha256').update(G.svg(share.decode(fixture.fragment,G))).digest('hex'),fixture.svgSha256);});
