const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('./generator.js'),share=require('../../assets/share.js');
const area=pts=>Math.abs(pts.reduce((a,p,i)=>{const q=pts[(i+1)%pts.length];return a+p[0]*q[1]-q[0]*p[1];},0))/2;
test('drops preserve ring areas, keep rings nested, and flows only shear along the flow direction',()=>{
const still={...G.defaults,sites:1,drift:0,wave:0,tines:0},rings=G.geometry(still).rings;assert.equal(rings.length,still.rings*2);
// Each outline encloses its own drop and every later drop, since drops preserve area outside the new disk.
const r2=r=>(r.ink?still.ink:still.water)**2;for(const [i,r]of rings.entries())assert(Math.abs(area(r.points)/(Math.PI*rings.slice(i).reduce((a,q)=>a+r2(q),0))-1)<0.01,'area '+i);
assert.equal(G.geometry({...still,water:0}).rings.every(r=>r.ink),true);
const flowed=G.geometry({...G.defaults,angle:0}).rings,dropped=G.geometry({...G.defaults,angle:0,wave:0,tines:0}).rings;assert.equal(flowed.length,dropped.length);
const ys=r=>r.points.map(p=>p[1]);for(const [i,r]of flowed.entries()){assert.equal(Math.min(...ys(r)).toFixed(6),Math.min(...ys(dropped[i])).toFixed(6));assert.equal(Math.max(...ys(r)).toFixed(6),Math.max(...ys(dropped[i])).toFixed(6));}
const drawn=s=>G.svg(s).split('</metadata>')[1];assert.notEqual(drawn({...G.defaults,pull:0}),drawn(G.defaults));assert.equal(drawn({...G.defaults,pull:0}),drawn({...G.defaults,tines:0}));
const s=G.normalize({...G.defaults,seed:'墨#',angle:90,palette:'clay'});assert.equal(G.svg(s),G.svg(share.decode(share.encode(s,G),G)));assert(!/NaN|Infinity/.test(G.svg({sites:Infinity,ink:NaN,wave:-1})));});

const {createHash}=require('node:crypto'),fixture=require('./share-v1.json');
test('saved generator-1 share URL preserves SVG geometry and palette',()=>{assert.equal(createHash('sha256').update(G.svg(share.decode(fixture.fragment,G))).digest('hex'),fixture.svgSha256);});
