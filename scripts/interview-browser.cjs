const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),crypto=require('node:crypto');
const {startPreview}=require('./interview-preview.cjs');
(async()=>{
 const {server,url}=await startPreview(),output='evidence/interview';await fs.mkdir(output,{recursive:true});let browser;
 try{
  browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({acceptDownloads:true}),errors=[],external=[];
  await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname==='127.0.0.1'||u.protocol==='data:'||u.protocol==='blob:')return route.continue();external.push(u.origin);return route.abort();});
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+new URL(r.url()).pathname);});
  await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copied=text;}}}));
  const ready=()=>page.waitForFunction(()=>window.interview&&document.querySelector('#question'));
  const state=()=>page.evaluate(()=>window.interview.state);
  const recipe=()=>page.evaluate(()=>window.interview.recipe);
  const downloaded=async label=>{const wait=page.waitForEvent('download');await page.getByRole('button',{name:label,exact:true}).click();const d=await wait;assert.equal(await d.failure(),null);return fs.readFile(await d.path());};
  for(const width of [1440,375]){
   await page.setViewportSize({width,height:width===375?900:1050});await page.goto(url);await ready();
   assert.equal(await page.locator('.candidate').count(),3);assert.equal(await page.locator('canvas').count(),0);
   await page.locator('.candidate img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
   assert.equal(await page.locator('.candidate img').evaluateAll(imgs=>new Set(imgs.map(i=>i.src)).size),3);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.screenshot({path:`${output}/choose-${width}.png`,fullPage:true});
   await page.locator('[data-candidate="1"]').click();assert.equal((await recipe()).step,1);
   await page.locator('.interview-view').focus();const before=await page.evaluate(()=>interview.camera);await page.keyboard.press('ArrowLeft');const rotated=await page.evaluate(()=>interview.camera);assert.notDeepEqual(rotated,before);
   await page.locator('[data-lock=amount]').click();assert.equal(await page.locator('[data-lock=amount]').evaluate(e=>e===document.activeElement),true);assert.deepEqual(await page.evaluate(()=>interview.camera),rotated);
   await page.locator('[data-lock=spread]').click();const base=await state();await page.screenshot({path:`${output}/hold-${width}.png`,fullPage:true});
   await page.getByRole('button',{name:'次の候補を見る',exact:true}).click();assert.equal((await recipe()).step,2);
   const candidates=await page.evaluate(()=>interview.candidates);for(const c of candidates){assert.equal(c.amount,base.amount);assert.equal(c.spread,base.spread);}
   await page.locator('.candidate img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));await page.screenshot({path:`${output}/refine-${width}.png`,fullPage:true});
   await page.getByRole('button',{name:'別の候補を見る',exact:true}).click();assert.equal((await recipe()).round,1);assert.notDeepEqual(await page.evaluate(()=>interview.candidates),candidates);
   await page.locator('[data-candidate="2"]').click();const selected=await state(),chosen=await recipe();assert.equal(chosen.step,3);assert.deepEqual(chosen.locks,['amount','spread']);await page.locator('.skip').focus();await page.keyboard.press('Enter');assert.deepEqual(await recipe(),chosen);await page.evaluate(()=>document.activeElement.blur());
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:`${output}/finish-${width}.png`,fullPage:true});
   const json=await downloaded('レシピを保存');assert.deepEqual(JSON.parse(json),chosen);await fs.writeFile(`${output}/recipe-${width}.json`,json);
   const stl=await downloaded('STLを保存');assert.equal(stl.length,84+50*stl.readUInt32LE(80));assert.ok(stl.readUInt32LE(80)>0);await fs.writeFile(`${output}/shape-${width}.stl`,stl);
   await page.getByRole('button',{name:'リンクをコピー',exact:true}).click();const shared=await page.evaluate(()=>window.copied);assert.equal(new URL(shared).origin,new URL(url).origin);assert.ok(new URL(shared).hash.startsWith('#recipe='));
   await page.goto(shared);await ready();assert.deepEqual(await recipe(),chosen);assert.deepEqual(await state(),selected);assert.deepEqual(await downloaded('STLを保存'),stl);
   // Importing a local recipe is local-only, and malformed imports leave the previous state intact.
   await page.locator('#recipe-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{')});await page.waitForFunction(()=>document.getElementById('status').textContent.includes('形式'));assert.deepEqual(await recipe(),chosen);
   await page.locator('#recipe-file').setInputFiles({name:'recipe.json',mimeType:'application/json',buffer:json});await page.waitForFunction(()=>document.getElementById('status').textContent.includes('読み込み'));assert.deepEqual(await recipe(),chosen);
   await page.getByRole('link',{name:'作品ページで仕上げる',exact:true}).click();await page.waitForFunction(()=>window.sculpture&&sculpture.validate()>0);assert.deepEqual(await page.evaluate(()=>sculpture.state),selected);
   await page.locator('#save-open').click();await page.locator('#save-format').selectOption('stl');const wait=page.waitForEvent('download');await page.locator('#download-file').click();const exported=await wait;assert.deepEqual(await fs.readFile(await exported.path()),stl,'same STL as the existing detail exporter');
   await page.goto(shared);await ready();await page.getByRole('button',{name:'候補へ戻る',exact:true}).click();assert.equal((await recipe()).choice,2);await page.getByRole('button',{name:'特徴を選び直す',exact:true}).click();assert.equal((await recipe()).choice,null);assert.equal((await recipe()).step,1);
   await page.locator('[data-lock=color]').click();assert.deepEqual((await recipe()).locks,['amount','spread','color']);await page.getByRole('button',{name:'次の候補を見る',exact:true}).click();for(const c of await page.evaluate(()=>interview.candidates)){assert.equal(c.color,base.color);assert.equal(c.amount,base.amount);assert.equal(c.spread,base.spread);}
   await page.getByRole('button',{name:'特徴を選び直す',exact:true}).click();await page.getByRole('button',{name:'最初の形へ',exact:true}).click();await page.locator('[data-candidate="0"]').click();assert.deepEqual((await recipe()).locks,[]);assert.equal((await recipe()).round,0);
   // The keyboard reaches the real candidate buttons without a pointer.
   await page.getByRole('button',{name:'最初の形へ',exact:true}).click();await page.locator('[data-candidate="2"]').focus();await page.keyboard.press('Enter');assert.equal((await recipe()).first,2);
   console.log(`PASS ${width}px: visual choices, locked features, back/reselect, camera keyboard, recipe file/hash/seed replay, same STL as existing detail, no overflow`);
  }
  const beforeBad=await recipe();await page.goto(url+'#recipe=%zz');await page.waitForFunction(()=>document.getElementById('status').textContent.includes('リンク'));assert.deepEqual(await recipe(),beforeBad);await page.goto('about:blank');await page.goto(url+'#recipe=%zz');await ready();assert.ok((await page.locator('#status').textContent()).includes('リンク'));assert.equal((await recipe()).step,0);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('PASS invalid recipe fallback; zero page/network errors and zero external requests');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
