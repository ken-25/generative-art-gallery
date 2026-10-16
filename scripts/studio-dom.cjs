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
   Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{if(window.__copyFail)throw Error('copy failed');window.__copied=text;}}});
   Object.defineProperty(navigator,'share',{value:async data=>{window.__shareCalls=(window.__shareCalls||0)+1;window.__shareWasActive=navigator.userActivation.isActive;if(data.files)window.__sharedFile=data.files[0];if(window.__shareError)throw new DOMException('mock',window.__shareError);window.__shared={url:data.url,title:data.title,files:data.files?.map(f=>({name:f.name,type:f.type,size:f.size}))};}});
   Object.defineProperty(navigator,'canShare',{value:()=>window.__canShare!==false});
  });
  await page.route(/googletagmanager\.com|google-analytics\.com/,route=>{errors.push('Unexpected live analytics');return route.abort();});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${new URL(r.url()).pathname}`);});
  const state=()=>page.evaluate(()=>({svg:document.querySelector('#art').innerHTML,settings:[...document.querySelector('form').elements].filter(e=>e.name).map(e=>[e.name,e.type==='radio'?e.checked:e.value])}));
  const settle=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const exportPNG=async()=>{const waiting=page.waitForEvent('download');await page.locator('#download-png').click();const d=await waiting;assert.equal(await d.failure(),null);return fs.readFile(await d.path());};
  const svgSnapshot=()=>page.locator('#art svg').evaluate(e=>new XMLSerializer().serializeToString(e));
  const verifyPixels=async(svg,bytes,label)=>{const result=await page.evaluate(comparePNG,{svg,png:bytes.toString('base64')});assert.ok(result.meanError<1,`${label}: overall pixel error ${result.meanError}`);assert.ok(result.inkError<4,`${label}: foreground pixel error ${result.inkError}`);return result;};

  for(const width of [1440,375]){
   await page.setViewportSize({width,height:1000});
   for(const {slug} of catalog){
    const url=base+'works/'+slug+'/';
    for(const suffix of ['','index.html']){assert.equal((await page.goto(url+suffix)).status(),200);await page.locator('#art svg').waitFor();}
    const initial=await state();
    const initialReference=await svgSnapshot(),initialPNG=await exportPNG();const initialPixels=await verifyPixels(initialReference,initialPNG,slug+' default SVG/PNG');assert.ok(initialPixels.ink>100,slug+' nonempty default drawing');
    if(slug==='order-and-chance'&&width===1440){const blank=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1600;c.height=1600;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);return c.toDataURL().split(',')[1];});await assert.rejects(verifyPixels(initialReference,Buffer.from(blank,'base64'),'blank PNG must fail'));}

    assert.equal(await page.locator('script[data-google-tag-id]').count(),0,'default build has no live analytics');
    const metadata=await page.evaluate(()=>Object.fromEntries([...document.querySelectorAll('meta[property],meta[name],link[rel=canonical]')].map(e=>[e.getAttribute('property')||e.getAttribute('name')||'canonical',e.content||e.href])));
    assert.equal(metadata['twitter:card'],'summary');assert.equal(metadata['og:url'],catalog.find(m=>m.slug===slug).url);assert.equal(metadata.canonical,metadata['og:url']);assert.ok(metadata['og:image'].startsWith('https://'));assert.ok(metadata['twitter:image:alt']);assert.ok(Number(metadata['og:image:width'])>0&&Number(metadata['og:image:height'])>0);

    const contract=legacy[slug]?{schema:false,fields:legacy[slug]}:await page.evaluate(()=>{
     const G=window.StudyGenerator;if(!G||!window.StudyControls)throw Error('Missing schema generator or definitions');
     const fields={};
     for(const key of new Set([...Object.keys(G.defaults),...Object.keys(G.schema)])){
      const rule=G.schema[key],ui=StudyControls.definition(G,key);
      fields[key]=key==='seed'?{type:'text'}:rule.options?{type:'select',options:Object.keys(rule.options)}:{type:ui.control,min:rule.min,max:rule.max,step:rule.step,output:true};
      fields[key].label=ui.label;fields[key].help=ui.help;
     }
     return {schema:true,fields};
    });
    assert.ok(Object.keys(contract.fields).length,slug+' nonempty expected contract');
    const generatorKeys=await page.evaluate(()=>Object.keys((window.StudyGenerator||window.ArtGenerator||window.TruchetGenerator||window.LissajousGenerator).defaults).sort());
    assert.deepEqual(Object.keys(contract.fields).sort(),generatorKeys,slug+' contract covers every generator key');
    assert.deepEqual(await page.evaluate(inspectControls,contract),[],slug+' complete control contract');
    // Mutation checks prove the browser audit fails on absent panels/fields,
    // incorrect widget types, limits, steps, labels, explanations and outputs.
    const mutationFailures=await page.evaluate(({source,contract})=>{
     const inspect=(0,eval)('('+source+')'),form=document.getElementById('settings'),backup=form.cloneNode(true),failures=[];
     const probe=(name,mutate)=>{const copy=backup.cloneNode(true);form.replaceWith(copy);mutate(copy);if(!inspect(contract).length)failures.push(name);copy.replaceWith(form);};
     probe('zero controls',f=>f.replaceChildren());
     if(contract.schema)probe('zero schema wrappers',f=>f.querySelectorAll('[data-control]').forEach(e=>e.removeAttribute('data-control')));
     for(const [key,rule] of Object.entries(contract.fields)){
      const get=f=>[...f.querySelectorAll('[name]')].find(e=>e.name===key);
      probe(key+' missing',f=>get(f).remove());
      probe(key+' type',f=>{const input=get(f);if(input.tagName==='INPUT')input.type=input.type==='text'?'number':'text';else{const replacement=document.createElement('textarea');for(const a of input.attributes)replacement.setAttribute(a.name,a.value);input.replaceWith(replacement);}});
      probe(key+' label',f=>{for(const l of [...get(f).labels])l.replaceWith(...l.childNodes);});
      probe(key+' help',f=>get(f).removeAttribute('aria-describedby'));
      if(rule.min!==undefined)for(const attr of ['min','max','step'])probe(key+' '+attr,f=>get(f).setAttribute(attr,'99999'));
      if(rule.output){probe(key+' output',f=>f.querySelector('#'+key+'-value').remove());probe(key+' stale output',f=>f.querySelector('#'+key+'-value').textContent='99999');}
     }
     return failures;
    },{source:inspectControls.toString(),contract});
    assert.deepEqual(mutationFailures,[],slug+' rejects malformed controls');

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
    const pngWaiting=page.waitForEvent('download');await page.locator('#download-png').click();const pngDownload=await pngWaiting;assert.equal(await pngDownload.failure(),null);const pngBytes=await fs.readFile(await pngDownload.path());assert.equal(pngBytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.ok(pngBytes.length>1000);const pw=pngBytes.readUInt32BE(16),ph=pngBytes.readUInt32BE(20);assert.equal(Math.max(pw,ph),1600);assert.ok(pw*ph<=8e6);
    const changedPixels=await verifyPixels(svg,pngBytes,slug+' changed SVG/PNG');assert.notEqual(changedPixels.pixelHash,initialPixels.pixelHash,slug+' settings change actual pixels');
    const raster=await page.evaluate(async data=>{
     const svg=document.querySelector('#art svg'),box=svg.viewBox.baseVal;
     const image=new Image();await new Promise((r,j)=>{image.onload=r;image.onerror=j;image.src='data:image/png;base64,'+data;});const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const corner=[...ctx.getImageData(0,0,1,1).data];ctx.fillStyle=svg.querySelector('rect').getAttribute('fill');ctx.fillRect(0,0,1,1);const background=[...ctx.getImageData(0,0,1,1).data];return {ratio:box.width/box.height,corner,background};
    },pngBytes.toString('base64'));assert.ok(Math.abs(pw/ph-raster.ratio)<.01);assert.deepEqual(raster.corner,raster.background,slug+' PNG background retained');
    await page.getByRole('button',{name:'この絵を共有',exact:true}).click();const urlForShare=await page.locator('textarea').inputValue();assert.equal(new URL(await page.locator('#settings').getAttribute('action')).hash,'');assert.equal(await page.locator('a[data-social]').count(),0,'SNS uses buttons to avoid automatic outbound link tracking');
    for(const key of ['x','line','facebook']){const href=await page.locator(`[data-social=${key}]`).getAttribute('data-share-url');assert.equal(new URL(href).searchParams.get(key==='facebook'?'u':'url'),urlForShare);await page.locator(`[data-social=${key}]`).click();assert.equal(await page.evaluate(()=>window.__opened.url),href);assert.match(await page.evaluate(()=>window.__opened.features),/noopener,noreferrer/);}
    if(await seed.count()){await seed.fill('日本語 & # / % " <>');await seed.dispatchEvent('change');await settle();await page.getByRole('button',{name:'この絵を共有',exact:true}).click();const unicodeURL=await page.locator('textarea').inputValue();assert.equal(JSON.parse(decodeURIComponent(new URL(unicodeURL).hash.slice(5))).settings.seed,'日本語 & # / % " <>');await page.locator('#share-native').click();assert.equal(await page.evaluate(()=>window.__shared.url),unicodeURL);}else{await page.locator('#share-native').click();assert.equal(await page.evaluate(()=>window.__shared.url),urlForShare);}

    await page.locator('#share-png').click();await page.waitForFunction(()=>document.getElementById('status').textContent==='PNGを共有しました。');assert.equal(await page.evaluate(()=>window.__shared.files[0].type),'image/png');
    if(slug==='probability-segments'){
     await page.evaluate(()=>{window.__shareError='AbortError';});await page.locator('#share-png').click();await page.waitForFunction(()=>document.getElementById('status').textContent.includes('キャンセル'));
     await page.evaluate(()=>{window.__shareError='NotAllowedError';});await page.locator('#share-png').click();await page.waitForFunction(()=>document.getElementById('status').textContent.includes('もう一度'));assert.equal(await page.locator('#share-png').isDisabled(),false);
     await page.locator('#png-size').selectOption('2400');const highWaiting=page.waitForEvent('download');await page.locator('#download-png').click();const high=await highWaiting;const bytes=await fs.readFile(await high.path());assert.equal(Math.max(bytes.readUInt32BE(16),bytes.readUInt32BE(20)),2400);
    }
    await page.evaluate(()=>{window.__copyFail=true;});await page.locator('#copy-link').click();assert.match(await page.locator('.share-controls>p').textContent(),/手動/);
    await page.evaluate(()=>{window.__shareError='AbortError';});await page.locator('#share-native').click();assert.match(await page.locator('.share-controls>p').textContent(),/キャンセル/);
    await page.evaluate(()=>{window.__shareError='NotAllowedError';});await page.locator('#share-native').click();assert.match(await page.locator('.share-controls>p').textContent(),/コピー/);
    await page.evaluate(()=>{window.__shareError=null;window.__canShare=false;});await page.locator('#share-png').click();await page.waitForFunction(()=>document.getElementById('status').textContent.includes('画像の共有に対応していません'));
    if(process.env.GALLERY_QA_DIR&&['order-and-chance','probability-segments'].includes(slug)){await fs.mkdir(process.env.GALLERY_QA_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.GALLERY_QA_DIR,`sharing-${slug}-${width}.png`),fullPage:true});}
    await page.getByRole('button',{name:'この絵を共有',exact:true}).click();await page.getByRole('button',{name:'リセット',exact:true}).click();await settle();assert.deepEqual(await state(),initial,slug+' resets all settings');assert.equal(await page.locator('textarea').inputValue(),'');assert.equal(await page.locator('.share-controls>label').isVisible(),false,slug+' hides stale share URL');
    await page.goto(url+'#art=%7B');await settle();assert.deepEqual(await state(),initial);assert.match(await page.locator('.share-controls>p').textContent(),/初期設定/);
    if(process.env.GALLERY_QA_DIR&&['recursive-regions','hex-transitions','probability-segments'].includes(slug)){await page.goto(url);await fs.mkdir(process.env.GALLERY_QA_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.GALLERY_QA_DIR,`after-${slug}-${width}.png`),fullPage:true});}
    if(['hex-transitions','probability-segments'].includes(slug)){
     await page.goto(url);const count=page.locator(slug==='hex-transitions'?'#states':'#directions');await count.fill(await count.getAttribute('max'));await count.dispatchEvent('change');await settle();for(const summary of await page.locator('.control-details summary:visible').all())await summary.click();
     assert.deepEqual(await page.evaluate(inspectControls,contract),[]);
     const layout=await page.evaluate(()=>{
      const issues=[],visible=[...document.querySelectorAll('.controls .field')].filter(e=>e.getClientRects().length);
      if(document.documentElement.scrollWidth>innerWidth)issues.push('page overflow');
      const panel=document.querySelector('.controls').getBoundingClientRect();
      for(const field of visible){const r=field.getBoundingClientRect();if(r.left<panel.left-1||r.right>panel.right+1)issues.push('field overflow');const input=field.querySelector('input,select'),label=field.querySelector('label');if(input&&label&&input.getBoundingClientRect().top<label.getBoundingClientRect().bottom-1)issues.push('label/input overlap');}
      for(let i=0;i<visible.length;i++)for(let j=i+1;j<visible.length;j++){const a=visible[i].getBoundingClientRect(),b=visible[j].getBoundingClientRect();if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)issues.push('fields overlap');}
      for(const group of document.querySelectorAll('.control-details[open]')){const fields=[...group.querySelectorAll('.field')].filter(e=>e.getClientRects().length);for(let i=1;i<fields.length;i++)if(fields[i].getBoundingClientRect().top-fields[i-1].getBoundingClientRect().bottom<12)issues.push('insufficient field gap');}
      return issues;
     });assert.deepEqual(layout,[],slug+' expanded layout');
     if(process.env.GALLERY_QA_DIR)await page.screenshot({path:path.join(process.env.GALLERY_QA_DIR,`expanded-${slug}-${width}.png`),fullPage:true});
    }
    if(slug==='probability-segments'&&width===375){
     // Delay conversion completion while mock transient activation expires.
     await page.goto(url);await page.getByRole('button',{name:'この絵を共有',exact:true}).click();
     await page.evaluate(()=>{window.__holdPNG=true;});await page.locator('#share-png').click();await page.waitForFunction(()=>typeof window.__releasePNG==='function');
     assert.equal(await page.evaluate(()=>window.__pngConversions),1);
     await page.evaluate(()=>{window.__activation=false;window.__holdPNG=false;window.__releasePNG();});
     await page.waitForFunction(()=>document.getElementById('status').textContent.includes('もう一度'));
     assert.equal(await page.evaluate(()=>window.__shareCalls||0),0,'expired activation never invokes native share automatically');
     assert.equal(await page.locator('#share-png').textContent(),'準備済みPNGを共有');
     await page.evaluate(()=>{window.__activation=true;});await page.locator('#share-png').click();await page.waitForFunction(()=>document.getElementById('status').textContent==='PNGを共有しました。');
     assert.equal(await page.evaluate(()=>window.__pngConversions),1,'second click skips rasterization');assert.equal(await page.evaluate(()=>window.__shareWasActive),true);
     await page.evaluate(()=>{window.__previousFile=window.__sharedFile;window.__shareError='AbortError';});await page.locator('#share-png').click();await page.waitForFunction(()=>document.getElementById('status').textContent.includes('キャンセル'));
     assert.equal(await page.evaluate(()=>window.__sharedFile===window.__previousFile),true,'cancel retains the prepared File');
     await page.evaluate(()=>{window.__shareError=null;window.__canShare=false;});await page.locator('#share-png').click();await page.waitForFunction(()=>document.getElementById('status').textContent.includes('画像の共有に対応していません'));
     await page.evaluate(()=>{window.__canShare=true;});await page.locator('#share-png').click();await page.waitForFunction(()=>document.getElementById('status').textContent==='PNGを共有しました。');assert.equal(await page.evaluate(()=>window.__pngConversions),1);
     await page.locator('#mean').fill('19');await page.locator('#mean').dispatchEvent('change');assert.equal(await page.locator('#share-png').textContent(),'現在のPNGを共有');
     await page.getByRole('button',{name:'この絵を共有',exact:true}).click();await page.locator('#share-png').click();await page.waitForFunction(()=>document.getElementById('status').textContent==='PNGを共有しました。');assert.equal(await page.evaluate(()=>window.__pngConversions),2);assert.equal(await page.evaluate(()=>window.__sharedFile===window.__previousFile),false,'settings invalidate the File');
     await page.locator('#png-size').selectOption('2400');assert.equal(await page.locator('#share-png').textContent(),'現在のPNGを共有');await page.locator('#share-png').click();await page.waitForFunction(()=>document.getElementById('status').textContent==='PNGを共有しました。');assert.equal(await page.evaluate(()=>window.__pngConversions),3,'size invalidates the File');
     // A pending export owns its click-time SVG and size, even when controls change.
     await page.goto(url);const clickedSVG=await svgSnapshot();await page.evaluate(()=>{window.__holdPNG=true;});
     const waiting=page.waitForEvent('download');await page.locator('#download-png').click();await page.waitForFunction(()=>typeof window.__releasePNG==='function');
     await page.locator('#directions').fill('2');await page.locator('#directions').dispatchEvent('change');await page.locator('#png-size').selectOption('2400');await settle();const currentSVG=await svgSnapshot();assert.notEqual(currentSVG,clickedSVG);
     await page.evaluate(()=>{window.__holdPNG=false;window.__releasePNG();});const pending=await waiting;const clickedBytes=await fs.readFile(await pending.path());assert.equal(Math.max(clickedBytes.readUInt32BE(16),clickedBytes.readUInt32BE(20)),1600);await verifyPixels(clickedSVG,clickedBytes,'click-time snapshot after edits');
     assert.equal(await page.locator('#share-png').textContent(),'現在のPNGを共有','old in-flight File must not enter new settings cache');
     const currentBytes=await exportPNG();assert.equal(Math.max(currentBytes.readUInt32BE(16),currentBytes.readUInt32BE(20)),2400);await verifyPixels(currentSVG,currentBytes,'next export uses new settings');
     console.log('PASS delayed activation/retry without conversion, cancel/fallback, invalidation, click-time snapshot');
    }
    console.log(`PASS ${width}px ${slug}: style, boundaries, keyboard, seed, share, SVG, reset`);
   }
  }
  console.log(`PASS ${catalog.length*4} independent SVG/PNG pixel comparisons; settings change PNG pixels`);
  // Archived URLs also work through the actual browser controls, including inactive weights.
  for(const f of JSON.parse(await fs.readFile('scripts/fixtures/all-works-v1.json'))){
   await page.goto(base+'works/'+f.slug+'/'+f.fragment);await settle();
   const downloadPromise=page.waitForEvent('download');await page.locator('#download').click();const d=await downloadPromise;const svg=await fs.readFile(await d.path(),'utf8');
   const withoutDeclaration=svg.replace(/^<\?xml[^>]*>\s*/,'');assert.equal(crypto.createHash('sha256').update(portableSVG(withoutDeclaration)).digest('hex'),f.svgPortableSha256,f.slug+' archived URL/download bytes');
  }
  await page.goto(base+'about/#terms');assert.equal(await page.locator('#terms').count(),1);assert.deepEqual(errors,[]);console.log('PASS 36 archived URLs/SVGs; About; zero script/network errors');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exit(1)});
