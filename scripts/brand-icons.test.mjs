import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {brandHead,brandHeader} from './brand.mjs';
test('brand SVGs retain the standard and optical geometry with public metadata',async()=>{
 for(const [name,size,stroke,scale]of [['mark.svg',64,'1.8',null],['mark-16.svg',16,'4','0.25'],['mark-32.svg',32,'2.9','0.5']]){
  const svg=await readFile('assets/brand/'+name,'utf8');assert.match(svg,new RegExp(`width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"`));assert.match(svg,new RegExp(`stroke-width="${stroke.replace('.','\\.')}"`));assert.equal((svg.match(/<rect /g)||[]).length,3);assert.match(svg,/stroke="#405944"/);assert.match(svg,/<title>Generative Art Gallery<\/title>/);assert.doesNotMatch(svg,/concept|draft|proof|https?:\/\/(?!www\.w3\.org)/i);if(scale)assert.ok(svg.includes(`transform="scale(${scale})"`));
 }
 const small=await readFile('assets/brand/mark-16.svg','utf8');assert.match(small,/x="19" y="19" width="26" height="26" rx="5"/);
});
test('favicon ICO embeds the exact optical 16px and 32px PNGs',async()=>{
 const ico=await readFile('assets/brand/favicon.ico');assert.equal(ico.readUInt16LE(0),0);assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt16LE(4),2);
 for(const [index,size]of [16,32].entries()){
  const png=await readFile(`assets/brand/favicon-${size}.png`),offset=6+index*16;assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);assert.equal(ico[offset],size);assert.equal(ico[offset+1],size);const count=ico.readUInt32LE(offset+8),start=ico.readUInt32LE(offset+12);assert.deepEqual(ico.subarray(start,start+count),png);
 }
});
test('common brand markup preserves the site label and respects a Pages subpath',()=>{
 const site='https://example.org/gallery/sub/',input='<a class="brand" href="../../index.html">GENERATIVE ART GALLERY<span>規則と偶然のあいだ</span></a>',page=site+'works/example/',html=brandHeader(input,site,page);
 assert.match(html,/src="\.\.\/\.\.\/assets\/brand\/mark-32.svg"/);assert.match(html,/width="32" height="32" alt="" aria-hidden="true"/);assert.match(html,/href="\.\.\/\.\.\/index.html"/);assert.ok(html.includes('GENERATIVE ART GALLERY<span>規則と偶然のあいだ</span>'));assert.equal(brandHeader(html,site,page),html);
 const head=brandHead(site);for(const file of ['favicon.ico','favicon-16.png','favicon-32.png'])assert.ok(head.includes('href="assets/brand/'+file+'"'));assert.equal((head.match(/rel="icon"/g)||[]).length,3);
});

test('one public build keeps brand assets relative for root and Pages-subpath serving',()=>{
 const site='https://ken-25.github.io/generative-art-gallery/';
 for(const route of ['', 'page/2/', 'about/', 'works/example/', 'works/example/index.html']){
  const page=new URL(route,site).href,html=brandHead(site,page)+brandHeader('<a class="brand" href="index.html">Gallery</a>',site,page);
  const paths=[...html.matchAll(/(?:src|href)="([^"]*assets\/brand\/[^"]+)"/g)].map(m=>m[1]);assert.equal(paths.length,4);
  for(const mount of ['http://localhost:8000/',site])for(const link of paths){assert.ok(!link.startsWith('/'));const actual=new URL(link,new URL(route,mount));assert.equal(actual.href,new URL('assets/brand/'+link.split('/').at(-1),mount).href);}
 }
});
