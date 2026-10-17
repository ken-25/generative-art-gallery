const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('./generator.js'),share=require('../../assets/share.js');
test('every boid updates from the previous state at the same time',()=>{
 // Two boids with alignment only: each turns toward the other's previous velocity, not the other's new one.
 const s={...G.defaults,count:2,separation:0,cohesion:0,alignment:1,radius:120,steps:20,seed:'pair-27'},g=G.geometry(s);
 const [a,b]=g.initial,lim=(x,y,m)=>{const n=Math.hypot(x,y);return n>m?[x*m/n,y*m/n]:[x,y];};
 const wrap=(d,size)=>d-size*Math.round(d/size);
 if(Math.hypot(wrap(b.x-a.x,900),wrap(b.y-a.y,600))<=120){
  for(const [self,other,trail]of [[a,b,g.trails[0]],[b,a,g.trails[1]]]){
   const m=Math.hypot(other.vx,other.vy),[fx,fy]=lim(other.vx/m*3-self.vx,other.vy/m*3-self.vy,0.05);
   let vx=self.vx+fx,vy=self.vy+fy;const sp=Math.hypot(vx,vy);if(sp>3){vx*=3/sp;vy*=3/sp;}
   assert(Math.abs(wrap(trail[1][0]-self.x,900)-vx)<1e-9&&Math.abs(wrap(trail[1][1]-self.y,600)-vy)<1e-9);
  }
 }else assert.fail('fixture pair should start as neighbours');
});
test('single boid, coincident boids, no neighbours and zero weights stay finite',()=>{
 const one=G.geometry({...G.defaults,count:1,steps:100});assert.equal(one.trails.length,1);
 // A lone boid has no neighbours, so it keeps its initial velocity.
 const [p0,p1,p2]=one.trails[0];assert(Math.abs((p2[0]-p1[0])-(p1[0]-p0[0]))<1e-9||Math.abs(p2[0]-p1[0])>400);
 const still=G.geometry({...G.defaults,separation:0,alignment:0,cohesion:0,steps:50});
 still.trails.forEach((t,i)=>{const v=still.initial[i];for(let k=1;k<t.length;k++){const dx=((t[k][0]-t[k-1][0])%900+1350)%900-450;assert(Math.abs(dx-v.vx)<1e-9);}});
 const tiny=G.geometry({...G.defaults,radius:10,count:2,steps:30});assert.equal(tiny.trails.every(t=>t.every(([x,y])=>Number.isFinite(x)&&Number.isFinite(y))),true);
 for(const t of G.geometry({...G.defaults,count:120,separation:3,alignment:3,cohesion:3,radius:120,steps:200}).trails)for(const [x,y]of t)assert(x>=0&&x<900&&y>=0&&y<600);
 assert(!/NaN|Infinity/.test(G.svg({count:NaN,radius:Infinity,separation:-1,steps:1e9})));
});
test('trails split at the wrap so no drawn segment crosses the picture',()=>{
 const g=G.geometry({...G.defaults,steps:500});
 for(const list of g.pieces)for(const piece of list)for(let i=1;i<piece.length;i++)assert(Math.hypot(piece[i][0]-piece[i-1][0],piece[i][1]-piece[i-1][1])<=3+1e-9);
 assert(g.pieces.some(list=>list.length>1));
 for(const [,x,y]of G.svg(G.defaults).matchAll(/l(-?[\d.]+) (-?[\d.]+)/g))assert(Math.hypot(+x,+y)<=7);
 assert.deepEqual(G.geometry(G.defaults).trails,G.geometry(G.defaults).trails);assert.notDeepEqual(G.geometry(G.defaults).trails,G.geometry({...G.defaults,seed:'other'}).trails);
 const s=G.normalize({...G.defaults,seed:'群れ#',count:20,palette:'clay'});assert.equal(G.svg(s),G.svg(share.decode(share.encode(s,G),G)));
});
const {createHash}=require('node:crypto'),fixture=require('./share-v1.json');
test('saved generator-1 share URL preserves SVG geometry and palette',()=>{assert.equal(createHash('sha256').update(G.svg(share.decode(fixture.fragment,G))).digest('hex'),fixture.svgSha256);});
