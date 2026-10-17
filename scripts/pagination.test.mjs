import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,cp,readFile,writeFile,rm,readdir,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {paginate,newestFirst,pagination,pagePath,catalog} from './build.mjs';

test('pages hold 20 works with no empty, missing or duplicated page',()=>{
 for(const [count,sizes] of [[0,[]],[1,[1]],[20,[20]],[21,[20,1]],[40,[20,20]],[41,[20,20,1]]]){
  const items=Array.from({length:count},(_,i)=>i),pages=paginate(items);
  assert.deepEqual(pages.map(p=>p.length),sizes,String(count));assert.deepEqual(pages.flat(),items);
 }
 assert.equal(pagination(1,1,20,0,''),'');
 const first=pagination(1,3,41,0,''),middle=pagination(2,3,41,20,'../../'),last=pagination(3,3,41,40,'../../');
 assert.doesNotMatch(first,/rel="prev"/);assert.match(first,/href="page\/2\/" rel="next"/);assert.match(first,/href="\.\/" aria-current="page">1</);
 assert.match(middle,/href="\.\.\/\.\.\/" rel="prev"/);assert.match(middle,/href="\.\.\/\.\.\/page\/3\/" rel="next"/);assert.match(middle,/全41件中 21〜40件/);
 assert.doesNotMatch(last,/rel="next"/);assert.match(last,/全41件中 41〜41件/);assert.equal(pagePath(1),'');assert.equal(pagePath(2),'page/2/');
});

test('newest first by first publication, ties by slug, independent of folder order',()=>{
 const works=[{slug:'b',addedAt:'2026-01-02T00:00:00Z'},{slug:'c',addedAt:'2026-01-01T00:00:00Z'},{slug:'a',addedAt:'2026-01-02T00:00:00Z'}];
 assert.deepEqual(newestFirst(works).map(m=>m.slug),['a','b','c']);assert.deepEqual(newestFirst([...works].reverse()).map(m=>m.slug),['a','b','c']);
});

async function site(count){
 const dir=await mkdtemp(path.join(tmpdir(),'gallery pages 日本語-'));
 for(const file of ['assets','templates','scripts','index.html','.nojekyll','about','LICENSE','THIRD_PARTY_NOTICES.md','CONTRIBUTING.md'])await cp(file,path.join(dir,file),{recursive:true});
 const existing=await catalog(path.resolve('works'));await mkdir(`${dir}/works`);
 for(let i=0;i<count;i++){
  const source=existing[i%existing.length],slug=i<existing.length?source.slug:`extra-${String(i).padStart(2,'0')}`;
  await cp(`works/${source.slug}`,`${dir}/works/${slug}`,{recursive:true});
  if(slug!==source.slug){const file=`${dir}/works/${slug}/manifest.json`,m=JSON.parse(await readFile(file));m.slug=slug;m.number=100+i;m.addedAt=`2027-01-01T00:00:${String(i%60).padStart(2,'0')}Z`;await writeFile(file,JSON.stringify(m));}
 }
 return dir;
}
const build=dir=>execFileSync(process.execPath,[path.join(dir,'scripts/build.mjs')],{cwd:dir,env:{...process.env,GOOGLE_TAG_ENABLED:'',SITE_URL:'https://example.org/sub/'}});

test('static list pages: 41 works give 20+20+1 newest-first pages with own canonical, nav and sitemap entry',async()=>{
 const dir=await site(41);
 try{
  build(dir);
  const list=JSON.parse(await readFile(`${dir}/dist/catalog.json`)),ordered=newestFirst(list);
  assert.equal(new Set(list.map(m=>m.number)).size,41);assert.deepEqual(list.map(m=>m.number),[...list.map(m=>m.number)].sort((a,b)=>a-b));
  const original=await catalog(path.resolve('works'));for(const m of original)assert.equal(list.find(x=>x.slug===m.slug).number,m.number,m.slug+' keeps its number');
  const files=['index.html','page/2/index.html','page/3/index.html'],seen=[];
  for(const [i,file] of files.entries()){
   const html=await readFile(`${dir}/dist/${file}`,'utf8'),canonical=`https://example.org/sub/${pagePath(i+1)}`;
   const hrefs=[...html.matchAll(/class="work-card" href="([^"]+)"/g)].map(m=>m[1]);assert.equal(hrefs.length,i<2?20:1);
   const prefix=i?'../../':'';assert.deepEqual(hrefs,ordered.slice(i*20,i*20+20).map(m=>`${prefix}works/${m.slug}/`));seen.push(...hrefs.map(h=>h.replace(prefix,'')));
   assert.match(html,new RegExp(`<link rel="canonical" href="${canonical}">`));assert.equal((html.match(/<title>/g)||[]).length,1);
   assert.match(html,/<nav class="pagination" aria-label="作品一覧のページ">/);assert.equal((html.match(/aria-current="page"/g)||[]).length,1);assert.match(html,new RegExp(`aria-current="page">${i+1}<`));
   assert.equal(/rel="prev"/.test(html),i>0);assert.equal(/rel="next"/.test(html),i<2);
   assert.match(html,/fetchpriority="high"/);assert.equal((html.match(/loading="lazy"/g)||[]).length,hrefs.length-1);assert.match(html,/41 WORKS/);
   if(i){assert.match(html,/href="\.\.\/\.\.\/assets\/style.css"/);assert.match(html,/href="\.\.\/\.\.\/about\/"/);assert.match(html,/href="\.\.\/\.\.\/index.html"/);for(const [,link] of html.matchAll(/(?:href|src)="(\.\.\/[^"#]+)"/g))await stat(path.resolve(`${dir}/dist/${path.dirname(file)}`,link.replace(/\/$/,'/index.html')));}
   assert.match(html,new RegExp(`全41件中 ${i*20+1}〜${Math.min(i*20+20,41)}件`));
  }
  assert.deepEqual([...seen].sort(),list.map(m=>`works/${m.slug}/`).sort());
  await assert.rejects(stat(`${dir}/dist/page/4/index.html`));await assert.rejects(stat(`${dir}/dist/page/1/index.html`));
  const titles=await Promise.all(files.map(async f=>(await readFile(`${dir}/dist/${f}`,'utf8')).match(/<title>(.*?)<\/title>/)[1]));assert.equal(new Set(titles).size,3);
  const map=await readFile(`${dir}/dist/sitemap.xml`,'utf8');for(const p of ['','page/2/','page/3/'])assert.match(map,new RegExp(`<loc>https://example.org/sub/${p}</loc>`));
  // Editing an existing work's description never moves it back to the top.
  const first=JSON.parse(await readFile(`${dir}/works/order-and-chance/manifest.json`));first.description+='（改訂）';await writeFile(`${dir}/works/order-and-chance/manifest.json`,JSON.stringify(first));
  build(dir);assert.equal((await readFile(`${dir}/dist/page/3/index.html`,'utf8')).match(/class="work-card" href="([^"]+)"/)[1],'../../works/order-and-chance/');
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('20 or fewer works render one page without page navigation, 21 adds a second page',async()=>{
 for(const [count,pages] of [[1,1],[20,1],[21,2]]){
  const dir=await site(count);
  try{
   build(dir);const html=await readFile(`${dir}/dist/index.html`,'utf8');
   assert.equal((html.match(/class="work-card"/g)||[]).length,Math.min(count,20));assert.equal(/class="pagination"/.test(html),pages>1);
   assert.equal((await readdir(`${dir}/dist`)).includes('page'),pages>1);
  }finally{await rm(dir,{recursive:true,force:true});}
 }
});

test('an empty gallery still builds a list, About and sitemap without assuming a first work',async()=>{
 const dir=await site(0);
 try{
  build(dir);const html=await readFile(`${dir}/dist/index.html`,'utf8');
  assert.match(html,/class="empty-state">作品はまだありません。/);assert.match(html,/00 WORKS/);assert.doesNotMatch(html,/class="pagination"|og:image/);
  assert.doesNotMatch(await readFile(`${dir}/dist/about/index.html`,'utf8'),/og:image|undefined/);assert.deepEqual(JSON.parse(await readFile(`${dir}/dist/catalog.json`)),[]);
  assert.match(await readFile(`${dir}/dist/sitemap.xml`,'utf8'),/<loc>https:\/\/example.org\/sub\/<\/loc>/);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('adding works at the same time, in the past or in parallel never renumbers existing works',async()=>{
 const original=await catalog(path.resolve('works')),dir=await site(original.length);
 try{
  const lissajous=original.find(m=>m.slug==='lissajous');
  // Two branches add works independently: one shares lissajous's addedAt and sorts before it, one predates everything.
  for(const [slug,addedAt,number]of [['aaa-same',lissajous.addedAt,201],['zz-past','2000-01-01T00:00:00Z',202]]){
   await cp('works/lissajous',`${dir}/works/${slug}`,{recursive:true});const file=`${dir}/works/${slug}/manifest.json`,m=JSON.parse(await readFile(file));
   Object.assign(m,{slug,addedAt,number});await writeFile(file,JSON.stringify(m));
  }
  build(dir);const list=JSON.parse(await readFile(`${dir}/dist/catalog.json`));
  for(const m of original){assert.equal(list.find(x=>x.slug===m.slug).number,m.number,m.slug);assert.match(await readFile(`${dir}/dist/works/${m.slug}/index.html`,'utf8'),new RegExp(`<p class="eyebrow">${String(m.number).padStart(3,'0')} / `));}
  const pages=(await Promise.all(['index.html','page/2/index.html'].map(f=>readFile(`${dir}/dist/${f}`,'utf8')))).join('');
  assert.match(pages,/href="(?:\.\.\/\.\.\/)?works\/lissajous\/"[^]*?<p class="eyebrow">003 \//);
  // A collision between two parallel additions fails the build instead of silently renumbering.
  const file=`${dir}/works/zz-past/manifest.json`,m=JSON.parse(await readFile(file));m.number=201;await writeFile(file,JSON.stringify(m));
  assert.throws(()=>execFileSync(process.execPath,[path.join(dir,'scripts/build.mjs')],{cwd:dir,env:{...process.env,SITE_URL:'https://example.org/sub/'},stdio:'pipe'}),/Duplicate number 201/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
