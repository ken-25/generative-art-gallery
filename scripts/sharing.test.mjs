import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {tagId,analyticsTag,seo,imageInfo} from './build.mjs';
const require=createRequire(import.meta.url),share=require('../assets/share.js');
test('PNG dimensions preserve ratio and enforce pixel/edge bounds',()=>{
 for(const [w,h]of [[900,600],[600,600],[300,1700],[1e6,1e6]])for(const edge of [1600,2400,1e6]){
  const s=share.pngSize(w,h,edge);assert.ok(s.width*s.height<=8e6&&s.width<=4096&&s.height<=4096);assert.ok(Math.abs(s.width/s.height-w/h)<.01);
 }
 for(const bad of [0,-1,Infinity,NaN,1e7])assert.throws(()=>share.pngSize(bad,600));
});
test('social intents preserve one encoded copy of Unicode settings URL',()=>{
 const url='https://example.org/sub/works/a/#art='+encodeURIComponent(JSON.stringify({seed:'日本語 & # / % " <>'}));
 const links=share.socialLinks(url,'作品 & 日本語');
 for(const [key,link]of Object.entries(links)){const parsed=new URL(link);assert.equal(parsed.searchParams.get(key==='facebook'?'u':'url'),url);assert.equal(parsed.protocol,'https:');}
 assert.equal(new URL(links.x).searchParams.get('text'),'作品 & 日本語');
});
test('tag validation and static cards use escaped text and absolute previews',async()=>{
 assert.equal(tagId(''),'');assert.equal(tagId(' G-TEST000000 '),'G-TEST000000');assert.equal(tagId('GT-TEST0000'),'GT-TEST0000');
 for(const bad of ['G-','UA-123','G-ABC<script>','g-lowercase','G-ABC DEF'])assert.throws(()=>tagId(bad));
 const info=await imageInfo('works/hex-transitions/preview.webp');assert.deepEqual(info,{width:320,height:214,type:'image/webp'});
 const html=seo('<html><head><title>old</title></head></html>','日本語 <b>','説明 & text','https://example.org/sub/a/','https://example.org/sub/a/preview.webp',info);
 assert.match(html,/twitter:card" content="summary/);assert.match(html,/og:image:height" content="214/);assert.match(html,/日本語 &lt;b&gt;/);assert.doesNotMatch(html,/data-google-tag-id|googletagmanager/);
});
test('mock Google tag initializes once and never reads or sends settings/seed',async()=>{
 const code=await readFile('assets/analytics.js','utf8'),scripts=[];
 const document={title:'固定の作品名',querySelector:selector=>selector==='script[data-google-tag-id]'?{dataset:{googleTagId:'G-TEST000000',googleTagEnabled:'true'}}:{href:'https://example.org/sub/work/?s=SECRET_SEED#art=SECRET_SEED'},createElement:()=>({}),head:{append:s=>scripts.push(s)}};
 const c={window:{},document,URL,Date};vm.createContext(c);vm.runInContext(code,c);vm.runInContext(code,c);
 assert.equal(scripts.length,1);assert.equal(scripts[0].referrerPolicy,'no-referrer');assert.equal(c.window.dataLayer.filter(x=>x[0]==='config').length,1);assert.equal(c.window.dataLayer.filter(x=>x[1]==='page_view').length,1);
 c.window.GalleryAnalytics.track('share_social','line',{seed:'SECRET_SEED'});c.window.GalleryAnalytics.track('bad','SECRET_SEED');
 const events=c.window.dataLayer.filter(x=>x[0]==='event');assert.equal(events.length,2);assert.equal(events[1][2].method,'line');assert.doesNotMatch(JSON.stringify(c.window.dataLayer),/SECRET_SEED|#art|\?s=/);
 assert.equal(c.window.dataLayer.find(x=>x[0]==='config')[2].send_page_view,false);
 const disabled={window:{},document:{...document,querySelector:()=>null},URL,Date};vm.createContext(disabled);vm.runInContext(code,disabled);assert.equal(disabled.window.GalleryAnalytics,undefined);assert.equal(scripts.length,1);
});

test('analytics requires an explicit true gate as well as a valid ID',async()=>{
 for(const enabled of [undefined,'','false','TRUE','1','yes']){
  assert.equal(analyticsTag(enabled,'G-TEST000000'),'');assert.equal(analyticsTag(enabled,'invalid ID'),'');
 }
 assert.equal(analyticsTag('true','G-TEST000000'),'G-TEST000000');
 assert.throws(()=>analyticsTag('true',''));assert.throws(()=>analyticsTag('true','invalid ID'));
 const code=await readFile('assets/analytics.js','utf8');
 for(const enabled of [undefined,'false','TRUE','1']){
  const c={window:{},document:{querySelector:()=>({dataset:{googleTagId:'G-TEST000000',googleTagEnabled:enabled}})},URL,Date};
  vm.createContext(c);vm.runInContext(code,c);assert.equal(c.window.GalleryAnalytics,undefined);assert.equal(c.window.dataLayer,undefined);
 }
});
