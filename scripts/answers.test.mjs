import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
const require=createRequire(import.meta.url),G=require('../answers/generator.js'),share=require('../assets/share.js'),rolling=require('../works/rolling-circles/generator.js');
const hash=s=>createHash('sha256').update(s).digest('hex');
test('answer mapping v1: all 27 combinations roundtrip and retain frozen SVG fixtures',async()=>{
 const fixtures=JSON.parse(await readFile('scripts/fixtures/answers-v1.json','utf8')),seen=new Set();
 for(const pace of Object.keys(G.schema.pace.options))for(const layers of Object.keys(G.schema.layers.options))for(const scene of Object.keys(G.schema.scene.options)){
  const answers={pace,layers,scene},url=share.encode(answers,G),svg=G.svg(answers),key=[pace,layers,scene].join('/');
  assert.deepEqual(share.decode(url,G),answers);assert.equal(G.svg(share.decode(url,G)),svg);
  assert.equal(hash(svg),fixtures[key].svg);assert.equal(url,fixtures[key].url);seen.add(hash(svg));
  const settings=G.settings(answers);assert.ok(settings.r<settings.R);assert.equal(rolling.normalize(settings).curves,settings.curves);
  assert.equal((svg.match(/<path /g)||[]).length,{single:1,woven:3,rich:5}[layers]);
  assert.ok(G.explain(answers).includes({single:'一本',woven:'三本',rich:'五本'}[layers]));
 }
 assert.equal(seen.size,27);assert.equal(Object.keys(fixtures).length,27);
});
test('input boundaries default safely; malformed shared answers and versions reject',()=>{
 for(const bad of [null,[],true,'x',{pace:'<script>',layers:'__proto__',scene:'constructor'},{pace:2,layers:NaN,scene:Infinity},{pace:'x'.repeat(9000)}])assert.deepEqual(G.normalize(bad),G.defaults);
 const fragment=settings=>'#art='+encodeURIComponent(JSON.stringify({format:1,generator:1,settings}));
 for(const bad of [{...G.defaults,pace:'unknown'},{...G.defaults,scene:3},{pace:'gentle'},{...G.defaults,extra:'a'}])assert.throws(()=>share.decode(fragment(bad),G));
 assert.throws(()=>share.decode('#art='+encodeURIComponent(JSON.stringify({format:1,generator:2,settings:G.defaults})),G));
 assert.throws(()=>share.decode('#art=%',G));assert.throws(()=>share.decode('#art='+'a'.repeat(8200),G));
 assert.equal(G.svg({pace:'x'}),G.svg(G.defaults));assert.deepEqual(G.normalize({pace:'bold',layers:'single',scene:'evening',ignored:'x'}),{pace:'bold',layers:'single',scene:'evening'});
});
