import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,readFile,writeFile,rm} from 'node:fs/promises';
import {catalog,escape} from './build.mjs';
test('catalog ordering, independent additions and validation',async()=>{
 const dir=await mkdtemp(process.cwd()+'/.catalog-test-');
 try {
  for(const slug of ['alpha','beta']) {
   await cp('works/lissajous',`${dir}/${slug}`,{recursive:true});
   const m=JSON.parse(await readFile(`${dir}/${slug}/manifest.json`));m.slug=slug;
   await writeFile(`${dir}/${slug}/manifest.json`,JSON.stringify(m));
  }
  assert.deepEqual((await catalog(dir)).map(m=>m.slug),['alpha','beta']);
  const file=`${dir}/alpha/manifest.json`, original=JSON.parse(await readFile(file));
  for(const patch of [{slug:'../x'},{addedAt:'2026-02-30T00:00:00Z'},{title:''},{preview:'../x.svg'},{sources:[]},{tags:[]}]){
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
   const file=`${dir}/works/${slug}/manifest.json`,m=JSON.parse(await readFile(file));m.slug=slug;m.title='<b> & " title $$ $& $`';await writeFile(file,JSON.stringify(m));
  }
  const run=()=>execFileSync(process.execPath,[path.join(dir,'scripts/build.mjs')],{cwd:dir,env:{...process.env,SITE_URL:'https://example.org/sub/'}});
  const snapshot=async(folder)=>{const files={};for(const e of await readdir(folder,{withFileTypes:true})){const p=path.join(folder,e.name);if(e.isDirectory())Object.assign(files,await snapshot(p));else files[path.relative(dir,p)]=(await readFile(p)).toString('base64');}return files;};
  run();const first=await snapshot(`${dir}/dist`);run();assert.deepEqual(await snapshot(`${dir}/dist`),first);
  const html=await readFile(`${dir}/dist/index.html`,'utf8'),map=await readFile(`${dir}/dist/sitemap.xml`,'utf8');
  const list=JSON.parse(await readFile(`${dir}/dist/catalog.json`));assert.equal(list.length,baseline+2);assert.ok(html.includes(String(baseline+2).padStart(2,'0')+' WORKS'));assert.ok(html.includes('&lt;b&gt; &amp; &quot; title $$ $&amp; $`'));
  for(const slug of ['alpha','beta'])assert.ok((await readFile(`${dir}/dist/works/${slug}/index.html`,'utf8')).includes('<title>&lt;b&gt; &amp; &quot; title $$ $&amp; $` — Generative Art Gallery</title>'));
  for(const slug of ['alpha','beta']){assert.match(html,new RegExp(`href="works/${slug}/"`));assert.match(map,new RegExp(`https://example.org/sub/works/${slug}/`));const m=list.find(x=>x.slug===slug);assert.match(await readFile(`${dir}/dist/works/${slug}/index.html`,'utf8'),new RegExp(String(m.number).padStart(3,'0')+' /'));}
  assert.doesNotMatch(html,/<script/);assert.match(html,/fetchpriority="high"/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
