/* Share format 1. Version 1 generators are frozen; future generators must retain
   this implementation or dispatch version 1 URLs to a compatible renderer. */
(() => {
 'use strict';
 function decode(fragment,G) {
  if(!fragment) return null;
  if(fragment.length>8192||!fragment.startsWith('#art=')) throw Error('共有URLの形式が不正です。');
  let data;
  try {data=JSON.parse(decodeURIComponent(fragment.slice(5)));} catch {throw Error('共有URLを読み取れません。');}
  if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).sort().join()!=='format,generator,settings') throw Error('共有URLの項目が不正です。');
  if(data.format!==1||data.generator!==1) throw Error('未対応のバージョンです。元の絵は復元していません。');
  const s=data.settings, keys=Object.keys(G.defaults);
  if(!s||typeof s!=='object'||Array.isArray(s)||Object.keys(s).sort().join()!==[...keys].sort().join()) throw Error('共有URLの設定が不足しているか、対応していない項目が含まれています。');
  for(const key of keys) if(typeof s[key]!==typeof G.defaults[key]||(typeof s[key]==='number'&&!Number.isFinite(s[key]))) throw Error('共有URLに使えない設定値が含まれています。');
  const normalized=G.normalize(s);
  if(keys.some(k=>normalized[k]!==s[k])) throw Error('共有URLの設定値が範囲外のため、復元できません。');
  return normalized;
 }
 function encode(input,G) {
  const normalized=G.normalize(input),settings={};
  for(const key of Object.keys(G.defaults)) settings[key]=normalized[key];
  return '#art='+encodeURIComponent(JSON.stringify({format:1,generator:1,settings}));
 }
 function pngSize(width,height,edge=1600) {
  if(![width,height,edge].every(n=>Number.isFinite(n)&&n>0)||width>1e6||height>1e6)throw Error('画像のサイズを確認できません。');
  const factor=Math.min(edge/Math.max(width,height),4096/Math.max(width,height),Math.sqrt(8e6/(width*height)));
  return {width:Math.max(1,Math.floor(width*factor)),height:Math.max(1,Math.floor(height*factor))};
 }
 async function pngBlob(svg,edge=1600) {
  const documentSVG=new DOMParser().parseFromString(svg,'image/svg+xml'),root=documentSVG.documentElement;
  if(root.localName!=='svg'||documentSVG.querySelector('parsererror,script,foreignObject'))throw Error('PNGに変換できない画像です。');
  const box=root.getAttribute('viewBox')?.trim().split(/[ ,]+/).map(Number);
  if(!box||box.length!==4)throw Error('画像のサイズを確認できません。');
  const size=pngSize(box[2],box[3],edge),canvas=document.createElement('canvas');canvas.width=size.width;canvas.height=size.height;
  root.setAttribute('width',size.width);root.setAttribute('height',size.height);root.setAttribute('preserveAspectRatio','none');
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(root)],{type:'image/svg+xml;charset=utf-8'})),image=new Image();
  try {
   await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('PNGへの変換に失敗しました。SVG保存もご利用ください。'));image.src=url;});
   const context=canvas.getContext('2d');if(!context)throw Error('この端末ではPNGを作成できません。');
   context.fillStyle='#ffffff';context.fillRect(0,0,size.width,size.height);context.drawImage(image,0,0,size.width,size.height);
   return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('PNGを作成できませんでした。')),'image/png'));
  } finally {URL.revokeObjectURL(url);image.src='';canvas.width=canvas.height=1;}
 }
 function socialLinks(url,title) {
  const result={};for(const [key,base,param]of [['x','https://twitter.com/intent/tweet','url'],['line','https://social-plugins.line.me/lineit/share','url'],['facebook','https://www.facebook.com/sharer/sharer.php','u']]){
   const link=new URL(base);link.searchParams.set(param,url);if(key==='x')link.searchParams.set('text',title);result[key]=link.href;
  }return result;
 }
 function attach(G,render) {
  const form=document.getElementById('settings');
  const box=document.createElement('div');
  const button=document.createElement('button');button.type='button';button.textContent='この絵を共有';
  const label=document.createElement('label');label.textContent='共有URL（選択してコピーできます）';label.hidden=true;
  const field=document.createElement('textarea');field.readOnly=true;field.rows=4;field.className='share-url';label.append(field);
  const message=document.createElement('p');message.setAttribute('role','status');
  box.className='share-controls';button.className='share-button';field.setAttribute('aria-label','共有URL');
  const options=document.createElement('div');options.className='share-options';options.hidden=true;
  const copy=document.createElement('button');copy.type='button';copy.textContent='リンクをコピー';copy.id='copy-link';
  const native=document.createElement('button');native.type='button';native.textContent='端末でリンクを共有';native.id='share-native';native.hidden=typeof navigator.share!=='function';
  const imageShare=document.createElement('button');imageShare.type='button';imageShare.textContent='現在のPNGを共有';imageShare.id='share-png';
  const social=document.createElement('nav');social.className='social-links';social.setAttribute('aria-label','SNSでリンクを共有');
  const anchors={};for(const [key,text]of [['x','X'],['line','LINE'],['facebook','Facebook']]){const a=document.createElement('a');a.textContent=text;a.target='_blank';a.rel='noopener noreferrer';a.dataset.social=key;anchors[key]=a;social.append(a);a.addEventListener('click',()=>track('share_social',key));}
  const hint=document.createElement('p');hint.className='share-note';hint.textContent='リンクのカードには作品の固定プレビューが表示されます。調整した絵はPNGで保存・共有できます。';
  options.append(copy,native,imageShare,social,hint);box.append(button,options,label,message);
  // One action layout for both hand-authored works and schema-based studies.
  const actions=document.getElementById('actions')||document.createElement('div');actions.id='actions';actions.className='studio-actions';
  const row=document.createElement('div');row.className='button-row';
  for(const control of [document.getElementById('new-seed'),form.querySelector('button[type=reset]')])if(control)row.append(control);
  if(row.children.length===1)row.classList.add('single');
  const download=document.getElementById('download');download.classList.add('primary');download.textContent='SVGを保存';
  const status=document.getElementById('status');status.setAttribute('aria-live','polite');
  const note=form.querySelector('.save-note')||document.createElement('p');note.className='save-note';note.textContent='SVGは設定も含めて保存します。PNGは画像として保存します。';
  const resolution=document.createElement('label');resolution.className='png-resolution';resolution.htmlFor='png-size';resolution.textContent='PNGのサイズ';
  const size=document.createElement('select');size.id='png-size';for(const [value,text]of [[1600,'標準（長辺1600px）'],[2400,'高解像度（長辺2400px）']]){const o=document.createElement('option');o.value=value;o.textContent=text;size.append(o);}resolution.append(size);
  const png=document.createElement('button');png.type='button';png.id='download-png';png.className='primary';png.textContent='PNGを保存';
  const title=G.title||document.querySelector('h1').textContent,slug=G.slug||location.pathname.split('/').filter(Boolean).filter(x=>x!=='index.html').at(-1);
  const track=(event,method)=>window.GalleryAnalytics?.track(event,method);
  const save=(blob,name)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);};
  let busy=false;
  const withPNG=async(action)=>{if(busy)return;busy=true;png.disabled=imageShare.disabled=true;status.textContent='PNGを作成しています。';try{render();await action(await pngBlob(G.svg(G.normalize(read())),Number(size.value)));}catch(e){status.textContent=e.name==='AbortError'?'共有をキャンセルしました。':'PNGを作成・共有できませんでした。SVG保存やリンクのコピーもご利用ください。';}finally{busy=false;png.disabled=imageShare.disabled=false;}};
  png.addEventListener('click',()=>withPNG(async blob=>{save(blob,slug+'.png');status.textContent='PNGの保存を開始しました。';track('download_png','png');}));
  download.addEventListener('click',()=>track('download_svg','svg'));
  imageShare.addEventListener('click',()=>withPNG(async blob=>{const file=new File([blob],slug+'.png',{type:'image/png'});if(!navigator.share||!navigator.canShare?.({files:[file]})){status.textContent='画像の共有に対応していません。PNG保存とリンクのコピーをご利用ください。';return;}await navigator.share({files:[file],title});status.textContent='PNGを共有しました。';track('share_image','png');}));
  actions.append(row,download,resolution,png,box,note,status);form.append(actions);
  for(const empty of form.querySelectorAll('.button-row'))if(!empty.children.length)empty.remove();
  const clear=()=>{field.value='';label.hidden=true;options.hidden=true;for(const a of Object.values(anchors))a.removeAttribute('href');message.textContent='';};
  form.addEventListener('reset',clear);form.addEventListener('input',event=>{if(event.target.name)clear();});
  document.getElementById('new-seed')?.addEventListener('click',clear);
  for(const preset of form.querySelectorAll('[data-preset]'))preset.addEventListener('click',clear);
  const read=()=>Object.fromEntries(Object.keys(G.defaults).map(k=>[k,form.elements.namedItem(k).value]));
  const restore=()=>{
   // Ordinary page anchors must never change the drawing or form.
   if(!location.hash.startsWith('#art=')) return;
   try {
    const s=decode(location.hash,G);
    if(s){for(const [k,v] of Object.entries(s)) form.elements.namedItem(k).value=v;const actual=G.normalize(read());if(Object.keys(s).some(k=>actual[k]!==s[k]))throw Error('この画面で扱えない設定のため、復元できません。');render();message.textContent='共有された図形・配色を復元しました。';}
   } catch(e){message.textContent=e.message+' 初期設定を表示しています。';for(const [k,v] of Object.entries(G.defaults))form.elements.namedItem(k).value=v;render();}
  };
  const shareURL=()=>{const url=new URL(location.href);url.search='';url.hash='';url.pathname=url.pathname.replace(/index\.html$/,'');url.hash=encode(read(),G);return url.href;};
  const update=()=>{field.value=shareURL();label.hidden=false;options.hidden=false;const links=socialLinks(field.value,title);for(const [key,a]of Object.entries(anchors))a.href=links[key];return field.value;};
  const copyLink=async()=>{const url=update();try{if(!navigator.clipboard?.writeText)throw Error();await navigator.clipboard.writeText(url);message.textContent='共有URLをコピーしました。';track('share_link','copy');}catch{field.focus();field.select();message.textContent='自動コピーできませんでした。URLを選択して手動でコピーしてください。';}};
  button.addEventListener('click',copyLink);copy.addEventListener('click',copyLink);
  native.addEventListener('click',async()=>{try{await navigator.share({title,url:update()});message.textContent='リンクを共有しました。';track('share_native','native');}catch(e){message.textContent=e.name==='AbortError'?'共有をキャンセルしました。':'端末で共有できませんでした。リンクをコピーして共有できます。';}});
  window.addEventListener('hashchange',restore);restore();
 }
 const api={decode,encode,attach,pngSize,pngBlob,socialLinks};
 if(typeof window!=='undefined')window.ArtShare=Object.freeze(api);
 if(typeof module!=='undefined')module.exports=api;
})();
