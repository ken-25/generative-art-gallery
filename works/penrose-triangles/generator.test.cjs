const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('./generator.js'),share=require('../../assets/share.js');
const signed=([,a,b,c])=>((b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]))/2;
const angle=(p,q,r)=>Math.acos(((q[0]-p[0])*(r[0]-p[0])+(q[1]-p[1])*(r[1]-p[1]))/(Math.hypot(q[0]-p[0],q[1]-p[1])*Math.hypot(r[0]-p[0],r[1]-p[1])))*180/Math.PI;
// At zoom 0.5 the whole decagonal patch lies inside the frame, so nothing is culled.
const whole=depth=>G.geometry({...G.defaults,depth,zoom:0.5}).tiles;
test('substitution keeps the patch area, so tiles neither overlap nor leave gaps',()=>{
 const total=10*0.5*300*300*Math.sin(Math.PI/5);
 for(let d=0;d<=7;d++){const tiles=whole(d);assert(Math.abs(tiles.reduce((a,t)=>a+Math.abs(signed(t)),0)/total-1)<1e-9,'depth '+d);}
});
test('tile counts, shapes and orientations at every depth',()=>{
 let acute=10,obtuse=0;
 for(let d=0;d<=7;d++){
  const tiles=whole(d);assert.equal(tiles.filter(t=>t[0]===0).length,acute);assert.equal(tiles.filter(t=>t[0]===1).length,obtuse);
  [acute,obtuse]=[acute+obtuse,acute+2*obtuse];
  for(const t of tiles){const [type,A,B,C]=t;assert(Math.abs(angle(A,B,C)-(type?108:36))<1e-6);assert(Math.abs(angle(B,A,C)-(type?36:72))<1e-6);}
  // Every tile is paired with its mirror image across a shared edge.
  for(const type of [0,1]){const of=tiles.filter(t=>t[0]===type);assert.equal(of.filter(t=>signed(t)>0).length,of.length/2);}
 }
 // Each acute tile splits into one acute and one obtuse tile scaled by 1/φ.
 const [a]=whole(0),[c0]=whole(1).filter(t=>t[0]===0),phi=(1+Math.sqrt(5))/2;
 assert(Math.abs(Math.abs(signed(a))/Math.abs(signed(c0))-phi*phi)<1e-9);
});
test('the view clips a finite patch, turns with rotation and stays finite',()=>{
 const near=G.geometry({...G.defaults,depth:7,zoom:3}).tiles.length,far=whole(7).length;assert(near<far/5);
 for(const t of G.geometry(G.defaults).tiles){const xs=[t[1][0],t[2][0],t[3][0]],ys=[t[1][1],t[2][1],t[3][1]];assert(Math.max(...xs)>=0&&Math.min(...xs)<=900&&Math.max(...ys)>=0&&Math.min(...ys)<=600);}
 assert.notEqual(G.svg(G.defaults),G.svg({...G.defaults,rotation:20}));assert.doesNotMatch(G.svg({...G.defaults,outline:0}),/stroke=/);
 assert(!/NaN|Infinity/.test(G.svg({depth:NaN,zoom:Infinity,rotation:-1})));
 const s=G.normalize({...G.defaults,depth:4,rotation:17,palette:'clay'});assert.equal(G.svg(s),G.svg(share.decode(share.encode(s,G),G)));
});
const {createHash}=require('node:crypto'),fixture=require('./share-v1.json');
test('saved generator-1 share URL preserves SVG geometry and palette',()=>{assert.equal(createHash('sha256').update(G.svg(share.decode(fixture.fragment,G))).digest('hex'),fixture.svgSha256);});
