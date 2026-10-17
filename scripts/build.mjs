import {readFile,writeFile,readdir,mkdir,cp,rm,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {externalLinks} from './external-links.mjs';
export const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const root=process.cwd();
const base=new URL(process.env.SITE_URL || 'https://ken-25.github.io/generative-art-gallery/');
if(!['https:','http:'].includes(base.protocol)||base.search||base.hash||base.username||base.password||!base.pathname.endsWith('/')) throw Error('SITE_URL must be an absolute directory URL');
export async function catalog(directory) {
 const result=[];
 for(const entry of await readdir(directory,{withFileTypes:true})) {
  if(!entry.isDirectory()) continue;
  const folder=path.join(directory,entry.name);
  const m=JSON.parse(await readFile(path.join(folder,'manifest.json'),'utf8'));
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(m.slug)||m.slug!==entry.name||result.some(x=>x.slug===m.slug)) throw Error('Invalid or duplicate slug');
  for(const key of ['title','description','addedAt','preview']) if(typeof m[key]!=='string'||!m[key].trim()) throw Error('Missing '+key);
  if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(m.addedAt)||!Number.isFinite(Date.parse(m.addedAt))||new Date(m.addedAt).toISOString()!==m.addedAt.replace('Z','.000Z')) throw Error('Invalid date');
  if(!Array.isArray(m.tags)||!m.tags.length||m.tags.some(t=>typeof t!=='string'||!t.trim())) throw Error('Invalid tags');
  if(!Array.isArray(m.sources)||!m.sources.length) throw Error('Missing sources');
  for(const s of m.sources) if(typeof s.label!=='string'||!s.label.trim()||!/^https?:$/.test(new URL(s.url).protocol)) throw Error('Invalid source');
  if(!/^[a-zA-Z0-9_-]+\.(svg|png|webp|jpg)$/.test(m.preview)) throw Error('Invalid preview');
  for(const file of ['index.html',m.preview]) if(!(await stat(path.join(folder,file))).isFile()) throw Error('Missing '+file);
  const html=await readFile(path.join(folder,'index.html'),'utf8');
  for(const [,link] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
   if(/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(link)) continue;
   const pathname=new URL(link,base).pathname;
   if(link.startsWith('/')&&!pathname.startsWith(base.pathname))continue;
   const target=link.startsWith('/')?path.resolve(root,decodeURIComponent(pathname.slice(base.pathname.length))):path.resolve(folder,decodeURIComponent(link.split(/[?#]/)[0]));
   if(target!==root&&!target.startsWith(root+path.sep)) throw Error('Link outside project');
   await stat(target);
  }
  result.push(m);
 }
 return result.sort((a,b)=>a.addedAt.localeCompare(b.addedAt)||a.slug.localeCompare(b.slug));
}
export function tagId(value='') {
 const id=value.trim();if(id&&!/^(G|GT)-[A-Z0-9]{6,20}$/.test(id))throw Error('GOOGLE_TAG_ID must be a valid G- or GT- tag ID');return id;
}
export function analyticsTag(enabled='',value='') {
 if(enabled!=='true')return '';
 const id=tagId(value);if(!id)throw Error('GOOGLE_TAG_ENABLED=true requires GOOGLE_TAG_ID');return id;
}
const googleTagId=analyticsTag(process.env.GOOGLE_TAG_ENABLED,process.env.GOOGLE_TAG_ID);
export async function imageInfo(file) {
 const b=await readFile(file),ext=path.extname(file).toLowerCase();
 let width,height;
 if(ext==='.png'&&b.length>=24&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){width=b.readUInt32BE(16);height=b.readUInt32BE(20);}
 if(ext==='.webp'&&b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'){
  const kind=b.toString('ascii',12,16);
  if(kind==='VP8 '){width=b.readUInt16LE(26)&16383;height=b.readUInt16LE(28)&16383;}
  else if(kind==='VP8X'){width=1+b.readUIntLE(24,3);height=1+b.readUIntLE(27,3);}
  else if(kind==='VP8L'){const n=b.readUInt32LE(21);width=1+(n&16383);height=1+((n>>>14)&16383);}
 }
 return {width,height,type:({'.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'})[ext]};
}
export function seo(html,title,description,url,image,info={}) {
 html=html.replace(/<title>.*?<\/title>/s,'').replace(/<meta name="description"[^>]*>/g,'');
 const tags=`<title>${escape(title)}</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${escape(url)}"><meta property="og:type" content="website"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${escape(url)}">${image?`<meta property="og:image" content="${escape(image)}"><meta property="og:image:alt" content="${escape(title)}の固定プレビュー">${info.width&&info.height?`<meta property="og:image:width" content="${info.width}"><meta property="og:image:height" content="${info.height}">`:''}${info.type?`<meta property="og:image:type" content="${info.type}">`:''}`:''}<meta property="og:locale" content="ja_JP"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}">${image?`<meta name="twitter:image" content="${escape(image)}"><meta name="twitter:image:alt" content="${escape(title)}の固定プレビュー">`:''}${googleTagId?`<script defer src="${escape(new URL('assets/analytics.js',base).pathname)}" data-google-tag-enabled="true" data-google-tag-id="${googleTagId}"></script>`:''}`;
 return externalLinks(html.replace('</head>',()=>tags+'</head>'),url,base.href);
}
export const PAGE_SIZE=20;
// Newest first by first-publication time; ties keep the slug order. Numbers stay chronological IDs.
export const newestFirst=works=>[...works].sort((a,b)=>b.addedAt.localeCompare(a.addedAt)||a.slug.localeCompare(b.slug));
export function paginate(items,size=PAGE_SIZE) {
 const pages=[];for(let i=0;i<items.length;i+=size)pages.push(items.slice(i,i+size));return pages;
}
export const pagePath=n=>n===1?'':`page/${n}/`;
// Re-root relative links of a root-level page template for a page n directories deep.
const relocate=(html,prefix)=>prefix?html.replace(/\b(href|src)="(?![a-z][a-z0-9+.-]*:|\/\/|\/|#)([^"]*)"/gi,(_,attr,link)=>`${attr}="${prefix}${link}"`):html;
export function pagination(n,total,count,start,prefix) {
 if(total<2)return '';
 const href=m=>escape(prefix+pagePath(m)||'./');
 const pages=Array.from({length:total},(_,i)=>i+1).map(m=>m===n?`<li><a href="${href(m)}" aria-current="page">${m}</a></li>`:`<li><a href="${href(m)}">${m}</a></li>`).join('');
 return `<nav class="pagination" aria-label="作品一覧のページ"><p>全${count}件中 ${start+1}〜${Math.min(start+PAGE_SIZE,count)}件を表示</p><ul>${n>1?`<li><a href="${href(n-1)}" rel="prev">← 前へ</a></li>`:''}${pages}${n<total?`<li><a href="${href(n+1)}" rel="next">次へ →</a></li>`:''}</ul></nav>`;
}
export async function build() {
 const works=await catalog(path.join(root,'works'));
 await rm('dist',{recursive:true,force:true}); await mkdir('dist');
 for(const file of ['assets','works','.nojekyll','about','LICENSE','THIRD_PARTY_NOTICES.md','CONTRIBUTING.md']) await cp(file,path.join('dist',file),{recursive:true});
 if(!googleTagId)await rm('dist/assets/analytics.js',{force:true});
 const infos=new Map(await Promise.all(works.map(async m=>[m.slug,await imageInfo(path.join(root,'works',m.slug,m.preview))])));
 const numbers=new Map(works.map((m,i)=>[m.slug,i+1])),number=m=>String(numbers.get(m.slug)).padStart(3,'0');
 const image=m=>m&&new URL(`works/${m.slug}/${m.preview}`,base).href;
 const card=(m,i,prefix)=>`<a class="work-card" href="${prefix}works/${m.slug}/"><div class="card-art"><img src="${prefix}works/${m.slug}/${m.preview}" width="320" height="320" ${i?'loading="lazy"':'fetchpriority="high"'} alt="${escape(m.title)}のプレビュー" style="width:100%;height:100%;object-fit:contain"></div><div class="card-copy"><p class="eyebrow">${number(m)} / ${escape(m.tags.join(' · ').toUpperCase())}</p><h3>${escape(m.title)}</h3><p>${escape(m.description)}</p><span class="text-link">作品をひらく →</span></div></a>`;
 const template=await readFile('templates/index.html','utf8'),ordered=newestFirst(works),pages=paginate(ordered);
 if(!pages.length)pages.push([]);
 for(const [index,items] of pages.entries()) {
  const n=index+1,prefix=n===1?'':'../../',start=index*PAGE_SIZE;
  const cards=items.length?items.map((m,i)=>card(m,i,prefix)).join('\n'):'<p class="empty-state">作品はまだありません。</p>';
  const home=relocate(template,prefix).replace('<!-- WORK_CARDS -->',()=>cards+pagination(n,pages.length,works.length,start,prefix)).replace('<!-- WORK_COUNT -->',()=>String(works.length).padStart(2,'0')+' WORKS');
  const title=n===1?'Generative Art Gallery — 規則と偶然のあいだ':`作品一覧 ${n}ページ目（${start+1}〜${start+items.length}件） — Generative Art Gallery`;
  const description=n===1?'規則と偶然を、手で動かして眺めるジェネラティブアートのギャラリー。':`ジェネラティブアートのギャラリー、新着順の作品一覧 ${n}ページ目。全${works.length}件中 ${start+1}〜${start+items.length}件を掲載。`;
  await mkdir(path.join('dist',pagePath(n)),{recursive:true});
  await writeFile(path.join('dist',pagePath(n),'index.html'),seo(home,title,description,new URL(pagePath(n),base).href,image(items[0]),infos.get(items[0]?.slug)));
 }
 for(const m of works) {
  const file=`dist/works/${m.slug}/index.html`;
  let html=await readFile(file,'utf8'); html=html.replace(/(<p class="eyebrow">)\d{3} \//,`$1${number(m)} /`);
  await writeFile(file,seo(html,m.title+' — Generative Art Gallery',m.description,new URL(`works/${m.slug}/`,base).href,image(m),infos.get(m.slug)));
 }
 await writeFile('dist/about/index.html',seo((await readFile('about/index.html','utf8')).replace('<!-- MEASUREMENT -->',()=>googleTagId?'<section class="terms" id="measurement"><h2>アクセス計測について</h2><p>サイト改善のため、アクセスや保存・共有の利用状況を集計しています。</p><p>Google AnalyticsとCookie等を利用します。詳しくは<a href="https://policies.google.com/privacy">Googleのプライバシーポリシー</a>をご覧ください。</p></section>':''),'このギャラリーについて — Generative Art Gallery','ルールから生まれる形を、触って楽しむ。目的・利用条件・参加方法。',new URL('about/',base).href,image(ordered[0]),infos.get(ordered[0]?.slug)));
 await writeFile('dist/catalog.json',JSON.stringify(works.map(m=>({...m,number:numbers.get(m.slug),url:new URL(`works/${m.slug}/`,base).href})),null,2)+'\n');
 await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...pages.map((_,i)=>pagePath(i+1)),'about/',...works.map(m=>`works/${m.slug}/`)].map(p=>`<url><loc>${escape(new URL(p,base).href)}</loc></url>`).join('')}</urlset>`);
 console.log(`Built ${works.length} works on ${pages.length} list page(s) → dist/ (${base.href})`);
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) await build();
