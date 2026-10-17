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
test('children lie inside their parent, never overlap, and meet edge to edge',()=>{
 const inside=(p,[,a,b,c])=>{const d=signed([0,a,b,c]);return [[p,b,c],[a,p,c],[a,b,p]].every(([x,y,z])=>signed([0,x,y,z])/d>=-1e-9);};
 for(const parent of whole(3))for(const child of G.subdivide(parent))for(const v of child.slice(1))assert(inside(v,parent));
 // Separating axis test: two triangles' interiors are disjoint if some edge normal separates them (touching allowed).
 const disjoint=(s,t)=>{const P=s.slice(1),Q=t.slice(1);for(const T of [P,Q])for(let i=0;i<3;i++){const [p,q]=[T[i],T[(i+1)%3]],n=[q[1]-p[1],p[0]-q[0]],len=Math.hypot(...n),proj=V=>V.map(v=>(v[0]*n[0]+v[1]*n[1])/len);const a=proj(P),b=proj(Q);if(Math.max(...a)<=Math.min(...b)+1e-7||Math.max(...b)<=Math.min(...a)+1e-7)return true;}return false;};
 const tiles=whole(4);for(let i=0;i<tiles.length;i++)for(let j=i+1;j<tiles.length;j++)assert(disjoint(tiles[i],tiles[j]),`${i}/${j}`);
 // Every edge is shared by exactly two tiles with the same endpoints, except edges on the decagon's rim.
 const key=p=>p.map(v=>Math.round(v*1e6)).join(','),edges=new Map();
 for(const [,a,b,c]of tiles)for(const [p,q]of [[a,b],[b,c],[c,a]]){const k=[key(p),key(q)].sort().join('|');edges.set(k,[...(edges.get(k)||[]),[p,q]]);}
 const rim=300*Math.cos(Math.PI/10);let rimLength=0;
 for(const list of edges.values()){assert(list.length<=2);if(list.length===1){const [p,q]=list[0],m=[(p[0]+q[0])/2-450,(p[1]+q[1])/2-300];assert(Math.hypot(...m)>=rim-1e-6,'T-junction or gap inside the patch');rimLength+=Math.hypot(q[0]-p[0],q[1]-p[1]);}}
 assert(Math.abs(rimLength-10*2*300*Math.sin(Math.PI/10))<1e-6);
});
const {createHash}=require('node:crypto'),fixture=require('./share-v1.json');
test('saved generator-1 share URL preserves SVG geometry and palette',()=>{assert.equal(createHash('sha256').update(G.svg(share.decode(fixture.fragment,G))).digest('hex'),fixture.svgSha256);});
