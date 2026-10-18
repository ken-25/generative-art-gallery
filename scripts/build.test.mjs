import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,readFile,writeFile,rm} from 'node:fs/promises';
import {catalog,escape} from './build.mjs';
test('catalog ordering, independent additions and validation',async()=>{
 const dir=await mkdtemp(process.cwd()+'/.catalog-test-');
 try {
  for(const slug of ['alpha','beta']) {
   await cp('works/lissajous',`${dir}/${slug}`,{recursive:true});
   const m=JSON.parse(await readFile(`${dir}/${slug}/manifest.json`));m.slug=slug;m.number=slug==='alpha'?1:2;
   await writeFile(`${dir}/${slug}/manifest.json`,JSON.stringify(m));
  }
  assert.deepEqual((await catalog(dir)).map(m=>m.slug),['alpha','beta']);
  const sourceFile=`${dir}/alpha/index.html`;await writeFile(sourceFile,(await readFile(sourceFile,'utf8'))+'<a href="mailto:hello@example.org">mail</a><a href="//example.org/reference">source</a><a href="/generative-art-gallery/about/">about</a>');
  assert.equal((await catalog(dir)).length,2);
  const file=`${dir}/alpha/manifest.json`, original=JSON.parse(await readFile(file));
  for(const patch of [{slug:'../x'},{addedAt:'2026-02-30T00:00:00Z'},{title:''},{preview:'../x.svg'},{sources:[]},{tags:[]},{number:undefined},{number:0},{number:1.5},{number:'1'},{number:2}]){
   await writeFile(file,JSON.stringify({...original,...patch}));await assert.rejects(catalog(dir));
  }
  assert.equal(escape('<script>"&'), '&lt;script&gt;&quot;&amp;');
 } finally {await rm(dir,{recursive:true,force:true});}
});

import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {readdir,stat} from 'node:fs/promises';
test('two folder-only additions enter deterministic HTML, catalog and sitemap',async()=>{
 const baseline=(await catalog(path.resolve('works'))).length;
 const dir=await mkdtemp(path.join(tmpdir(),'gallery 日本語 space-'));
 try {
  for(const file of ['assets','works','templates','scripts','index.html','.nojekyll','about','LICENSE','THIRD_PARTY_NOTICES.md','CONTRIBUTING.md']) {
   try{await stat(file);}catch{continue;}
   await cp(file,path.join(dir,file),{recursive:true});
  }
  for(const slug of ['alpha','beta']){
   await cp('works/lissajous',`${dir}/works/${slug}`,{recursive:true});
   const file=`${dir}/works/${slug}/manifest.json`,m=JSON.parse(await readFile(file));m.slug=slug;m.number=slug==='alpha'?901:902;m.title='<b> & " title $$ $& $`';await writeFile(file,JSON.stringify(m));
  }
  const run=()=>execFileSync(process.execPath,[path.join(dir,'scripts/build.mjs')],{cwd:dir,env:{...process.env,GOOGLE_TAG_ENABLED:'',GOOGLE_TAG_ID:'',SITE_URL:'https://example.org/sub/'}});
  const snapshot=async(folder)=>{const files={};for(const e of await readdir(folder,{withFileTypes:true})){const p=path.join(folder,e.name);if(e.isDirectory())Object.assign(files,await snapshot(p));else files[path.relative(dir,p)]=(await readFile(p)).toString('base64');}return files;};
  run();const first=await snapshot(`${dir}/dist`);run();assert.deepEqual(await snapshot(`${dir}/dist`),first);
  const html=await readFile(`${dir}/dist/index.html`,'utf8'),lists=(await Promise.all(Array.from({length:Math.ceil((baseline+2)/20)},(_,i)=>readFile(`${dir}/dist/${i?`page/${i+1}/`:''}index.html`,'utf8')))).join('').replaceAll('../../works/','works/'),map=await readFile(`${dir}/dist/sitemap.xml`,'utf8');
  const list=JSON.parse(await readFile(`${dir}/dist/catalog.json`));assert.equal(list.length,baseline+2);assert.ok(html.includes(String(baseline+2).padStart(2,'0')+' WORKS'));assert.ok(lists.includes('&lt;b&gt; &amp; &quot; title $$ $&amp; $`'));
  for(const slug of ['alpha','beta'])assert.ok((await readFile(`${dir}/dist/works/${slug}/index.html`,'utf8')).includes('<title>&lt;b&gt; &amp; &quot; title $$ $&amp; $` — Generative Art Gallery</title>'));
  for(const slug of ['alpha','beta']){assert.match(lists,new RegExp(`href="works/${slug}/"`));assert.match(map,new RegExp(`https://example.org/sub/works/${slug}/`));const rendered=await readFile(`${dir}/dist/works/${slug}/index.html`,'utf8');assert.match(rendered,/target="_blank" rel="noopener noreferrer"/);assert.match(rendered,/class="external-link-note">（新しいタブ）/);assert.match(rendered,/class="brand-mark" src="\/sub\/assets\/brand\/mark-32.svg"/);assert.match(rendered,/sizes="16x16" href="\/sub\/assets\/brand\/favicon-16.png"/);const m=list.find(x=>x.slug===slug);assert.match(await readFile(`${dir}/dist/works/${slug}/index.html`,'utf8'),new RegExp('<p class="eyebrow">'+String(m.number).padStart(3,'0')+' / [A-Z]'));}
  assert.doesNotMatch(html,/<script/);assert.match(html,/fetchpriority="high"/);
  assert.doesNotMatch(html,/theme-nav|theme-section/);assert.equal((html.match(/class="work-card"/g)||[]).length,Math.min(baseline+2,20));assert.equal((lists.match(/class="work-card"/g)||[]).length,baseline+2);assert.match(html,/twitter:card/);assert.match(html,/og:image:alt/);await assert.rejects(stat(`${dir}/dist/assets/analytics.js`));
  execFileSync(process.execPath,[path.join(dir,'scripts/build.mjs')],{cwd:dir,env:{...process.env,SITE_URL:'https://example.org/sub/',GOOGLE_TAG_ENABLED:'true',GOOGLE_TAG_ID:'G-TEST000000'}});
  for(const file of ['index.html','about/index.html','works/alpha/index.html','works/beta/index.html']){
   const tagged=await readFile(`${dir}/dist/${file}`,'utf8');assert.equal((tagged.match(/data-google-tag-id=/g)||[]).length,1);assert.match(tagged,/src="\/sub\/assets\/analytics.js"/);assert.match(tagged,/data-google-tag-enabled="true"/);if(file==='about/index.html')assert.match(tagged,/サイト改善のため、アクセスや保存・共有の利用状況を集計しています。/);
  }
  assert.throws(()=>execFileSync(process.execPath,[path.join(dir,'scripts/build.mjs')],{cwd:dir,env:{...process.env,GOOGLE_TAG_ENABLED:'true',GOOGLE_TAG_ID:'G-<script>'},stdio:'pipe'}));
  assert.throws(()=>execFileSync(process.execPath,[path.join(dir,'scripts/build.mjs')],{cwd:dir,env:{...process.env,GOOGLE_TAG_ENABLED:'true',GOOGLE_TAG_ID:''},stdio:'pipe'}));
  for(const enabled of ['', 'false', 'TRUE', '1']){
   execFileSync(process.execPath,[path.join(dir,'scripts/build.mjs')],{cwd:dir,env:{...process.env,GOOGLE_TAG_ENABLED:enabled,GOOGLE_TAG_ID:'G-TEST000000'}});
   await assert.rejects(stat(`${dir}/dist/assets/analytics.js`));
   for(const file of ['index.html','about/index.html',...list.map(m=>`works/${m.slug}/index.html`)])assert.doesNotMatch(await readFile(`${dir}/dist/${file}`,'utf8'),/data-google-tag-|assets\/analytics.js|googletagmanager|集計しています|明示的に有効化/);
  }


 }finally{await rm(dir,{recursive:true,force:true});}
});

test('flat catalog preserves every artwork number',async()=>{
 const works=await catalog(path.resolve('works'));
 assert.ok(works.every(m=>!Object.hasOwn(m,'theme')));
 assert.deepEqual(works.slice(0,24).map(m=>m.slug),['order-and-chance','truchet-tiles','lissajous','recursive-regions','line-trails','octahedral-paths','layered-lines','density-field','hex-transitions','flow-and-silence','nested-hexagons','probability-segments','ink-on-water','rolling-circles','branching-rules','chaos-game','julia-mandelbrot','elementary-automata','reaction-diffusion','flocking-trails','diffusion-aggregation','penrose-triangles','voronoi-relaxation','lorenz-orbit']);
});
