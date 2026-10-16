/* Behavioral and computed-style regression checks. Runs against dist on a Pages-like subpath. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const crypto=require('node:crypto');
const portableSVG=require('./svg-compat.cjs');
(async()=>{
 const root=path.resolve('dist'),catalog=JSON.parse(await fs.readFile(path.join(root,'catalog.json')));
 const prefix='/generative-art-gallery/';
 const server=http.createServer(async(req,res)=>{
  try{
   const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   if(!pathname.startsWith(prefix)){res.writeHead(404).end();return;}
   let file=path.resolve(root,pathname.slice(prefix.length));
   if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
   if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
   const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml'};
   res.setHeader('Content-Type',types[path.extname(file)]||'text/plain');res.end(await fs.readFile(file));
  }catch{res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}${prefix}`;
 const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 try{
  const page=await browser.newPage({acceptDownloads:true});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${new URL(r.url()).pathname}`);});
  const state=()=>page.evaluate(()=>({svg:document.querySelector('#art').innerHTML,settings:[...document.querySelector('form').elements].filter(e=>e.name).map(e=>[e.name,e.type==='radio'?e.checked:e.value])}));
  const settle=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  for(const width of [1440,375]){
   await page.setViewportSize({width,height:1000});
   for(const {slug} of catalog){
    const url=base+'works/'+slug+'/';
    for(const suffix of ['','index.html']){assert.equal((await page.goto(url+suffix)).status(),200);await page.locator('#art svg').waitFor();}
    const initial=await state();
    const metrics=await page.evaluate(()=>{
     const d=document.getElementById('download'),share=document.querySelector('.share-button'),a=document.getElementById('actions'),reset=a.querySelector('button[type=reset]'),box=d.getBoundingClientRect(),style=getComputedStyle(d);
     return {overflow:document.documentElement.scrollWidth>innerWidth,bg:style.backgroundColor,color:style.color,width:box.width,available:a.getBoundingClientRect().width,height:box.height,gap:box.top-reset.getBoundingClientRect().bottom,shareWidth:share.getBoundingClientRect().width};
    });
    assert.equal(metrics.overflow,false,slug+' horizontal overflow');assert.equal(metrics.bg,'rgb(64, 89, 68)',slug+' primary color');assert.equal(metrics.color,'rgb(255, 255, 255)');assert.ok(metrics.width>=metrics.available-1&&metrics.height>=44,slug+' full-width SVG');assert.ok(metrics.gap>=8,slug+' action spacing');assert.equal(metrics.shareWidth,metrics.width);
    const seed=page.locator('[name=seed]');assert.equal(await page.locator('#new-seed').count(),await seed.count(),slug+' seed action');
    const range=page.locator('input[type=range]:visible').first();const before=await range.inputValue();await range.focus();await page.keyboard.press('End');await settle();const max=await range.getAttribute('max');assert.equal(await range.inputValue(),max);assert.notEqual(await range.inputValue(),before);const key=await range.getAttribute('name');const output=page.locator('#'+key+'-value');assert.equal(parseFloat(await output.textContent()),slug==='truchet-tiles'?57:Number(max),slug+' output follows keyboard');await page.keyboard.press('Home');await settle();assert.equal(parseFloat(await output.textContent()),Number(await range.getAttribute('min')));
    const number=page.locator('input[type=number]').first();if(await number.count()){
     const min=await number.getAttribute('min'),max=await number.getAttribute('max');await number.fill(String(Number(max)+100));await number.press('Tab');await settle();assert.equal(await number.inputValue(),max,slug+' upper clamp');await number.fill(String(Number(min)-100));await number.press('Tab');await settle();assert.equal(await number.inputValue(),min,slug+' lower clamp');await number.fill('');await number.press('Tab');await settle();assert.notEqual(await number.inputValue(),'',slug+' empty fallback');
    }
    if(await page.locator('[data-control]').count()){
     for(const summary of await page.locator('.control-details summary:visible').all())await summary.click();
     assert.deepEqual(await page.locator('[data-control]').evaluateAll(fields=>fields.flatMap(f=>{const i=f.querySelector('input,select'),label=f.querySelector('label'),help=document.getElementById(i.getAttribute('aria-describedby'));return label?.htmlFor===i.id&&help?.textContent.trim()&&(!f.hidden||i.disabled)?[]:[i.name]})),[],slug+' labels/help/active contract');
    }
    if(slug==='hex-transitions'){
     await page.locator('#states').fill('2');await page.locator('#states').dispatchEvent('change');await settle();assert.equal(await page.locator('input[name^=w]:enabled').count(),4);assert.equal(await page.locator('input[name^=w]:disabled').count(),12);
     await page.locator('#states').fill('4');await page.locator('#states').dispatchEvent('change');assert.equal(await page.locator('input[name^=w]:enabled').count(),16);
     await page.locator('#w33').evaluate(e=>{e.value='23';e.dispatchEvent(new Event('input',{bubbles:true}));});await settle();
     await page.locator('#states').fill('2');await page.locator('#states').dispatchEvent('change');assert.equal(await page.locator('#w33').inputValue(),'23');assert.equal(await page.locator('#w33').isDisabled(),true);
    }
    if(slug==='probability-segments'){
     await page.locator('#directions').fill('2');await page.locator('#directions').dispatchEvent('change');await settle();assert.equal(await page.locator('input[name^=w]:not([name=width]):enabled').count(),2);
     assert.equal(await page.locator('input[name^=w]:disabled').count(),4);
     await page.locator('#directions').fill('6');await page.locator('#directions').dispatchEvent('change');assert.equal(await page.locator('input[name^=w]:not([name=width]):enabled').count(),6);
     await page.locator('#w5').evaluate(e=>{e.value='23';e.dispatchEvent(new Event('input',{bubbles:true}));});await settle();await page.locator('#directions').fill('2');await page.locator('#directions').dispatchEvent('change');assert.equal(await page.locator('#w5').inputValue(),'23');assert.equal(await page.locator('#w5').isDisabled(),true);
    }
    if(await seed.count()){const old=await seed.inputValue();await page.locator('#new-seed').click();assert.notEqual(await seed.inputValue(),old);}
    await page.getByRole('button',{name:'この絵を共有',exact:true}).click();const shared=await page.locator('textarea').inputValue();const expected=await state();assert.ok(shared.includes(prefix+'works/'+slug+'/')&&shared.includes('#art='));await page.goto(shared);await settle();assert.deepEqual(await state(),expected,slug+' share restores exact drawing and form');
    await page.locator('.skip').focus();await page.keyboard.press('Enter');await settle();assert.deepEqual(await state(),expected,slug+' skip link preserves drawing');
    const downloading=page.waitForEvent('download');await page.locator('#download').click();const download=await downloading;assert.equal(await download.failure(),null);const svg=await fs.readFile(await download.path(),'utf8');assert.match(svg,/<svg/);assert.match(svg,/<metadata>/);assert.ok(svg.includes(expected.svg.slice(0,30)),slug+' downloaded SVG');
    await page.getByRole('button',{name:'この絵を共有',exact:true}).click();await page.getByRole('button',{name:'リセット',exact:true}).click();await settle();assert.deepEqual(await state(),initial,slug+' resets all settings');assert.equal(await page.locator('textarea').inputValue(),'');assert.equal(await page.locator('.share-controls>label').isVisible(),false,slug+' hides stale share URL');
    await page.goto(url+'#art=%7B');await settle();assert.deepEqual(await state(),initial);assert.match(await page.locator('.share-controls>p').textContent(),/初期設定/);
    if(process.env.GALLERY_QA_DIR&&['recursive-regions','hex-transitions','probability-segments'].includes(slug)){await page.goto(url);await fs.mkdir(process.env.GALLERY_QA_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.GALLERY_QA_DIR,`after-${slug}-${width}.png`),fullPage:true});}
    console.log(`PASS ${width}px ${slug}: style, boundaries, keyboard, seed, share, SVG, reset`);
   }
  }
  // Archived URLs also work through the actual browser controls, including inactive weights.
  for(const f of JSON.parse(await fs.readFile('scripts/fixtures/all-works-v1.json'))){
   await page.goto(base+'works/'+f.slug+'/'+f.fragment);await settle();
   const downloadPromise=page.waitForEvent('download');await page.locator('#download').click();const d=await downloadPromise;const svg=await fs.readFile(await d.path(),'utf8');
   const withoutDeclaration=svg.replace(/^<\?xml[^>]*>\s*/,'');assert.equal(crypto.createHash('sha256').update(portableSVG(withoutDeclaration)).digest('hex'),f.svgPortableSha256,f.slug+' archived URL/download bytes');
  }
  await page.goto(base+'about/#terms');assert.equal(await page.locator('#terms').count(),1);assert.deepEqual(errors,[]);console.log('PASS 36 archived URLs/SVGs; About; zero script/network errors');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exit(1)});
