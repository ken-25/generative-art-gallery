const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('./generator.js'),share=require('../../assets/share.js');
const area=c=>G.centroid(c)?.area||0,total=list=>list.reduce((a,c)=>a+area(c),0);
const nearest=(sites,x,y)=>sites.reduce((b,p,i)=>(p[0]-x)**2+(p[1]-y)**2<(sites[b][0]-x)**2+(sites[b][1]-y)**2?i:b,0);
test('cells tile the frame and every point belongs to its nearest site',()=>{
 const g=G.geometry({...G.defaults,iterations:0});assert(Math.abs(total(g.cells)-540000)<1e-6);
 for(const [i,c]of g.cells.entries()){const m=G.centroid(c);assert.equal(nearest(g.sites,m.x,m.y),i);for(const [x,y]of c)assert(x>=-1e-9&&x<=900+1e-9&&y>=-1e-9&&y<=600+1e-9);}
 // Two sites split the frame at their bisector.
 const two=G.cells([[300,300],[600,300]]);assert(Math.abs(area(two[0])-270000)<1e-6&&Math.abs(G.centroid(two[0]).x-225)<1e-9);
});
test('repeated, collinear and nearly collinear sites stay finite',()=>{
 const same=G.cells([[100,100],[100,100],[500,300]]);assert.equal(same[1].length,0);assert(Math.abs(total(same)-540000)<1e-6);
 const line=G.cells(Array.from({length:6},(_,i)=>[100+i*140,300]));assert(Math.abs(total(line)-540000)<1e-6);for(const c of line.slice(1,-1))assert(Math.abs(area(c)-140*600)<1e-6);
 const almost=G.cells(Array.from({length:8},(_,i)=>[60+i*110,300+1e-7*i*i]));assert(Math.abs(total(almost)-540000)<1e-4);
 for(const c of [...same,...line,...almost])for(const v of c)assert(v.every(Number.isFinite));
});
test('relaxation moves sites toward centroids and evens out the cell areas',()=>{
 const spread=g=>{const a=g.cells.map(area),m=a.reduce((x,y)=>x+y)/a.length;return Math.sqrt(a.reduce((x,y)=>x+(y-m)**2,0)/a.length);};
 const energy=g=>g.cells.reduce((e,c,i)=>{const m=G.centroid(c);return e+(m.x-g.sites[i][0])**2+(m.y-g.sites[i][1])**2;},0);
 const g0=G.geometry({...G.defaults,iterations:0}),g1=G.geometry({...G.defaults,iterations:1}),g10=G.geometry({...G.defaults,iterations:10});
 assert.deepEqual(g0.sites,g0.initial);assert.notDeepEqual(g10.sites,g0.sites);assert(spread(g10)<spread(g0));assert(energy(g10)<energy(g1));
 // One relaxation step puts each site exactly at the centroid of its previous cell.
 g0.cells.forEach((c,i)=>{const m=G.centroid(c);assert(Math.abs(m.x-g1.sites[i][0])<1e-9&&Math.abs(m.y-g1.sites[i][1])<1e-9);});
 assert(Math.abs(total(G.geometry({...G.defaults,sites:200,iterations:20}).cells)-540000)<1e-6);
});
test('drawing styles and share URLs use the same cells',()=>{
 assert.match(G.svg({...G.defaults,style:'outline'}),/fill="none"/);assert.doesNotMatch(G.svg({...G.defaults,style:'fill',markers:'hide'}),/stroke=|a2.2/);
 const s={...G.defaults,iterations:6},a=G.svg(s),b=G.svg({...s});assert.equal(a,b);
 assert(!/NaN|Infinity/.test(G.svg({sites:NaN,iterations:Infinity,style:'x'})));
 const n=G.normalize({...G.defaults,sites:33,seed:'母点#',palette:'dusk'});assert.equal(G.svg(n),G.svg(share.decode(share.encode(n,G),G)));
});
const {createHash}=require('node:crypto'),fixture=require('./share-v1.json');
test('saved generator-1 share URL preserves SVG geometry and palette',()=>{assert.equal(createHash('sha256').update(G.svg(share.decode(fixture.fragment,G))).digest('hex'),fixture.svgSha256);});
