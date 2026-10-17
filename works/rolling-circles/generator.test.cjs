const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('./generator.js'),share=require('../../assets/share.js');
const close=(a,b,e=1e-6)=>Math.abs(a-b)<e;
test('special cases: d=0 is a circle of radius R-r, R=2r with d=r is a segment',()=>{
 const circle=G.geometry({...G.defaults,R:90,r:30,d:0,curves:1,rotation:0}),k=circle.scale;
 for(const [x,y]of circle.curves[0])assert(close(Math.hypot(x-450,y-300),60*k,1e-6));
 for(const [x,y]of G.geometry({...G.defaults,R:80,r:40,d:40,curves:1,rotation:0}).curves[0])assert(close(y,300,1e-6));
});
test('closes after 2πr/gcd(R,r) and not before; every curve fits the viewBox',()=>{
 for(const [R,r]of [[96,60],[7,3],[120,1],[120,119],[100,25]]){
  const g=G.geometry({...G.defaults,R,r,d:120,curves:6,phase:37,rotation:123}),pts=g.curves[0],gcd=(a,b)=>b?gcd(b,a%b):a;
  assert(close(g.period,2*Math.PI*r/gcd(R,r),1e-12));assert(close(pts[0][0],pts.at(-1)[0],1e-6)&&close(pts[0][1],pts.at(-1)[1],1e-6),R+'/'+r);
  // The curve closes only at the end of the period: no earlier sample returns to the start.
  assert(pts.slice(1,-1).every(q=>Math.hypot(q[0]-pts[0][0],q[1]-pts[0][1])>1e-3),'no early repeat '+R+'/'+r);
  assert(pts.length-1<=6000&&pts.length>=97);
  for(const c of g.curves)for(const [x,y]of c)assert(x>=0&&x<=900&&y>=0&&y<=600);
 }
});
test('invalid radii are rejected or normalised without NaN',()=>{
 assert.equal(G.normalize({r:0}).r,1);assert.equal(G.geometry({R:30,r:30}).curves.length,0);assert.equal(G.geometry({R:20,r:40}).rejected,true);assert.match(G.note({R:20,r:40}),/小さく/);assert.equal(G.note(G.defaults),'');
 assert(!/NaN|Infinity/.test(G.svg({R:NaN,r:Infinity,d:-5,curves:'x'})));
 const s=G.normalize({...G.defaults,R:77,r:21,d:13,palette:'dusk'});assert.equal(G.svg(s),G.svg(share.decode(share.encode(s,G),G)));
});
const {createHash}=require('node:crypto'),fixture=require('./share-v1.json');
test('saved generator-1 share URL preserves SVG geometry and palette',()=>{assert.equal(createHash('sha256').update(G.svg(share.decode(fixture.fragment,G))).digest('hex'),fixture.svgSha256);});
