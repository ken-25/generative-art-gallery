import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),share=require('../assets/share.js');
for(const [slug,file,key] of [['order-and-chance','generator.js','ArtGenerator'],['truchet-tiles','truchet-generator.js','TruchetGenerator'],['lissajous','lissajous.js','LissajousGenerator']]) {
 const context={window:{}};vm.runInNewContext(await readFile(`works/${slug}/${file}`,'utf8'),context);const G=context.window[key];
 test(slug+' stable round trips and invalid data',()=>{
  for(const bound of [0,1]) {
   const input={...G.defaults};for(const [k,v] of Object.entries(G.limits))input[k]=v[bound];
   if('seed' in input)input.seed='日本語 & # / % " <>';
   if('palette' in input)input.palette='night';
   const s=G.normalize(input),fragment=share.encode(s,G),restored=share.decode(fragment,G);
   assert.equal(G.svg(restored),G.svg(s));assert.equal(share.encode(restored,G),fragment);
   assert.equal(share.encode(Object.fromEntries(Object.entries(s).reverse()),G),fragment);
  }
  const s={...G.defaults};
  for(const data of [{format:2,generator:1,settings:s},{format:1,generator:2,settings:s},{format:1,generator:1,settings:{...s,unknown:1}},{format:1,generator:1,settings:{}},{format:1,generator:1,settings:{...s,[Object.keys(G.limits)[0]]:9999}}])assert.throws(()=>share.decode('#art='+encodeURIComponent(JSON.stringify(data)),G));
  for(const fragment of ['#art=%ZZ','#art='+ 'x'.repeat(8192),'#art=null','#art=%7B','#x=1'])assert.throws(()=>share.decode(fragment,G));
 });
}
// Persisted URLs and output hashes survive future generator changes.
import {createHash} from 'node:crypto';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/share-v1.json',import.meta.url),'utf8'));
test('saved generator-1 URLs retain their original SVG outputs',async()=>{
 for(const f of fixtures){const c={window:{}};vm.runInNewContext(await readFile(`works/${f.slug}/${f.file}`,'utf8'),c);const G=c.window[f.key];assert.equal(createHash('sha256').update(G.svg(share.decode(f.fragment,G))).digest('hex'),f.svgSha256);}
});
