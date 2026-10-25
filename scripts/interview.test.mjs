import {test} from 'node:test';import assert from 'node:assert/strict';
import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
import * as M from '../prototypes/shape-interview/model.mjs';import {build} from '../assets/sculpture-geometry.mjs';import {STLExporter} from '../assets/vendor/STLExporter.js';
const require=createRequire(import.meta.url),G=require('../works/nested-hexagons/generator.js'),C=require('../assets/study-core.js');
const bytes=s=>{const g=build(s,G,C);try{return new Uint8Array(new STLExporter().parse(g,{binary:true}).buffer);}finally{g.traverse(m=>{m.geometry?.dispose();m.material?.dispose();});}};
test('interview recipe replays every choice, seed and binary geometry',()=>{
 for(const seed of ['interview-001','日本語 & # / seed','long-seed-'.repeat(8)])for(let first=0;first<3;first++)for(let choice=0;choice<3;choice++){
  let r=M.chooseFirst(M.create(seed),first);r=M.toggleLock(r,'amount');r=M.toggleLock(r,'spread');r=M.choose(M.vary(M.advance(r)),choice);
  const restored=M.loadRecipe(M.saveRecipe(r));assert.deepEqual(restored,r);assert.deepEqual(M.fromFragment(M.fragment(r)),r);
  assert.deepEqual(M.candidates(restored),M.candidates(r));assert.deepEqual(bytes(M.selected(restored)),bytes(M.selected(r)));
 }
});
test('every combination of retained features survives all candidate rounds',()=>{
 for(const seed of ['interview-001','x'.repeat(80)])for(let first=0;first<3;first++)for(let mask=0;mask<8;mask++){
  let r=M.chooseFirst(M.create(seed),first);for(let i=0;i<3;i++)if(mask&(1<<i))r=M.toggleLock(r,M.features[i]);r=M.advance(r);
  const base=M.firstCandidates(r)[first];for(let j=0;j<6;j++){for(const s of M.candidates(r))for(const key of r.locks)assert.equal(s[key],base[key]);
   const digests=M.candidates(r).map(s=>createHash('sha256').update(bytes(s)).digest('hex'));assert.equal(new Set(digests).size,3,'three real distinct shapes');r=M.vary(r);}
 }
});
test('back, reselect and feature revisions clear only dependent choices',()=>{
 let r=M.chooseFirst(M.create(),1);r=M.toggleLock(r,'color');r=M.choose(M.advance(r),2);
 r=M.back(r);assert.equal(r.step,2);assert.equal(r.choice,2);assert.deepEqual(r.locks,['color']);r=M.back(r);assert.equal(r.step,1);assert.equal(r.choice,null);assert.deepEqual(M.selected(r),M.firstCandidates(r)[1]);
 r=M.toggleLock(r,'amount');assert.deepEqual(r.locks,['amount','color']);r=M.chooseFirst(M.back(r),0);assert.deepEqual(r.locks,[]);assert.equal(r.round,0);assert.equal(r.choice,null);
});
test('invalid recipes are rejected without silently changing intent',()=>{
 for(const change of [{format:2},{seed:''},{seed:7},{locks:['__proto__']},{locks:['amount','amount']},{choice:4},{step:3},{step:1},{round:51},{extra:true},{first:null,choice:1}])assert.throws(()=>M.loadRecipe(JSON.stringify({...M.create(),...change})));
 assert.throws(()=>M.fromFragment('#recipe=%zz'));assert.throws(()=>M.loadRecipe('x'.repeat(16385)));
});
test('detail link preserves the selected existing 3D state on the artwork route',()=>{
 const r=M.choose(M.advance(M.chooseFirst(M.create(),2)),1),url=new URL(M.detailURL(r,'http://127.0.0.1/prototype/'));
 assert.equal(url.pathname,'/works/nested-hexagons/');assert.equal(url.searchParams.get('view'),'3d');for(const [k,v] of Object.entries(M.selected(r)))assert.equal(url.searchParams.get(k),String(v));
});
