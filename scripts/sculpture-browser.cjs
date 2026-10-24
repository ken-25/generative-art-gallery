/* Integrated artwork routes, renderer controls, archived URLs, output and review images. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const portableSVG=require('./svg-compat.cjs'),crypto=require('node:crypto');
const works=['lorenz-orbit','octahedral-paths','nested-hexagons','voronoi-relaxation','branching-rules'];
(async()=>{
 const root=path.resolve('dist'),output=process.argv.includes('--screenshots')?'review-preview':'evidence/revised';await fs.mkdir(output,{recursive:true});
 const prefix='/generative-art-gallery/';
 const server=http.createServer(async(req,res)=>{try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),relative=pathname.startsWith(prefix)?pathname.slice(prefix.length):pathname.slice(1);
  let file=path.resolve(root,relative);if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}
  if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
  res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));
 }catch{res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}${prefix}`;
 let browser;
 try{
  browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({acceptDownloads:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.addInitScript(()=>{
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedURL=text;}}});
   Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.shared=data.files?{type:data.files[0].type,size:data.files[0].size,sha:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await data.files[0].arrayBuffer()))).map(b=>b.toString(16).padStart(2,'0')).join('')}:{url:data.url};}});
   Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
  });
  const ready=()=>page.waitForFunction(()=>window.sculpture&&window.sculpture.validate()>0);
  const geometry=()=>page.evaluate(async()=>{const a=[];sculpture.object.updateMatrixWorld(true);sculpture.object.traverse(m=>{if(m.isMesh)a.push(Array.from(m.geometry.attributes.position.array),m.matrixWorld.toArray(),m.material.color.getHex());});const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(a)));return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');});
  const camera=()=>page.evaluate(()=>sculpture.camera.position.toArray());
  const close=()=>page.locator('#dialog-close').click();
  const download=async format=>{await page.locator('#save-open').click();await page.locator('#save-format').selectOption(format);const pending=page.waitForEvent('download');await page.locator('#download-file').click();const file=await pending,bytes=await fs.readFile(await file.path());assert.equal(await file.failure(),null);await close();return bytes;};
  for(const width of [1440,375]){
   await page.setViewportSize({width,height:width===375?900:1100});
   await page.goto(base);await page.locator('.work-card img').first().evaluate(i=>i.decode());
   assert.equal(await page.locator('.sculpture-canvas,[data-sculpture],select[name=work]').count(),0);
   assert.equal(await page.locator('.work-card').count(),20);
   assert.ok((await page.locator('.work-card').first().getAttribute('href')).startsWith('works/'));
   await page.screenshot({path:`${output}/top-${width===375?'mobile':'desktop'}-viewport.png`});
   for(const work of works){
    await page.goto(base+'works/'+work+'/');
    if(['lorenz-orbit','octahedral-paths'].includes(work))await ready();else{await page.locator('#art svg').waitFor();await page.locator('.work-view a',{hasText:'3D'}).click();await ready();}
    assert.equal(new URL(page.url()).pathname,prefix+'works/'+work+'/');
    assert.equal(await page.locator('select[name=work],[data-action=recommend],[data-action=random],[data-action=undo],.sculpture-entry').count(),0);
    assert.deepEqual(await page.locator('#actions>button').allTextContents(),['保存','共有']);
    assert.equal(await page.locator('#settings input[name=thickness]:visible').count(),['nested-hexagons','voronoi-relaxation'].includes(work)?0:1);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const boxes=await page.locator('#actions>button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {height:r.height,top:r.top,width:r.width};}));
    assert.equal(boxes[0].height,44);assert.equal(boxes[1].height,44);assert.equal(boxes[0].top,boxes[1].top);assert.equal(boxes[0].width,boxes[1].width);
    if(work==='nested-hexagons'&&width===1440)await page.screenshot({path:`${output}/nested-hexagons-desktop.png`,fullPage:true});
    if(work==='lorenz-orbit'&&width===375)await page.screenshot({path:`${output}/lorenz-orbit-mobile.png`,fullPage:true});
    const initial=await page.evaluate(()=>sculpture.state),initialGeometry=await geometry(),initialCamera=await camera();
    await page.locator('.sculpture-canvas').scrollIntoViewIfNeeded();const canvasBox=await page.locator('.sculpture-canvas').boundingBox();
    await page.mouse.move(canvasBox.x+canvasBox.width*.3,canvasBox.y+canvasBox.height*.4);await page.mouse.down();await page.mouse.move(canvasBox.x+canvasBox.width*.65,canvasBox.y+canvasBox.height*.6,{steps:3});await page.mouse.up();
    await page.getByRole('button',{name:'視点を戻す',exact:true}).click();
    for(let i=0;i<8;i++){await page.evaluate(()=>new Promise(requestAnimationFrame));assert.ok((await camera()).every((v,j)=>Math.abs(v-initialCamera[j])<1e-6),'pointer reset is stable after drag damping');}
    for(const input of await page.locator('#settings input[type=range],#settings input[type=color]').all()){
     const before=await geometry();await input.evaluate(e=>{e.value=e.type==='color'?'#386c73':String(Number(e.value)===Number(e.max)?Number(e.min):Math.min(Number(e.max),Number(e.value)+Number(e.step)));e.dispatchEvent(new Event('input',{bubbles:true}));});assert.notEqual(await geometry(),before,work+' '+await input.getAttribute('name')+' has an effect');
    }
    const range=page.locator('#settings input[type=range]').first();await range.focus();await page.keyboard.press('Home');assert.equal(await range.inputValue(),await range.getAttribute('min'));await page.keyboard.press('End');assert.equal(await range.inputValue(),await range.getAttribute('max'));
    if(width===375){const r=await range.evaluate(e=>{const r=e.getBoundingClientRect(),p=document.querySelector('.paper-area').getBoundingClientRect();return {top:r.top,bottom:r.bottom,preview:p.bottom,height:innerHeight};});assert.ok(r.top>=r.preview&&r.bottom<=r.height);}
    await page.locator('.sculpture-canvas').focus();await page.keyboard.press('ArrowLeft');await page.keyboard.press('+');assert.notDeepEqual(await camera(),initialCamera);
    const changedCamera=await camera();await page.getByRole('button',{name:'設定をリセット',exact:true}).click();assert.deepEqual(await page.evaluate(()=>sculpture.state),initial);assert.equal(await geometry(),initialGeometry);assert.deepEqual(await camera(),changedCamera);
    await page.getByRole('button',{name:'視点を戻す',exact:true}).click();const resetCamera=await camera();assert.ok(resetCamera.every((v,i)=>Math.abs(v-initialCamera[i])<1e-6));
    const png=await download('png');assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(Math.max(png.readUInt32BE(16),png.readUInt32BE(20)),1600);
    const decoded=await page.evaluate(async b=>{const img=new Image();img.src='data:image/png;base64,'+b;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);const p=x.getImageData(0,0,c.width,c.height).data;let ink=0;for(let i=0;i<p.length;i+=4)if(Math.abs(p[i]-232)+Math.abs(p[i+1]-234)+Math.abs(p[i+2]-225)>35)ink++;return ink;},png.toString('base64'));assert.ok(decoded>1000);
    const stl=await download('stl');assert.ok(stl.readUInt32LE(80)>0);assert.equal(stl.length,84+stl.readUInt32LE(80)*50);
    await page.locator('.sculpture-canvas').focus();await page.keyboard.press('ArrowRight');
    await range.evaluate(e=>{e.value=e.min;e.dispatchEvent(new Event('input',{bubbles:true}));});const sharedState=await page.evaluate(()=>sculpture.state),sharedGeometry=await geometry();
    await page.locator('#share-open').click();const shared=await page.locator('#share-url').inputValue();assert.equal(new URL(shared).pathname,prefix+'works/'+work+'/');assert.equal(new URL(shared).searchParams.get('view'),'3d');
    await page.locator('#copy-link').click();assert.equal(await page.evaluate(()=>window.copiedURL),shared);
    await page.locator('#share-native').click();assert.equal(await page.evaluate(()=>window.shared.url),shared);
    await page.locator('#share-png').click();await page.waitForFunction(()=>document.getElementById('dialog-status').textContent==='PNGを共有しました。');assert.equal(await page.evaluate(()=>window.shared.type),'image/png');assert.notEqual(await page.evaluate(()=>window.shared.sha),crypto.createHash('sha256').update(png).digest('hex'),'PNG sharing reflects changed camera/settings');
    await page.keyboard.press('Escape');assert.equal(await page.locator('#studio-dialog').evaluate(d=>d.open),false);assert.equal(await page.locator('#share-open').evaluate(e=>e===document.activeElement),true);
    await page.goto(shared);await ready();assert.deepEqual(await page.evaluate(()=>sculpture.state),sharedState);assert.equal(await geometry(),sharedGeometry);await page.getByRole('button',{name:'設定をリセット',exact:true}).click();assert.deepEqual(await page.evaluate(()=>sculpture.state),initial);assert.equal(await geometry(),initialGeometry);
    await page.goto(base+'works/'+work+'/index.html?view=3d');await ready();
    await page.locator('.work-view a',{hasText:'2D'}).click();await page.locator('#art svg').waitFor();assert.equal(await page.locator('#save-open').count(),1);
    console.log('PASS integrated '+width+'px '+work+': effective fields, keyboard, two resets, PNG/STL, native/link/PNG sharing and route reload');
   }
  }
  const fixtures=JSON.parse(await fs.readFile('scripts/fixtures/all-works-v1.json'));
  for(const work of works){const f=fixtures.find(f=>f.slug===work);await page.goto(base+'works/'+work+'/?view=3d'+f.fragment);await page.locator('#art svg').waitFor();const svg=(await download('svg')).toString().replace(/^<\?xml[^>]*>\s*/,'');assert.equal(crypto.createHash('sha256').update(portableSVG(svg)).digest('hex'),f.svgPortableSha256);assert.equal(await page.locator('.sculpture-canvas').count(),0);}
  await page.goto(base+'sculpture/?work=nested-hexagons');await ready();assert.equal(new URL(page.url()).pathname,prefix+'works/nested-hexagons/');
  const fallback=await browser.newPage();await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:get.call(this,type,...args);};});await fallback.goto(base+'works/lorenz-orbit/');await fallback.waitForSelector('.webgl-fallback');await fallback.locator('.work-view a',{hasText:'2D'}).click();await fallback.locator('#art svg').waitFor();await fallback.close();
  assert.deepEqual(errors,[]);console.log('PASS old 2D fragments override 3D view; preview URL forwards to detail; WebGL fallback; zero JS/network errors');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
