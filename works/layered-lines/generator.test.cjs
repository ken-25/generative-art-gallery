const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('./generator.js'),share=require('../../assets/share.js');
test('line layers have bounded counts, exact angles and spacing, and clipping',()=>{
assert(G.geometry({...G.defaults,groups:0}).every(r=>!r.lines.length));
for(const angle of [0,89,179]){const regions=G.geometry({...G.defaults,angle,groups:1,spacing:6});assert.equal(regions.length,3);for(const {lines}of regions){assert(lines.length<400);for(const l of lines){assert(Math.abs(l.angle-angle*Math.PI/180)<1e-12);const dx=l.b[0]-l.a[0],dy=l.b[1]-l.a[1];assert(Math.abs(Math.atan2(dy,dx)-l.angle)<1e-10||Math.abs(Math.atan2(dy,dx)-l.angle+Math.PI*2)<1e-10);}const [a,b]=lines;assert(Math.abs((b.a[0]-a.a[0])*(-Math.sin(a.angle))+(b.a[1]-a.a[1])*Math.cos(a.angle)-6)<1e-9);}}
const s=G.normalize({...G.defaults,groups:5,spacing:6,palette:'dusk'});assert(G.geometry(s).reduce((n,r)=>n+r.lines.length,0)<6000);assert.equal((G.svg(s).match(/clip-path=/g)||[]).length,3);assert.equal(G.svg(s),G.svg(share.decode(share.encode(s,G),G)));assert(!/NaN|Infinity/.test(G.svg({groups:NaN,spacing:0})));});

const {createHash}=require('node:crypto'),fixture=require('./share-v1.json');
test('saved generator-1 share URL preserves SVG geometry and palette',()=>{assert.equal(createHash('sha256').update(G.svg(share.decode(fixture.fragment,G))).digest('hex'),fixture.svgSha256);});
