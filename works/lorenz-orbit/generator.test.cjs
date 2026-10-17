const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('./generator.js'),share=require('../../assets/share.js');
test('the origin is an equilibrium and stays exactly there',()=>{
 const s={...G.defaults,x0:0,y0:0,z0:0},g=G.geometry(s);assert(g.orbit.every(q=>q.every(v=>v===0)));assert.match(G.note(s),/平衡点/);assert.match(G.svg(s),/l0 0/);
});
test('the standard orbit stays bounded; below the first bifurcation orbits settle',()=>{
 const g=G.geometry({...G.defaults,points:20000});assert.equal(g.diverged,false);
 for(const [x,y,z]of g.orbit)assert(Math.abs(x)<25&&Math.abs(y)<30&&z>0&&z<55);
 assert(g.orbit.some(q=>q[0]>5)&&g.orbit.some(q=>q[0]<-5),'visits both wings');
 // For 1 < ρ < 24.74 orbits from (1,1,1) settle on C+ = (√(β(ρ−1)), √(β(ρ−1)), ρ−1).
 const end=G.geometry({...G.defaults,rho:10,points:20000}).last,c=Math.sqrt(8/3*9);assert(Math.hypot(end[0]-c,end[1]-c,end[2]-9)<1e-3);
 const small=G.geometry({...G.defaults,rho:0.5,points:20000}).last;assert(Math.hypot(...small)<1e-6);
 for(const rho of [0.5,60])for(const [x0,z0]of [[-20,-10],[20,50]])assert.equal(G.geometry({...G.defaults,rho,x0,y0:x0,z0,points:20000}).diverged,false);
});
test('fixed RK4 step is fourth-order accurate on a reference case',()=>{
 const run=(h,n)=>{let p=[1,1,1];for(let i=0;i<n;i++)p=G.step(28,p,h);return p;};
 const ref=run(0.0005,1000),coarse=run(0.005,100),fine=run(0.0025,200),err=p=>Math.hypot(p[0]-ref[0],p[1]-ref[1],p[2]-ref[2]);
 assert(err(coarse)<1e-3);const ratio=err(coarse)/err(fine);assert(ratio>12&&ratio<20,'ratio '+ratio);
});
test('projection, initial values and point count are part of the shared drawing',()=>{
 const base=G.svg(G.defaults);for(const change of [{projection:'xy'},{x0:1.1},{points:11500},{rho:27.5}])assert.notEqual(G.svg({...G.defaults,...change}),base);
 for(const projection of ['xz','xy','yz'])for(const [x,y]of G.geometry({...G.defaults,projection}).screen)assert(x>=39.9&&x<=860.1&&y>=39.9&&y<=560.1);
 assert(!/NaN|Infinity/.test(G.svg({rho:NaN,x0:Infinity,points:-1,projection:'q'})));
 const s=G.normalize({...G.defaults,rho:45.5,projection:'yz',palette:'fern'});assert.equal(G.svg(s),G.svg(share.decode(share.encode(s,G),G)));
});
const {createHash}=require('node:crypto'),fixture=require('./share-v1.json');
test('saved generator-1 share URL preserves SVG geometry and palette',()=>{assert.equal(createHash('sha256').update(G.svg(share.decode(fixture.fragment,G))).digest('hex'),fixture.svgSha256);});
