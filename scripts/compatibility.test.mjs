import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/all-works-v1.json',import.meta.url),'utf8'));
test('all generator-v1 defaults and boundary share URLs retain exact SVG bytes',async()=>{
 const slugs=(await readdir('works')).sort();
 assert.deepEqual([...new Set(fixtures.map(f=>f.slug))].sort(),slugs);
 for(const f of fixtures){
  const c={window:{}};vm.createContext(c);
  if(f.key==='StudyGenerator'){vm.runInContext(await readFile('assets/study-core.js','utf8'),c);c.StudyCore=c.window.StudyCore;}
  vm.runInContext(await readFile(`works/${f.slug}/${f.file}`,'utf8'),c);
  vm.runInContext(await readFile('assets/share.js','utf8'),c);
  const G=c.window[f.key],settings=c.window.ArtShare.decode(f.fragment,G);
  assert.equal(JSON.stringify(settings),JSON.stringify(f.settings),f.slug+' settings');
  assert.equal(createHash('sha256').update(G.svg(settings)).digest('hex'),f.svgSha256,f.slug+' SVG');
 }
});
test('every schema control has a readable label, explanation and supported widget',async()=>{
 const c={window:{}};vm.createContext(c);vm.runInContext(await readFile('assets/study-core.js','utf8'),c);c.StudyCore=c.window.StudyCore;
 vm.runInContext(await readFile('assets/study-controls.js','utf8'),c);
 for(const slug of await readdir('works')){
  if(['order-and-chance','truchet-tiles','lissajous'].includes(slug))continue;
  delete c.window.StudyControlDefinitions;
  try{vm.runInContext(await readFile(`works/${slug}/controls.js`,'utf8'),c);}catch(e){if(e.code!=='ENOENT')throw e;}
  vm.runInContext(await readFile(`works/${slug}/generator.js`,'utf8'),c);const G=c.window.StudyGenerator;
  for(const key of Object.keys(G.defaults)){
   const d=c.window.StudyControls.definition(G,key);assert.ok(d.label&&d.help,slug+'/'+key);
   assert.ok(['range','number'].includes(d.control));
   if(G.schema[key]?.min!==undefined)assert.ok(G.schema[key].step>0);
  }
 }
});
