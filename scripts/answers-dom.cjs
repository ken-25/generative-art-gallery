/* Exercised by the regular studio browser check on the same Pages-like server. */
const assert=require('node:assert/strict');
const G=require('../answers/generator.js');
module.exports=async({page,base,width,exportFile,closeDialog,settle})=>{
 const route=base+'answers/';
 await page.goto(base);await page.getByRole('link',{name:'答えて描いてみる →'}).click();assert.equal(page.url(),route);
 for(const suffix of ['','index.html']){
  assert.equal((await page.goto(route+suffix)).status(),200);await page.locator('#art svg').waitFor();
  assert.equal(await page.locator('.brand-mark').count(),1);
  await page.locator('.brand-mark').evaluate(i=>i.decode());
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://ken-25.github.io/generative-art-gallery/answers/');
 }
 const svg=()=>page.locator('#art').innerHTML();const initial=await svg();
 assert.equal(await page.locator('#settings select').count(),3);
 // Reach and operate all questions using native keyboard navigation.
 await page.locator('#pace').focus();await page.keyboard.press('End');await settle();
 assert.equal(await page.locator('#pace').inputValue(),'bold');assert.notEqual(await svg(),initial);
 await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'layers');await page.keyboard.press('Home');
 await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'scene');await page.keyboard.press('End');await settle();
 assert.equal(await page.locator('#layers').inputValue(),'single');assert.equal(await page.locator('#scene').inputValue(),'evening');
 assert.equal(await page.locator('#reading').textContent(),G.explain({pace:'bold',layers:'single',scene:'evening'}));
 const expected=await svg();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width} no horizontal overflow`);
 const copiesBefore=await page.evaluate(()=>window.__copyCalls||0);await page.locator('#share-open').click();assert.equal(await page.evaluate(()=>window.__copyCalls||0),copiesBefore);
 await page.locator('#copy-link').click();await page.waitForFunction(()=>window.__copied);
 const url=await page.evaluate(()=>window.__copied);assert.ok(url.startsWith(route+'#art='));
 assert.deepEqual(require('../assets/share.js').decode(new URL(url).hash,G),{pace:'bold',layers:'single',scene:'evening'});
 await page.locator('#share-x').click();assert.deepEqual(await page.evaluate(()=>({target:window.__opened.target,features:window.__opened.features})),{target:'_blank',features:'noopener,noreferrer'});
 assert.equal(await page.locator('.external-link-note').evaluateAll(es=>es.every(e=>getComputedStyle(e).clipPath==='inset(50%)'&&e.getBoundingClientRect().width<=1)),true);
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'share-open');
 const png=await exportFile('png');assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),1600);assert.equal(png.readUInt32BE(20),1066);
 const saved=await exportFile('svg');assert.ok(saved.toString().includes('answerMapping'));assert.ok(saved.toString().includes('&quot;bold&quot;'));
 await page.locator('#save-open').click();await page.locator('#save-format').selectOption('svg');await page.locator('#copy-svg').click();await page.waitForFunction(()=>window.__copied?.startsWith('<svg'));
 assert.equal(await page.evaluate(()=>window.__copied),saved.toString());await closeDialog();
 await page.getByRole('button',{name:'やり直す',exact:true}).click();await settle();assert.equal(await svg(),initial);
 await page.goto(url);await page.locator('#art svg').waitFor();assert.equal(await svg(),expected);assert.equal(await page.locator('#pace').inputValue(),'bold');
 // Check every combination against the Node renderer, including explanations.
 for(const pace of ['gentle','light','bold'])for(const layers of ['single','woven','rich'])for(const scene of ['leaves','earth','evening']){
  await page.locator('#pace').selectOption(pace);await page.locator('#layers').selectOption(layers);await page.locator('#scene').selectOption(scene);
  const {svg:rendered,reading}=await page.evaluate(()=>({svg:window.AnswerArt.svg(Object.fromEntries(new FormData(document.getElementById('settings')))),reading:document.getElementById('reading').textContent}));
  assert.equal(rendered,G.svg({pace,layers,scene}));assert.equal(reading,G.explain({pace,layers,scene}));
 }
 for(const hash of ['#art=%','#art='+encodeURIComponent(JSON.stringify({format:1,generator:1,settings:{pace:'bad',layers:'single',scene:'leaves'}})),'#art='+encodeURIComponent(JSON.stringify({format:1,generator:2,settings:G.defaults}))]){
  await page.goto(route+hash);await page.locator('#art svg').waitFor();assert.equal(await svg(),initial);assert.match(await page.locator('#status').textContent(),/初期設定/);
 }
 await page.goto(url);await page.locator('#art svg').waitFor();await settle();
 if(process.env.ANSWERS_SCREENSHOTS){await page.screenshot({path:process.env.ANSWERS_SCREENSHOTS+`/answers-${width}.png`,fullPage:true});}
 await page.getByRole('link',{name:'転がる円の軌跡',exact:true}).click();assert.equal(page.url(),base+'works/rolling-circles/');
 console.log(`Answer prototype: ${width}px, keyboard, 27 mappings, PNG/SVG/copy/reset/share and bad URLs passed`);
};
