import {test} from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {defaults,normalize,build,validate,works} from '../assets/sculpture-geometry.mjs';import {STLExporter} from '../assets/vendor/STLExporter.js';
const require=createRequire(import.meta.url),C=require('../assets/study-core.js');
test('3D v1 normalization rejects unknown work, nonfinite values and colors',()=>{assert.deepEqual(normalize({amount:'NaN',work:'../x',color:'red'}),defaults);assert.equal(normalize({amount:1000}).amount,80);});
for(const work of works)test(`${work}: deterministic geometry, finite nondegenerate triangles, binary STL readback`,()=>{const G=require(`../works/${work}/generator.js`);for(const mount of ['none','base','hang']){const s={...defaults,work,mount},a=build(s,G,C),b=build(s,G,C);assert.ok(validate(a)>0);const exporter=new STLExporter(),bytes=exporter.parse(a,{binary:true}),other=exporter.parse(b,{binary:true});assert.deepEqual(new Uint8Array(bytes.buffer),new Uint8Array(other.buffer));const n=bytes.getUint32(80,true);assert.equal(bytes.byteLength,84+n*50);assert.ok(n>0);for(let i=84;i<bytes.byteLength;i+=50)for(let j=0;j<12;j++)assert.ok(Number.isFinite(bytes.getFloat32(i+4*j,true)));}});
test('all meshes retain closed boundaries and outward orientation across density limits',()=>{for(const work of works)for(const amount of [8,48,80]){const group=build({...defaults,work,amount},require(`../works/${work}/generator.js`),C);validate(group);group.traverse(m=>{if(!m.isMesh)return;const g=m.geometry,p=g.attributes.position,ix=g.index,edges=new Map();let volume=0;const at=i=>{const j=ix?ix.getX(i):i;return [p.getX(j),p.getY(j),p.getZ(j)];},key=a=>a.map(x=>Math.round(x*10000)).join(',');for(let i=0;i<(ix?ix.count:p.count);i+=3){const a=at(i),b=at(i+1),c=at(i+2);volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;for(const [u,v] of [[a,b],[b,c],[c,a]]){const x=key(u),y=key(v),k=x<y?x+'|'+y:y+'|'+x;const e=edges.get(k)||{count:0,direction:0};e.count++;e.direction+=x<y?1:-1;edges.set(k,e);}}assert.ok(volume>0,`${work} ${amount} outward volume ${volume}`);assert.ok([...edges.values()].every(e=>e.count===2&&e.direction===0),`${work} ${amount} closed oriented edges`);});}});

test('artwork-specific controls have an effect at every adjacent setting and retain normalized shares',async()=>{
 const {profiles,defaultsFor,normalizeFor}=await import('../assets/sculpture-settings.mjs');
 for(const work of works){
  const G=require(`../works/${work}/generator.js`),base=normalizeFor(work,defaultsFor(work));
  assert.deepEqual(normalizeFor(work,base),base);
  const signature=s=>{const g=build(s,G,C),bytes=new STLExporter().parse(g,{binary:true});g.traverse(m=>{m.geometry?.dispose();m.material?.dispose();});return require('node:crypto').createHash('sha256').update(Buffer.from(bytes.buffer)).digest('hex');};
  for(const field of profiles[work]){
   let previous;
   for(let value=field.min;value<=field.max+1e-6;value+=field.step){const s=normalizeFor(work,{...base,[field.key]:value});const current=signature(s);assert.notEqual(current,previous,`${work} ${field.key} ${value} changes geometry`);previous=current;}
  }
  assert.equal(profiles[work].some(f=>f.key==='thickness'),!['nested-hexagons','voronoi-relaxation'].includes(work));
 }
});
