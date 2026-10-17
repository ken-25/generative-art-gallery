/* Behavioral and computed-style regression checks. Runs against dist on a Pages-like subpath. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const crypto=require('node:crypto');
const portableSVG=require('./svg-compat.cjs');
const comparePNG=require('./png-reference.cjs');
const {inspectControls,legacy}=require('./control-contract.cjs');
(async()=>{
 const root=path.resolve('dist'),catalog=JSON.parse(await fs.readFile(path.join(root,'catalog.json')));
 // List pages are newest first, 20 per page; artwork numbers stay chronological.
 const ordered=[...catalog].sort((a,b)=>b.addedAt.localeCompare(a.addedAt)||a.slug.localeCompare(b.slug));
 const listPages=Array.from({length:Math.max(1,Math.ceil(ordered.length/20))},(_,i)=>ordered.slice(i*20,i*20+20)),listRoutes=listPages.map((_,i)=>i?`page/${i+1}/`:'');
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
  await page.addInitScript(()=>{
   const toBlob=HTMLCanvasElement.prototype.toBlob;
   HTMLCanvasElement.prototype.toBlob=function(callback,...args){window.__pngConversions=(window.__pngConversions||0)+1;return toBlob.call(this,blob=>{if(window.__holdPNG)window.__releasePNG=()=>{window.__releasePNG=null;callback(blob);};else callback(blob);},...args);};
   Object.defineProperty(navigator,'userActivation',{value:{get isActive(){return window.__activation!==false;}}});
   window.open=(url,target,features)=>{window.__opened={url,target,features};return null;};
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copyCalls=(window.__copyCalls||0)+1;if(window.__copyHold)await new Promise(r=>window.__releaseCopy=r);if(window.__copyFail)throw Error('copy failed');window.__copied=text;}}});
   Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.__shareCalls=(window.__shareCalls||0)+1;window.__shareWasActive=navigator.userActivation.isActive;if(window.__shareHold)await new Promise(r=>window.__releaseShare=r);if(data.files)window.__sharedFile=data.files[0];if(window.__shareError)throw new DOMException('mock',window.__shareError);window.__shared={url:data.url,title:data.title,files:data.files?.map(f=>({name:f.name,type:f.type,size:f.size}))};}});
   Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>window.__canShare!==false});
  });
  await page.route(/googletagmanager\.com|google-analytics\.com/,route=>{errors.push('Unexpected live analytics');return route.abort();});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${new URL(r.url()).pathname}`);});
  const state=()=>page.evaluate(()=>({svg:document.querySelector('#art').innerHTML,settings:[...document.querySelector('form').elements].filter(e=>e.name).map(e=>[e.name,e.type==='radio'?e.checked:e.value])}));
  const settle=()=>page.evaluate(()=>new Promise(resolve=>{const wait=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>document.querySelector('#art[aria-busy=true]')?setTimeout(wait,10):resolve()));wait();}));
  const closeDialog=async()=>{if(await page.locator('#studio-dialog').evaluate(d=>d.open)){await page.locator('#dialog-close').click();await page.waitForFunction(()=>!document.getElementById('studio-dialog').open);await settle();}};
  const openDialog=async mode=>{const current=await page.locator('#studio-dialog').evaluate(d=>({open:d.open,mode:d.dataset.mode}));if(current.open&&current.mode!==mode)await closeDialog();if(!current.open||current.mode!==mode)await page.locator(mode==='save'?'#save-open':'#share-open').click();};
  const format=async value=>{await openDialog('save');if(await page.locator('#save-format').inputValue()!==value)await page.locator('#save-format').selectOption(value);};
  const exportFile=async(type='png',size='1600')=>{await format(type);if(type==='png'&&await page.locator('#png-size').inputValue()!==size)await page.locator('#png-size').selectOption(size);const waiting=page.waitForEvent('download');await page.locator('#download-file').click();const d=await waiting;assert.equal(await d.failure(),null);const bytes=await fs.readFile(await d.path());await closeDialog();return bytes;};
  const svgSnapshot=()=>page.locator('#art svg').evaluate(e=>new XMLSerializer().serializeToString(e));
  const verifyPixels=async(svg,bytes,label)=>{const r=await page.evaluate(comparePNG,{svg,png:bytes.toString('base64')});assert.ok(r.meanError<1,`${label}: pixel error ${r.meanError}`);assert.ok(r.inkError<4,`${label}: foreground error ${r.inkError}`);return r;};
  const contractFor=async slug=>legacy[slug]?{schema:false,fields:legacy[slug]}:page.evaluate(()=>{
   const G=window.StudyGenerator,fields={};if(!G||!window.StudyControls)throw Error('Missing schema');
   for(const key of new Set([...Object.keys(G.defaults),...Object.keys(G.schema)])){const rule=G.schema[key],ui=StudyControls.definition(G,key);fields[key]=key==='seed'?{type:'text'}:rule.options?{type:'select',options:Object.keys(rule.options)}:{type:ui.control,min:rule.min,max:rule.max,step:rule.step,output:true};Object.assign(fields[key],{label:ui.label,help:ui.help});}return {schema:true,fields};
  });
  const verifyContract=async slug=>{
   const contract=await contractFor(slug);assert.ok(Object.keys(contract.fields).length);
   assert.deepEqual(Object.keys(contract.fields).sort(),await page.evaluate(()=>Object.keys((window.StudyGenerator||window.ArtGenerator||window.TruchetGenerator||window.LissajousGenerator).defaults).sort()));
   assert.deepEqual(await page.evaluate(inspectControls,contract),[],slug+' complete form contract');
   const failures=await page.evaluate(({source,contract})=>{
    const inspect=(0,eval)('('+source+')'),form=document.getElementById('settings'),backup=form.cloneNode(true),failed=[];
    const probe=(name,change)=>{const copy=backup.cloneNode(true);form.replaceWith(copy);change(copy);if(!inspect(contract).length)failed.push(name);copy.replaceWith(form);};
    probe('zero inputs',f=>f.replaceChildren());if(contract.schema)probe('zero wrappers',f=>f.querySelectorAll('[data-control]').forEach(e=>e.removeAttribute('data-control')));
    for(const[key,rule]of Object.entries(contract.fields)){const get=f=>[...f.querySelectorAll('[name]')].find(e=>e.name===key);probe(key+' missing',f=>get(f).remove());probe(key+' type',f=>{const e=get(f);if(e.tagName==='INPUT')e.type=e.type==='text'?'number':'text';else{const t=document.createElement('textarea');for(const a of e.attributes)t.setAttribute(a.name,a.value);e.replaceWith(t);}});probe(key+' label',f=>{for(const l of [...get(f).labels])l.replaceWith(...l.childNodes);});probe(key+' help',f=>get(f).removeAttribute('aria-describedby'));if(rule.min!==undefined)for(const attr of ['min','max','step'])probe(key+attr,f=>get(f).setAttribute(attr,'99999'));if(rule.output){probe(key+' output',f=>f.querySelector('#'+key+'-value').remove());probe(key+' stale output',f=>f.querySelector('#'+key+'-value').textContent='99999');}}
    return failed;
   },{source:inspectControls.toString(),contract});assert.deepEqual(failures,[],slug+' catches missing/wrong fields');
  };
  for(const width of [1440,375]){
   await page.setViewportSize({width,height:1000});
   for(const {slug,url:canonical}of catalog){
    const url=base+'works/'+slug+'/';for(const suffix of ['','index.html']){assert.equal((await page.goto(url+suffix)).status(),200);await page.locator('#art svg').waitFor();await settle();}
    const initial=await state();await verifyContract(slug);
    assert.equal(await page.locator('#actions>button').count(),2);assert.deepEqual(await page.locator('#actions>button').allTextContents(),['保存','共有']);assert.equal(await page.locator('#actions input,#actions select,#actions textarea,#actions #new-seed,#actions button[type=reset]').count(),0);
    assert.equal(await page.locator('#studio-dialog').evaluate(d=>d.open),false);assert.equal(await page.locator('script[data-google-tag-id]').count(),0);
    const seed=page.locator('#settings [name=seed]');assert.equal(await page.locator('.generation-settings #new-seed').count(),await seed.count());if(await seed.count())assert.equal(await seed.evaluate(e=>!!e.closest('.generation-settings')),true);
    const metadata=await page.evaluate(()=>Object.fromEntries([...document.querySelectorAll('meta[property],meta[name],link[rel=canonical]')].map(e=>[e.getAttribute('property')||e.getAttribute('name')||'canonical',e.content||e.href])));assert.equal(metadata.canonical,canonical);assert.equal(metadata['og:url'],canonical);assert.equal(metadata['twitter:card'],'summary');assert.ok(metadata['og:image'].startsWith('https://'));
    assert.equal(await page.locator('a').evaluateAll(as=>as.some(a=>!a.getAttribute('href')?.startsWith('http')&&/\.md(?:#|$)/.test(a.getAttribute('href')||''))),false);
    const initialReference=await svgSnapshot(),initialPNG=await exportFile(),initialPixels=await verifyPixels(initialReference,initialPNG,slug+' default');assert.ok(initialPixels.ink>100);
    if(slug==='order-and-chance'&&width===1440){const blank=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=1600;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,1600,1600);return c.toDataURL().split(',')[1];});await assert.rejects(verifyPixels(initialReference,Buffer.from(blank,'base64'),'blank image'));}
    const range=page.locator('#settings input[type=range]:visible').first();await range.focus();await page.keyboard.press('End');await settle();const max=await range.getAttribute('max');assert.equal(await range.inputValue(),max);const key=await range.getAttribute('name');assert.equal(parseFloat(await page.locator('#'+key+'-value').textContent()),slug==='truchet-tiles'?57:Number(max));await page.keyboard.press('Home');await settle();assert.equal(await range.inputValue(),await range.getAttribute('min'));
    const number=page.locator('#settings input[type=number]').first();if(await number.count()){const min=await number.getAttribute('min'),max=await number.getAttribute('max');for(const[value,expected]of [[String(Number(max)+100),max],[String(Number(min)-100),min]]){await number.fill(value);await number.press('Tab');await settle();assert.equal(await number.inputValue(),expected);}await number.fill('');await number.press('Tab');await settle();assert.notEqual(await number.inputValue(),'');}
    if(slug==='hex-transitions'){await page.locator('#states').fill('4');await page.locator('#states').dispatchEvent('change');await page.locator('#w33').evaluate(e=>{e.value='23';e.dispatchEvent(new Event('input',{bubbles:true}));});await page.locator('#states').fill('2');await page.locator('#states').dispatchEvent('change');assert.equal(await page.locator('input[name^=w]:enabled').count(),4);assert.equal(await page.locator('#w33').inputValue(),'23');}
    if(slug==='probability-segments'){await page.locator('#directions').fill('6');await page.locator('#directions').dispatchEvent('change');await page.locator('#w5').evaluate(e=>{e.value='23';e.dispatchEvent(new Event('input',{bubbles:true}));});await page.locator('#directions').fill('2');await page.locator('#directions').dispatchEvent('change');assert.equal(await page.locator('input[name^=w]:not([name=width]):enabled').count(),2);assert.equal(await page.locator('#w5').inputValue(),'23');}
    if(await seed.count()){const before=await seed.inputValue();await page.locator('#new-seed').click();assert.notEqual(await seed.inputValue(),before);await seed.fill('日本語 & # / % " <>');await seed.dispatchEvent('change');await settle();}
    const expected=await state(),svg=(await exportFile('svg')).toString();assert.match(svg,/<metadata>/);await format('svg');await page.locator('#copy-svg').click();assert.equal(await page.evaluate(()=>window.__copied),svg);await closeDialog();
    const png=await exportFile();assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(Math.max(png.readUInt32BE(16),png.readUInt32BE(20)),1600);const pixels=await verifyPixels(svg,png,slug+' changed');assert.notEqual(pixels.pixelHash,initialPixels.pixelHash);
    const beforeOpen=await page.evaluate(()=>window.__copyCalls||0);await openDialog('share');assert.equal(await page.evaluate(()=>window.__copyCalls||0),beforeOpen,'opening never copies');const shared=await page.locator('#share-url').inputValue();await page.locator('#copy-link').click();assert.equal(await page.evaluate(()=>window.__copied),shared);
    if(await seed.count())assert.equal(JSON.parse(decodeURIComponent(new URL(shared).hash.slice(5))).settings.seed,'日本語 & # / % " <>');
    assert.equal(await page.locator('.social-links .external-link-note').count(),3);assert.equal(await page.getByRole('button',{name:/^X\s*（新しいタブ）/}).count(),1);
    for(const social of ['x','line','facebook']){assert.equal(await page.locator(`[data-social=${social}]`).getAttribute('title'),null);assert.ok(await page.locator(`[data-social=${social}] .external-link-note`).evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width<=1&&r.height<=1&&s.clipPath==='inset(50%)'&&s.position==='absolute';}));await page.locator(`[data-social=${social}]`).click();const opened=await page.evaluate(()=>window.__opened);assert.equal(new URL(opened.url).searchParams.get(social==='facebook'?'u':'url'),shared);assert.match(opened.features,/noopener,noreferrer/);}
    await page.locator('#share-native').click();assert.equal(await page.evaluate(()=>window.__shared.url),shared);await page.locator('#share-png').click();await page.waitForFunction(()=>document.getElementById('dialog-status').textContent==='PNGを共有しました。');assert.equal(await page.evaluate(()=>window.__shared.files[0].type),'image/png');
    await page.evaluate(()=>{window.__copyFail=true;});await page.locator('#copy-link').click();assert.match(await page.locator('#dialog-status').textContent(),/手動/);assert.equal(await page.locator('#share-url').evaluate(e=>e.selectionEnd-e.selectionStart),shared.length);
    await page.evaluate(()=>{window.__shareError='AbortError';});await page.locator('#share-native').click();assert.match(await page.locator('#dialog-status').textContent(),/キャンセル/);await page.evaluate(()=>{window.__shareError='NotAllowedError';});await page.locator('#share-png').click();await page.waitForFunction(()=>document.getElementById('dialog-status').textContent.includes('もう一度'));
    await page.evaluate(()=>{window.__shareError=null;window.__canShare=false;});await page.locator('#share-png').click();await page.waitForFunction(()=>document.getElementById('dialog-status').textContent.includes('対応していません'));await closeDialog();
    await page.goto(shared);await settle();assert.deepEqual(await state(),expected,slug+' v1 restore');await page.locator('.skip').focus();await page.keyboard.press('Enter');await settle();assert.deepEqual(await state(),expected,slug+' skip link');await page.getByRole('button',{name:'リセット',exact:true}).click();await settle();assert.deepEqual(await state(),initial,slug+' reset');
    await page.goto(url+'#art=%7B');await settle();assert.deepEqual(await state(),initial);assert.match(await page.locator('#status').textContent(),/初期設定/);
    console.log(`PASS ${width}px ${slug}: complete controls, seed/reset, modal SVG/code/PNG, pixel references, v1, clipboard/native fallbacks`);
   }
  }
  // Saving, copying or making a PNG while a heavy study is still computing waits for the chunked job
  // instead of recomputing synchronously, so the page never blocks for the whole simulation.
  {
   await page.setViewportSize({width:1440,height:1000});await page.goto(base+'works/reaction-diffusion/');await settle();
   await page.evaluate(()=>{window.__longest=0;new PerformanceObserver(list=>{for(const e of list.getEntries())window.__longest=Math.max(window.__longest,e.duration);}).observe({type:'longtask',buffered:false});});
   const heavy=async iterations=>{await closeDialog();await page.locator('#iterations').evaluate((e,v)=>{e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},iterations);await page.waitForFunction(()=>document.querySelector('#art[aria-busy=true]'));};
   const metadata=svg=>JSON.parse(svg.match(/<metadata>(.*?)<\/metadata>/)[1].replace(/&quot;/g,'"'));
   const shape=svg=>svg.match(/ d="([^"]*)"/)[1];let downloads=0;const count=()=>downloads++;page.on('download',count);
   // Closing the dialog while the save waits cancels it; the page stays responsive and nothing is saved.
   await heavy(4000);await format('svg');await page.locator('#download-file').click();
   assert.equal(await page.locator('#art').getAttribute('aria-busy'),'true','save requested mid-computation');assert.match(await page.locator('#dialog-status').textContent(),/計算を待っています/);
   await page.locator('#dialog-close').click();await page.waitForFunction(()=>!document.getElementById('studio-dialog').open);
   assert.equal(await page.locator('#art').getAttribute('aria-busy'),'true','dialog closes while computing');await settle();assert.equal(downloads,0);page.off('download',count);
   await heavy(3900);await format('svg');const waiting=page.waitForEvent('download');await page.locator('#download-file').click();const saved=(await fs.readFile(await (await waiting).path())).toString();
   assert.equal(metadata(saved).iterations,3900);assert.equal(shape(saved),shape(await svgSnapshot()));
   await heavy(3800);await format('svg');await page.locator('#copy-svg').click();await page.waitForFunction(()=>window.__copied?.includes('&quot;iterations&quot;:3800'));
   assert.equal(shape(await page.evaluate(()=>window.__copied)),shape(await svgSnapshot()));
   await heavy(3700);const png=await exportFile();assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');await verifyPixels(await svgSnapshot(),png,'PNG requested mid-computation');
   assert.equal(metadata(await svgSnapshot()).iterations,3700);
   // The PNG size and settings are fixed when the save is clicked, even if the dialog changes while waiting.
   await heavy(3600);await format('png');await page.locator('#png-size').selectOption('1600');let pngWait=page.waitForEvent('download');await page.locator('#download-file').click();
   assert.equal(await page.locator('#art').getAttribute('aria-busy'),'true');await page.locator('#png-size').selectOption('2400');
   const sized=await fs.readFile(await (await pngWait).path());assert.equal(Math.max(sized.readUInt32BE(16),sized.readUInt32BE(20)),1600,'size chosen at click');await closeDialog();
   // Changing the drawing while the save waits cancels it rather than saving different settings.
   downloads=0;page.on('download',count);await heavy(3500);await format('svg');await page.locator('#download-file').click();
   await page.locator('#iterations').evaluate(e=>{e.value='3400';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});
   await page.waitForFunction(()=>/設定が変わった/.test(document.getElementById('dialog-status').textContent));await settle();assert.equal(downloads,0);page.off('download',count);await closeDialog();
   const longest=await page.evaluate(()=>window.__longest);assert.ok(longest<400,'longest main-thread task '+longest+'ms');
   console.log(`PASS save/copy/PNG during chunked computation wait for the job; longest task ${Math.round(longest)}ms`);
  }
  console.log(`PASS ${catalog.length*4} independent SVG/PNG pixel comparisons`);
  // Dialog lifecycle at desktop, short portrait, and landscape sizes.
  for(const [width,height]of [[1440,1000],[320,568],[375,667],[667,375]]){
   await page.setViewportSize({width,height});await page.goto(base+'works/order-and-chance/');await settle();const drawing=await state();
   for(const mode of ['save','share']){
    const entry=mode==='save'?'save-open':'share-open';await page.locator('#'+entry).focus();await settle();const scrollBefore=await page.evaluate(()=>scrollY);const calls=await page.evaluate(()=>window.__copyCalls||0);await openDialog(mode);
    assert.equal(await page.locator('dialog[open]').count(),1);assert.equal(await page.evaluate(()=>window.__copyCalls||0),calls);assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'hidden');
    const bounds=await page.locator('dialog[open]').evaluate(d=>({r:d.getBoundingClientRect().toJSON(),h:innerHeight,w:innerWidth}));assert.ok(bounds.r.left>=-1&&bounds.r.right<=bounds.w+1&&bounds.r.top>=-1&&bounds.r.bottom<=bounds.h+1);
    if(process.env.GALLERY_QA_DIR){await fs.mkdir(process.env.GALLERY_QA_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.GALLERY_QA_DIR,`${mode}-${width}x${height}.png`)});}
    const ids=await page.locator('dialog[open]').evaluate(d=>[...d.querySelectorAll('button,select,textarea')].filter(e=>!e.disabled&&e.getClientRects().length).map(e=>e.id));
    await page.locator('#'+ids.at(-1)).focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),ids[0]);await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),ids.at(-1));
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.getElementById('studio-dialog').open);await settle();assert.equal(await page.evaluate(()=>document.activeElement.id),entry);assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'');assert.equal(await page.evaluate(()=>document.body.style.overflow),'');assert.deepEqual(await state(),drawing);assert.equal(await page.evaluate(()=>scrollY),scrollBefore);
    await openDialog(mode);await page.mouse.click(3,3);await page.waitForFunction(()=>!document.getElementById('studio-dialog').open);await settle();assert.equal(await page.evaluate(()=>document.activeElement.id),entry);
    await openDialog(mode);await page.evaluate(()=>{document.getElementById('dialog-close').click();document.getElementById('share-open').click();});assert.equal(await page.locator('dialog[open]').count(),1);assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'hidden');await closeDialog();assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'');
   }
   await format('svg');await page.evaluate(()=>{window.__copyFail=true;});await page.locator('#copy-svg').click();assert.equal(await page.locator('#svg-code-label').isVisible(),true);assert.match(await page.locator('#svg-code').inputValue(),/<svg/);assert.match(await page.locator('#dialog-status').textContent(),/手動/);await closeDialog();
   await page.evaluate(()=>{window.__copyFail=false;window.__copyHold=true;});await openDialog('share');await page.locator('#copy-link').click();await page.waitForFunction(()=>typeof window.__releaseCopy==='function');await closeDialog();await openDialog('save');await page.evaluate(()=>{window.__copyHold=false;window.__releaseCopy();});await settle();assert.equal(await page.locator('#dialog-status').textContent(),'');assert.equal(await page.evaluate(()=>document.activeElement.id),'dialog-close');await closeDialog();
  }
  // Delayed rasterization, expired activation, and reopening preserve the prepared File.
  await page.setViewportSize({width:375,height:667});const probability=base+'works/probability-segments/';await page.goto(probability);await openDialog('share');
  await page.evaluate(()=>{window.__holdPNG=true;});await page.locator('#share-png').click();await page.waitForFunction(()=>typeof window.__releasePNG==='function');assert.equal(await page.evaluate(()=>window.__pngConversions),1);await page.evaluate(()=>{for(let i=0;i<8;i++)document.getElementById('share-png').click();});assert.equal(await page.evaluate(()=>window.__pngConversions),1);
  await page.evaluate(()=>{window.__activation=false;window.__holdPNG=false;window.__releasePNG();});await page.waitForFunction(()=>document.getElementById('dialog-status').textContent.includes('もう一度'));assert.equal(await page.evaluate(()=>window.__shareCalls||0),0);
  await closeDialog();await openDialog('share');await page.evaluate(()=>{window.__activation=true;});await page.locator('#share-png').click();await page.waitForFunction(()=>document.getElementById('dialog-status').textContent==='PNGを共有しました。');assert.equal(await page.evaluate(()=>window.__pngConversions),1);assert.equal(await page.evaluate(()=>window.__shareWasActive),true);
  await page.evaluate(()=>{window.__previousFile=window.__sharedFile;window.__shareError='AbortError';});await page.locator('#share-png').click();await page.waitForFunction(()=>document.getElementById('dialog-status').textContent.includes('キャンセル'));assert.equal(await page.evaluate(()=>window.__sharedFile===window.__previousFile),true);
  await page.evaluate(()=>{window.__shareError=null;window.__canShare=false;});await page.locator('#share-png').click();await page.waitForFunction(()=>document.getElementById('dialog-status').textContent.includes('対応していません'));await closeDialog();const fallback=await exportFile();assert.equal(await page.evaluate(()=>window.__pngConversions),1);assert.equal(fallback.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  await page.locator('#mean').fill('19');await page.locator('#mean').dispatchEvent('change');await openDialog('share');await page.evaluate(()=>{window.__canShare=true;});await page.locator('#share-png').click();await page.waitForFunction(()=>document.getElementById('dialog-status').textContent==='PNGを共有しました。');assert.equal(await page.evaluate(()=>window.__pngConversions),2);assert.equal(await page.evaluate(()=>window.__sharedFile===window.__previousFile),false);
  await closeDialog();await format('png');await page.locator('#png-size').selectOption('2400');await closeDialog();await openDialog('share');await page.locator('#share-png').click();await page.waitForFunction(()=>document.getElementById('dialog-status').textContent==='PNGを共有しました。');assert.equal(await page.evaluate(()=>window.__pngConversions),3);await closeDialog();
  // Closing a pending download cancels its side effect; reopening never starts it automatically.
  await page.goto(probability);await format('png');let downloads=0;const countDownload=()=>downloads++;page.on('download',countDownload);await page.evaluate(()=>{window.__holdPNG=true;});await page.locator('#download-file').click();await page.waitForFunction(()=>typeof window.__releasePNG==='function');await closeDialog();await openDialog('share');
  await page.evaluate(()=>{window.__holdPNG=false;window.__releasePNG();});await page.waitForFunction(()=>!document.getElementById('share-png').disabled);assert.equal(downloads,0);assert.equal(await page.evaluate(()=>window.__shareCalls||0),0);await page.locator('#share-png').click();await page.waitForFunction(()=>document.getElementById('dialog-status').textContent==='PNGを共有しました。');assert.equal(await page.evaluate(()=>window.__pngConversions),1);await closeDialog();
  // An in-progress export keeps the clicked SVG/size, while edits invalidate the future cache.
  await page.goto(probability);const clickedSVG=await svgSnapshot();await format('png');await page.evaluate(()=>{window.__holdPNG=true;});const waiting=page.waitForEvent('download');await page.locator('#download-file').click();await page.waitForFunction(()=>typeof window.__releasePNG==='function');
  await page.evaluate(()=>{const d=document.getElementById('directions');d.value='2';d.dispatchEvent(new Event('change',{bubbles:true}));const size=document.getElementById('png-size');size.value='2400';size.dispatchEvent(new Event('change',{bubbles:true}));});await settle();const currentSVG=await svgSnapshot();assert.notEqual(clickedSVG,currentSVG);await page.evaluate(()=>{window.__holdPNG=false;window.__releasePNG();});const pending=await waiting,oldBytes=await fs.readFile(await pending.path());assert.equal(Math.max(oldBytes.readUInt32BE(16),oldBytes.readUInt32BE(20)),1600);await verifyPixels(clickedSVG,oldBytes,'click-time snapshot');await closeDialog();const currentBytes=await exportFile('png','2400');assert.equal(Math.max(currentBytes.readUInt32BE(16),currentBytes.readUInt32BE(20)),2400);await verifyPixels(currentSVG,currentBytes,'new settings');page.off('download',countDownload);
  // Close + edit + reopen while conversion is pending must not reuse the stale File.
  await page.goto(probability);await openDialog('share');await page.evaluate(()=>{window.__holdPNG=true;});await page.locator('#share-png').click();await page.waitForFunction(()=>typeof window.__releasePNG==='function');await closeDialog();await page.locator('#mean').fill('20');await page.locator('#mean').dispatchEvent('change');await openDialog('share');await page.evaluate(()=>{window.__holdPNG=false;window.__releasePNG();});await page.waitForFunction(()=>!document.getElementById('share-png').disabled);assert.equal(await page.locator('#share-png').textContent(),'現在のPNGを共有');assert.equal(await page.evaluate(()=>window.__shareCalls||0),0);await page.locator('#share-png').click();await page.waitForFunction(()=>document.getElementById('dialog-status').textContent==='PNGを共有しました。');assert.equal(await page.evaluate(()=>window.__pngConversions),2);await closeDialog();
  // Native sharing also rejects duplicate taps, and late completion stays in its original session.
  await page.goto(probability);await openDialog('share');await page.evaluate(()=>{window.__shareHold=true;for(let i=0;i<8;i++)document.getElementById('share-native').click();});await page.waitForFunction(()=>typeof window.__releaseShare==='function');assert.equal(await page.evaluate(()=>window.__shareCalls),1);await closeDialog();await openDialog('save');await page.evaluate(()=>{window.__shareHold=false;window.__releaseShare();});await page.waitForFunction(()=>!document.getElementById('download-file').disabled);assert.doesNotMatch(await page.locator('#dialog-status').textContent(),/リンクを共有しました/);await closeDialog();
  // Missing clipboard, share, and canShare APIs retain manual copy and download routes.
  await page.goto(probability);await page.evaluate(()=>{for(const key of ['clipboard','share','canShare'])Object.defineProperty(navigator,key,{configurable:true,value:undefined});});await openDialog('share');await page.locator('#copy-link').click();assert.match(await page.locator('#dialog-status').textContent(),/手動/);await page.locator('#share-png').click();await page.waitForFunction(()=>document.getElementById('dialog-status').textContent.includes('対応していません'));await closeDialog();assert.equal((await exportFile()).subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  console.log('PASS modal Escape/backdrop/close/focus/Tab/scroll, copy fallback, delayed clipboard, activation retry, interrupted download/reopen/settings snapshot');
  // The generated link policy works without JavaScript, including a real blank-target popup.
  const linksContext=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:667}});
  await linksContext.route('https://github.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>External destination fixture</title><p>Fixture</p>'}));
  const linksPage=await linksContext.newPage();
  try{
   let checked=0;
   for(const route of [...listRoutes, 'about/', ...catalog.map(m=>'works/'+m.slug+'/')]){
    await linksPage.goto(base+route);
    const rows=await linksPage.locator('a[href]').evaluateAll(as=>{const canonical=document.querySelector('link[rel=canonical]').href,site=new URL('/generative-art-gallery/','https://ken-25.github.io');return as.map(a=>{const u=new URL(a.getAttribute('href'),canonical);return {external:!a.hasAttribute('download')&&['http:','https:'].includes(u.protocol)&&(u.origin!==site.origin||!(u.pathname===site.pathname.slice(0,-1)||u.pathname.startsWith(site.pathname))),target:a.getAttribute('target'),rel:a.rel.split(/\s+/),note:a.querySelector('.external-link-note')?.textContent,clipped:!!a.querySelector('.external-link-note')&&getComputedStyle(a.querySelector('.external-link-note')).clipPath==='inset(50%)'&&a.querySelector('.external-link-note').getBoundingClientRect().width<=1,title:a.title};});});
    for(const a of rows){if(a.external){assert.equal(a.target,'_blank');assert.ok(a.rel.includes('noopener')&&a.rel.includes('noreferrer'));assert.equal(a.note,'（新しいタブ）');assert.ok(a.clipped);assert.doesNotMatch(a.title,/新しいタブ/);checked++;}else{assert.equal(a.target,null);assert.equal(a.note,undefined);}}
    assert.equal(await linksPage.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   }
   await linksPage.goto(base);const previous=linksPage.url();const opened=linksContext.waitForEvent('page');await linksPage.getByRole('link',{name:/おすすめ設定・配色を提案.*新しいタブ/}).click();const popup=await opened;await popup.waitForLoadState('domcontentloaded');assert.equal(await popup.evaluate(()=>window.opener),null);assert.equal(linksPage.url(),previous);assert.match(popup.url(),/^https:\/\/github.com\//);await popup.close();await linksPage.locator('.work-card').first().click();assert.ok(linksPage.url().startsWith(base+'works/'));assert.equal(linksContext.pages().length,1);
   console.log(`PASS ${checked} external anchors across home/About/all works without JavaScript; secure real new tab, visually hidden accessible notice, internal same-tab navigation`);
  }finally{await linksContext.close();}
  // Static unclassified list stays usable without page JavaScript.
  const home=await browser.newPage({javaScriptEnabled:false,viewport:{width:375,height:667}});
  try{
   await home.goto(base);
   for(const [index,items]of listPages.entries()){
    const route=listRoutes[index];if(index){assert.equal((await home.goto(base+route)).status(),200);assert.equal((await home.reload()).status(),200);}
    assert.equal(home.url(),base+route);assert.equal(await home.locator('.theme-nav,.theme-section').count(),0);assert.equal(await home.locator('a.work-card').count(),items.length);
    assert.equal(await home.locator('link[rel=canonical]').getAttribute('href'),new URL(route,'https://ken-25.github.io/generative-art-gallery/').href);assert.equal(await home.evaluate(()=>getComputedStyle(document.querySelector('.work-card')).display),'grid','stylesheet on '+route);
    for(const [i,m]of items.entries()){const card=home.locator('a.work-card').nth(i);assert.equal(new URL(await card.getAttribute('href'),home.url()).href,base+`works/${m.slug}/`);assert.match(await card.locator('.eyebrow').textContent(),new RegExp('^'+String(m.number).padStart(3,'0')+' /'));assert.equal(await card.locator('img').getAttribute('loading'),i?'lazy':null);await card.locator('img').scrollIntoViewIfNeeded();await card.locator('img').evaluate(i=>i.decode());}
    for(const link of ['.brand','header a[href$="about/"]']){const href=await home.locator(link).first().getAttribute('href');assert.equal((await home.request.get(new URL(href,home.url()).href)).status(),200,route+' '+link);}
    const nav=home.locator('nav.pagination');assert.equal(await nav.count(),listPages.length>1?1:0);
    if(listPages.length>1){assert.equal(await nav.locator('[aria-current=page]').textContent(),String(index+1));assert.equal(await nav.locator('[rel=prev]').count(),index?1:0);assert.equal(await nav.locator('[rel=next]').count(),index<listPages.length-1?1:0);for(const a of await nav.locator('a').all())assert.ok(listRoutes.map(r=>base+r).includes(new URL(await a.getAttribute('href'),home.url()).href));}
    assert.equal(await home.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    if(index<listPages.length-1){await nav.locator('[rel=next]').focus();await home.keyboard.press('Enter');await home.waitForURL(base+listRoutes[index+1]);await home.goBack();}
   }
   assert.deepEqual(listPages.flat().map(m=>m.slug).sort(),catalog.map(m=>m.slug).sort());
  }finally{await home.close();}
  for(const [width,height]of [[320,568],[375,667],[667,375],[844,390]]){
   await page.setViewportSize({width,height});for(const {slug}of catalog){await page.goto(base+'works/'+slug+'/');for(const selector of ['#settings input[type=range]:visible','#settings input[type=text]:visible','#save-open']){const control=page.locator(selector).first();if(!await control.count())continue;await control.focus();await settle();const r=await control.evaluate(e=>{const p=document.querySelector('.paper-area').getBoundingClientRect(),f=e.getBoundingClientRect();return {p:p.toJSON(),f:f.toJSON(),h:visualViewport.height,overflow:document.documentElement.scrollWidth>innerWidth,nested:[document.querySelector('.studio'),document.querySelector('.controls')].some(n=>['auto','scroll'].includes(getComputedStyle(n).overflowY)&&n.scrollHeight>n.clientHeight+1)};});assert.equal(r.overflow,false);assert.equal(r.nested,false);assert.ok(r.p.height<=r.h*.4+1);assert.ok(r.f.top>=r.p.bottom+8&&r.f.bottom<=r.h-8,`${slug} ${width}x${height} ${selector}`);}}
  }
  for(const f of JSON.parse(await fs.readFile('scripts/fixtures/all-works-v1.json'))){await page.goto(base+'works/'+f.slug+'/'+f.fragment);await settle();const svg=(await exportFile('svg')).toString().replace(/^<\?xml[^>]*>\s*/,'');assert.equal(crypto.createHash('sha256').update(portableSVG(svg)).digest('hex'),f.svgPortableSha256,f.slug+' archived SVG');}
  await page.goto(base+'about/#terms');assert.equal(await page.locator('#measurement').count(),0);assert.doesNotMatch(await page.locator('body').innerText(),/集計しています|明示的に有効化/);assert.equal(await page.locator('a').evaluateAll(as=>as.some(a=>!a.getAttribute('href')?.startsWith('http')&&/\.md(?:#|$)/.test(a.getAttribute('href')||''))),false);assert.deepEqual(errors,[]);
  console.log(`PASS flat no-JS list/${catalog.length} previews on ${listPages.length} page(s), 4 mobile sizes, ${JSON.parse(await fs.readFile('scripts/fixtures/all-works-v1.json')).length} archived SVGs, reader copy and analytics-off notice; zero JS/network errors`);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exit(1)});
