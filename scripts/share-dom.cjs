/* Run with a local static server: GALLERY_TEST_URL=http://localhost:8000 node scripts/share-dom.cjs
   Requires Playwright and a Chromium installation; no site runtime dependency. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try {
  const page=await browser.newPage();
  for(const slug of ['order-and-chance','truchet-tiles','lissajous']){
   await page.goto(`${process.env.GALLERY_TEST_URL||'http://localhost:8000'}/works/${slug}/`);
   await page.locator('input[type=range]').first().focus();await page.keyboard.press('ArrowRight');await page.waitForTimeout(30);
   await page.getByRole('button',{name:'この絵を共有',exact:true}).click();const shared=await page.locator('textarea').inputValue();
   await page.goto(shared);
   const capture=()=>page.evaluate(()=>({svg:document.querySelector('#art').innerHTML,settings:Array.from(document.querySelector('form').elements).filter(e=>e.name).map(e=>[e.name,e.type==='radio'?e.checked:e.value])}));
   const expected=await capture();await page.locator('.skip').focus();await page.keyboard.press('Enter');await page.waitForTimeout(30);assert.deepEqual(await capture(),expected);
   assert.equal(new URL(page.url()).hash,'#main');console.log(slug+': shared SVG and form survive skip link');
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
