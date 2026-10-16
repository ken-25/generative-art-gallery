import {readFile,writeFile,readdir,mkdir,cp,rm,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
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
   if(/^(https?:|#)/.test(link)) continue;
   const target=path.resolve(folder,decodeURIComponent(link.split(/[?#]/)[0]));
   if(!target.startsWith(root+path.sep)) throw Error('Link outside project');
   await stat(target);
  }
  result.push(m);
 }
 return result.sort((a,b)=>a.addedAt.localeCompare(b.addedAt)||a.slug.localeCompare(b.slug));
}
export function tagId(value='') {
 const id=value.trim();if(id&&!/^(G|GT)-[A-Z0-9]{6,20}$/.test(id))throw Error('GOOGLE_TAG_ID must be a valid G- or GT- tag ID');return id;
}
const googleTagId=tagId(process.env.GOOGLE_TAG_ID);
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
 const tags=`<title>${escape(title)}</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${escape(url)}"><meta property="og:type" content="website"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${escape(url)}"><meta property="og:image" content="${escape(image)}"><meta property="og:image:alt" content="${escape(title)}の固定プレビュー">${info.width&&info.height?`<meta property="og:image:width" content="${info.width}"><meta property="og:image:height" content="${info.height}">`:''}${info.type?`<meta property="og:image:type" content="${info.type}">`:''}<meta property="og:locale" content="ja_JP"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${escape(image)}"><meta name="twitter:image:alt" content="${escape(title)}の固定プレビュー">${googleTagId?`<script defer src="${escape(new URL('assets/analytics.js',base).pathname)}" data-google-tag-id="${googleTagId}"></script>`:''}`;
 return html.replace('</head>',()=>tags+'</head>');
}
export async function build() {
 const works=await catalog(path.join(root,'works'));
 if(!works.length) throw Error('No works');
 await rm('dist',{recursive:true,force:true}); await mkdir('dist');
 for(const file of ['assets','works','.nojekyll','about','LICENSE','THIRD_PARTY_NOTICES.md','CONTRIBUTING.md']) await cp(file,path.join('dist',file),{recursive:true});
 if(!googleTagId)await rm('dist/assets/analytics.js',{force:true});
 const infos=await Promise.all(works.map(m=>imageInfo(path.join(root,'works',m.slug,m.preview))));
 const number=i=>String(i+1).padStart(3,'0');
 const cards=works.map((m,i)=>`<a class="work-card" href="works/${m.slug}/"><div class="card-art"><img src="works/${m.slug}/${m.preview}" width="320" height="320" ${i?'loading="lazy"':'fetchpriority="high"'} alt="${escape(m.title)}のプレビュー" style="width:100%;height:100%;object-fit:contain"></div><div class="card-copy"><p class="eyebrow">${number(i)} / ${escape(m.tags.join(' · ').toUpperCase())}</p><h3>${escape(m.title)}</h3><p>${escape(m.description)}</p><span class="text-link">作品をひらく →</span></div></a>`).join('\n');
 let home=await readFile('templates/index.html','utf8'); home=home.replace('<!-- WORK_CARDS -->',()=>cards).replace('<!-- WORK_COUNT -->',()=>String(works.length).padStart(2,'0')+' WORKS');
 await writeFile('dist/index.html',seo(home,'Generative Art Gallery — 規則と偶然のあいだ','規則と偶然を、手で動かして眺めるジェネラティブアートのギャラリー。',base.href,new URL(`works/${works[0].slug}/${works[0].preview}`,base).href,infos[0]));
 for(const [i,m] of works.entries()) {
  const file=`dist/works/${m.slug}/index.html`;
  let html=await readFile(file,'utf8'); html=html.replace(/(<p class="eyebrow">)\d{3} /,`$1${number(i)} /`);
  await writeFile(file,seo(html,m.title+' — Generative Art Gallery',m.description,new URL(`works/${m.slug}/`,base).href,new URL(`works/${m.slug}/${m.preview}`,base).href,infos[i]));
 }
 await writeFile('dist/about/index.html',seo(await readFile('about/index.html','utf8'),'このギャラリーについて — Generative Art Gallery','ルールから生まれる形を、触って楽しむ。目的・利用条件・参加方法。',new URL('about/',base).href,new URL(`works/${works[0].slug}/${works[0].preview}`,base).href,infos[0]));
 await writeFile('dist/catalog.json',JSON.stringify(works.map((m,i)=>({...m,number:i+1,url:new URL(`works/${m.slug}/`,base).href})),null,2)+'\n');
 await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['','about/',...works.map(m=>`works/${m.slug}/`)].map(p=>`<url><loc>${escape(new URL(p,base).href)}</loc></url>`).join('')}</urlset>`);
 console.log(`Built ${works.length} works → dist/ (${base.href})`);
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) await build();
