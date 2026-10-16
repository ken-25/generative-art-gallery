const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('./generator.js'),share=require('../../assets/share.js');
test('nested layers stay regular at zero perturbation and bounded at extremes',()=>{
const regular=G.geometry({...G.defaults,shift:0,rotation:0,dropout:0});assert.equal(regular.length,G.defaults.bands*G.defaults.stacks*G.defaults.layers);for(let i=0;i<regular.length;i+=G.defaults.layers){const stack=regular.slice(i,i+G.defaults.layers);assert(stack.every(c=>c.rotation===0&&c.center[0]===stack[0].center[0]&&c.center[1]===stack[0].center[1]));}
for(const layers of [1,14])for(const c of G.geometry({...G.defaults,bands:8,stacks:8,layers,gap:16,rotation:45,shift:30,dropout:0})){assert(c.radius>0);for(const [x,y]of c.points)assert(x>=30&&x<=870&&y>=30&&y<=570);}
assert.equal(G.geometry({...G.defaults,dropout:1}).length,0);const a=G.geometry({...G.defaults,dropout:0,correlation:1});for(let i=0;i<a.length;i+=G.defaults.layers)assert(a.slice(i,i+G.defaults.layers).every(c=>c.rotation===a[i].rotation));assert.notDeepEqual(a,G.geometry({...G.defaults,dropout:0,correlation:0}));const s=G.normalize({...G.defaults,seed:'層 # &',palette:'dusk'});assert.equal(G.svg(s),G.svg(share.decode(share.encode(s,G),G)));assert(!/NaN|Infinity/.test(G.svg({layers:999,shift:NaN})));});

const {createHash}=require('node:crypto'),fixture=require('./share-v1.json');
test('saved generator-1 share URL preserves SVG geometry and palette',()=>{assert.equal(createHash('sha256').update(G.svg(share.decode(fixture.fragment,G))).digest('hex'),fixture.svgSha256);});
